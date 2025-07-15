#!/bin/bash
# Memory Bank Context Helper

echo "# PROJECT MEMORY BANK CONTEXT"
echo "# Generated: $(date)"
echo ""

for file in memory-bank/*.md; do
    if [ -f "$file" ]; then
        echo "## $(basename "$file" .md | tr '[:lower:]' '[:upper:]')"
        echo ""
        head -20 "$file" | sed 's/^/# /'
        echo ""
        echo "---"
        echo ""
    fi
done
