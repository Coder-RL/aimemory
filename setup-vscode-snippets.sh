#!/bin/bash

# Setup VS Code Snippets for Memory Bank
echo "🔧 Setting up VS Code Memory Bank Snippets..."

# Create VS Code snippets directory
SNIPPETS_DIR="$HOME/Library/Application Support/Code/User/snippets"
mkdir -p "$SNIPPETS_DIR"

# Create memory bank snippets
cat > "$SNIPPETS_DIR/memory-bank.code-snippets" << 'EOF'
{
  "Insert Memory Bank Context": {
    "prefix": "memorycontext",
    "body": [
      "// === MEMORY BANK CONTEXT ===",
      "// Project: ${TM_DIRECTORY/.*\\///}",
      "// Generated: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "// PROJECT BRIEF:",
      "// ${1:Add project overview here}",
      "",
      "// CURRENT WORK:",
      "// ${2:Add current work context here}",
      "",
      "// TECH STACK:",
      "// ${3:Add technology context here}",
      "",
      "// RECENT PROGRESS:",
      "// ${4:Add recent progress here}",
      "",
      "// === END MEMORY BANK CONTEXT ===",
      "",
      "${5:Your question or code here}"
    ],
    "description": "Insert memory bank context for AI interactions"
  },
  
  "Quick Memory Update": {
    "prefix": "memoryupdate",
    "body": [
      "## Memory Bank Update - ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "### Completed:",
      "- ${1:What was completed}",
      "",
      "### Current Work:",
      "- ${2:What you're working on now}",
      "",
      "### Next Steps:",
      "- ${3:What to do next}",
      "",
      "### Notes:",
      "- ${4:Important notes}"
    ],
    "description": "Quick memory bank update template"
  },
  
  "AI Question with Context": {
    "prefix": "aiask",
    "body": [
      "Based on my project context:",
      "",
      "**Project**: ${TM_DIRECTORY/.*\\///}",
      "**Current Work**: ${1:Current task}",
      "**Tech Stack**: ${2:Technologies used}",
      "**Goal**: ${3:What you want to achieve}",
      "",
      "**Question**: ${4:Your specific question}",
      "",
      "Please provide a solution that fits with my existing codebase and patterns."
    ],
    "description": "Ask AI with project context"
  }
}
EOF

echo "✅ VS Code snippets created!"
echo ""
echo "🎯 How to use in VS Code:"
echo "1. Type 'memorycontext' and press Tab → Insert full context"
echo "2. Type 'memoryupdate' and press Tab → Quick update template"
echo "3. Type 'aiask' and press Tab → Ask AI with context"
echo ""
echo "💡 These work in any file type in VS Code!"
