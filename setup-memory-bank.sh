#!/bin/bash

# Cross-Platform Memory Bank Setup Script
# Automatically configures memory bank integration for Cursor and VS Code

echo "🚀 Setting up Cross-Platform Memory Bank..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in a project directory
if [ ! -d ".git" ] && [ ! -f "package.json" ] && [ ! -f "*.code-workspace" ]; then
    print_warning "This doesn't appear to be a project directory."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create .cursorrules for Cursor integration
echo "📝 Creating Cursor integration files..."
cat > .cursorrules << 'EOF'
# Cross-Platform Memory Bank Integration Rules

## Memory Bank Context Reading
Before starting any task, always read the memory bank files to understand the project context:

### Required Reading:
- projectbrief.md: Project overview, goals, and scope
- productContext.md: User stories, requirements, and features  
- activeContext.md: Current tasks, recent changes, and work in progress
- systemPatterns.md: Architecture, design patterns, and best practices
- techContext.md: Technologies, frameworks, dependencies, and setup
- progress.md: Completed work, current status, and next steps

### Memory Bank Auto-Update Rules:
1. **Before Starting Work**: Read activeContext.md and progress.md
2. **During Work**: Update activeContext.md with current changes
3. **When Completing Features**: Update progress.md with what's now working
4. **When Adding Dependencies**: Update techContext.md
5. **When Creating Patterns**: Add to systemPatterns.md
6. **When Changing Scope**: Update projectbrief.md

### Workflow Commands:
- "Read my memory bank and help me with [task]"
- "Update my memory bank with the changes we made"
- "What's the current state based on my memory bank?"
- "Add this pattern to my system patterns"

### Context Injection:
Always start responses with: "Based on your memory bank context..." when relevant.

### Auto-Update Triggers:
- File changes → Update activeContext.md
- Feature completion → Update progress.md  
- New patterns → Update systemPatterns.md
- Dependency changes → Update techContext.md

## Memory Bank File Purposes:
- **projectbrief.md**: High-level project vision and goals
- **productContext.md**: User-focused requirements and features
- **activeContext.md**: Current work and immediate context
- **systemPatterns.md**: Technical architecture and patterns
- **techContext.md**: Technology stack and setup instructions
- **progress.md**: Status tracking and completed work
EOF

print_status "Created .cursorrules for Cursor auto-mode integration"

# Create VS Code workspace settings
echo "📝 Creating VS Code integration files..."
mkdir -p .vscode

cat > .vscode/settings.json << 'EOF'
{
  "aimemory.autoStart": true,
  "aimemory.autoUpdate": true,
  "aimemory.contextInjection": true,
  "aimemory.serverPort": 7331,
  "aimemory.enableLogging": true,
  "aimemory.enableContentSanitization": true,
  "aimemory.hooks": {
    "onFileChange": "updateActiveContext",
    "onTaskComplete": "updateProgress", 
    "onNewFeature": "updateSystemPatterns"
  },
  "aimemory.integration": {
    "copilot": true,
    "tabnine": true,
    "codeGPT": true
  }
}
EOF

print_status "Created VS Code workspace settings"

# Create VS Code keybindings
cat > .vscode/keybindings.json << 'EOF'
[
  {
    "key": "cmd+shift+m",
    "command": "aimemory.openWebview",
    "when": "editorTextFocus"
  },
  {
    "key": "cmd+shift+i",
    "command": "aimemory.insertContext",
    "when": "editorTextFocus"
  },
  {
    "key": "cmd+shift+u",
    "command": "aimemory.updateActiveContext",
    "when": "editorTextFocus"
  },
  {
    "key": "cmd+shift+j",
    "command": "aimemory.updateProgress",
    "when": "editorTextFocus"
  }
]
EOF

print_status "Created VS Code keyboard shortcuts"

# Create project-specific memory bank configuration
cat > .memory-bank-config.json << 'EOF'
{
  "version": "2.0.0",
  "projectName": "",
  "autoUpdate": true,
  "contextInjection": true,
  "integrations": {
    "cursor": {
      "enabled": true,
      "mcpAutoConfig": true,
      "autoMode": true
    },
    "vscode": {
      "enabled": true,
      "contextInjection": true,
      "aiIntegration": true
    }
  },
  "files": {
    "projectbrief.md": "Project overview and goals",
    "productContext.md": "User stories and requirements",
    "activeContext.md": "Current tasks and recent changes", 
    "systemPatterns.md": "Architecture and design patterns",
    "techContext.md": "Technologies and dependencies",
    "progress.md": "Completed work and status"
  }
}
EOF

