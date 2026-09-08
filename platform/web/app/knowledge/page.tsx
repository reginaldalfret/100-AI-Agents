'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { KnowledgeView } from '../../src/features/knowledge/KnowledgeView';

export default function KnowledgeRoute() {
  return (
    <AppShell activeView="knowledge">
      <KnowledgeView />
    </AppShell>
  );
}
