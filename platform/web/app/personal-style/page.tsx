'use client';
import React from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { PersonalStyleLab } from '../../src/features/personal-style/PersonalStyleLab';

export default function PersonalStyleRoute() {
  return (
    <AppShell activeView="personalStyle">
      <PersonalStyleLab />
    </AppShell>
  );
}
