# FinTrack AI Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Active support  |

## Reporting a Vulnerability

If you discover a security vulnerability in FinTrack AI, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainers directly with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

We will respond within 48 hours and work with you to understand and address the issue.

## Security Measures

### Authentication
- Passwords are hashed using SHA-256 with a unique salt
- Sessions are stored locally and validated against the Convex backend on every request
- No plaintext passwords are ever stored or transmitted

### Authorization
- Every database operation verifies the requesting user owns the resource
- Cross-user data access is explicitly denied at the backend level
- Unauthenticated users cannot access any protected routes

### Data Protection
- User data is isolated per account — no shared data between users
- Financial data is encrypted in transit (HTTPS)
- No secrets, API keys, or passwords are exposed in the frontend code
- Environment variables are used for all sensitive configuration

### Input Validation
- All form inputs are validated before submission
- CSV imports are sanitized against formula injection attacks
- Transaction amounts are validated as positive numbers
- Description lengths are bounded

### ML Models
- Model artifacts are not exposed to the client
- ML inference runs server-side only
- Anomaly detection never labels transactions as "fraud" — only as "unusual"

## Scope

The following are in scope:
- Authentication bypass
- Authorization bypass (accessing another user's data)
- Cross-site scripting (XSS)
- SQL/NoSQL injection
- Server-side request forgery (SSRF)
- Remote code execution
- Sensitive data exposure

The following are out of scope:
- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report to the dependency maintainer)
- Issues requiring physical access to a user's device

## Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Do not exploit the vulnerability beyond what is necessary to demonstrate it
- Do not access or modify data belonging to other users
