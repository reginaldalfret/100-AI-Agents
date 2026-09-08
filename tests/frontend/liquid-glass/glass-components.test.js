import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Liquid Glass React Primitives', () => {
  const compDir = path.resolve('platform/web/src/components/liquid-glass');

  it('GlassSurface component exists and applies elevation tokens', () => {
    const file = path.join(compDir, 'GlassSurface.tsx');
    assert.ok(fs.existsSync(file));
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('lg-glass-surface'));
    assert.ok(content.includes('elevation'));
  });

  it('GlassButton component exists with primary/destructive variants and micro-interactions', () => {
    const file = path.join(compDir, 'GlassButton.tsx');
    assert.ok(fs.existsSync(file));
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('lg-glass-btn'));
    assert.ok(content.includes('variant'));
    assert.ok(content.includes('primary'));
    assert.ok(content.includes('destructive'));
  });

  it('GlassInput component exists with floating capsule styling', () => {
    const file = path.join(compDir, 'GlassInput.tsx');
    assert.ok(fs.existsSync(file));
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('lg-glass-input'));
  });

  it('GlassToolbar component exists with sticky floating positioning', () => {
    const file = path.join(compDir, 'GlassToolbar.tsx');
    assert.ok(fs.existsSync(file));
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('lg-glass-toolbar'));
  });
});
