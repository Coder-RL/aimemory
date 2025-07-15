#!/bin/bash

# Memory Bank Core System - Production Implementation
# Senior Software Engineer: Clean Code & Best Practices

set -euo pipefail  # Strict error handling

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_BANK_VERSION="1.0.0"
readonly MEMORY_BANK_DIR="memory-bank"
readonly CONFIG_FILE=".memory-bank-config.json"
readonly SCHEMA_FILE=".memory-bank-schema.json"

# Logging configuration
readonly LOG_FILE="memory-bank.log"
readonly LOG_LEVEL="${LOG_LEVEL:-INFO}"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        ERROR) echo -e "${RED}❌ $message${NC}" ;;
        WARN)  echo -e "${YELLOW}⚠️  $message${NC}" ;;
        INFO)  echo -e "${GREEN}ℹ️  $message${NC}" ;;
        DEBUG) [[ "$LOG_LEVEL" == "DEBUG" ]] && echo -e "${BLUE}🔍 $message${NC}" ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Validation functions
validate_project_name() {
    local project_name="$1"
    if [[ ! "$project_name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        error_exit "Invalid project name: $project_name. Use only alphanumeric, underscore, and dash characters."
    fi
}

validate_memory_bank_structure() {
    local required_files=(
        "projectbrief.md"
        "activeContext.md"
        "progress.md"
        "techContext.md"
        "systemPatterns.md"
        "productContext.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$MEMORY_BANK_DIR/$file" ]]; then
            error_exit "Missing required memory bank file: $file"
        fi
    done
    
    log "INFO" "Memory bank structure validation passed"
}

# Configuration management
create_config() {
    local project_name="$1"
    local config_content=$(cat << EOF
{
  "version": "$MEMORY_BANK_VERSION",
  "projectName": "$project_name",
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contributors": ["$(whoami)"],
  "settings": {
    "autoBackup": true,
    "validateOnUpdate": true,
    "enableAnalytics": false,
    "contextMaxLength": 5000
  },
  "integrations": {
    "cursor": {
      "enabled": true,
      "autoContextInjection": true
    },
    "vscode": {
      "enabled": true,
      "snippetsInstalled": false
    }
  }
}
EOF
    )
    
    echo "$config_content" > "$CONFIG_FILE"
    log "INFO" "Configuration file created: $CONFIG_FILE"
}

create_schema() {
    local schema_content=$(cat << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Memory Bank Schema",
  "type": "object",
  "properties": {
    "version": {"type": "string"},
    "projectName": {"type": "string"},
    "createdAt": {"type": "string", "format": "date-time"},
    "lastUpdated": {"type": "string", "format": "date-time"},
    "contributors": {"type": "array", "items": {"type": "string"}},
    "settings": {
      "type": "object",
      "properties": {
        "autoBackup": {"type": "boolean"},
        "validateOnUpdate": {"type": "boolean"},
        "enableAnalytics": {"type": "boolean"},
        "contextMaxLength": {"type": "integer", "minimum": 1000}
      }
    }
  },
  "required": ["version", "projectName", "createdAt", "lastUpdated"]
}
EOF
    )
    
    echo "$schema_content" > "$MEMORY_BANK_DIR/$SCHEMA_FILE"
    log "INFO" "Schema file created: $SCHEMA_FILE"
}

# Template creation functions
create_project_brief_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/projectbrief.md" << EOF
# $project_name Project Brief

## Overview
<!-- Provide a clear, concise description of what this project does -->

## Goals
<!-- List the main objectives this project aims to achieve -->
- Goal 1
- Goal 2
- Goal 3

## Scope
<!-- Define what is included and excluded from this project -->
### In Scope
- Feature 1
- Feature 2

### Out of Scope
- Feature X
- Feature Y

## Target Users
<!-- Identify who will use this project -->
- User type 1
- User type 2

## Success Criteria
<!-- Define measurable outcomes that indicate project success -->
- Criteria 1
- Criteria 2

## Key Stakeholders
<!-- List important stakeholders and their roles -->
- Stakeholder 1: Role
- Stakeholder 2: Role

---
*Created: $(date)*
*Last Updated: $(date)*
EOF
}

create_active_context_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/activeContext.md" << EOF
# $project_name Active Context

## Current Work
<!-- What you're actively working on right now -->
- Current task 1
- Current task 2

## Recent Changes
<!-- Important changes made in the last few days -->
- Change 1 ($(date '+%Y-%m-%d'))
- Change 2 ($(date '+%Y-%m-%d'))

## Next Steps
<!-- Immediate next actions to take -->
- [ ] Next step 1
- [ ] Next step 2
- [ ] Next step 3

## Blockers
<!-- Current obstacles preventing progress -->
- Blocker 1: Description
- Blocker 2: Description

## Important Notes
<!-- Critical information to remember -->
- Note 1
- Note 2

## Context for AI
<!-- Specific context for AI assistants -->
- Current focus: [Brief description]
- Preferred approach: [Methodology/pattern]
- Constraints: [Technical/business constraints]

---
*Last Updated: $(date)*
EOF
}

