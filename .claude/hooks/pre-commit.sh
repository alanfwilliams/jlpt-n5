#!/bin/bash
# PreToolUse hook — blocks git commit and git push when tests are failing.
#
# Claude Code passes the pending tool call as JSON on stdin.
# For the Bash tool the payload is: { "command": "...", ... }
# Exit 2 to block the call; exit 0 to allow it through.

set -euo pipefail

INPUT=$(cat)

# Extract the shell command from the JSON payload
COMMAND=$(echo "$INPUT" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('command',''))" \
  2>/dev/null || echo "")

# Only intercept git commit and git push
if ! echo "$COMMAND" | grep -qE "git (commit|push)"; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
RUNNER="$PROJECT_DIR/.claude/hooks/run-tests.js"

echo "Running test suite before: $(echo "$COMMAND" | head -1)"
echo ""

if node "$RUNNER" 2>&1; then
  echo ""
  echo "All tests passed — proceeding with git operation."
  exit 0
else
  echo ""
  echo "ERROR: Tests are failing. Fix the failures listed above before committing."
  exit 2
fi
