'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { AgentWorkspace } from '../../src/features/agents/AgentWorkspace';

export default function AgentsRoute() {
  return (
    <AppShell activeView="agent-workspace">
      <AgentWorkspace />
    </AppShell>
  );
}
