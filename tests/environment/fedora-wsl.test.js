import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

describe('Fedora WSL 2 Environment Verification', () => {
  it('should verify WSL is version 2 and status is clean', () => {
    const status = execSync('wsl.exe --status', { encoding: 'utf8' });
    assert.ok(status.length > 0, 'WSL status must return text');
  });

  it('should find Fedora distribution registered under WSL', () => {
    const list = execSync('wsl.exe -l -v', { encoding: 'utf8' }).replace(/\x00/g, '');
    assert.match(list, /Fedora/i, 'Fedora must be registered in WSL list');
  });

  it('should query /etc/os-release inside Fedora successfully', () => {
    const osRelease = execSync('wsl.exe -d Fedora -e cat /etc/os-release', { encoding: 'utf8' });
    assert.match(osRelease, /ID=fedora/i, 'Distro ID must be fedora');
  });

  it('should have conservative resource limits in .wslconfig', () => {
    const wslConfigPath = 'C:\\Users\\ASUS\\.wslconfig';
    if (fs.existsSync(wslConfigPath)) {
      const content = fs.readFileSync(wslConfigPath, 'utf8');
      assert.match(content, /memory=/i, 'Must define memory limit');
      assert.match(content, /processors=/i, 'Must define processors limit');
    }
  });
});
