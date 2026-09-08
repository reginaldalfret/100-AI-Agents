/**
 * Sovereign AI Workbench — Obsidian Markdown Parser & Semantic Sectioner
 * Parses YAML frontmatter, headings hierarchy, #tags, [[wikilinks]], tables,
 * code blocks, quotes, and produces structure-aware semantic chunks.
 *
 * 100% On-Premise, Air-Gapped, Zero External Dependencies.
 */

export class MarkdownParser {
  parse(content = '', options = {}) {
    return MarkdownParser.parse(content, options);
  }

  chunk(content = '', options = {}) {
    return MarkdownParser.createChunks(content, options);
  }

  static createChunks(content, options = {}) {
    const parsed = typeof content === 'string' ? this.parse(content, options) : content;
    const sections = parsed.sections || this.segmentIntoSections(parsed.body || content, options.title);
    return sections.map((s, idx) => ({
      chunkId: `${options.title || 'doc'}_chunk_${idx}`,
      heading: s.heading,
      headingPath: s.headingPath,
      text: s.content
    }));
  }

  /**
   * Parses raw Markdown note content into a structured representation.
   * @param {string} content - Raw markdown text
   * @param {Object} options - { filename, relativePath, title }
   * @returns {Object} Structured note representation
   */
  static parse(content = '', options = {}) {
    if (typeof content !== 'string') content = '';

    const { frontmatter, body } = this.extractFrontmatter(content);
    const title = options.title || frontmatter.title || this.extractTitle(body, options.filename);
    const headings = this.extractHeadings(body);
    const wikilinks = this.extractWikilinks(body);
    const mdLinks = this.extractMarkdownLinks(body);
    const tags = this.extractTags(body, frontmatter);
    const codeBlocks = this.extractCodeBlocks(body);
    const tables = this.extractTables(body);
    const sections = this.segmentIntoSections(body, title);

    return {
      title,
      filename: options.filename || 'Untitled.md',
      relativePath: options.relativePath || options.filename || 'Untitled.md',
      frontmatter,
      headings,
      wikilinks,
      links: [...wikilinks, ...mdLinks],
      tags,
      codeBlocks,
      tables,
      sections,
      charCount: content.length,
      wordCount: body.trim().split(/\s+/).filter(Boolean).length
    };
  }

  /**
   * Extracts YAML frontmatter between opening and closing --- fences.
   */
  static extractFrontmatter(content) {
    const trimmed = content.trim();
    if (!trimmed.startsWith('---')) {
      return { frontmatter: {}, body: content };
    }

    const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const yamlBlock = match[1];
    const body = match[2];
    const frontmatter = this._parseSimpleYaml(yamlBlock);

    return { frontmatter, body };
  }

  /**
   * Lightweight sovereign YAML parser for Obsidian frontmatter.
   */
  static _parseSimpleYaml(yamlText) {
    const res = {};
    const lines = yamlText.split(/\r?\n/);
    let currentArrayKey = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) continue;

