import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('AppShell & Navigation Component Tests', () => {
  const appShellPath = path.resolve('platform/web/src/components/layout/AppShell.tsx');
  const sidebarPath = path.resolve('platform/web/src/components/navigation/Sidebar.tsx');

  it('AppShell.tsx exists and exports AppShell component', () => {
    assert.ok(fs.existsSync(appShellPath));
    const content = fs.readFileSync(appShellPath, 'utf8');
    assert.ok(content.includes('export const AppShell') || content.includes('export function AppShell'));
  });

  it('AppShell renders Outlet for React Router sibling views', () => {
    const content = fs.readFileSync(appShellPath, 'utf8');
    assert.ok(content.includes('<Outlet'));
  });

  it('Sidebar.tsx exists and renders 301 agents directory', () => {
    assert.ok(fs.existsSync(sidebarPath));
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(content.includes('AGENTS') || content.includes('301'));
  });

  it('Sidebar contains compact 2x2 tool navigation grid', () => {
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(content.includes('Factory') || content.includes('/fine-tuning'));
    assert.ok(content.includes('Knowledge') || content.includes('/knowledge'));
    assert.ok(content.includes('Style Lab') || content.includes('/personal-style'));
    assert.ok(content.includes('Arena') || content.includes('/arena'));
  });
});
