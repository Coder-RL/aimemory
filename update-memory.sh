#!/bin/bash

# Quick Memory Bank Update Script
# Streamlined interface for updating memory bank

set -euo pipefail

readonly MEMORY_BANK_DIR="memory-bank"
readonly TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"

update_progress() {
    local completed="$1"
    if [[ -n "$completed" ]]; then
        echo "" >> "$MEMORY_BANK_DIR/progress.md"
        echo "### $TIMESTAMP" >> "$MEMORY_BANK_DIR/progress.md"
        echo "- ✅ $completed" >> "$MEMORY_BANK_DIR/progress.md"
        echo "✅ Added to progress: $completed"
    fi
}

update_active_context() {
    local current="$1"
    if [[ -n "$current" ]]; then
        echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "### Current Work ($TIMESTAMP)" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "- 🔄 $current" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "✅ Updated active context: $current"
    fi
}

add_notes() {
    local notes="$1"
    if [[ -n "$notes" ]]; then
        echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "### Notes ($TIMESTAMP)" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "- 📝 $notes" >> "$MEMORY_BANK_DIR/activeContext.md"
        echo "✅ Added notes: $notes"
    fi
}

main() {
    echo "🧠 Memory Bank Quick Update"
    echo "=========================="
    
    if [[ ! -d "$MEMORY_BANK_DIR" ]]; then
        echo "❌ No memory bank found. Run ./memory-bank-core.sh init first"
        exit 1
    fi
    
    echo "What did you just complete? (Enter to skip)"
    read -r completed
    update_progress "$completed"
    
    echo "What are you working on now? (Enter to skip)"
    read -r current
    update_active_context "$current"
    
    echo "Any important notes or decisions? (Enter to skip)"
    read -r notes
    add_notes "$notes"
    
    echo ""
    echo "🎯 Memory bank updated successfully!"
    echo "💡 Run ./get-context.sh to see updated context"
}

main "$@"
