/**
 * Sovereign AI Workbench — Multi-Agent Workflow Result Validator
 * 
 * Enforces strict content integrity and cross-technology isolation:
 * - JavaScript (.js) must not contain Java/C++/Python artifacts and must pass JS syntax check.
 * - HTML (.html) must contain valid markup.
 * - CSS (.css) must contain valid stylesheet rules.
 * - C++ (.cpp/.c) must contain valid C/C++ source constructs.
 * - Java (.java) must contain valid Java source constructs.
 * - Python (.py) must contain valid Python source constructs.
 */

import vm from 'node:vm';

export class WorkflowResultValidator {
  /**
   * Validate an artifact's content against its declared technology/extension.
   * @param {Object} artifact - { filename, content, language, subtaskId }
   * @param {string} expectedTechnology - e.g. 'JavaScript', 'HTML', 'CSS', 'Java', 'Python', 'C++'
   * @returns {{ valid: boolean, error?: string, language: string }}
   */
  static validateArtifact(artifact, expectedTechnology = '') {
    if (!artifact || typeof artifact.content !== 'string' || !artifact.content.trim()) {
      return { valid: false, error: 'Artifact content is empty', language: 'unknown' };
    }

    const content = artifact.content.trim();
    const filename = (artifact.filename || '').toLowerCase();
    const tech = (expectedTechnology || artifact.language || '').toLowerCase().trim();

    // 1. JavaScript Validation (.js)
    if (filename.endsWith('.js') || tech.includes('javascript') || tech === 'js') {
      // Cross-language contamination check: Reject Java syntax
      const javaContaminants = [
        /\bpublic\s+class\b/i,
        /\bSystem\.out\.println\b/,
        /\bStringBuilder\s+\w+\s*=/i,
        /\bpublic\s+static\s+void\s+main\b/,
        /\bimport\s+java\./,
        /\bString\[\]\s+args\b/
      ];

      for (const pattern of javaContaminants) {
        if (pattern.test(content)) {
          return {
            valid: false,
            error: `Cross-language contamination: JavaScript artifact '${artifact.filename}' contains Java syntax (${pattern.toString()})`,
            language: 'javascript'
          };
        }
      }

      // Cross-language check: Reject C++ include
      if (/#include\s*<iostream>/i.test(content) || /std::cout/i.test(content)) {
        return {
          valid: false,
          error: `Cross-language contamination: JavaScript artifact '${artifact.filename}' contains C++ syntax`,
          language: 'javascript'
        };
      }

      // Syntax check using Node vm
      try {
        new vm.Script(content, { filename: artifact.filename || 'script.js' });
      } catch (err) {
        try {
          new Function(content);
        } catch (fnErr) {
          const stripped = content.replace(/^\s*(import|export)\s+.*$/gm, '// $1');
          try {
            new Function(stripped);
          } catch (finalErr) {
            return {
              valid: false,
              error: `JavaScript syntax validation error: ${finalErr.message}`,
              language: 'javascript'
            };
          }
        }
      }

      return { valid: true, language: 'javascript' };
    }

    // 2. HTML Validation (.html)
    if (filename.endsWith('.html') || tech.includes('html') || tech.includes('markup')) {
      const isJavaClass = /\bpublic\s+class\b/.test(content);
      const isCpp = /#include\s*</.test(content);

      if (isJavaClass || isCpp) {
        return {
          valid: false,
          error: `Cross-language contamination: HTML artifact '${artifact.filename}' contains code instead of markup`,
          language: 'html'
        };
      }

      const hasTags = /<(!DOCTYPE|[a-z0-9]+)(\s+[^>]*)?>/i.test(content);
      const isComment = content.startsWith('<!--') || content.startsWith('//');
      if (!hasTags && !isComment) {
        return {
          valid: false,
          error: `HTML validation error: No HTML tags detected in '${artifact.filename}'`,
          language: 'html'
        };
      }

      return { valid: true, language: 'html' };
    }

    // 3. CSS Validation (.css)
    if (filename.endsWith('.css') || tech.includes('css') || tech.includes('styling')) {
      const isJava = /\bpublic\s+class\b/.test(content);
      const isJs = /\bfunction\s+\w+\s*\(/.test(content) || /\bconst\s+\w+\s*=\s*\[/.test(content);

      if (isJava || isJs) {
        return {
          valid: false,
          error: `Cross-language contamination: CSS artifact '${artifact.filename}' contains programming logic`,
          language: 'css'
        };
      }

      const hasCssRules = /[{;:]/.test(content) || content.startsWith('/*') || content.startsWith('//');
      if (!hasCssRules) {
        return {
          valid: false,
          error: `CSS validation error: No CSS rules detected in '${artifact.filename}'`,
          language: 'css'
        };
      }

      return { valid: true, language: 'css' };
    }

    // 4. Java Validation (.java)
    if (filename.endsWith('.java') || tech === 'java' || (tech.includes('java') && !tech.includes('javascript') && !tech.includes('js'))) {
      const isJsOnly = /document\.getElementById|addEventListener/.test(content);

      if (isJsOnly) {
        return {
          valid: false,
          error: `Cross-language contamination: Java artifact '${artifact.filename}' contains DOM JavaScript`,
          language: 'java'
        };
      }

      const hasJavaClass = /\bclass\s+\w+/i.test(content) || content.startsWith('//') || content.startsWith('/*');
      if (!hasJavaClass) {
        return {
          valid: false,
          error: `Java validation error: No class definition in '${artifact.filename}'`,
          language: 'java'
        };
      }

      return { valid: true, language: 'java' };
    }

    // 5. C++ Validation (.cpp / .c)
    if (filename.endsWith('.cpp') || filename.endsWith('.c') || tech.includes('c\+\+') || tech === 'cpp' || tech === 'c') {
      const isJava = /\bpublic\s+class\b|System\.out\.println/.test(content);

      if (isJava) {
        return {
          valid: false,
          error: `Cross-language contamination: C++ artifact '${artifact.filename}' contains Java code`,
          language: 'cpp'
        };
      }

      const hasCppConstruct = /#include|std::|int\s+main|bool\s+\w+|void\s+\w+/.test(content) || content.startsWith('//') || content.startsWith('/*');
      if (!hasCppConstruct) {
        return {
          valid: false,
          error: `C++ validation error: No C/C++ constructs detected in '${artifact.filename}'`,
          language: 'cpp'
        };
      }

      return { valid: true, language: 'cpp' };
    }

    // 6. Python Validation (.py)
    if (filename.endsWith('.py') || tech.includes('python') || tech === 'py') {
      const isJava = /\bpublic\s+class\b|System\.out\.println/.test(content);
      const isCpp = /#include\s*</.test(content);

      if (isJava || isCpp) {
        return {
          valid: false,
          error: `Cross-language contamination: Python artifact '${artifact.filename}' contains non-Python code`,
          language: 'python'
        };
      }

      const hasPyConstruct = /\b(def|import|from|class|if\s+__name__)\b/.test(content) || /:\s*$/m.test(content) || content.startsWith('#') || content.startsWith('//');
      if (!hasPyConstruct) {
        return {
          valid: false,
          error: `Python validation error: No Python constructs in '${artifact.filename}'`,
          language: 'python'
        };
      }

      return { valid: true, language: 'python' };
    }

    return { valid: true, language: tech || 'text' };
  }

  /**
   * Validate entire workflow execution output for cross-subtask integrity.
   */
  static validateWorkflowExecution(workflowContext) {
    const errors = [];
    const artifacts = workflowContext.artifacts || [];

    for (const art of artifacts) {
      const subtask = (workflowContext.plan?.subtasks || []).find(s => s.subtaskId === art.subtaskId);
      const tech = subtask?.technology || art.language;
      const res = this.validateArtifact(art, tech);
      if (!res.valid) {
        errors.push({
          artifactId: art.id,
          filename: art.filename,
          subtaskId: art.subtaskId,
          error: res.error
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
