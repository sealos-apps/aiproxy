# TC-06 离线镜像检查

## 测试目标

验证部署后的节点镜像来源符合离线安装要求，只使用允许的本地镜像仓库前缀。

## 前置条件

- Sealos 集群已安装并导入离线镜像。
- AIProxy 修复验证镜像已导入本地 registry。

## 关联代码修改

- 本用例不直接对应代码修改，主要验证修复镜像没有破坏离线镜像约束。

## 测试流程

1. 在目标节点执行 `crictl images`。
2. 过滤允许前缀：
   - `sealos.hub:5000/`
   - `hub.<cluster-domain>/`
3. 检查过滤结果是否为空。

## 命令证据

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

## 预期结果

命令无输出。

## 实际结果

命令无输出。

结果：通过。
