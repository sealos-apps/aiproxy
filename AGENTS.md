# Repository Instructions

## Health Checks

- Keep `/healthz` strict: it is the startup, liveness, readiness, and Sealos-style availability endpoint. It must validate required runtime configuration and perform only read-only backend smoke checks.
- Do not add a separate probe endpoint unless the probe contract is intentionally split again.
- Never add database writes, token creation, group/channel mutations, or user-scoped side effects to health probes.
- Do not include secret values in health responses or logs. Report missing or invalid secret-backed settings by name only.
- Validate URL-backed settings as URLs and treat backend smoke checks as healthy only when the expected JSON contract reports `success: true`.
- Keep Helm startup, liveness, and readiness probes routed to `/healthz`.
