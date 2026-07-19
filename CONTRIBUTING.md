# Contributing to DeltaOps

Thank you for your interest in contributing to **DeltaOps** — an enterprise cryptocurrency trading platform with full observability! We welcome contributions from developers, DevOps engineers, site reliability engineers, and UI/UX designers.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Development Guidelines](#development-guidelines)
3. [Branching Strategy](#branching-strategy)
4. [Commit Conventions](#commit-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Issue Reporting](#issue-reporting)

---

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to `security@deltaops.internal`.

---

## Development Guidelines

### Prerequisites
- Python 3.11+
- Node.js 18+ & pnpm / npm
- Docker Desktop / Podman
- Git 2.38+

### Environment Setup
1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/deltaops.git
   cd deltaops
   ```
2. Create your feature branch from `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```
3. Copy the environment config:
   ```bash
   cp .env.example .env
   ```

---

## Branching Strategy

We follow **Enterprise Git Flow**:
- `main`: Production-ready code only. Tagged with semantic versions (`vX.Y.Z`).
- `develop`: Integration branch for pre-release state.
- `feature/<name>`: New capabilities or modules.
- `hotfix/<name>`: Critical production fixes branched from `main`.
- `release/<version>`: Preparation branch for upcoming production releases.
- `docs/<name>`: Documentation updates.
- `ci/<name>`: CI/CD pipeline modifications.

---

## Commit Conventions

We strictly enforce **Conventional Commits**:

Format: `<type>(<scope>): <short description>`

### Commit Types:
- `feat`: A new user-facing or API feature.
- `fix`: A bug fix.
- `docs`: Documentation updates only.
- `style`: Formatting, missing semi-colons, whitespace fixes.
- `refactor`: Code restructuring without functional changes.
- `perf`: Code modification to improve latency or memory usage.
- `test`: Adding missing tests or refactoring test suites.
- `build`: Dependency upgrades or build tool adjustments.
- `ci`: GitHub Actions or automation updates.
- `chore`: Maintenance tasks or repository tooling.

### Examples:
```
feat(market-data): add WebSocket reconnect handler for L2 orderbook
fix(gateway): resolve rate-limiting memory leak in Redis middleware
docs(api): update WebSocket payload specification in API_GUIDELINES.md
```

---

## Pull Request Process

1. Ensure all code conforms to the formatting and linting rules:
   - Backend: `black`, `isort`, `flake8`, `mypy`
   - Frontend: `eslint`, `prettier`
2. Update documentation (`docs/`) if API or architecture changes were made.
3. Open a Pull Request targeting the `develop` branch.
4. Complete the PR template checklist.
5. Obtain approval from at least **1 Staff/Senior reviewer** before merging.

---

## Issue Reporting

Use the provided [GitHub Issue Templates](.github/ISSUE_TEMPLATE/):
- **Bug Report**: Provide reproduction steps, expected vs actual behavior, logs, and system environment.
- **Feature Request**: Detail user value, proposed technical approach, and alternative designs considered.
