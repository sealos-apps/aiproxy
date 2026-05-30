{{/*
Expand the name of the chart.
*/}}
{{- define "aiproxy.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "aiproxy.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "aiproxy.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "aiproxy.labels" -}}
helm.sh/chart: {{ include "aiproxy.chart" . }}
{{ include "aiproxy.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "aiproxy.selectorLabels" -}}
app.kubernetes.io/name: {{ include "aiproxy.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "aiproxy.serviceAccountName" -}}
{{- default (include "aiproxy.fullname" .) .Values.serviceAccount.name }}
{{- end }}

{{/*
Create external URLs that follow the Sealos global HTTP settings.
*/}}
{{- define "aiproxy.webHost" -}}
{{- printf "%s.%s" (include "aiproxy.fullname" .) .Values.cloudDomain -}}
{{- end }}

{{- define "aiproxy.backendHost" -}}
{{- printf "aiproxy.%s" .Values.cloudDomain -}}
{{- end }}

{{- define "aiproxy.scheme" -}}
{{- if eq (toString .Values.disableHttps) "true" -}}http{{- else -}}https{{- end -}}
{{- end }}

{{- define "aiproxy.externalPort" -}}
{{- $scheme := include "aiproxy.scheme" . -}}
{{- $port := toString .Values.cloudPort -}}
{{- if eq $scheme "http" -}}
{{- $port = toString .Values.httpPort -}}
{{- end -}}
{{- if or (and (eq $scheme "https") (or (eq $port "") (eq $port "443"))) (and (eq $scheme "http") (or (eq $port "") (eq $port "80"))) -}}
{{- "" -}}
{{- else -}}
{{- $port -}}
{{- end -}}
{{- end }}

{{- define "aiproxy.externalPortSuffix" -}}
{{- $port := include "aiproxy.externalPort" . -}}
{{- if $port -}}:{{ $port }}{{- end -}}
{{- end }}

{{- define "aiproxy.webExternalURL" -}}
{{- include "aiproxy.scheme" . -}}://{{ include "aiproxy.webHost" . }}{{ include "aiproxy.externalPortSuffix" . }}
{{- end }}

{{- define "aiproxy.backendExternalURL" -}}
{{- include "aiproxy.scheme" . -}}://{{ include "aiproxy.backendHost" . }}{{ include "aiproxy.externalPortSuffix" . }}
{{- end }}
