#!/bin/bash

# Memory Bank Reader for Cursor
echo "# MEMORY BANK CONTEXT FOR CURSOR"
echo "# Project: $(basename "$PWD")"
echo "# Generated: $(date)"
echo ""

if [ ! -d "memory-bank" ]; then
    echo "❌ No memory bank found. Run ./simple-memory-bank.sh first"
    exit 1
fi

echo "## PROJECT OVERVIEW"
if [ -f "memory-bank/projectbrief.md" ]; then
    head -15 "memory-bank/projectbrief.md" | tail -n +2
else
    echo "No project brief found"
fi

echo ""
echo "## CURRENT CONTEXT"
if [ -f "memory-bank/activeContext.md" ]; then
    head -15 "memory-bank/activeContext.md" | tail -n +2
else
    echo "No active context found"
fi

echo ""
echo "## RECENT PROGRESS"
if [ -f "memory-bank/progress.md" ]; then
    head -15 "memory-bank/progress.md" | tail -n +2
else
    echo "No progress found"
fi

echo ""
echo "## TECH STACK"
if [ -f "memory-bank/techContext.md" ]; then
    head -15 "memory-bank/techContext.md" | tail -n +2
else
    echo "No tech context found"
fi

echo ""
echo "---"
echo "💡 Cursor will automatically read these files due to .cursorrules"
echo "💡 You can also copy this context manually if needed"
