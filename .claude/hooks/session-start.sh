#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "jlpt-n5: static HTML project — no dependencies to install."
echo ""

# Run the test suite so any pre-existing failures are visible immediately.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
RUNNER="$PROJECT_DIR/.claude/hooks/run-tests.js"

if node "$RUNNER" 2>&1; then
  echo "All tests passing — safe to start work."
else
  echo ""
  echo "WARNING: Tests are failing. Fix the failures above before committing."
fi
