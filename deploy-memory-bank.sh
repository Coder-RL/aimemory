#!/bin/bash

# Memory Bank System - Production Deployment Script
# Senior Software Engineer: End-to-End Deployment

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly MEMORY_BANK_VERSION="1.0.0"
readonly PROJECT_NAME="${1:-$(basename "$PWD")}"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Logging
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        ERROR) echo -e "${RED}❌ [$timestamp] $message${NC}" ;;
        WARN)  echo -e "${YELLOW}⚠️  [$timestamp] $message${NC}" ;;
        INFO)  echo -e "${GREEN}✅ [$timestamp] $message${NC}" ;;
        STEP)  echo -e "${BLUE}🚀 [$timestamp] $message${NC}" ;;
        TITLE) echo -e "${BOLD}${BLUE}$message${NC}" ;;
    esac
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    echo ""
    echo "❌ Deployment failed. Check the error above and try again."
    exit 1
}

# Prerequisites check
check_prerequisites() {
    log "STEP" "Checking prerequisites..."
    
    # Check required commands
    local required_commands=("python3" "git" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command not found: $cmd"
        fi
    done
    
    # Check Python JSON module
    if ! python3 -c "import json" 2>/dev/null; then
        error_exit "Python JSON module not available"
    fi
    
    # Check if we're in a valid project directory
    if [[ ! -w "$PWD" ]]; then
        error_exit "Current directory is not writable: $PWD"
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Make scripts executable
setup_permissions() {
    log "STEP" "Setting up script permissions..."
    
    local scripts=(
        "memory-bank-core.sh"
        "memory-bank-integrations.sh"
        "memory-bank-automation.sh"
        "get-context.sh"
        "update-memory.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            chmod +x "$script"
            log "INFO" "Made executable: $script"
        fi
    done
}

# Validate project name
validate_project_name() {
    if [[ ! "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        error_exit "Invalid project name: $PROJECT_NAME. Use only alphanumeric, underscore, and dash characters."
    fi
    
    log "INFO" "Project name validated: $PROJECT_NAME"
}

# Deploy core system
deploy_core() {
    log "STEP" "Deploying memory bank core system..."
    
    if ! ./memory-bank-core.sh init "$PROJECT_NAME"; then
        error_exit "Failed to initialize memory bank core"
    fi
    
    log "INFO" "Core system deployed successfully"
}

# Deploy integrations
deploy_integrations() {
    log "STEP" "Deploying integrations..."
    
    if ! ./memory-bank-integrations.sh setup; then
        error_exit "Failed to setup integrations"
    fi
    
    log "INFO" "Integrations deployed successfully"
}

# Setup automation
setup_automation() {
    log "STEP" "Setting up automation..."
    
    # Create automation cron job (optional)
    cat > "memory-bank-cron.sh" << 'EOF'
#!/bin/bash
# Memory Bank Automation Cron Job
# Add to crontab with: crontab -e
# 0 */6 * * * /path/to/your/project/memory-bank-cron.sh

cd "$(dirname "$0")"
./memory-bank-automation.sh run >> memory-bank-automation.log 2>&1
EOF
    
    chmod +x memory-bank-cron.sh
    
    log "INFO" "Automation setup completed"
}

# Create documentation
create_documentation() {
    log "STEP" "Creating documentation..."
    
    cat > "MEMORY_BANK_README.md" << EOF
# Memory Bank System - Production Deployment

## 🎯 Overview

This is a production-ready Memory Bank system that provides persistent AI context across development workflows. The system is designed with clean code principles, comprehensive error handling, and enterprise-grade reliability.

## 📁 System Architecture

\`\`\`
Memory Bank System/
├── Core Layer
│   ├── memory-bank-core.sh          # Core functionality and templates
│   ├── memory-bank/                 # Memory bank files
│   │   ├── projectbrief.md         # Project overview
│   │   ├── activeContext.md        # Current work context
│   │   ├── progress.md             # Progress tracking
│   │   ├── techContext.md          # Technical stack
│   │   ├── systemPatterns.md       # Architecture patterns
│   │   └── productContext.md       # Product requirements
│   └── .memory-bank-config.json    # System configuration
│
├── Integration Layer
│   ├── memory-bank-integrations.sh # Editor integrations
│   ├── .cursorrules                # Cursor auto-integration
│   ├── VS Code snippets            # VS Code integration
│   ├── get-context.sh              # Universal context script
│   └── update-memory.sh            # Quick update script
│
├── Automation Layer
│   ├── memory-bank-automation.sh   # Validation & automation
│   ├── .memory-bank-backups/       # Automatic backups
│   └── memory-bank-cron.sh         # Scheduled automation
│
└── Documentation
    ├── MEMORY_BANK_README.md        # This file
    └── memory-bank.log              # System logs
\`\`\`

## 🚀 Quick Start

### 1. Cursor Integration (Automatic)
\`\`\`bash
# Open Cursor in your project
cursor .

# Ask any question - Cursor automatically reads memory bank
"What should I work on next?"
"Help me implement user authentication"
\`\`\`

### 2. VS Code + Augment Code Integration
\`\`\`bash
# In VS Code, type and press Tab:
memorycontext    # Full context template
aiask           # Structured question template
memoryupdate    # Quick update template

# Then ask Augment Code your question
\`\`\`

### 3. Universal Integration (Any AI)
\`\`\`bash
# Get context for any AI assistant
./get-context.sh

# Copy output and paste before your AI question
\`\`\`

## 🔧 Daily Workflow

### Morning Routine
\`\`\`bash
# Check memory bank health
./memory-bank-automation.sh health

# Get current context
./get-context.sh brief
\`\`\`

### During Development
\`\`\`bash
# Quick updates as you work
./update-memory.sh

# Or use Cursor/VS Code integrations
\`\`\`

### End of Day
\`\`\`bash
# Update progress
./update-memory.sh

# Create backup
./memory-bank-automation.sh backup
\`\`\`

## 🛠️ Maintenance

### Health Monitoring
\`\`\`bash
# Run health check
./memory-bank-automation.sh health

# Validate integrity
./memory-bank-automation.sh validate

# Optimize context size
./memory-bank-automation.sh optimize
\`\`\`

### Backup Management
\`\`\`bash
# Manual backup
./memory-bank-automation.sh backup

# Backups are stored in .memory-bank-backups/
# Last 5 backups are kept automatically
\`\`\`

### Automation Setup
\`\`\`bash
# Add to crontab for automatic maintenance
crontab -e

# Add this line for 6-hourly automation:
0 */6 * * * /path/to/your/project/memory-bank-cron.sh
\`\`\`

## 📊 Features

### ✅ Core Features
- **Structured Memory Bank**: 6 specialized files for different contexts
- **Cross-Platform**: Works with Cursor, VS Code, any editor
- **AI Integration**: Automatic context injection for AI assistants
- **Version Control**: Git-friendly markdown files
- **Team Collaboration**: Shareable across team members

### ✅ Advanced Features
- **Automatic Backups**: Scheduled backups with retention policy
- **Health Monitoring**: Continuous system health checks
- **Context Optimization**: Automatic context length management
- **Analytics**: Optional usage analytics collection
- **Validation**: Comprehensive integrity validation

### ✅ Enterprise Features
- **Error Handling**: Comprehensive error handling and logging
- **Configuration Management**: JSON-based configuration system
- **Audit Trail**: Complete change tracking and attribution
- **Security**: Input validation and sanitization
- **Scalability**: Designed for large projects and teams

## 🎯 Success Metrics

You'll know the system is working when:

- ✅ **Cursor**: AI automatically mentions project context in responses
- ✅ **VS Code**: Context injection works seamlessly with Augment Code
- ✅ **Universal**: Any AI assistant understands your project immediately
- ✅ **Team**: New team members get instant project context
- ✅ **Persistence**: Context survives across sessions and deployments

## 🆘 Troubleshooting

### Common Issues

**Memory bank not found**
\`\`\`bash
# Reinitialize the system
./memory-bank-core.sh init
\`\`\`

**Cursor not reading context**
\`\`\`bash
# Check .cursorrules file exists
ls -la .cursorrules

# Try explicit command
"Read my memory bank and help me with [task]"
\`\`\`

**VS Code snippets not working**
\`\`\`bash
# Reinstall snippets
./memory-bank-integrations.sh vscode

# Restart VS Code
\`\`\`

**Context too long**
\`\`\`bash
# Optimize context
./memory-bank-automation.sh optimize
\`\`\`

## 📞 Support

For issues or questions:
1. Check the logs: \`tail -f memory-bank.log\`
2. Run health check: \`./memory-bank-automation.sh health\`
3. Validate system: \`./memory-bank-automation.sh validate\`

## 🎉 Deployment Information

- **Version**: $MEMORY_BANK_VERSION
- **Project**: $PROJECT_NAME
- **Deployed**: $(date)
- **System**: $(uname -s) $(uname -m)

---

**🚀 Your Memory Bank system is ready for production use!**
EOF

    log "INFO" "Documentation created: MEMORY_BANK_README.md"
}

# Run deployment tests
run_deployment_tests() {
    log "STEP" "Running deployment tests..."
    
    # Test core functionality
    if ! ./memory-bank-core.sh validate; then
        error_exit "Core validation test failed"
    fi
    
    # Test context retrieval
    if ! ./get-context.sh brief > /dev/null; then
        error_exit "Context retrieval test failed"
    fi
    
    # Test automation
    if ! ./memory-bank-automation.sh validate; then
        error_exit "Automation validation test failed"
    fi
    
    log "INFO" "All deployment tests passed"
}

# Main deployment function
deploy_memory_bank() {
    log "TITLE" ""
    log "TITLE" "🧠 Memory Bank System - Production Deployment"
    log "TITLE" "=============================================="
    log "TITLE" ""
    log "INFO" "Deploying Memory Bank for project: $PROJECT_NAME"
    log "INFO" "Version: $MEMORY_BANK_VERSION"
    log "INFO" "Target directory: $PWD"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    validate_project_name
    setup_permissions
    deploy_core
    deploy_integrations
    setup_automation
    create_documentation
    run_deployment_tests
    
    # Success message
    echo ""
    log "TITLE" "🎉 DEPLOYMENT SUCCESSFUL!"
    log "TITLE" "========================"
    echo ""
    log "INFO" "Memory Bank system deployed successfully for $PROJECT_NAME"
    echo ""
    echo "🚀 Quick Start:"
    echo "   Cursor: Just ask 'What should I work on next?'"
    echo "   VS Code: Type 'memorycontext' + Tab, then ask Augment Code"
    echo "   Any AI: Run './get-context.sh' and copy the output"
    echo ""
    echo "📖 Read MEMORY_BANK_README.md for complete documentation"
    echo ""
    echo "🎯 Your AI assistants now have persistent project context!"
}

# Main execution
main() {
    deploy_memory_bank
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
