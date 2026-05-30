#!/usr/bin/env bash
set -euo pipefail

RELEASE_NAME=${RELEASE_NAME:-"aiproxy-web"}
RELEASE_NAMESPACE=${RELEASE_NAMESPACE:-"aiproxy-system"}
CHART_PATH=${CHART_PATH:-"./charts/aiproxy-web"}
HELM_OPTS=${HELM_OPTS:-""}
HELM_OPTIONS=${HELM_OPTIONS:-""}
AUTO_CONFIG_HELM_OPTS=()
load_cloud_tools_or_exit() {
  local tools_file="${TOOLS_FILE:-/root/.sealos/cloud/scripts/tools.sh}"
  local required_functions=(
    ensure_global_values_ready_for_component
    fetch_configmap_data_key
    global_http_disable_https
    read_cert_tls_reject_unauthorized
    read_jwt_internal
    read_yaml_file_path
  )
  local missing_functions=()
  local function_name

  if [ ! -f "${tools_file}" ]; then
    cat >&2 <<'EOF'
错误：未找到 /root/.sealos/cloud/scripts/tools.sh，当前组件镜像无法继续执行。

请先回到当前安装包目录，执行对应命令同步 values + tools：
  Pro 安装包：./sealos-pro.sh sync-config
  OSS 安装包：./sealos-oss.sh sync-config
EOF
    exit 1
  fi

  # shellcheck source=/dev/null
  source "${tools_file}"
  for function_name in "${required_functions[@]}"; do
    if ! declare -f "${function_name}" >/dev/null 2>&1; then
      missing_functions+=("${function_name}")
    fi
  done

  if [ "${#missing_functions[@]}" -gt 0 ]; then
    cat >&2 <<EOF
错误：/root/.sealos/cloud/scripts/tools.sh 版本过旧，缺少配置检测函数，当前组件镜像无法继续执行。

缺少函数：${missing_functions[*]}

请先回到当前安装包目录，执行对应命令同步 values + tools：
  Pro 安装包：./sealos-pro.sh sync-config
  OSS 安装包：./sealos-oss.sh sync-config
EOF
    exit 1
  fi

  ensure_global_values_ready_for_component
}

value_or_default() {
  local value="$1"
  local fallback="$2"

  if [ -n "${value}" ]; then
    printf '%s' "${value}"
  else
    printf '%s' "${fallback}"
  fi
}

load_cloud_tools_or_exit

get_cm_value() {
  local namespace="$1"
  local name="$2"
  local key="$3"
  fetch_configmap_data_key "${name}" "${key}" "${namespace}" 1 0 2>/dev/null || true
}

add_set_string() {
  local key="$1"
  local value="$2"
  if [ -n "${value}" ]; then
    AUTO_CONFIG_HELM_OPTS+=(--set-string "${key}=${value}")
  fi
}

NODE_COUNT=$(kubectl get nodes --no-headers 2>/dev/null | wc -l | tr -d " ")
if [ "${NODE_COUNT}" = "1" ]; then
  AUTO_CONFIG_HELM_OPTS+=(--set "replicas=1")
fi

JWT_INTERNAL=${JWT_INTERNAL:-"${jwtInternal:-$(read_jwt_internal)}"}
ADMIN_KEY=${ADMIN_KEY:-"${adminKey:-$(get_cm_value aiproxy-system aiproxy-env ADMIN_KEY)}"}
SEALOS_CLOUD_DOMAIN=${SEALOS_CLOUD_DOMAIN:-"${cloudDomain:-$(get_cm_value sealos-system sealos-config cloudDomain)}"}
SEALOS_CLOUD_DOMAIN="$(value_or_default "${SEALOS_CLOUD_DOMAIN}" "127.0.0.1.nip.io")"
SEALOS_CLOUD_PORT=${SEALOS_CLOUD_PORT:-"${cloudPort:-$(read_yaml_file_path '.global.http.httpsPort')}"}
SEALOS_CLOUD_PORT="$(value_or_default "${SEALOS_CLOUD_PORT}" "$(get_cm_value sealos-system sealos-config cloudPort)")"
HTTP_PORT=${HTTP_PORT:-"${httpPort:-$(read_yaml_file_path '.global.http.httpPort')}"}
CERT_SECRET_NAME=${CERT_SECRET_NAME:-"${certSecretName:-$(read_yaml_file_path '.global.http.certSecretName')}"}
CERT_SECRET_NAME="$(value_or_default "${CERT_SECRET_NAME}" "wildcard-cert")"

if [ -n "${DISABLE_HTTPS:-${disableHttps:-}}" ]; then
  DISABLE_HTTPS="${DISABLE_HTTPS:-${disableHttps:-}}"
elif global_http_disable_https; then
  DISABLE_HTTPS="true"
else
  DISABLE_HTTPS="false"
fi

BILLING_CURRENCY=${BILLING_CURRENCY:-"${billingCurrency:-$(read_yaml_file_path '.global.billing.currency')}"}
BILLING_CURRENCY="$(value_or_default "${BILLING_CURRENCY}" "cny")"
CURRENCY_SYMBOL=${CURRENCY_SYMBOL:-"${currencySymbol:-${BILLING_CURRENCY}}"}
NODE_TLS_REJECT_UNAUTHORIZED_VALUE=${NODE_TLS_REJECT_UNAUTHORIZED:-"${tlsRejectUnauthorized:-$(read_cert_tls_reject_unauthorized)}"}
NODE_TLS_REJECT_UNAUTHORIZED_VALUE="$(value_or_default "${NODE_TLS_REJECT_UNAUTHORIZED_VALUE}" "1")"
SUFFIX=${SUFFIX:-"${suffix:-}"}
if [ "${CURRENCY_SYMBOL}" = "usd" ] && [ -z "${SUFFIX}" ]; then
  SUFFIX="/en/home"
