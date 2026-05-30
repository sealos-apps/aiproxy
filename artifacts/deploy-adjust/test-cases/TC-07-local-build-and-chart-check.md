# TC-07 本地构建与图表检查

## 测试目标

验证正确仓库目录 `<repo-root>` 中的修复分支可以通过本地构建、类型检查、格式检查和 Helm 图表检查。

## 前置条件

- 当前目录为 `<repo-root>`
- 当前分支为 `codex/aiproxy-deploy-adjust`

## 关联代码修改

- `next.config.js`
- `app/api/admin/channel/type-name/route.ts`
- `app/api/admin/option/batch/route.ts`
- `types/static-assets.d.ts`：补充 `*.svg` 和 `*.png` 静态资源模块声明，让正确仓库安装依赖后可以单独执行 `tsc --noEmit`。
- `artifacts/deploy-adjust/test-cases/*`

## 测试流程

1. 执行 Next.js build。
2. 执行 TypeScript noEmit 检查。
3. 执行 Git whitespace 检查。
4. 执行 Prettier 检查。
5. 执行 Helm lint 和 template。

## 命令证据

```bash
pnpm -s build
pnpm -s exec tsc --noEmit --pretty false
git diff --check
pnpm -s exec prettier --check app/api/admin/channel/type-name/route.ts app/api/admin/option/batch/route.ts next.config.js artifacts/deploy-adjust/aiproxy-cluster-20260530.md artifacts/deploy-adjust/test-cases/*.md
helm lint deploy/charts/aiproxy-web
helm template aiproxy-web deploy/charts/aiproxy-web >/tmp/aiproxy-web-helm-template.yaml
```

## 预期结果

全部命令通过。

## 实际结果

全部命令通过。构建中仍存在项目既有 warning：React Hook dependency warning、`web-worker` dynamic dependency warning、localStorage experimental warning、Next prerender dynamic server usage warning。

结果：通过。
