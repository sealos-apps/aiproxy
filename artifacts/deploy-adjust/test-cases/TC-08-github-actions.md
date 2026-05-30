# TC-08 流水线验证

## 测试目标

验证正确仓库 `sealos-apps/aiproxy` 的 `codex/aiproxy-deploy-adjust` 分支可以通过官方构建流水线。

## 前置条件

- 分支已推送到 `git@github.com:sealos-apps/aiproxy.git`
- 验证提交：`<verified-commit-sha>`

## 关联代码修改

- 本用例覆盖本分支全部修复与文档截图材料。

## 测试流程

1. 在正确仓库触发 `Build Sealos from Sealos`。
2. 查看 runtime 镜像构建。
3. 查看 Sealos 镜像构建。
4. 查看多架构 manifest 发布。
5. 查看 OSS 同步任务。

## 命令证据

```bash
gh workflow run "Build Sealos from Sealos" \
  --repo sealos-apps/aiproxy \
  --ref codex/aiproxy-deploy-adjust \
  -f version=<version>

gh run view <run-id> \
  --repo sealos-apps/aiproxy \
  --json status,conclusion,jobs
```

## 预期结果

流水线所有 job 通过。

## 实际结果

流水线地址：`<workflow-run-url>`

通过的 job：

- Release Metadata
- Build Runtime Image (amd64)
- Build Runtime Image (arm64)
- Publish Runtime Manifests
- Build Sealos Image (amd64)
- Build Sealos Image (arm64)
- Publish Sealos Manifests
- Sync Sealos Packages to OSS (arm64)
- Sync Sealos Packages to OSS (amd64)

结果：通过。
