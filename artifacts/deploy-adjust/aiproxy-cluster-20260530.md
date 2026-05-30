# AIProxy Sealos Deploy Adjust Report

- Overall: PASS
- Date: 2026-05-30 CST
- Target: `id=<cluster-id>`, `ip=<cluster-ip>`
- Cluster domain: `<cluster-domain>`
- Branch: `codex/aiproxy-deploy-adjust`
- Baseline command: `sealos run ghcr.io/sealos-apps/aiproxy/aiproxy-cluster:sha-5db063c`
- Final validation image: `<validation-image>`

## Inputs

| Item | Value |
|---|---|
| Base package | `sealos-pro-v5.1.2-rc5-amd64.tar` |
| Addon package | `admin-cluster-v0.1.0-amd64.tar` |
| App package | `ghcr.io/sealos-apps/aiproxy/aiproxy-cluster:sha-5db063c` |
| Namespace | `aiproxy-system` |
| UI validation | AIProxy dashboard, global configs, price/model page |
| API validation | `/v1/models`, `/v1/chat/completions` |
| Test channel | `<test-channel-name>` |
| Test model | `claude-3-5-haiku-20241022` |

Signed package URLs and AI provider credentials are intentionally not recorded in this report.

## Baseline Result

The baseline install command completed, but `aiproxy-web` failed at runtime:

```text
Error: Cannot find module '/app/server.js'
```

Image inspection showed the standalone server was generated below `/app/app/server.js`, while the Dockerfile starts `node server.js` from `/app`.

After the web pod was repaired, the channel form still failed because the frontend requested the removed backend endpoint `/api/channels/type_names`. The running AIProxy backend exposes `/api/channels/type_metas`.

The global default-model save path also failed through the frontend because the backend supports `POST /api/option/batch`, while the frontend proxy was calling it with `PUT`.

## Code Fixes

| File | Change | Result |
|---|---|---|
| `next.config.js` | Set `experimental.outputFileTracingRoot` to `__dirname` so Next standalone output contains root `server.js`. | PASS |
| `app/api/admin/channel/type-name/route.ts` | Prefer `/api/channels/type_metas` and map metadata to the existing frontend type-name shape. Keep `/type_names` fallback. | PASS |
| `app/api/admin/option/batch/route.ts` | Keep frontend `PUT` route, but proxy to backend with `POST /api/option/batch`. | PASS |

## Rebuild And Redeploy Evidence

```bash
rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.next' <repo-root>/ root@<cluster-ip>:<remote-build-dir>/
ssh root@<cluster-ip> 'cd <remote-build-dir> && sealos build --platform linux/amd64 -t <validation-image> -f Dockerfile .'
ssh root@<cluster-ip> 'ctr -n k8s.io images import <validation-image-archive>'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system set image deploy/aiproxy-web aiproxy=<validation-image>'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system rollout status deploy/aiproxy-web --timeout=180s'
```

Expected result: rollout completes and `aiproxy-web` logs show `Ready`.

Observed result:

```text
deployment "aiproxy-web" successfully rolled out
Next.js 14.2.35
Ready in 591ms
```

## UI Validation

Browser validation used real page navigation, clicks, fills, and submit actions against:

```text
https://aiproxy-web.<cluster-domain>/zh/dashboard
```

Because the app is normally launched inside Sealos Desktop, the browser test injected a short-lived `ns-admin` app JWT into page API requests. Channel configuration itself was performed through the AIProxy pages, not by calling backend channel APIs directly. Screenshots intentionally avoid the moment where the provider key is visible in the form.

| Step | Expected | Result | Evidence |
|---|---|---|---|
| Open AIProxy dashboard | Dashboard loads and shows the test channel. | PASS | `artifacts/deploy-adjust/images/01-dashboard-channel-list.png` |
| Configure/save channel from the page | Existing Anthropic channel remains enabled and saved with the current provider config. | PASS | `artifacts/deploy-adjust/images/02-dashboard-channel-updated.png` |
| Open global configs | Default-model configuration page loads. | PASS | `artifacts/deploy-adjust/images/03-global-configs-default-model.png` |
| Open price/model page | `claude-3-5-haiku-20241022` is visible as an enabled model. | PASS | `artifacts/deploy-adjust/images/04-price-enabled-model.png` |

