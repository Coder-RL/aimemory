#!/bin/bash

# Memory Bank Integrations - Production Implementation
# Senior Software Engineer: Integration Layer

set -euo pipefail

# Configuration
readonly INTEGRATION_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_BANK_DIR="memory-bank"
readonly VSCODE_SNIPPETS_DIR="$HOME/Library/Application Support/Code/User/snippets"
readonly CURSOR_CONFIG_DIR="$HOME/.cursor"

# Logging functions (independent)
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "memory-bank.log"

    case "$level" in
        ERROR) echo -e "\033[0;31m❌ $message\033[0m" ;;
        WARN)  echo -e "\033[1;33m⚠️  $message\033[0m" ;;
        INFO)  echo -e "\033[0;32mℹ️  $message\033[0m" ;;
    esac
}

# Integration: Cursor Auto-Configuration
setup_cursor_integration() {
    log "INFO" "Setting up Cursor integration..."
    
    # Create enhanced .cursorrules
    cat > ".cursorrules" << 'EOF'
# MEMORY BANK INTEGRATION - PRODUCTION CONFIGURATION

## Context Reading Protocol
ALWAYS read memory bank files before responding to any request.

### Memory Bank Files (read in priority order):
1. `memory-bank/projectbrief.md` - Project overview and goals
2. `memory-bank/activeContext.md` - Current work and immediate context  
3. `memory-bank/progress.md` - Completed work and next steps
4. `memory-bank/techContext.md` - Technology stack and setup
5. `memory-bank/systemPatterns.md` - Architecture and design patterns
6. `memory-bank/productContext.md` - User requirements and features

### Response Protocol:
1. Start responses with: "Based on your memory bank context..."
2. Reference specific information from relevant memory bank files
3. Ensure all suggestions align with existing patterns and tech stack
4. Consider current progress and active work when making recommendations

### Memory Bank Update Protocol:
When work is completed or context changes significantly:
1. Update `activeContext.md` with current work status
2. Update `progress.md` with completed items and new metrics
3. Add new patterns to `systemPatterns.md` when introducing new approaches
4. Update `techContext.md` when dependencies or setup changes

### Context Injection Commands:
Use these phrases to trigger memory bank reading:
- "Read my memory bank and help me with [specific task]"
- "Based on my project context, [question/request]"
- "Update my memory bank with [completed work/changes]"
- "What should I work on next based on my current progress?"

### Quality Assurance:
- Always validate suggestions against existing system patterns
- Ensure consistency with established coding standards
- Consider performance and security implications
- Maintain alignment with project goals and user requirements

## Memory Bank File Purposes:
- **projectbrief.md**: High-level vision, goals, scope, and success criteria
- **activeContext.md**: Current tasks, recent changes, immediate focus areas
- **progress.md**: Completed work, metrics, milestones, and velocity tracking
- **techContext.md**: Technology stack, dependencies, setup instructions
- **systemPatterns.md**: Architecture, design patterns, coding standards
- **productContext.md**: User stories, requirements, personas, feedback

## Integration Workflow:
1. Read memory bank context before every response
2. Provide context-aware, project-specific guidance
3. Suggest memory bank updates when appropriate
4. Maintain consistency with established project patterns
5. Track and reference previous decisions and implementations
EOF

    log "INFO" "Cursor integration configured successfully"
}

