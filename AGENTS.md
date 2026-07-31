# Repository Instructions

## Health Checks

- Keep `/livez` shallow: it should only prove the Next.js process can respond. Kubernetes startup and liveness probes use this endpoint.
- Keep `/healthz` strict: it is the readiness and Sealos-style availability endpoint. It must validate required runtime configuration and perform only read-only backend smoke checks.
- Never add database writes, token creation, group/channel mutations, or user-scoped side effects to health probes.
- Do not include secret values in health responses or logs. Report missing or invalid secret-backed settings by name only.
- Validate URL-backed settings as URLs and treat backend smoke checks as healthy only when the expected JSON contract reports `success: true`.
- Keep Helm probe routing aligned with the endpoint semantics: startup/liveness -> `/livez`, readiness -> `/healthz`.
