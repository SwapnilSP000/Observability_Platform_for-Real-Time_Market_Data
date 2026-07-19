# Security Policy & Credential Management - DeltaOps

## 🛡️ Reporting Vulnerabilities

At **DeltaOps**, we take the security of our trading platform, user data, and financial API credentials extremely seriously.

> [!CAUTION]
> **Do NOT submit security vulnerabilities through public GitHub issues.**

### How to Report a Vulnerability
If you believe you have discovered a security vulnerability in DeltaOps, please email our Security Team at `security@deltaops.internal`. Include the following details:

1. **Type of issue**: (e.g., API key leak risk, XSS, SSRF, SQL Injection, WebSocket hijack).
2. **Component affected**: (e.g., `gateway`, `backend`, `frontend`, `configs`).
3. **Step-by-step instructions** or Proof of Concept (PoC) script.
4. **Impact assessment**.

We will acknowledge receipt of your vulnerability report within **24 hours** and provide a resolution timeline within **72 hours**.

---

## 🔑 Secrets & Credential Management Rules

1. **Zero hardcoded secrets**: Never commit API keys, passphrases, private keys, or passwords to Git.
2. **Environment Variable Enforcement**: All secret credentials MUST be loaded via `.env` files or cloud secret managers (AWS Secrets Manager, HashiCorp Vault).
3. **GitHub Secrets Integration**: When running CI/CD pipelines or deploying to staging/production, configure the following repository secrets:
   - `DELTA_API_KEY`: Delta Exchange production API Key
   - `DELTA_API_SECRET`: Delta Exchange HMAC secret
   - `GRAFANA_ADMIN_PASSWORD`: Grafana administration password
4. **Automated Secret Scanning**: Pre-commit hooks (`gitleaks`, `trufflehog`) run automatically on GitHub Actions workflows. Commits containing detected secrets will be rejected instantly.
