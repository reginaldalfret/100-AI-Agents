# 100 → 1 Release Controller

The Release Controller is responsible for the daily release lifecycle of the
100 → 1 AI Agent Challenge.

## Current version

Version 0.1 is a dry-run controller.

It:

- loads release state
- validates release state
- determines whether today's release is ready
- generates a release plan
- refuses deployment when the agent is not ready

It does not currently:

- create GitHub repositories
- push agents
- create Vercel projects
- deploy to Vercel
- modify production systems

Those capabilities will be added only after the state machine and validation
layers are tested.

## Runtime

The controller is designed to run as the `ai` user through systemd.

It should not be run as root.
