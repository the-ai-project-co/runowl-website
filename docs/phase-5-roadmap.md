# Phase 5 — Enterprise (Roadmap)

## Goal

Enterprise-grade deployment, compliance, and multi-environment support.

---

## Milestone 5.1: Deployment

- Helm charts for Kubernetes deployment
- Docker Compose for self-hosted setup
- On-premises installation documentation
- Air-gapped environment support

## Milestone 5.2: Authentication & Compliance

### UI Complete
- SSO/SAML configuration page (`/app/settings/sso`) — provider selector, metadata URL, ACS URL display
- Audit logs stub page (`/app/admin/audit`)
- Compliance stub page (`/app/admin/compliance`)

### Backend Pending
- SSO/SAML backend integration (Okta, Azure AD, Google Workspace, custom IdP)
- SCIM provisioning
- Audit log system connected to real backend
- Compliance report generation (SOC2, ISO 27001 readiness)

## Milestone 5.3: Multi-Environment

- Environment configuration (prod, staging, dev)
- Environment-specific test execution
- Environment-aware review rules
- Deployment pipeline integration
