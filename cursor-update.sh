#!/bin/bash

# Quick Memory Bank Update for Cursor
echo "🎯 Cursor Memory Bank Update"
echo "=========================="

if [ ! -d "memory-bank" ]; then
    echo "❌ No memory bank found. Run ./simple-memory-bank.sh first"
    exit 1
fi

echo "What did you just complete?"
read -r completed
if [ -n "$completed" ]; then
    echo "" >> memory-bank/progress.md
    echo "### $(date '+%Y-%m-%d %H:%M')" >> memory-bank/progress.md
    echo "- ✅ $completed" >> memory-bank/progress.md
fi

echo "What are you working on now?"
read -r current
if [ -n "$current" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "### Current Work ($(date '+%Y-%m-%d %H:%M'))" >> memory-bank/activeContext.md
    echo "- 🔄 $current" >> memory-bank/activeContext.md
fi

echo "Any blockers or important notes?"
read -r notes
if [ -n "$notes" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "### Notes ($(date '+%Y-%m-%d %H:%M'))" >> memory-bank/activeContext.md
    echo "- 📝 $notes" >> memory-bank/activeContext.md
fi

echo ""
echo "✅ Memory bank updated!"
echo "💡 Cursor will automatically read the updated context"
