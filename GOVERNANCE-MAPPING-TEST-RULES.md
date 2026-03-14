# Governance Mapping — Test Rules

**Repository:** YorkieB/Storage-UI-v2  
**Last Updated:** 2026-03-14  
**Stage:** 11 — Governance Mapping  
**Compliance Cycle:** Phase 4

This document maps every tracked file in the repository to the specific governance rules that apply to it. It is consumed by the nightly Stage 11 compliance scan to verify coverage and ownership.

---

## Mapping Table

| File | Governance Rule(s) | Stage(s) | Owner | Status |
|------|--------------------|----------|-------|--------|
| `src/CloudStorageApp.jsx` | Rule 1: No temporary markers (TODO/FIXME/HACK/TEMP/WIP); Rule 2: No `console.log` debug statements; Rule 3: API keys externalised to environment variables; Rule 4: Single-responsibility components | Stage 4, Stage 5 | Frontend | ✅ Compliant |
| `src/main.jsx` | Rule 1: No temporary markers; Rule 2: No `console.log` debug statements | Stage 4 | Frontend | ✅ Compliant |
| `src/index.css` | Rule 1: No temporary markers | Stage 4 | Frontend | ✅ Compliant |
| `.env.example` | Rule 3: API keys externalised — example file must list all required environment variables without real values | Stage 5 | Platform | ✅ Compliant |
| `vite.config.js` | Rule 5: Build configuration must not expose secrets; dev server port must be documented in Action Document | Stage 5, Stage 8 | Platform | ✅ Compliant |
| `package.json` | Rule 6: Dependencies must pass `npm audit`; version field must follow semver | Stage 2 | Platform | ✅ Compliant |
| `index.html` | Rule 1: No temporary markers | Stage 4 | Frontend | ✅ Compliant |
| `README.md` | Rule 7: README must include Quick Start, Environment Variables, and Build instructions | Stage 8 | Documentation | ✅ Compliant |
| `docs/actions/2026-03-14-governance-compliance-v2.md` | Rule 8: Action Documents must contain all 8 mandated sections | Stage 8 | Governance | ✅ Compliant |
| `GOVERNANCE-MAPPING-TEST-RULES.md` | Rule 9: Governance mapping must exist and list every tracked file | Stage 11 | Governance | ✅ Compliant |

---

## Rule Definitions

| Rule ID | Rule Name | Description |
|---------|-----------|-------------|
| Rule 1 | No Temporary Markers | Source files must not contain `TODO`, `FIXME`, `HACK`, `TEMP`, or `WIP` comments. |
| Rule 2 | No Debug Logging | Source files must not contain `console.log` statements. `console.error` / `console.warn` are permitted in error-handling paths. |
| Rule 3 | Credential Externalisation | API keys, tokens, and passwords must be read from environment variables (e.g., `import.meta.env.VITE_*`). No hardcoded secrets. |
| Rule 4 | Single Responsibility | Each component file should have a single, clearly defined responsibility. |
| Rule 5 | Secure Build Configuration | Build and server configuration files must not reference or embed secrets. Dev port must be documented. |
| Rule 6 | Dependency Hygiene | All dependencies must pass `npm audit`. Package versions must follow semver. |
| Rule 7 | README Completeness | The root `README.md` must include Quick Start instructions, an Environment Variables table, and Build/Deploy instructions. |
| Rule 8 | Action Document Structure | Every Action Document in `docs/actions/` must contain all 8 mandated sections (Summary, Motivation, Affected Files, Affected Ports, Version Changes, Migration Notes, Validation Notes, Release Notes). |
| Rule 9 | Governance Coverage | This mapping file must list every tracked file in the repository and assign at least one rule to it. |

---

## Coverage Summary

| Metric | Value |
|--------|-------|
| Total files tracked | 10 |
| Files compliant | 10 |
| Files non-compliant | 0 |
| Rules defined | 9 |
| Coverage | 100% |

---

## Audit History

| Date | Phase | Action | Result |
|------|-------|--------|--------|
| 2026-03-14 | Phase 4 | Initial governance mapping created | 10/10 files compliant |