print_status "Created memory bank configuration"

# Create shell aliases
echo "📝 Creating shell aliases..."
cat > .memory-bank-aliases.sh << 'EOF'
#!/bin/bash
# Memory Bank Shell Aliases

# Quick start commands
alias mb-cursor="cursor . && sleep 2 && cursor --command 'aimemory.openWebview'"
alias mb-vscode="code . && sleep 2 && code --command 'aimemory.openWebview'"
alias mb-dashboard="cursor --command 'aimemory.openWebview' || code --command 'aimemory.openWebview'"

# Memory bank operations
alias mb-status="cursor --command 'aimemory.getStatus' || code --command 'aimemory.getStatus'"
alias mb-update="cursor --command 'aimemory.updateActiveContext' || code --command 'aimemory.updateActiveContext'"
alias mb-progress="cursor --command 'aimemory.updateProgress' || code --command 'aimemory.updateProgress'"

# Daily workflow
alias start-work="mb-dashboard"
alias end-work="mb-progress"

echo "Memory Bank aliases loaded! Use 'mb-dashboard' to open the dashboard."
EOF

print_status "Created shell aliases (source .memory-bank-aliases.sh to use)"

# Create README for the project
cat > MEMORY_BANK_README.md << 'EOF'
# Memory Bank Integration

This project is configured with the Cross-Platform Memory Bank system.

## Quick Start

### Open Memory Bank Dashboard:
```bash
# Cursor
Ctrl+Shift+P → "Memory Bank: Open Dashboard"

# VS Code  
Ctrl+Shift+P → "Memory Bank: Open Dashboard"
```

### Keyboard Shortcuts:
- `Ctrl+Shift+M`: Open Memory Bank Dashboard
- `Ctrl+Shift+I`: Insert Context into current file
- `Ctrl+Shift+U`: Update Active Context
- `Ctrl+Shift+P`: Update Progress

### Memory Bank Files:
- **projectbrief.md**: Project overview and goals
- **productContext.md**: User stories and requirements
- **activeContext.md**: Current tasks and recent changes
- **systemPatterns.md**: Architecture and design patterns  
- **techContext.md**: Technologies and dependencies
- **progress.md**: Completed work and status

### AI Integration:
- **Cursor**: Auto-mode will automatically read and update memory bank
- **VS Code**: Use context injection for AI interactions

### Daily Workflow:
1. Start work: Open memory bank dashboard
2. During work: AI updates memory bank automatically
3. End work: Review and update progress

## Configuration Files:
- `.cursorrules`: Cursor auto-mode integration rules
- `.vscode/settings.json`: VS Code memory bank settings
- `.memory-bank-config.json`: Project-specific configuration
EOF

print_status "Created project README"

# Check for editor installations
echo ""
echo "🔍 Checking editor installations..."

if command -v cursor &> /dev/null; then
    print_status "Cursor detected"
    CURSOR_AVAILABLE=true
else
    print_warning "Cursor not found in PATH"
    CURSOR_AVAILABLE=false
fi

if command -v code &> /dev/null; then
    print_status "VS Code detected"
    VSCODE_AVAILABLE=true
else
    print_warning "VS Code not found in PATH"
    VSCODE_AVAILABLE=false
fi

# Installation instructions
echo ""
echo "📦 Next Steps:"
echo "=============="

print_info "1. Install the Memory Bank extension:"
if [ "$CURSOR_AVAILABLE" = true ]; then
    echo "   cursor --install-extension aimemory-2.0.0.vsix"
fi
if [ "$VSCODE_AVAILABLE" = true ]; then
    echo "   code --install-extension aimemory-2.0.0.vsix"
fi

print_info "2. Load shell aliases (optional):"
echo "   source .memory-bank-aliases.sh"

print_info "3. Open your editor and run:"
echo "   Command Palette → 'Memory Bank: Open Dashboard'"

print_info "4. For Cursor auto-mode:"
echo "   The .cursorrules file will automatically integrate memory bank"

print_info "5. For VS Code AI integration:"
echo "   Use Ctrl+Shift+I to inject context before AI interactions"

echo ""
print_status "Memory Bank setup complete!"
echo ""
echo "🎯 Your project is now configured for automatic memory bank integration!"
echo "   The AI will automatically read and update your project context."
echo ""
