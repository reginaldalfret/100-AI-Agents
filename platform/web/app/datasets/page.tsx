'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { DatasetIntelligence } from '../../src/features/datasets/DatasetIntelligence';

export default function DatasetsRoute() {
  return (
    <AppShell activeView="datasets">
      <DatasetIntelligence />
    </AppShell>
  );
}
