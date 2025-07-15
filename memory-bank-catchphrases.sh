#!/bin/bash

# Memory Bank Catch Phrase System
# Simple trigger-based memory bank operations

set -euo pipefail

readonly MEMORY_BANK_DIR="memory-bank"
readonly CATCHPHRASE_LOG="memory-bank-catchphrases.log"

# Logging
log() {
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" >> "$CATCHPHRASE_LOG"
    echo "✅ $message"
}

# Generate catch phrase responses
generate_memory_context() {
    local context_type="${1:-full}"
    
    echo "🧠 MEMORY BANK ACTIVATED"
    echo "========================"
    echo ""
    
    case "$context_type" in
        "start"|"activate"|"full")
            echo "📋 PROJECT CONTEXT:"
            if [[ -f "$MEMORY_BANK_DIR/projectbrief.md" ]]; then
                head -15 "$MEMORY_BANK_DIR/projectbrief.md" | sed 's/^/   /'
            fi
            echo ""
            echo "🔄 CURRENT WORK:"
            if [[ -f "$MEMORY_BANK_DIR/activeContext.md" ]]; then
                head -15 "$MEMORY_BANK_DIR/activeContext.md" | sed 's/^/   /'
            fi
            echo ""
            echo "📊 PROGRESS:"
            if [[ -f "$MEMORY_BANK_DIR/progress.md" ]]; then
                head -10 "$MEMORY_BANK_DIR/progress.md" | sed 's/^/   /'
            fi
            echo ""
            echo "🛠️ TECH STACK:"
            if [[ -f "$MEMORY_BANK_DIR/techContext.md" ]]; then
                head -10 "$MEMORY_BANK_DIR/techContext.md" | sed 's/^/   /'
            fi
            ;;
        "brief"|"quick")
            echo "📋 CURRENT FOCUS:"
            if [[ -f "$MEMORY_BANK_DIR/activeContext.md" ]]; then
                grep -A 5 "## Current Work" "$MEMORY_BANK_DIR/activeContext.md" | sed 's/^/   /'
            fi
            echo ""
            echo "📊 RECENT PROGRESS:"
            if [[ -f "$MEMORY_BANK_DIR/progress.md" ]]; then
                grep -A 5 "## Completed" "$MEMORY_BANK_DIR/progress.md" | sed 's/^/   /'
            fi
            ;;
        "tech"|"technical")
            echo "🛠️ TECHNICAL CONTEXT:"
            if [[ -f "$MEMORY_BANK_DIR/techContext.md" ]]; then
                cat "$MEMORY_BANK_DIR/techContext.md" | sed 's/^/   /'
            fi
            ;;
    esac
    
    echo ""
    echo "💡 Memory bank context loaded. Ask your question now!"
    echo "========================"
}

# Update memory bank with completed task
update_completed_task() {
    local task="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    echo "" >> "$MEMORY_BANK_DIR/progress.md"
    echo "### ✅ Completed ($timestamp)" >> "$MEMORY_BANK_DIR/progress.md"
    echo "- $task" >> "$MEMORY_BANK_DIR/progress.md"
    
    # Also update active context
    echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "### Recent Completion ($timestamp)" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "- ✅ $task" >> "$MEMORY_BANK_DIR/activeContext.md"
    
    log "Task completed: $task"
    echo "🎯 Memory bank updated with completed task!"
}

# Update current work
update_current_work() {
    local work="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "### 🔄 Current Work ($timestamp)" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "- $work" >> "$MEMORY_BANK_DIR/activeContext.md"
    
    log "Current work updated: $work"
    echo "🔄 Memory bank updated with current work!"
}

# Add important note
add_memory_note() {
    local note="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    echo "" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "### 📝 Important Note ($timestamp)" >> "$MEMORY_BANK_DIR/activeContext.md"
    echo "- $note" >> "$MEMORY_BANK_DIR/activeContext.md"
    
    log "Note added: $note"
    echo "📝 Memory bank updated with note!"
}

# Main catch phrase processor
process_catchphrase() {
    local phrase="$1"
    shift
    local content="$*"
    
    case "$phrase" in
        "MEMORY_ACTIVATE"|"MEMORY_START"|"MEMORY_FULL")
            generate_memory_context "full"
            ;;
        "MEMORY_BRIEF"|"MEMORY_QUICK")
            generate_memory_context "brief"
            ;;
        "MEMORY_TECH"|"MEMORY_TECHNICAL")
            generate_memory_context "tech"
            ;;
        "MEMORY_COMPLETED"|"MEMORY_DONE")
            if [[ -n "$content" ]]; then
                update_completed_task "$content"
            else
                echo "❌ Please specify what was completed: MEMORY_COMPLETED [task description]"
            fi
            ;;
        "MEMORY_WORKING"|"MEMORY_CURRENT")
            if [[ -n "$content" ]]; then
                update_current_work "$content"
            else
                echo "❌ Please specify current work: MEMORY_WORKING [work description]"
            fi
            ;;
        "MEMORY_NOTE"|"MEMORY_IMPORTANT")
            if [[ -n "$content" ]]; then
                add_memory_note "$content"
            else
                echo "❌ Please specify note: MEMORY_NOTE [note content]"
            fi
            ;;
        *)
            echo "❌ Unknown catch phrase: $phrase"
            echo ""
            echo "📋 Available catch phrases:"
            echo "   MEMORY_ACTIVATE    - Load full context"
            echo "   MEMORY_BRIEF       - Load brief context"
            echo "   MEMORY_TECH        - Load technical context"
            echo "   MEMORY_COMPLETED   - Mark task as completed"
            echo "   MEMORY_WORKING     - Update current work"
            echo "   MEMORY_NOTE        - Add important note"
            ;;
    esac
}

# Main execution
main() {
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 CATCHPHRASE [content]"
        echo ""
        echo "📋 Available catch phrases:"
        echo "   MEMORY_ACTIVATE    - Load full context"
        echo "   MEMORY_BRIEF       - Load brief context"
        echo "   MEMORY_TECH        - Load technical context"
        echo "   MEMORY_COMPLETED   - Mark task as completed"
        echo "   MEMORY_WORKING     - Update current work"
        echo "   MEMORY_NOTE        - Add important note"
        exit 1
    fi
    
    process_catchphrase "$@"
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
