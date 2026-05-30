# TC-05 Helm 与遗留数据检查

## 测试目标

验证 AIProxy 当前资源由 Helm 管理，集群无失败 Helm release，无非 Running Pod，并且没有残留的临时测试渠道。

## 前置条件

- AIProxy 已完成修复镜像升级。
- 页面渠道和 API 调用验证已通过。

## 关联代码修改

- 本用例不直接对应单个代码文件，主要验证修复后部署状态没有引入额外残留资源。

## 测试流程

1. 查看所有非 Running/Succeeded Pod。
2. 查看所有 failed Helm release。
3. 查看 `aiproxy-system` 下 AIProxy Helm release 状态。
4. 查看当前渠道列表是否只保留验证渠道，无 `probe-*` 等临时残留。
5. 查看 `aiproxy-web` 当前镜像是否为修复验证镜像。

## 命令证据

```bash
ssh root@<cluster-ip> 'kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers'
ssh root@<cluster-ip> 'helm list -A --failed --no-headers'
ssh root@<cluster-ip> 'helm list -n aiproxy-system'
ssh root@<cluster-ip> 'kubectl -n aiproxy-system get deploy aiproxy-web -o jsonpath="{.spec.template.spec.containers[0].image}"'
```

## 预期结果

- 不存在异常状态 Pod。
- 不存在 failed Helm release。
- `aiproxy`、`aiproxy-database`、`aiproxy-web` 均为 deployed。
- 不存在 `probe-*` 残留渠道。

## 实际结果

```text
PASS: no non-running pods
PASS: no failed helm releases
aiproxy, aiproxy-database, aiproxy-web: deployed
id=<channel-id> name=<test-channel-name> type=14 status=1 models=[]
```

结果：通过。
