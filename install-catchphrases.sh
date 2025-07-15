#!/bin/bash

# Install Simple Catch Phrase Memory Bank System

set -euo pipefail

readonly VSCODE_SNIPPETS_DIR="$HOME/Library/Application Support/Code/User/snippets"

echo "🧠 Installing Simple Catch Phrase Memory Bank System"
echo "=================================================="

# Make catchphrase script executable
chmod +x memory-bank-catchphrases.sh

# Install VS Code snippets
echo "📝 Installing VS Code snippets..."
mkdir -p "$VSCODE_SNIPPETS_DIR"
cp vscode-catchphrase-snippets.json "$VSCODE_SNIPPETS_DIR/memory-bank-catchphrases.code-snippets"

# Test the system
echo "🧪 Testing catch phrase system..."
./memory-bank-catchphrases.sh MEMORY_ACTIVATE > /dev/null

echo ""
echo "✅ INSTALLATION COMPLETE!"
echo "========================"
echo ""
echo "🎯 SIMPLE CATCH PHRASES:"
echo ""
echo "📋 MEMORY ACTIVATION:"
echo "   MEMORY_ACTIVATE    → Full project context"
echo "   MEMORY_BRIEF       → Brief context only"  
echo "   MEMORY_TECH        → Technical context only"
echo ""
echo "🔄 MEMORY UPDATES:"
echo "   MEMORY_COMPLETED [task]  → Mark task completed"
echo "   MEMORY_WORKING [task]    → Update current work"
echo "   MEMORY_NOTE [note]       → Add important note"
echo ""
echo "🚀 QUICK SHORTCUTS:"
echo "   mb    → Quick activate (VS Code)"
echo "   mbu   → Quick update (VS Code)"
echo ""
echo "💡 HOW TO USE:"
echo ""
echo "🎯 In Cursor:"
echo "   Just type: MEMORY_ACTIVATE"
echo "   Then ask your question"
echo ""
echo "🎯 In VS Code:"
echo "   Type: MEMORY_ACTIVATE + Tab"
echo "   Or type: mb + Tab (quick shortcut)"
echo "   Then ask Augment Code"
echo ""
echo "🎯 Real-time Updates:"
echo "   MEMORY_COMPLETED implemented user authentication"
echo "   MEMORY_WORKING building dashboard components"
echo "   MEMORY_NOTE need to research HIPAA compliance"
echo ""
echo "🎉 Ready to use! Try typing MEMORY_ACTIVATE in Cursor or VS Code!"
