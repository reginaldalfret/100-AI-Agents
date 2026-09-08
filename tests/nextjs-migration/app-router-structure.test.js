import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Next.js App Router Structure & Configuration', () => {
  const root = process.cwd();
  const appDir = path.join(root, 'platform', 'web', 'app');
  const nextConfigPath = path.join(root, 'platform', 'web', 'next.config.mjs');
  const tsconfigPath = path.join(root, 'platform', 'web', 'tsconfig.json');

  it('contains root layout with dark theme and liquid glass stylesheets', () => {
    const layoutPath = path.join(appDir, 'layout.tsx');
    assert.ok(fs.existsSync(layoutPath), 'app/layout.tsx must exist');
    const content = fs.readFileSync(layoutPath, 'utf8');
    assert.ok(content.includes('data-theme="dark"'));
    assert.ok(content.includes('tokens.css'));
    assert.ok(content.includes('liquid-glass.css'));
    assert.ok(content.includes('RootLayout'));
  });

  it('contains root index redirecting to /agents', () => {
    const pagePath = path.join(appDir, 'page.tsx');
    assert.ok(fs.existsSync(pagePath), 'app/page.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(content.includes('/agents'));
    assert.ok(content.includes('useRouter'));
  });

  it('contains all 6 dedicated feature routes with page.tsx', () => {
    const requiredRoutes = [
      'agents',
      'arena',
      'personal-style',
      'datasets',
      'fine-tuning',
      'knowledge'
    ];

    for (const route of requiredRoutes) {
      const routeFile = path.join(appDir, route, 'page.tsx');
      assert.ok(fs.existsSync(routeFile), `app/${route}/page.tsx must exist`);
      const content = fs.readFileSync(routeFile, 'utf8');
      assert.ok(content.includes("'use client'"), `app/${route}/page.tsx must be a client component`);
      assert.ok(content.includes('AppShell'), `app/${route}/page.tsx must wrap in AppShell`);
    }
  });

  it('next.config.mjs defines /api/:path* rewrite to gateway at 127.0.0.1:8300', () => {
    assert.ok(fs.existsSync(nextConfigPath), 'next.config.mjs must exist');
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    assert.ok(content.includes('/api/:path*'));
    assert.ok(content.includes('http://127.0.0.1:8300/api/:path*'));
  });

  it('tsconfig.json defines paths mapping for @/*', () => {
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    assert.ok(content.compilerOptions);
    assert.ok(content.compilerOptions.paths);
    assert.ok(content.compilerOptions.paths['@/*']);
  });
});
