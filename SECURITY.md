# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in **CloudDrive / Storage-UI-v2**, please report it responsibly.

**Do not open a public GitHub Issue for security vulnerabilities.**

### How to Report

1. Email the maintainer directly with a description of the vulnerability.
2. Include steps to reproduce, the potential impact, and any suggested mitigations.
3. You will receive an acknowledgement within 48 hours and a resolution timeline within 7 days.

### Scope

This application handles:
- Cloud storage file management
- Google Gemini AI API integration
- User authentication state (client-side)

Please pay particular attention to:
- **API key exposure**: The Gemini API key must never be committed to the repository. Use `.env` files as documented in `.env.example`.
- **Input sanitization**: All user-supplied file names and search queries must be validated before use.
- **Data privacy**: AI-generated content and uploaded file metadata should not be transmitted to third-party services beyond those explicitly documented.

## Disclosure Policy

Once a fix is available, we will publish a security advisory on this repository and credit the reporter (unless anonymity is requested).
