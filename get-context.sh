#!/bin/bash

# Universal Memory Bank Context Retrieval
# Works with any AI assistant or platform

set -euo pipefail

readonly MEMORY_BANK_DIR="memory-bank"
readonly PROJECT_NAME="$(basename "$PWD")"

# Color codes
readonly BLUE='\033[0;34m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

print_header() {
    echo -e "${BLUE}=== MEMORY BANK CONTEXT ===${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Generated: $(date)"
    echo "Context Type: ${1:-Full Context}"
    echo ""
}

print_section() {
    local title="$1"
    local file="$2"
    
    echo -e "${GREEN}## $title${NC}"
    if [[ -f "$MEMORY_BANK_DIR/$file" ]]; then
        # Read file and format for AI consumption
        sed 's/^/  /' "$MEMORY_BANK_DIR/$file" | head -20
        if [[ $(wc -l < "$MEMORY_BANK_DIR/$file") -gt 20 ]]; then
            echo "  ... (truncated, see $file for full content)"
        fi
    else
        echo "  No $file found"
    fi
    echo ""
}

main() {
    local context_type="${1:-full}"
    
    if [[ ! -d "$MEMORY_BANK_DIR" ]]; then
        echo "❌ No memory bank found. Run ./memory-bank-core.sh init first"
        exit 1
    fi
    
    print_header "$context_type"
    
    case "$context_type" in
        "brief")
            print_section "PROJECT OVERVIEW" "projectbrief.md"
            print_section "CURRENT CONTEXT" "activeContext.md"
            ;;
        "technical")
            print_section "TECHNICAL CONTEXT" "techContext.md"
            print_section "SYSTEM PATTERNS" "systemPatterns.md"
            ;;
        "progress")
            print_section "PROGRESS STATUS" "progress.md"
            print_section "CURRENT CONTEXT" "activeContext.md"
            ;;
        "full"|*)
            print_section "PROJECT OVERVIEW" "projectbrief.md"
            print_section "CURRENT CONTEXT" "activeContext.md"
            print_section "PROGRESS STATUS" "progress.md"
            print_section "TECHNICAL CONTEXT" "techContext.md"
            print_section "SYSTEM PATTERNS" "systemPatterns.md"
            print_section "PRODUCT CONTEXT" "productContext.md"
            ;;
    esac
    
    echo -e "${YELLOW}=== END CONTEXT ===${NC}"
    echo ""
    echo "💡 Usage: Copy the above context and paste it before your AI questions"
    echo "💡 Context types: full (default), brief, technical, progress"
}

main "$@"
