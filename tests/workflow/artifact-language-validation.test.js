import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowResultValidator } from '../../platform/workflow-engine/workflow-result-validator.js';

test('3. Artifact Language Validation: Rejects cross-language contamination in JavaScript', () => {
  // Contaminated JS containing Java code
  const contaminated = {
    filename: 'script.js',
    content: 'public class Palindrome { public static void main(String[] args) { System.out.println("test"); } }',
    language: 'javascript'
  };

  const res = WorkflowResultValidator.validateArtifact(contaminated, 'JavaScript');
  assert.equal(res.valid, false);
  assert.ok(res.error.includes('Cross-language contamination'));

  // Valid JS
  const cleanJs = {
    filename: 'script.js',
    content: 'const items = [1, 2, 3]; function render() { return items.map(x => x * 2); }',
    language: 'javascript'
  };

  const validRes = WorkflowResultValidator.validateArtifact(cleanJs, 'JavaScript');
  assert.equal(validRes.valid, true);
});

test('3b. Artifact Language Validation: Validates HTML, CSS, C++, Java, and Python', () => {
  const htmlArt = { filename: 'index.html', content: '<!DOCTYPE html><html><body><h1>Test</h1></body></html>', language: 'html' };
  const cssArt = { filename: 'styles.css', content: ':root { --main: #fff; } body { margin: 0; padding: 0; }', language: 'css' };
  const cppArt = { filename: 'palindrome.cpp', content: '#include <iostream>\nint main() { return 0; }', language: 'cpp' };
  const javaArt = { filename: 'Palindrome.java', content: 'public class Palindrome { boolean check() { return true; } }', language: 'java' };
  const pyArt = { filename: 'palindrome.py', content: 'def is_palindrome(s):\n    return s == s[::-1]', language: 'python' };

  assert.equal(WorkflowResultValidator.validateArtifact(htmlArt, 'HTML').valid, true);
  assert.equal(WorkflowResultValidator.validateArtifact(cssArt, 'CSS').valid, true);
  assert.equal(WorkflowResultValidator.validateArtifact(cppArt, 'C++').valid, true);
  assert.equal(WorkflowResultValidator.validateArtifact(javaArt, 'Java').valid, true);
  assert.equal(WorkflowResultValidator.validateArtifact(pyArt, 'Python').valid, true);
});
