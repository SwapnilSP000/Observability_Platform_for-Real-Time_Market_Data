# Developer Guide & Local Setup - DeltaOps

## 1. Prerequisites

Before developing on DeltaOps, ensure your system has:
- **Python**: 3.11 or higher
- **Node.js**: v18.0.0+ and `pnpm` or `npm`
- **Docker & Docker Compose**: v24.0+
- **Git**: 2.38+ with pre-commit configured

---

## 2. Setting Up Local Environment

```bash
# 1. Clone repository
git clone https://github.com/organization/deltaops.git
cd deltaops

# 2. Configure Environment File
cp .env.example .env

# 3. Setup Python Virtual Environment for Backend (in root)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"

# 4. Setup Frontend Dependencies
cd frontend
npm install
```

---

## 3. Coding & Linting Rules

### Backend Python
- Style Guide: **PEP 8** enforced via `black`, `isort`, `flake8`.
- Type Annotations: Strict typing with `mypy`.
- Docstrings: Google Docstring format.

### Frontend TypeScript / React
- Linter: `eslint` with `@typescript-eslint` rules.
- Formatter: `prettier`.
- Component naming: PascalCase for components (`OrderBook.tsx`), camelCase for hooks (`useMarketData.ts`).
