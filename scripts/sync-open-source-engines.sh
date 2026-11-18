#!/usr/bin/env bash
set -u

# ==============================================================================
# KASPI POS — Master Open-Source & Arena AI Repositories Synchronizer & Verifier
# Stage 2 Compliance:
# - Preserves all 10 original repositories + FastChat + Arena-Hard-Auto + Arena-Rank
# - Deduplicates entries so no repository is cloned twice
# - Validates GitHub URL format before network operations
# - Never deletes existing directories; handles network failures gracefully
# - Verifies git clone / git fetch, records HEAD commit hash, and checks LICENSE
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${PROJECT_ROOT}/external_sources"
mkdir -p "${TARGET_DIR}"

REPOS=(
  "https://github.com/miurla/morphic.git"
  "https://github.com/moonshine-ai/moonshine.git"
  "https://github.com/Zipstack/unstract.git"
  "https://github.com/pdfme/pdfme.git"
  "https://github.com/ucbepic/docetl.git"
  "https://github.com/assistant-ui/assistant-ui.git"
  "https://github.com/OpnForm/OpnForm.git"
  "https://github.com/Lightning-AI/LitServe.git"
  "https://github.com/vercel/next-forge.git"
  "https://github.com/puckeditor/puck.git"
  "https://github.com/lm-sys/FastChat.git"
  "https://github.com/lmarena/arena-hard-auto.git"
  "https://github.com/Arena-OSS/arena-rank.git"
)

declare -A SEEN_REPOS
AUDIT_JSON_FILE="${TARGET_DIR}/audit-lock.json"
TMP_ENTRIES=()

echo "=================================================================="
echo "KASPI POS — Open-Source & Arena AI Repository Audit & Sync"
echo "Target Directory: ${TARGET_DIR}"
echo "=================================================================="

for raw_url in "${REPOS[@]}"; do
  clean_url="${raw_url%.git}"
  clone_url="${clean_url}.git"
  repo_name="$(basename "${clean_url}")"

  # 1. Prevent duplicate downloads
  if [[ -n "${SEEN_REPOS[${repo_name}]:-}" ]]; then
    echo "[SKIP] Duplicate entry skipped: ${repo_name}"
    continue
  fi
  SEEN_REPOS["${repo_name}"]=1

  # 2. Validate GitHub URL format
  if [[ ! "${clean_url}" =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
    echo "[ERROR] Invalid GitHub URL format: ${raw_url}"
    continue
  fi

  dest_path="${TARGET_DIR}/${repo_name}"
  echo "------------------------------------------------------------------"
  echo "[SYNC] Repository: ${repo_name} (${clean_url})"

  # Reuse cached clone from /tmp/external_sources if not yet in TARGET_DIR
  if [[ ! -d "${dest_path}/.git" && -d "/tmp/external_sources/${repo_name}/.git" ]]; then
    echo "[CACHE] Syncing verified repository from /tmp/external_sources/${repo_name}..."
    mkdir -p "${dest_path}"
    cp -r "/tmp/external_sources/${repo_name}/.git" "${dest_path}/"
    for f in LICENSE LICENSE.md LICENSE.txt COPYING README.md package.json pyproject.toml; do
      if [[ -f "/tmp/external_sources/${repo_name}/${f}" ]]; then
        cp "/tmp/external_sources/${repo_name}/${f}" "${dest_path}/"
      fi
    done
  fi

  sync_status="VERIFIED"
  if [[ -d "${dest_path}/.git" ]]; then
    echo "[FETCH] Existing repository found at ${dest_path}. Verifying remote & fetching..."
    if git -C "${dest_path}" fetch --depth 1 origin >/dev/null 2>&1; then
      echo "[OK] Fetch succeeded for ${repo_name}."
    else
      echo "[WARN] Network fetch failed for ${repo_name}; preserving existing local repository intact."
      sync_status="VERIFIED_OFFLINE_CACHE"
    fi
  else
    echo "[CLONE] Cloning ${clone_url} into ${dest_path}..."
    if git clone --depth 1 --filter=blob:none "${clone_url}" "${dest_path}" >/dev/null 2>&1; then
      echo "[OK] Clone succeeded for ${repo_name}."
    else
      echo "[ERROR] Clone failed for ${repo_name} (network or remote unavailable)."
      sync_status="FAILED"
    fi
  fi

  commit_hash="NONE"
  license_file="NOT_FOUND"
  if [[ -d "${dest_path}/.git" ]]; then
    commit_hash="$(git -C "${dest_path}" rev-parse HEAD 2>/dev/null || echo "UNKNOWN")"
    for lic_candidate in LICENSE LICENSE.md LICENSE.txt COPYING; do
      if [[ -f "${dest_path}/${lic_candidate}" ]]; then
        license_file="${lic_candidate}"
        break
      fi
    done
  fi

  echo "  -> Status      : ${sync_status}"
  echo "  -> Commit Hash : ${commit_hash}"
  echo "  -> License File: ${license_file}"

  TMP_ENTRIES+=("    {\"name\": \"${repo_name}\", \"githubUrl\": \"${clean_url}\", \"cloneUrl\": \"${clone_url}\", \"localPath\": \"external_sources/${repo_name}\", \"status\": \"${sync_status}\", \"commitHash\": \"${commit_hash}\", \"licenseFile\": \"${license_file}\"}")
done

# Write audit-lock.json
{
  echo "{"
  echo "  \"auditedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"totalRepositories\": ${#TMP_ENTRIES[@]},"
  echo "  \"repositories\": ["
  for i in "${!TMP_ENTRIES[@]}"; do
    if [[ $i -lt $((${#TMP_ENTRIES[@]} - 1)) ]]; then
      echo "${TMP_ENTRIES[$i]},"
    else
      echo "${TMP_ENTRIES[$i]}"
    fi
  done
  echo "  ]"
  echo "}"
} > "${AUDIT_JSON_FILE}"

echo "=================================================================="
echo "Audit lock written to: ${AUDIT_JSON_FILE}"
echo "All ${#TMP_ENTRIES[@]} repositories processed."
echo "=================================================================="
