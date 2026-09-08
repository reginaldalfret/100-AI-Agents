#!/usr/bin/env python3
"""
301 SUPER AI — Fedora WSL 2 PyTorch CUDA Hardware Verification Script
Verifies PyTorch, CUDA availability, GPU device name (RTX 2050), VRAM, and tensor execution.
"""
import sys

print("============================================================")
print("301 SUPER AI — FEDORA WSL 2 PYTORCH CUDA VERIFICATION")
print("============================================================")

try:
    import torch
    print(f"PyTorch Version: {torch.__version__}")
except ImportError as e:
    print(f"PyTorch: NOT INSTALLED ({e})")
    sys.exit(1)

cuda_available = torch.cuda.is_available()
print(f"CUDA:\n{'AVAILABLE' if cuda_available else 'UNAVAILABLE'}")

if cuda_available:
    device_count = torch.cuda.device_count()
    print(f"Device Count: {device_count}")
    for i in range(device_count):
        name = torch.cuda.get_device_name(i)
        total_mem = torch.cuda.get_device_properties(i).total_memory / (1024**2)
        print(f"GPU:\n{name}")
        print(f"Total VRAM: {total_mem:.1f} MiB")
        
    print("\nRunning matrix multiplication test on CUDA device...")
    x = torch.randn(1000, 1000, device="cuda")
    y = torch.matmul(x, x.T)
    res = y.sum().item()
    print(f"Tensor verification check sum: {res:.4f}")
    print("STATUS: CUDA ACCELERATION CONFIRMED WORKING")
else:
    print("GPU:\nNO GPU DETECTED")
    print("STATUS: CUDA ACCELERATION FAILED")
    sys.exit(1)
