# 301 SUPER AI — Cloudflare Cutover & Rollback Runbook

**Target Domain**: `https://superai.reginaldalfret.tech`  
**Cloudflare Tunnel Config**: `C:\Users\ASUS\.cloudflared\config.yml`  
**Tunnel ID**: `68ed2dc1-dd09-45ee-b538-21d694e3b5a5`  

---

## 1. Port Architecture

| Component | Port | Purpose |
| :--- | :--- | :--- |
| **Node.js Gateway** | `http://127.0.0.1:8300` | Core API, RAG, Ollama Bridge, Postgres Repositories |
| **Next.js Production App** | `http://127.0.0.1:3000` | SSR, React 19 UI, Liquid Glass styles, `/api/*` rewrites to 8300 |

---

## 2. Cutover Procedure (Switching Production to Next.js)

1. **Update Cloudflare Ingress**:
   In `C:\Users\ASUS\.cloudflared\config.yml`, set the service for `superai.reginaldalfret.tech` to `http://127.0.0.1:3000`:
   ```yaml
   ingress:
     - hostname: superai.reginaldalfret.tech
       service: http://127.0.0.1:3000
   ```

2. **Restart Cloudflared Service**:
   ```powershell
   Restart-Service -Name Cloudflared
   ```

3. **Verify Public Live Site**:
   Run smoke and E2E tests directly against `https://superai.reginaldalfret.tech`.

---

## 3. Immediate Rollback Procedure (Safety Guarantee)

If any critical failure occurs:
1. Revert `C:\Users\ASUS\.cloudflared\config.yml` service for `superai.reginaldalfret.tech` to `http://127.0.0.1:8300`.
2. Restart Cloudflared:
   ```powershell
   Restart-Service -Name Cloudflared
   ```
3. Verification will immediately return to the legacy SPA served by the Gateway on port 8300.
