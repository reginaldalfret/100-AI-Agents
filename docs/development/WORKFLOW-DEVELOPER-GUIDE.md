# Super AI Workflow Developer Guide

## How to Test and Extend Workflows

### Running Test Suites
```bash
# Run all 14 workflow test suites
node --test tests/workflow/*.test.js

# Run full workbench test battery
node --test tests/workflow/*.test.js tests/orchestration/*.test.js tests/ui/*.test.js tests/agents/*.test.js tests/python-compute/*.test.js
node tests/sih/run-all-tests.js
```

### Adding a New Technology Specialist
1. Define the agent in `registry/agents.json`.
2. Add capability mapping in `SuperAIWorkflowEngine.discoverSpecialist()`.
3. Add pattern matcher in `SuperAIWorkflowEngine.planWorkflow()`.
