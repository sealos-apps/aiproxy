# TC-04 用户 Key 调用 AI 能力

## 测试目标

验证用户申请的 AIProxy API key 可以通过页面配置好的渠道完成实际 AI 调用。

## 前置条件

- TC-02 页面渠道配置已通过。
- TC-03 模型页面验证已通过。
- 已在 `ns-admin` 工作空间创建或复用用户 API key。

## 关联代码修改

- 本用例验证的是 TC-02 和 TC-03 两处修复的端到端效果。
- 渠道类型接口修复保证渠道能配置。
- 批量 option 保存方法修复保证默认模型配置能保存。

## 测试流程

1. 使用用户 API key 调用 `/v1/models`。
2. 确认模型列表包含 `claude-3-5-haiku-20241022`。
3. 使用同一个用户 API key 调用 `/v1/chat/completions`。
4. 请求内容要求模型只回复 `ok`。

## 命令证据

```bash
curl -k -H "Authorization: Bearer <user-api-key>" \
  https://aiproxy.<cluster-domain>/v1/models

curl -k -H "Authorization: Bearer <user-api-key>" \
  -H 'Content-Type: application/json' \
  -d '{"model":"claude-3-5-haiku-20241022","messages":[{"role":"user","content":"reply exactly: ok"}],"max_tokens":16}' \
  https://aiproxy.<cluster-domain>/v1/chat/completions
```

## 预期结果

- `/v1/models` 返回模型列表，包含 `claude-3-5-haiku-20241022`。
- `/v1/chat/completions` 返回 HTTP 200。
- assistant 内容为 `ok`。

## 实际结果

```json
{"model":"claude-3-5-haiku-20241022","content":"ok","total_tokens":11}
```

结果：通过。