## API Validation

The user key created in the `ns-admin` workspace was used for model and chat-completion verification.

```bash
curl -k -H "Authorization: Bearer <user-api-key>" \
  https://aiproxy.<cluster-domain>/v1/models
```

Expected result: `claude-3-5-haiku-20241022` is listed.

Observed result: PASS.

```bash
curl -k -H "Authorization: Bearer <user-api-key>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-3-5-haiku-20241022","messages":[{"role":"user","content":"reply exactly: ok"}],"max_tokens":16}' \
  https://aiproxy.<cluster-domain>/v1/chat/completions
```

Expected result: HTTP 200 and assistant content `ok`.

Observed result:

```json
{"model":"claude-3-5-haiku-20241022","content":"ok","total_tokens":11}
```

## Cluster And Legacy Data Checks

| Check | Expected | Result |
|---|---|---|
| Node health | `pve-<cluster-id>` Ready | PASS |
| Non-running pods | None | PASS |
| Failed Helm releases | None | PASS |
| AIProxy Helm releases | `aiproxy`, `aiproxy-database`, `aiproxy-web` deployed | PASS |
| Current channel list | Only the Helm-backed validation channel remains; no `probe-*` leftovers | PASS |
| aiproxy-web image | `<validation-image>` | PASS |
| `/api/status` | HTTP 200 | PASS |
| `/api/init-app-config` | HTTP 200 | PASS |

Sanitized channel state:

```text
id=<channel-id> name=<test-channel-name> type=14 status=1 models=[]
```

## Offline Image Check

Allowed prefixes:

- `sealos.hub:5000/`
- `hub.<cluster-domain>/`

Command:

```bash
CLOUD_DOMAIN=<cluster-domain>
crictl images | awk -v domain="$CLOUD_DOMAIN" '
  NR==1 { next }
  {
    image=$1
    hub_host="hub." domain
    allowed_hub_domain=(domain != "" && (image == hub_host || index(image, hub_host "/") == 1))
    if (image !~ /^sealos\.hub:5000(\/|$)/ && !allowed_hub_domain) {
      print image
    }
  }
' | sort -u
```

Expected result: no output.

Observed result: PASS.

## Local Verification

```bash
pnpm -s build
pnpm -s exec tsc --noEmit --pretty false
git diff --check
pnpm -s exec prettier --check app/api/admin/channel/type-name/route.ts app/api/admin/option/batch/route.ts next.config.js
helm lint deploy/charts/aiproxy-web
helm template aiproxy-web deploy/charts/aiproxy-web >/tmp/aiproxy-web-helm-template.yaml
```

All commands passed. Existing build warnings remain: React Hook dependency warnings, webpack dynamic dependency warning from `web-worker`, localStorage experimental warnings, and the existing Next dynamic server usage warning during prerender.

## Manual Retest

```bash
ssh root@<cluster-ip> 'kubectl -n aiproxy-system get pods'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system logs deploy/aiproxy-web --tail=80'
curl -k https://aiproxy.<cluster-domain>/api/status
curl -k https://aiproxy-web.<cluster-domain>/api/init-app-config
```

Expected result: all AIProxy pods are Running, web logs include `Ready`, and both HTTP checks return 200.

For AI verification, create or reuse an `ns-admin` API key and call:

```bash
curl -k -H "Authorization: Bearer <user-api-key>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-3-5-haiku-20241022","messages":[{"role":"user","content":"reply exactly: ok"}],"max_tokens":16}' \
  https://aiproxy.<cluster-domain>/v1/chat/completions
```

Expected result: HTTP 200 with assistant content `ok`.

## Risk Notes

- Local macOS trust setup via `cert.sh` fetched the cluster CA but `security add-trusted-cert` did not make curl/browser trust effective. Browser/API validation used explicit TLS ignore flags.
- The target cluster was patched with a validation image built from this branch. Production use requires the CI-built runtime image and Sealos image for this branch.
