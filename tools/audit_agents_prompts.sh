#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <repo_path>"
  exit 1
fi

REPO_PATH="$1"
OUT_DIR="${2:-audits/kratos_audit_$(date +%Y%m%d_%H%M%S)}"

mkdir -p "$OUT_DIR"

if [[ ! -d "$REPO_PATH/.git" ]]; then
  echo "Error: $REPO_PATH is not a git repository"
  exit 2
fi

echo "[1/8] Inventory files"
rg --files "$REPO_PATH" > "$OUT_DIR/files.txt"

echo "[2/8] Locate agent/prompt-like artifacts"
rg -n --no-heading -S \
  -g '!**/node_modules/**' -g '!**/.git/**' \
  '(agent|prompt|system prompt|assistant role|planner|executor|router|critic|validator|tool call|function call|guardrail|injection)' \
  "$REPO_PATH" > "$OUT_DIR/agent_prompt_hits.txt" || true

echo "[3/8] Extract candidate prompt files"
rg --files "$REPO_PATH" \
  -g '*prompt*' -g '*agent*' -g '*.md' -g '*.yaml' -g '*.yml' -g '*.json' -g '*.ts' -g '*.js' \
  > "$OUT_DIR/candidate_files.txt"

echo "[4/8] Security keyword sweep"
rg -n --no-heading -S \
  -g '!**/node_modules/**' -g '!**/.git/**' \
  '(API_KEY|SECRET|TOKEN|authorization|allowlist|denylist|sandbox|jailbreak|prompt injection|exfiltration)' \
  "$REPO_PATH" > "$OUT_DIR/security_hits.txt" || true

echo "[5/8] Tooling and model usage sweep"
rg -n --no-heading -S \
  -g '!**/node_modules/**' -g '!**/.git/**' \
  '(openai|anthropic|gemini|llama|tool_choice|response_format|json_schema|function calling|mcp|langchain|autogen|crewai)' \
  "$REPO_PATH" > "$OUT_DIR/model_tool_hits.txt" || true

echo "[6/8] CI/CD and tests overview"
rg --files "$REPO_PATH" -g '.github/workflows/*' -g '*test*' -g 'pytest.ini' -g 'package.json' -g 'pyproject.toml' \
  > "$OUT_DIR/quality_files.txt" || true

echo "[7/8] Git metadata"
git -C "$REPO_PATH" rev-parse HEAD > "$OUT_DIR/head_commit.txt"
git -C "$REPO_PATH" log --oneline -n 30 > "$OUT_DIR/recent_commits.txt"

echo "[8/8] Summary"
{
  echo "# Audit Summary"
  echo "Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo "Repo: $REPO_PATH"
  echo
  echo "## Counts"
  echo "- files: $(wc -l < "$OUT_DIR/files.txt")"
  echo "- agent/prompt hits: $(wc -l < "$OUT_DIR/agent_prompt_hits.txt" 2>/dev/null || echo 0)"
  echo "- candidate files: $(wc -l < "$OUT_DIR/candidate_files.txt")"
  echo "- security hits: $(wc -l < "$OUT_DIR/security_hits.txt" 2>/dev/null || echo 0)"
  echo "- model/tool hits: $(wc -l < "$OUT_DIR/model_tool_hits.txt" 2>/dev/null || echo 0)"
} > "$OUT_DIR/summary.md"

echo "Audit artifacts written to: $OUT_DIR"
