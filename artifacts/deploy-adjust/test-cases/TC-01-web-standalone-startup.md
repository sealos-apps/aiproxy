# TC-01 Web 启动修复

## 测试目标

验证 `sealos run ghcr.io/sealos-apps/aiproxy/aiproxy-cluster:sha-5db063c` 部署后的 `aiproxy-web` 启动问题已经修复，Web Pod 能正常启动并完成 rollout。

## 前置条件

- Sealos 集群已安装完成：`<cluster-ip>`
- AIProxy 基线包已经执行过：`sealos run ghcr.io/sealos-apps/aiproxy/aiproxy-cluster:sha-5db063c`
- 在正确仓库目录 `<repo-root>` 的 `codex/aiproxy-deploy-adjust` 分支构建验证镜像

## 关联代码修改

- `next.config.js:12`：将 `experimental.outputFileTracingRoot` 设置为 `__dirname`，确保 Next standalone 输出中存在容器启动命令需要的 `/app/server.js`。

## 测试流程

1. 观察基线部署后的 Web Pod 日志。
2. 使用当前修复分支构建验证镜像。
3. 将 `aiproxy-web` Deployment 镜像切换到修复后的验证镜像。
4. 等待 Deployment rollout 完成。
5. 查看 Web 日志是否进入 Ready 状态。

## 命令证据

```bash
ssh root@<cluster-ip> 'kubectl -n aiproxy-system logs deploy/aiproxy-web --tail=80'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system set image deploy/aiproxy-web aiproxy=<validation-image>'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system rollout status deploy/aiproxy-web --timeout=180s'
```

## 预期结果

- 基线错误 `Cannot find module '/app/server.js'` 不再出现。
- Deployment rollout 成功。
- `aiproxy-web` 日志显示 Next.js 已 Ready。

## 实际结果

```text
deployment "aiproxy-web" successfully rolled out
Next.js 14.2.35
Ready in 591ms
```

结果：通过。
