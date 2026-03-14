# Contributing to Storage-UI-v2

Thank you for your interest in contributing to **CloudDrive / Storage-UI-v2**! This document outlines the standards and workflow required to keep the project compliant with the organization's **Coding Rules & Governance System**.

## Code of Conduct

All contributors are expected to maintain a respectful and professional environment. Harassment or discriminatory behaviour will not be tolerated.

## Getting Started

1. Fork the repository and clone your fork locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Governance & Compliance Requirements

This project enforces the organization's governance rules via automated workflows. All pull requests must pass the following checks before merging:

| Workflow | Stage | Description |
| :--- | :--- | :--- |
| `01-biome-check.yml` | Stage 1 | Biome formatting and linting |
| `02-dependency-validation.yml` | Stage 2 | Dependency security audit |
| `05-architecture-integrity.yml` | Stage 5 | Architecture boundary enforcement |

## Code Style

This project uses **[Biome](https://biomejs.dev/)** for formatting and linting. ESLint is no longer used.

- **Indentation**: Tabs (enforced by Biome)
- **Linting**: Biome recommended rules are enabled
- **Components**: Must use **PascalCase** (e.g., `CloudStorageApp.jsx`)
- **Utilities**: Must use **camelCase**

Run the full check locally before pushing:
```bash
npm run lint
npm run check:all
```

## Architecture Boundaries

- Components in `src/` must not directly import services or backend modules.
- Keep business logic out of render functions where possible.

Run the architecture check:
```bash
npm run check:architecture
```

## Submitting a Pull Request

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and ensure all governance checks pass locally.
3. Open a pull request against `main` with a clear description of your changes.
4. Address any review feedback promptly.

## Reporting Issues

Open a GitHub Issue with a clear description and reproduction steps. For security vulnerabilities, see [SECURITY.md](./SECURITY.md).