fi

add_set_string aiproxy.APP_TOKEN_JWT_KEY "${JWT_INTERNAL}"
add_set_string aiproxy.AI_PROXY_BACKEND_KEY "${ADMIN_KEY}"
add_set_string cloudDomain "${SEALOS_CLOUD_DOMAIN}"
add_set_string cloudPort "${SEALOS_CLOUD_PORT}"
add_set_string httpPort "${HTTP_PORT}"
add_set_string disableHttps "${DISABLE_HTTPS}"
add_set_string certSecretName "${CERT_SECRET_NAME}"
add_set_string aiproxy.CURRENCY_SYMBOL "${CURRENCY_SYMBOL}"
add_set_string aiproxy.NODE_TLS_REJECT_UNAUTHORIZED "${NODE_TLS_REJECT_UNAUTHORIZED_VALUE}"
add_set_string suffix "${SUFFIX}"
add_set_string aiproxy.ACCOUNT_SERVER_TOKEN_JWT_KEY "${JWT_INTERNAL}"


adopt_namespaced_resource() {
  local namespace="$1"
  local kind="$2"
  local name="$3"
  if kubectl -n "${namespace}" get "${kind}" "${name}" >/dev/null 2>&1; then
    echo "Adopting ${kind} ${namespace}/${name}..."
    kubectl -n "${namespace}" label "${kind}" "${name}" app.kubernetes.io/managed-by=Helm --overwrite >/dev/null 2>&1 || true
    kubectl -n "${namespace}" annotate "${kind}" "${name}" meta.helm.sh/release-name="${RELEASE_NAME}" meta.helm.sh/release-namespace="${RELEASE_NAMESPACE}" --overwrite >/dev/null 2>&1 || true
  fi
}

echo "Checking and adopting existing resources..."
if kubectl get namespace "${RELEASE_NAMESPACE}" >/dev/null 2>&1; then
  kubectl label namespace "${RELEASE_NAMESPACE}" app.kubernetes.io/managed-by=Helm --overwrite >/dev/null 2>&1 || true
  kubectl annotate namespace "${RELEASE_NAMESPACE}" meta.helm.sh/release-name="${RELEASE_NAME}" meta.helm.sh/release-namespace="${RELEASE_NAMESPACE}" --overwrite >/dev/null 2>&1 || true

  adopt_namespaced_resource "${RELEASE_NAMESPACE}" configmap aiproxy-web
  adopt_namespaced_resource "${RELEASE_NAMESPACE}" service aiproxy-web
  adopt_namespaced_resource "${RELEASE_NAMESPACE}" deployment aiproxy-web
  adopt_namespaced_resource "${RELEASE_NAMESPACE}" ingress aiproxy-web
fi

adopt_namespaced_resource app-system apps.app.sealos.io aiproxy

SERVICE_NAME="aiproxy-web"
USER_VALUES_OLD_PATH=${USER_VALUES_OLD_PATH:-"/root/.sealos/cloud/values/core/${SERVICE_NAME}-values.yaml"}
USER_VALUES_DIR=${USER_VALUES_DIR:-"/root/.sealos/cloud/values/apps/aiproxy"}
USER_VALUES_PATH=${USER_VALUES_PATH:-"${USER_VALUES_DIR}/${SERVICE_NAME}-values.yaml"}

if [ "${USER_VALUES_OLD_PATH}" = "/root/.sealos/cloud/values/core/${SERVICE_NAME}-values.yaml" ]; then
  rm -f "${USER_VALUES_OLD_PATH}"
fi

if [ ! -f "${USER_VALUES_PATH}" ]; then
  mkdir -p "$(dirname "${USER_VALUES_PATH}")"
  cp "./charts/aiproxy-web/${SERVICE_NAME}-values.yaml" "${USER_VALUES_PATH}"
fi

HELM_EXTRA_ARGS=()
if [ -n "${HELM_OPTIONS}" ]; then
  # shellcheck disable=SC2206
  HELM_EXTRA_ARGS+=(${HELM_OPTIONS})
fi
if [ -n "${HELM_OPTS}" ]; then
  # shellcheck disable=SC2206
  HELM_EXTRA_ARGS+=(${HELM_OPTS})
fi

VALUES_ARGS=(-f "./charts/aiproxy-web/values.yaml")
VALUES_ARGS+=(-f "${USER_VALUES_PATH}")

echo "Deploying Helm chart..."
HELM_CMD=(helm upgrade -i "${RELEASE_NAME}" -n "${RELEASE_NAMESPACE}" --create-namespace "${CHART_PATH}")
HELM_CMD+=("${VALUES_ARGS[@]}")
if [ "${#AUTO_CONFIG_HELM_OPTS[@]}" -gt 0 ]; then
  HELM_CMD+=("${AUTO_CONFIG_HELM_OPTS[@]}")
fi
if [ "${#HELM_EXTRA_ARGS[@]}" -gt 0 ]; then
  HELM_CMD+=("${HELM_EXTRA_ARGS[@]}")
fi
"${HELM_CMD[@]}"
