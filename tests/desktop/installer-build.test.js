import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const releaseDir = path.join(projectRoot, 'release');

describe('Windows Installer Production Release Artifacts', () => {
  it('verifies 301-Super-AI-Setup.exe exists and is non-empty', () => {
    const exePath = path.join(releaseDir, '301-Super-AI-Setup.exe');
    assert.ok(fs.existsSync(exePath), 'Setup EXE must exist in release/');
    const stat = fs.statSync(exePath);
    assert.ok(stat.size > 1000, 'Setup EXE must have valid binary size');
  });

  it('verifies 301-Super-AI-Setup.msi exists and is non-empty', () => {
    const msiPath = path.join(releaseDir, '301-Super-AI-Setup.msi');
    assert.ok(fs.existsSync(msiPath), 'Setup MSI must exist in release/');
    const stat = fs.statSync(msiPath);
    assert.ok(stat.size > 1000, 'Setup MSI must have valid binary size');
  });

  it('verifies 301-Super-AI.exe desktop launcher exists', () => {
    const launcherPath = path.join(releaseDir, '301-Super-AI.exe');
    assert.ok(fs.existsSync(launcherPath), 'Desktop launcher EXE must exist');
    const stat = fs.statSync(launcherPath);
    assert.ok(stat.size > 1000, 'Launcher EXE must have valid binary size');
  });

  it('validates release/build-manifest.json structure and contents', () => {
    const manifestPath = path.join(releaseDir, 'build-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'build-manifest.json must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.targetPlatform, 'Windows 10/11 x64');
    assert.equal(manifest.airGapped, true);
    assert.equal(manifest.zeroManualDependencies, true);
    assert.ok(Array.isArray(manifest.releaseArtifacts));
    assert.equal(manifest.releaseArtifacts.length, 3);
  });

  it('verifies release/checksums.txt SHA-256 cryptographic hashes match file contents', () => {
    const checksumsPath = path.join(releaseDir, 'checksums.txt');
    assert.ok(fs.existsSync(checksumsPath), 'checksums.txt must exist');
    const lines = fs.readFileSync(checksumsPath, 'utf8').split('\n').filter(l => l && !l.startsWith('#'));

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const [expectedHash, filename] = parts;
        const filePath = path.join(releaseDir, filename);
        assert.ok(fs.existsSync(filePath), `Artifact ${filename} must exist`);
        const buffer = fs.readFileSync(filePath);
        const actualHash = crypto.createHash('sha256').update(buffer).digest('hex');
        assert.equal(actualHash, expectedHash, `SHA-256 mismatch for ${filename}`);
      }
    });
  });
});
