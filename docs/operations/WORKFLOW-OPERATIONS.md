# Super AI Workflow Operations & Telemetry

## Health Checks & REST Endpoints

- `GET /api/health`: Gateway, Ollama, Python compute health status.
- `POST /api/workflow/plan`: Inspect decomposed workflow plan without execution.
- `POST /api/workflow/execute`: Execute multi-agent plan with live resource scheduling.
- `POST /api/workflow/:id/retry`: Retry a specific failed subtask.
- `POST /api/workflow/:id/cancel`: Cancel an active workflow cleanly.
- `GET /api/workflow/:id/artifacts`: Fetch isolated code artifacts with SHA-256 hashes.
