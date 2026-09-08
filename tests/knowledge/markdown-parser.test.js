import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MarkdownParser } from '../../platform/knowledge/markdown-parser.js';

describe('Markdown Parser & Semantics', () => {
  const parser = new MarkdownParser();

  it('should parse YAML frontmatter correctly', () => {
    const raw = `---
title: Sample Architecture Note
tags: [architecture, local-ai, sov]
domain: architecture
status: VERIFIED
---
# Overview
This is a sample document for testing parser frontmatter.`;

    const parsed = parser.parse(raw);
    assert.strictEqual(parsed.frontmatter.title, 'Sample Architecture Note');
    assert.strictEqual(parsed.frontmatter.domain, 'architecture');
    assert.strictEqual(parsed.frontmatter.status, 'VERIFIED');
    assert.deepStrictEqual(parsed.frontmatter.tags, ['architecture', 'local-ai', 'sov']);
  });

  it('should extract heading hierarchy', () => {
    const raw = `# Main Heading
Content A
## Subheading Level 2
Content B
### Section Level 3
Content C`;

    const parsed = parser.parse(raw);
    assert.strictEqual(parsed.headings.length, 3);
    assert.strictEqual(parsed.headings[0].level, 1);
    assert.strictEqual(parsed.headings[0].title, 'Main Heading');
    assert.strictEqual(parsed.headings[1].level, 2);
    assert.strictEqual(parsed.headings[1].title, 'Subheading Level 2');
    assert.strictEqual(parsed.headings[2].level, 3);
    assert.strictEqual(parsed.headings[2].title, 'Section Level 3');
  });

  it('should extract inline #tags correctly', () => {
    const raw = `This note contains inline tags like #qlora and #gpu-memory.
Also #medical/cardiology hierarchical tag.`;

    const parsed = parser.parse(raw);
    assert.ok(parsed.tags.includes('qlora'));
    assert.ok(parsed.tags.includes('gpu-memory'));
    assert.ok(parsed.tags.includes('medical/cardiology'));
  });

  it('should extract [[wikilinks]] with aliases and anchors', () => {
    const raw = `See [[301 Architecture]] and [[QLoRA|Quantized LoRA]] for fine-tuning.
Also check section [[Healthcare#Clinical Support]].`;

    const parsed = parser.parse(raw);
    assert.strictEqual(parsed.wikilinks.length, 3);
    assert.strictEqual(parsed.wikilinks[0].target, '301 Architecture');
    assert.strictEqual(parsed.wikilinks[1].target, 'QLoRA');
    assert.strictEqual(parsed.wikilinks[1].alias, 'Quantized LoRA');
    assert.strictEqual(parsed.wikilinks[2].target, 'Healthcare');
    assert.strictEqual(parsed.wikilinks[2].anchor, 'Clinical Support');
  });

  it('should preserve tables and code blocks during semantic chunking', () => {
    const raw = `# Table & Code Section

Here is code:
\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

Here is a table:
| Model | Size | Hardware |
|---|---|---|
| Nemotron 3 | 2.8 GB | RTX 2050 |
| Gemma 3 | 1.0 GB | CPU/GPU |`;

    const chunks = parser.chunk(raw, { title: 'Code & Table Note' });
    assert.ok(chunks.length > 0);
    const chunkText = chunks[0].text;
    assert.ok(chunkText.includes('const x = 42;'));
    assert.ok(chunkText.includes('| Model | Size | Hardware |'));
  });
});
