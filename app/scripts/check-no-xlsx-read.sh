#!/usr/bin/env bash
# Guardrail: prevent the abandoned `xlsx` package (and its read APIs) from
# being reintroduced. We migrated off it for security reasons in commit
# af51c86 — see that commit's message and the SECURITY.md for context.
#
# This script is invoked from `pnpm check`. It exits non-zero if any source
# file imports xlsx or calls XLSX.read* / readFile / sheet_to_json.
#
# To export XLSX, use `exceljs` (already a dep). Reading XLSX files in this
# app is intentionally unsupported — there's no safe parser of comparable
# scope, and the threat model treats untrusted XLSX as malware.

set -e

# Run from the directory that contains this script (== app/), so `src/` is
# the source tree to grep regardless of the caller's PWD.
cd "$(dirname "$0")/.."

if grep -rE "from ['\"]xlsx['\"]|require\(['\"]xlsx['\"]\)|XLSX\.(read|readFile|sheet_to_json)" src 2>/dev/null; then
  echo ""
  echo "ERROR: xlsx package import or XLSX read API found in src/."
  echo "       The xlsx package is abandoned upstream and ships unfixed CVEs."
  echo "       Use exceljs for writes; reading XLSX is intentionally unsupported."
  exit 1
fi

exit 0