# Integration: VS Code Snippets
setup_vscode_integration() {
    log "INFO" "Setting up VS Code integration..."
    
    # Create snippets directory if it doesn't exist
    mkdir -p "$VSCODE_SNIPPETS_DIR"
    
    # Create comprehensive memory bank snippets
    cat > "$VSCODE_SNIPPETS_DIR/memory-bank.code-snippets" << 'EOF'
{
  "Insert Memory Bank Context": {
    "prefix": "memorycontext",
    "body": [
      "// === MEMORY BANK CONTEXT ===",
      "// Project: ${TM_DIRECTORY/.*\\///}",
      "// Generated: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE} ${CURRENT_HOUR}:${CURRENT_MINUTE}",
      "// Context Type: ${1|Full Context,Brief Context,Technical Context,Progress Context|}",
      "",
      "// PROJECT OVERVIEW:",
      "// ${2:Brief project description and current goals}",
      "",
      "// CURRENT WORK:",
      "// ${3:What you're actively working on right now}",
      "",
      "// TECHNICAL STACK:",
      "// ${4:Key technologies and frameworks being used}",
      "",
      "// RECENT PROGRESS:",
      "// ${5:Recently completed work and current status}",
      "",
      "// NEXT STEPS:",
      "// ${6:Immediate next actions and priorities}",
      "",
      "// CONSTRAINTS:",
      "// ${7:Technical, business, or time constraints to consider}",
      "",
      "// === END MEMORY BANK CONTEXT ===",
      "",
      "${8:Your question or request for the AI assistant}"
    ],
    "description": "Insert comprehensive memory bank context for AI interactions"
  },
  
  "Quick Memory Update": {
    "prefix": "memoryupdate",
    "body": [
      "## Memory Bank Update - ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "",
      "### ✅ Completed:",
      "- ${1:What was just completed}",
      "",
      "### 🔄 Current Work:",
      "- ${2:What you're working on now}",
      "",
      "### 📋 Next Steps:",
      "- ${3:What to do next}",
      "",
      "### 🚧 Blockers:",
      "- ${4:Any current obstacles}",
      "",
      "### 📝 Notes:",
      "- ${5:Important notes or decisions made}",
      "",
      "### 🎯 Context for AI:",
      "- Focus: ${6:Current area of focus}",
      "- Approach: ${7:Preferred methodology or pattern}",
      "- Goal: ${8:Immediate objective}"
    ],
    "description": "Quick memory bank update template with structured sections"
  },
  
  "AI Question with Context": {
    "prefix": "aiask",
    "body": [
      "Based on my project memory bank context:",
      "",
      "**Project**: ${TM_DIRECTORY/.*\\///}",
      "**Current Focus**: ${1:What you're currently working on}",
      "**Tech Stack**: ${2:Relevant technologies for this question}",
      "**Constraints**: ${3:Any limitations or requirements}",
      "**Goal**: ${4:What you want to achieve}",
      "",
      "**Specific Question**: ${5:Your detailed question}",
      "",
      "**Additional Context**: ${6:Any other relevant information}",
      "",
      "Please provide a solution that:",
      "- Fits with my existing codebase and patterns",
      "- Considers the technical constraints mentioned",
      "- Aligns with the project goals and current progress",
      "- Follows established best practices for this tech stack"
    ],
    "description": "Structured template for asking AI questions with full context"
  },
  
  "Technical Context": {
    "prefix": "techcontext",
    "body": [
      "// === TECHNICAL CONTEXT ===",
      "// Architecture: ${1:Current architecture pattern}",
      "// Framework: ${2:Primary framework/technology}",
      "// Database: ${3:Database technology}",
      "// Deployment: ${4:Deployment platform}",
      "",
      "// Current Implementation:",
      "// ${5:Relevant existing code or patterns}",
      "",
      "// Requirements:",
      "// ${6:Technical requirements for this task}",
      "",
      "// Constraints:",
      "// ${7:Technical limitations or considerations}",
      "",
      "// === END TECHNICAL CONTEXT ==="
    ],
    "description": "Insert technical context for development questions"
  },
  
  "Progress Context": {
    "prefix": "progresscontext",
    "body": [
      "// === PROGRESS CONTEXT ===",
      "// Sprint/Iteration: ${1:Current sprint or iteration}",
      "// Completed: ${2:Recently completed features/tasks}",
      "// In Progress: ${3:Current active work}",
      "// Planned: ${4:Next planned work}",
      "// Blockers: ${5:Current obstacles}",
      "",
      "// Metrics:",
      "// - Features Complete: ${6:X/Y}",
      "// - Tests Passing: ${7:X/Y}",
      "// - Code Coverage: ${8:X%}",
      "",
      "// === END PROGRESS CONTEXT ==="
    ],
    "description": "Insert progress context for project status discussions"
  }
}
EOF

    log "INFO" "VS Code snippets installed successfully"
    log "INFO" "Available snippets: memorycontext, memoryupdate, aiask, techcontext, progresscontext"
}

# Integration: Universal Context Scripts
create_context_scripts() {
    log "INFO" "Creating universal context scripts..."
    
    # Master context retrieval script
    cat > "get-context.sh" << 'EOF'
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
EOF

    chmod +x get-context.sh
    
    # Quick update script
    cat > "update-memory.sh" << 'EOF'
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
EOF

    chmod +x update-memory.sh
    
    log "INFO" "Universal context scripts created successfully"
}

# Main integration setup function
setup_all_integrations() {
    log "INFO" "Setting up all Memory Bank integrations..."
    
    setup_cursor_integration
    setup_vscode_integration
    create_context_scripts
    
    log "INFO" "All integrations configured successfully"
    
    echo ""
    echo "🎯 Integration Setup Complete!"
    echo "=============================="
    echo ""
    echo "✅ Cursor Integration:"
    echo "   - .cursorrules file created"
    echo "   - Automatic context reading enabled"
    echo "   - Just ask: 'What should I work on next?'"
    echo ""
    echo "✅ VS Code Integration:"
    echo "   - Snippets installed in VS Code"
    echo "   - Type 'memorycontext' + Tab for full context"
    echo "   - Type 'aiask' + Tab for structured questions"
    echo ""
    echo "✅ Universal Scripts:"
    echo "   - ./get-context.sh - Get context for any AI"
    echo "   - ./update-memory.sh - Quick memory updates"
    echo ""
    echo "🚀 Ready to use with any AI assistant!"
}

# Main execution
main() {
    local command="${1:-setup}"
    
    case "$command" in
        "setup")
            setup_all_integrations
            ;;
        "cursor")
            setup_cursor_integration
            ;;
        "vscode")
            setup_vscode_integration
            ;;
        "scripts")
            create_context_scripts
            ;;
        *)
            echo "Usage: $0 {setup|cursor|vscode|scripts}"
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
