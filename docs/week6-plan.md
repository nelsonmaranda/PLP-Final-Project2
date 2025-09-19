## Week 6: Refine AI Models & MVP Preparation

Objectives
- Improve model accuracy and stability for initial MVP use-cases
- Get MVP-ready builds running end-to-end with key flows
- Ensure tests, security, and performance are acceptable for demo

Deliverables
- Updated model artifacts (versioned) and inference scripts
- All green CI for frontend and backend tests on Node 18/20
- Documented MVP scope and acceptance checklist

Tasks
1) AI model refinement
- Review current model baselines and validation metrics
- Add data pre-processing consistency between train/infer
- Export lightweight inference pipeline for backend endpoint

2) Backend integration
- Add `/api/ai/predict` route with schema validation and safe fallbacks
- Unit tests for the route and service stubs

3) Frontend integration
- Add client hook for inference (graceful errors, loading)
- Wire to MVP screen behind a feature flag

4) Quality gates
- Frontend tests passing (fix failing selectors/texts)
- Security audit (secrets, dep vulns) and lint clean
- Basic performance budget for bundle size

Checklists
- [ ] Model inference endpoint returns 2xx with mock/model outputs
- [ ] Frontend consumes endpoint and renders outputs
- [ ] CI green on main and PRs
- [ ] No high-severity audit findings remaining

Notes
- Keep credentials in GitHub Secrets; never commit secrets
- Prefer Node 20 for CI; verify Node 18 compatibility where feasible