create_progress_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/progress.md" << EOF
# $project_name Progress

## Completed ✅
<!-- Tasks and features that are done -->
- [x] Completed task 1 ($(date '+%Y-%m-%d'))
- [x] Completed task 2 ($(date '+%Y-%m-%d'))

## In Progress 🔄
<!-- Currently active work -->
- [ ] In progress task 1 (Started: $(date '+%Y-%m-%d'))
- [ ] In progress task 2 (Started: $(date '+%Y-%m-%d'))

## Planned 📋
<!-- Future work that's been planned -->
- [ ] Planned task 1
- [ ] Planned task 2

## Metrics
<!-- Quantitative progress indicators -->
- **Lines of Code**: [number]
- **Features Complete**: [number]/[total]
- **Tests Passing**: [number]/[total]
- **Code Coverage**: [percentage]%
- **Performance**: [metric]

## Milestones
<!-- Major project milestones -->
- [ ] Milestone 1: [Description] (Target: [date])
- [ ] Milestone 2: [Description] (Target: [date])

## Velocity
<!-- Development velocity tracking -->
- **This Week**: [tasks completed]
- **Last Week**: [tasks completed]
- **Average**: [tasks per week]

---
*Last Updated: $(date)*
EOF
}

# Main initialization function
initialize_memory_bank() {
    local project_name="${1:-$(basename "$PWD")}"
    
    log "INFO" "Initializing Memory Bank for project: $project_name"
    
    # Validate inputs
    validate_project_name "$project_name"
    
    # Create directory structure
    mkdir -p "$MEMORY_BANK_DIR"
    
    # Create configuration files
    create_config "$project_name"
    create_schema
    
    # Create memory bank files
    create_project_brief_template "$project_name"
    create_active_context_template "$project_name"
    create_progress_template "$project_name"
    create_tech_context_template "$project_name"
    create_system_patterns_template "$project_name"
    create_product_context_template "$project_name"
    
    # Validate structure
    validate_memory_bank_structure
    
    log "INFO" "Memory Bank initialization completed successfully"
}

# Main execution
main() {
    local command="${1:-init}"
    local project_name="${2:-}"
    
    case "$command" in
        "init")
            initialize_memory_bank "$project_name"
            ;;
        "validate")
            validate_memory_bank_structure
            ;;
        *)
            echo "Usage: $0 {init|validate} [project_name]"
            exit 1
            ;;
    esac
}

create_tech_context_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/techContext.md" << EOF
# $project_name Technical Context

## Technology Stack

### Frontend
- **Framework**: [e.g., React, Vue, Angular]
- **Language**: [e.g., TypeScript, JavaScript]
- **Styling**: [e.g., Tailwind CSS, Styled Components]

### Backend
- **Runtime**: [e.g., Node.js, Python, Java]
- **Framework**: [e.g., Express, FastAPI, Spring Boot]
- **Database**: [e.g., PostgreSQL, MongoDB, MySQL]

### Infrastructure
- **Cloud Provider**: [e.g., AWS, GCP, Azure]
- **Deployment**: [e.g., Docker, Kubernetes, Vercel]
- **CI/CD**: [e.g., GitHub Actions, GitLab CI]

## Setup Instructions
1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run database migrations
5. Start development server

---
*Last Updated: $(date)*
EOF
}

create_system_patterns_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/systemPatterns.md" << EOF
# $project_name System Patterns

## Architecture Patterns
- **Pattern**: [e.g., MVC, MVVM, Clean Architecture]
- **Rationale**: [Why this pattern was chosen]

## Design Patterns
- **Factory Pattern**: [Usage and location]
- **Observer Pattern**: [Usage and location]
- **Strategy Pattern**: [Usage and location]

## Code Organization
### Directory Structure
\`\`\`
src/
├── components/     # Reusable UI components
├── services/      # API and business logic
├── utils/         # Utility functions
└── types/         # TypeScript definitions
\`\`\`

## Best Practices
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write unit tests for all business logic
- Implement proper error handling

---
*Last Updated: $(date)*
EOF
}

create_product_context_template() {
    local project_name="$1"
    cat > "$MEMORY_BANK_DIR/productContext.md" << EOF
# $project_name Product Context

## User Stories
- **As a** [user type], **I want** [goal] **so that** [benefit]
- **As a** [user type], **I want** [goal] **so that** [benefit]

## Requirements
### Functional Requirements
- **FR-001**: [Requirement description]
- **FR-002**: [Requirement description]

### Non-Functional Requirements
- **NFR-001**: Performance - [specific requirement]
- **NFR-002**: Security - [specific requirement]

## Features
### Core Features
- **Feature 1**: [Description and acceptance criteria]
- **Feature 2**: [Description and acceptance criteria]

## User Personas
### Primary Persona: [Name]
- **Demographics**: [Age, role, experience level]
- **Goals**: [What they want to achieve]
- **Pain Points**: [Current challenges]

## User Feedback
- **Feedback 1**: [User comment and action taken]
- **Feedback 2**: [User comment and action taken]

---
*Last Updated: $(date)*
EOF
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
