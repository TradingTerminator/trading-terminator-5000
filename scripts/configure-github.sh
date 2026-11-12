#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
gh auth status
gh api --method PUT repos/TradingTerminator/trading-terminator-5000/branches/main/protection --input ops/branch-protection.json
gh api repos/TradingTerminator/trading-terminator-5000/branches/main/protection