      // Check array item continuation: "  - value"
      const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
      if (arrayItemMatch && currentArrayKey) {
        let val = arrayItemMatch[1].trim();
        val = val.replace(/^["']|["']$/g, '');
        if (!Array.isArray(res[currentArrayKey])) res[currentArrayKey] = [];
        res[currentArrayKey].push(val);
        continue;
      }

      // Check key-value pair: "key: value"
      const kvMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        let val = kvMatch[2].trim();

        if (val === '' || val === null) {
          // Could be starting an array or object
          currentArrayKey = key;
          res[key] = [];
        } else if (val.startsWith('[') && val.endsWith(']')) {
          // Inline array: [item1, item2]
          currentArrayKey = null;
          res[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        } else {
          currentArrayKey = null;
          val = val.replace(/^["']|["']$/g, '');
          // Booleans & numbers
          if (val.toLowerCase() === 'true') res[key] = true;
          else if (val.toLowerCase() === 'false') res[key] = false;
          else if (!isNaN(Number(val)) && val !== '') res[key] = Number(val);
          else res[key] = val;
        }
      }
    }

    return res;
  }

  /**
   * Determines title from first H1 or filename.
   */
  static extractTitle(body, fallbackFilename = '') {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();
    if (fallbackFilename) {
      return fallbackFilename.replace(/\.md$/i, '');
    }
    return 'Untitled Note';
  }

  /**
   * Extracts all headings with depth and line number.
   */
  static extractHeadings(body) {
    const headings = [];
    const lines = body.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          title: match[2].trim(),
          heading: match[2].trim(),
          line: i + 1
        });
      }
    }
    return headings;
  }

  /**
   * Extracts [[wikilinks]] including aliases [[Target|Alias]] and anchors [[Target#Heading]].
   */
  static extractWikilinks(body) {
    const wikilinks = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      const fullContent = match[1].trim();
      let target = fullContent;
      let alias = '';
      let anchor = '';

      if (fullContent.includes('|')) {
        const parts = fullContent.split('|');
        target = parts[0].trim();
        alias = parts.slice(1).join('|').trim();
      }

      if (target.includes('#')) {
        const parts = target.split('#');
        target = parts[0].trim();
        anchor = parts.slice(1).join('#').trim();
      }

      wikilinks.push({
        raw: match[0],
        target: target.replace(/\.md$/i, ''),
        alias: alias || target,
        anchor,
        type: 'WIKILINK'
      });
    }

    return wikilinks;
  }

  /**
   * Extracts standard markdown links [label](url).
   */
  static extractMarkdownLinks(body) {
    const links = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      links.push({
        raw: match[0],
        label: match[1].trim(),
        target: match[2].trim(),
        type: 'MARKDOWN_LINK'
      });
    }
    return links;
  }

  /**
   * Extracts tags from body (#tag) and frontmatter.
   */
  static extractTags(body, frontmatter = {}) {
    const tags = new Set();

    // From frontmatter
    if (frontmatter.tags) {
      if (Array.isArray(frontmatter.tags)) {
        frontmatter.tags.forEach(t => tags.add(String(t).replace(/^#/, '').toLowerCase()));
      } else if (typeof frontmatter.tags === 'string') {
        frontmatter.tags.split(/[\s,]+/).forEach(t => tags.add(t.replace(/^#/, '').toLowerCase()));
      }
    }

    if (frontmatter.tag) {
      tags.add(String(frontmatter.tag).replace(/^#/, '').toLowerCase());
    }

    // From body (#tag followed by word characters, not preceded by URL or code block)
    const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-\/]+)(?=\s|$|[.,;:!?])/g;
    let match;
    while ((match = tagRegex.exec(body)) !== null) {
      const tag = match[1].trim().toLowerCase();
      // Ignore if purely numerical or header marker (# or ##)
      if (!/^\d+$/.test(tag) && tag.length > 1) {
        tags.add(tag);
      }
    }

    return Array.from(tags);
  }

  /**
   * Extracts code blocks with language identifiers.
   */
  static extractCodeBlocks(body) {
    const codeBlocks = [];
    const regex = /```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(body)) !== null) {
      codeBlocks.push({
        language: match[1].trim() || 'text',
        code: match[2]
      });
    }
    return codeBlocks;
  }

  /**
   * Extracts Markdown tables.
   */
  static extractTables(body) {
    const tables = [];
    const lines = body.split(/\r?\n/);
    let inTable = false;
    let currentTable = [];

    for (const line of lines) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        currentTable.push(line.trim());
      } else if (inTable) {
        if (currentTable.length >= 2) {
          tables.push(currentTable.join('\n'));
        }
        inTable = false;
        currentTable = [];
      }
    }
    if (inTable && currentTable.length >= 2) {
      tables.push(currentTable.join('\n'));
    }

    return tables;
  }

  /**
   * Segments body text into semantic sections based on heading hierarchy.
   */
  static segmentIntoSections(body, docTitle = 'Untitled Note') {
    const lines = body.split(/\r?\n/);
    const sections = [];
    let currentHeading = 'Overview';
    let headingPath = [docTitle];
    let currentBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        // Flush previous section
        const content = currentBuffer.join('\n').trim();
        if (content.length > 0) {
          sections.push({
            heading: currentHeading,
            headingPath: headingPath.join(' > '),
            content,
            charCount: content.length
          });
        }

        const level = headingMatch[1].length;
        currentHeading = headingMatch[2].trim();

        // Update hierarchy path
        headingPath = [docTitle, ...headingPath.slice(1, level), currentHeading];
        currentBuffer = [];
      } else {
        currentBuffer.push(line);
      }
    }

    // Flush last section
    const finalContent = currentBuffer.join('\n').trim();
    if (finalContent.length > 0) {
      sections.push({
        heading: currentHeading,
        headingPath: headingPath.join(' > '),
        content: finalContent,
        charCount: finalContent.length
      });
    }

    // Fallback if no sections were created
    if (sections.length === 0 && body.trim().length > 0) {
      sections.push({
        heading: 'General',
        headingPath: docTitle,
        content: body.trim(),
        charCount: body.trim().length
      });
    }

    return sections;
  }
}
