import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Apple Liquid Glass Design Tokens & Stylesheet', () => {
  const cssPath = path.resolve('platform/web/src/styles/liquid-glass.css');

  it('liquid-glass.css exists and defines root material tokens', () => {
    assert.ok(fs.existsSync(cssPath));
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('--lg-glass-bg:'));
    assert.ok(content.includes('--lg-glass-border:'));
    assert.ok(content.includes('--lg-glass-blur:'));
    assert.ok(content.includes('--lg-glass-shadow:'));
    assert.ok(content.includes('--lg-glass-highlight:'));
    assert.ok(content.includes('--lg-glass-specular:'));
  });

  it('defines concentric geometry radii tokens', () => {
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('--lg-radius-sm:'));
    assert.ok(content.includes('--lg-radius-md:'));
    assert.ok(content.includes('--lg-radius-lg:'));
    assert.ok(content.includes('--lg-radius-xl:'));
    assert.ok(content.includes('--lg-radius-capsule:'));
  });

  it('uses clean system font stack without proprietary font bundles', () => {
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('-apple-system'));
    assert.ok(content.includes('BlinkMacSystemFont'));
    assert.ok(content.includes('Segoe UI'));
  });

  it('supports light theme variant', () => {
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('[data-theme="light"]'));
    assert.ok(content.includes('--lg-bg-canvas: #f5f5f7'));
  });

  it('provides accessibility support for prefers-reduced-motion', () => {
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(content.includes('animation-duration: 0.01ms'));
  });

  it('provides graceful fallback when backdrop-filter is unsupported', () => {
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('@supports not (backdrop-filter: blur(10px))'));
    assert.ok(content.includes('opacity: 0.96'));
  });
});
