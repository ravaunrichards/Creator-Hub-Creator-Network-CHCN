#!/usr/bin/env bash
# CHCN test runner. Runs every check and reports a real pass/fail summary.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAILED=0

echo "== 1. JS syntax / parse integrity (all shipped .js) =="
SYN_OK=0; SYN_BAD=0
for f in $(ls app/*.js scripts/*.js 2>/dev/null); do
  if node --check "$f" 2>/tmp/err; then SYN_OK=$((SYN_OK+1)); else SYN_BAD=$((SYN_BAD+1)); echo "  PARSE FAIL: $f"; cat /tmp/err; fi
done
echo "  parsed OK: $SYN_OK  failed: $SYN_BAD"
[ "$SYN_BAD" -ne 0 ] && FAILED=1

echo "== 2. Grading unit tests =="
node tests/unit/grading.test.js || FAILED=1

echo "== 3. Course + quiz data integrity =="
node tests/integration/data-integrity.test.js || FAILED=1

echo "== 4. Course registry build is reproducible =="
node scripts/build-registry.js || FAILED=1

echo ""
if [ "$FAILED" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; fi
exit $FAILED
