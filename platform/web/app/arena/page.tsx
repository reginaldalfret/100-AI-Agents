'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { ModelArena } from '../../src/features/model-arena/ModelArena';

export default function ArenaRoute() {
  return (
    <AppShell activeView="modelArena">
      <ModelArena />
    </AppShell>
  );
}
