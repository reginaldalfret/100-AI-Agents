import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Knowledge Citations UI Styling and Behavior', () => {
  const css = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'styles.css'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'platform', 'web', 'app.js'), 'utf8');

  it('should define citation card and link classes in styles.css', () => {
    assert.ok(css.includes('.knowledge-citations-container'), 'Must define .knowledge-citations-container');
    assert.ok(css.includes('.citation-card-pill'), 'Must define .citation-card-pill');
    assert.ok(css.includes('.citation-obsidian-link'), 'Must define .citation-obsidian-link');
    assert.ok(css.includes('.citation-score-badge'), 'Must define .citation-score-badge');
  });

  it('should implement citation rendering in app.js', () => {
    assert.ok(js.includes('renderKnowledgeCitations'), 'Must define renderKnowledgeCitations function');
    assert.ok(js.includes('openKnowledgeNote'), 'Must define openKnowledgeNote function');
    assert.ok(js.includes('Open in Obsidian'), 'Must include Open in Obsidian link text');
  });
});
