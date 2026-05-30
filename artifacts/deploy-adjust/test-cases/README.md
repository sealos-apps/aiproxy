# AIProxy Sealos 修复验证用例集

- 测试日期：2026-05-30
- 测试集群：`ID=<cluster-id>`，`<cluster-ip>`
- 集群域名：`<cluster-domain>`
- 测试分支：`codex/aiproxy-deploy-adjust`
- 基线部署命令：`sealos run ghcr.io/sealos-apps/aiproxy/aiproxy-cluster:sha-5db063c`
- 修复验证镜像：`<validation-image>`

## 用例列表

| 用例 | 目标 | 结果 | 截图/证据 |
|---|---|---|---|
| [TC-01 Web 启动修复](./TC-01-web-standalone-startup.md) | 验证 `aiproxy-web` 修复后能启动并完成 rollout。 | 通过 | 命令输出 |
| [TC-02 页面配置渠道](./TC-02-channel-page-config.md) | 验证通过 AIProxy 管理中心页面配置并保存渠道。 | 通过 | `images/01-dashboard-channel-list.png`、`images/02-dashboard-channel-updated.png` |
| [TC-03 页面访问渠道模型](./TC-03-model-and-price-page.md) | 验证页面能看到刚才渠道可用的模型。 | 通过 | `images/03-global-configs-default-model.png`、`images/04-price-enabled-model.png` |
| [TC-04 用户 Key 调用 AI 能力](./TC-04-user-key-ai-api.md) | 验证用户申请的 key 能通过配置渠道完成 AI 调用。 | 通过 | API 输出 |
| [TC-05 Helm 与遗留数据检查](./TC-05-helm-and-legacy-data.md) | 验证当前部署由 Helm 管理，无失败 release 和残留测试渠道。 | 通过 | 命令输出 |
| [TC-06 离线镜像检查](./TC-06-offline-image-check.md) | 验证节点镜像只来自允许的本地仓库前缀。 | 通过 | 命令输出 |
| [TC-07 本地构建与图表检查](./TC-07-local-build-and-chart-check.md) | 验证正确目录中的代码、类型、格式和 Helm 图表。 | 通过 | 命令输出 |
| [TC-08 流水线验证](./TC-08-github-actions.md) | 验证正确仓库分支的官方构建流水线通过。 | 通过 | GitHub Actions |

## 截图说明

截图只保留页面状态和验证结果，已打码测试渠道名，不保留 AI provider key、用户 API key、JWT、后端 admin key 或签名下载地址。

## 总结论

基线包部署后暴露出三个问题：Web standalone 输出路径错误、渠道类型接口与当前后端不兼容、全局配置批量保存代理方法错误。修复后，页面配置、模型访问、用户 key 调用 AI、Helm 状态、离线镜像、本地验证和官方流水线均通过。
