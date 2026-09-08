import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';

describe('Windows E: Drive Mount & Project Availability in Fedora', () => {
  it('should find /mnt/e/Smart Automation/100-AI-Agents directory accessible in Fedora', () => {
    const listOut = execSync('wsl.exe -d Fedora -e ls -d "/mnt/e/Smart Automation/100-AI-Agents"', { encoding: 'utf8' });
    assert.match(listOut, /Smart Automation\/100-AI-Agents/, 'Mount path must resolve');
  });

  it('should verify project models directories exist on mount', () => {
    const modelsOut = execSync('wsl.exe -d Fedora -e sh -c "ls -d \'/mnt/e/Smart Automation/100-AI-Agents/models\'/*"', { encoding: 'utf8' });
    assert.match(modelsOut, /models\/research|models\/fine-tuned|models\/quantized/, 'Models directories must exist');
  });
});
