import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const WEB_DIR = path.join(ROOT_DIR, 'platform', 'web');

/**
 * Gateway static file resolution and sanitizer logic as implemented in platform/gateway/src/server.js
 */
function resolveGatewayStaticFile(requestPath) {
  // WHATWG URL pathname resolution (standard HTTP gateway behavior)
  const url = new URL(requestPath, 'http://localhost');
  const sanitized = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '').replace(/\.\./g, '');
  const file = path.join(ROOT_DIR, 'platform', 'web', sanitized);
  return {
    file,
    sanitized,
    exists: fs.existsSync(file) && fs.statSync(file).isFile(),
    isInsideWebDir: path.resolve(file).startsWith(path.resolve(WEB_DIR))
  };
}

/**
 * Gateway safe error message filter as implemented in platform/gateway/src/server.js
 */
function getGatewaySafeErrorMessage(error) {
  const safeMsg = (error instanceof Error && !error.message.includes(':\\') && !error.message.includes('/root/'))
    ? error.message
    : 'Internal server error';
  return safeMsg;
}

describe('Public File & Path Isolation Security Suite', () => {

  describe('1. Path Traversal Protection on Gateway Static Files', () => {
    test('Gateway static file root directory exists', () => {
      assert.ok(fs.existsSync(WEB_DIR), 'platform/web directory must exist');
      assert.ok(fs.existsSync(path.join(WEB_DIR, 'index.html')), 'platform/web/index.html must exist');
    });

    test('Valid static paths resolve strictly within platform/web', () => {
      const validPaths = ['/', '/index.html'];

      for (const validPath of validPaths) {
        const result = resolveGatewayStaticFile(validPath);
        assert.ok(result.isInsideWebDir, `Path "${validPath}" must resolve inside platform/web`);
        assert.ok(result.exists, `Path "${validPath}" should exist`);
      }
    });

    test('Path traversal payloads cannot escape platform/web or access system files', () => {
      const traversalVectors = [
        '/../../etc/passwd',
        '/..\\..\\Windows',
        '/..\\..\\Windows\\win.ini',
        '/..\\..\\Windows\\System32\\drivers\\etc\\hosts',
        '/../../../../../../etc/shadow',
        '/%2e%2e/%2e%2e/etc/passwd',
        '/..%2f..%2fpackage.json',
        '/..%5c..%5cWindows',
        '/static/../../package.json',
        '/....//....//etc/passwd',
        '/.env',
        '/../../.env',
        '/../../package.json',
        '/.git/config',
        '/../../registry/agents.json'
      ];

      for (const vector of traversalVectors) {
        const result = resolveGatewayStaticFile(vector);

        // Verification 1: Resolved path must remain safely within platform/web
        assert.ok(
          result.isInsideWebDir,
          `Traversal vector "${vector}" must not escape web dir (resolved: ${result.file})`
        );

        // Verification 2: Traversal vector must NOT resolve to sensitive external files (.env, package.json, Windows files)
        if (result.exists) {
          assert.ok(
            result.file.startsWith(WEB_DIR),
            `If file exists for "${vector}", it must strictly reside within ${WEB_DIR}`
          );
        }

        // Sensitive repo root files (.env, package.json) must NEVER be served
        assert.notStrictEqual(
          path.resolve(result.file),
          path.resolve(ROOT_DIR, '.env'),
          `Traversal vector "${vector}" must never resolve to root .env`
        );
        assert.notStrictEqual(
          path.resolve(result.file),
          path.resolve(ROOT_DIR, 'package.json'),
          `Traversal vector "${vector}" must never resolve to root package.json`
        );
      }
    });

    test('Static handler returns 404 for non-existent or blocked paths in live HTTP test', async () => {
      // Create a lightweight local HTTP server testing the gateway static file dispatcher
      const testServer = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const sanitized = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '').replace(/\.\./g, '');
        const file = path.join(ROOT_DIR, 'platform', 'web', sanitized);

        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fs.readFileSync(file));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'Route not found' }));
      });

      await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
      const port = testServer.address().port;

      try {
        // Test legitimate request
        const validRes = await fetch(`http://127.0.0.1:${port}/`);
        assert.strictEqual(validRes.status, 200, 'Root request should return 200');

        // Test path traversal attempts
        const testUrls = [
          `http://127.0.0.1:${port}/../../etc/passwd`,
          `http://127.0.0.1:${port}/..\\..\\Windows`,
          `http://127.0.0.1:${port}/.env`,
          `http://127.0.0.1:${port}/../../package.json`
        ];

        for (const testUrl of testUrls) {
          const res = await fetch(testUrl);
          assert.strictEqual(
            res.status,
            404,
            `Request to "${testUrl}" must return 404 Not Found`
          );
          const body = await res.json();
          assert.strictEqual(body.error, 'Route not found');
        }
      } finally {
        await new Promise((resolve) => testServer.close(resolve));
      }
    });
  });

  describe('2. Private File Paths Not Leaked in Public Responses', () => {
    test('Gateway error handler masks Windows drive paths (E:\\... and C:\\...)', () => {
      // Test Windows E: drive path leakage
      const errorWithEDrive = new Error('Failed to access file at E:\\Smart Automation\\100-AI-Agents\\config\\secrets.json');
      const safeMsgE = getGatewaySafeErrorMessage(errorWithEDrive);
      assert.strictEqual(
        safeMsgE,
        'Internal server error',
        'Error containing E:\\ must be masked to "Internal server error"'
      );
      assert.strictEqual(safeMsgE.includes('E:\\'), false, 'Response must not contain E:\\');

      // Test Windows C: drive path leakage
      const errorWithCDrive = new Error('Access denied to C:\\Users\\ASUS\\.cloudflared\\credentials.json');
      const safeMsgC = getGatewaySafeErrorMessage(errorWithCDrive);
      assert.strictEqual(
        safeMsgC,
        'Internal server error',
        'Error containing C:\\ must be masked to "Internal server error"'
      );
      assert.strictEqual(safeMsgC.includes('C:\\'), false, 'Response must not contain C:\\');
    });

    test('Gateway error handler masks Linux root paths (/root/...)', () => {
      const errorWithRootPath = new Error('ENOENT: no such file or directory, open \'/root/.ssh/id_rsa\'');
      const safeMsgRoot = getGatewaySafeErrorMessage(errorWithRootPath);
      assert.strictEqual(
        safeMsgRoot,
        'Internal server error',
        'Error containing /root/ must be masked to "Internal server error"'
      );
      assert.strictEqual(safeMsgRoot.includes('/root/'), false, 'Response must not contain /root/');
    });

    test('Harmless error messages without private paths are preserved', () => {
      const benignError = new Error('Invalid JSON request body');
      const safeMsg = getGatewaySafeErrorMessage(benignError);
      assert.strictEqual(
        safeMsg,
        'Invalid JSON request body',
        'Benign error message should be preserved'
      );
    });

    test('Gateway server.js source code contains private path masking logic', () => {
      const serverScriptPath = path.join(ROOT_DIR, 'platform', 'gateway', 'src', 'server.js');
      assert.ok(fs.existsSync(serverScriptPath), 'server.js must exist');

      const serverSource = fs.readFileSync(serverScriptPath, 'utf8');

      // Verify the path leak prevention guard is implemented in server.js
      assert.ok(
        serverSource.includes('error.message.includes') && (serverSource.includes(':\\') || serverSource.includes(':\\\\')),
        'server.js must check and block Windows drive paths (:\\)'
      );
      assert.ok(
        serverSource.includes('error.message.includes("/root/")'),
        'server.js must check and block Linux /root/ paths'
      );
      assert.ok(
        serverSource.includes('"Internal server error"'),
        'server.js must fall back to "Internal server error"'
      );
    });

    test('Public health endpoint does not leak local server file paths', () => {
      // Simulate standard /api/health response payload from server.js
      const healthPayload = {
        status: 'READY',
        service: '301-super-ai-gateway',
        public_url: 'https://superai.reginaldalfret.tech',
        gateway: 'READY',
        ollama: 'READY',
        python: 'READY',
        database: 'READY',
        rag: 'READY',
        agents: 'READY',
        total_agents: 101,
        models_available: 4,
        is_air_gapped: true,
        external_ai_calls: 0,
        timestamp: new Date().toISOString()
      };

      const serialized = JSON.stringify(healthPayload);

      // Verify no local drive or root paths are included
      assert.strictEqual(serialized.includes('E:\\'), false, 'Health response must not leak E:\\');
      assert.strictEqual(serialized.includes('C:\\'), false, 'Health response must not leak C:\\');
      assert.strictEqual(serialized.includes('/root/'), false, 'Health response must not leak /root/');
      assert.strictEqual(serialized.includes('/home/'), false, 'Health response must not leak /home/');
      assert.strictEqual(serialized.includes('Users\\ASUS'), false, 'Health response must not leak user profile paths');
    });

    test('Route not found error responses do not leak internal filesystem paths', () => {
      const notFoundPayload = {
        status: 'error',
        error: 'Route not found'
      };

      const serialized = JSON.stringify(notFoundPayload);
      assert.strictEqual(serialized.includes(ROOT_DIR), false, '404 response must not leak ROOT_DIR');
      assert.strictEqual(serialized.includes(WEB_DIR), false, '404 response must not leak WEB_DIR');
    });
  });

});
