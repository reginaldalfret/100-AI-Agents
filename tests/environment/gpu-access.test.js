import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';

describe('NVIDIA GPU Access inside Fedora WSL 2', () => {
  it('should discover NVIDIA GPU through nvidia-smi in Fedora', () => {
    const smiOut = execSync('wsl.exe -d Fedora -e /usr/lib/wsl/lib/nvidia-smi', { encoding: 'utf8' });
    assert.match(smiOut, /NVIDIA GeForce RTX 2050/i, 'Must detect RTX 2050 GPU');
    assert.match(smiOut, /4096MiB/i, 'Must detect 4096 MiB VRAM');
  });

  it('should detect CUDA driver passthrough library', () => {
    const libCheck = execSync('wsl.exe -d Fedora -e ls -l /usr/lib/wsl/lib/libcuda.so.1', { encoding: 'utf8' });
    assert.match(libCheck, /libcuda\.so\.1/i, 'libcuda.so.1 must be mapped into WSL');
  });
});
