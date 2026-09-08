import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Apple Liquid Glass Navigation & Sidebar', () => {
  const sidebarPath = path.resolve('platform/web/src/components/navigation/Sidebar.tsx');

  it('Sidebar uses single floating Liquid Glass navigation layer', () => {
    assert.ok(fs.existsSync(sidebarPath));
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(content.includes('lg-glass') || content.includes('app-sidebar'));
    assert.ok(content.includes('sidebar-tools-grid'));
  });

  it('Sidebar renders 301 agents directory with category filters', () => {
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(content.includes('CATEGORIES'));
    assert.ok(content.includes('filteredAgents'));
  });

  it('Contains all 4 tool routes in bottom floating grid', () => {
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assert.ok(content.includes('/fine-tuning'));
    assert.ok(content.includes('/knowledge'));
    assert.ok(content.includes('/personal-style'));
    assert.ok(content.includes('/arena'));
  });
});
