'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { FineTuningFactory } from '../../src/features/fine-tuning/FineTuningFactory';

export default function FineTuningRoute() {
  return (
    <AppShell activeView="fine-tuning">
      <FineTuningFactory />
    </AppShell>
  );
}
