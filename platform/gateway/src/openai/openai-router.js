import { LOCAL_MODELS, getModelById } from '../../../models/model-registry.js';
import { runtimeRouter } from '../../../models/runtimes/index.js';
import { OpenAIChatCompletionSchema } from './openai-schema.js';
import { checkRateLimit, verifyApiKey } from './auth-ratelimit.js';

export async function handleOpenAIRoutes(req, res, url, body) {
  const clientIp = req.socket.remoteAddress || '127.0.0.1';

  // 1. Rate Limiting Check
  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': String(rateCheck.resetSeconds)
    });
    res.end(JSON.stringify({
      error: {
        message: `Rate limit exceeded. Try again in ${rateCheck.resetSeconds}s`,
        type: 'rate_limit_error',
        code: 429
      }
    }));
    return true;
  }

  // 2. Authentication Check
  const auth = verifyApiKey(req);
  if (!auth.valid) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: {
        message: auth.error || 'Unauthorized',
        type: 'invalid_request_error',
        code: 401
      }
    }));
    return true;
  }

  // 3. GET /v1/models
  if (req.method === 'GET' && url.pathname === '/v1/models') {
    const modelsData = LOCAL_MODELS.map(m => ({
      id: m.model_id,
      object: 'model',
      created: 1725800000,
      owned_by: (m.provider || 'local').toLowerCase(),
      permission: [],
      root: m.model_id,
      parent: null
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: modelsData
    }));
    return true;
  }

  // 4. POST /v1/chat/completions
  if (req.method === 'POST' && url.pathname === '/v1/chat/completions') {
    const validation = OpenAIChatCompletionSchema.safeParse(body);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: {
          message: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid request',
          type: 'invalid_request_error',
          code: 400
        }
      }));
      return true;
    }

    const { model, messages, stream, temperature, max_tokens } = validation.data;
    const completionId = `chatcmpl-${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const createdTimestamp = Math.floor(Date.now() / 1000);

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      try {
        await runtimeRouter.stream(model, messages, {
          onToken: ({ text }) => {
            if (!res.writableEnded) {
              const chunk = {
                id: completionId,
                object: 'chat.completion.chunk',
                created: createdTimestamp,
                model,
                choices: [
                  {
                    index: 0,
                    delta: { content: text },
                    finish_reason: null
                  }
                ]
              };
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
          },
          onDone: () => {
            if (!res.writableEnded) {
              const finalChunk = {
                id: completionId,
                object: 'chat.completion.chunk',
                created: createdTimestamp,
                model,
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop'
                  }
                ]
              };
              res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            }
          },
          onError: (err) => {
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ error: { message: err.error || err.message } })}\n\n`);
              res.end();
            }
          }
        }, { temperature, max_tokens });
      } catch (streamErr) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: { message: streamErr.message } })}\n\n`);
          res.end();
        }
      }

      return true;
    }

    // Non-streaming response
    try {
      const genResult = await runtimeRouter.generate(model, messages, { temperature, max_tokens });
      const responseBody = {
        id: completionId,
        object: 'chat.completion',
        created: createdTimestamp,
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: genResult.text
            },
            finish_reason: genResult.finish_reason || 'stop'
          }
        ],
        usage: genResult.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseBody));
    } catch (genErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: {
          message: genErr.message,
          type: 'api_error',
          code: 500
        }
      }));
    }

    return true;
  }

  return false;
}
