# Manual Installation Guide - Cross-Platform Memory Bank

## 📦 Quick Installation

### **Step 1: Download the Extension**
The extension package is ready: `aimemory-2.0.0.vsix` (66.6 KB)

### **Step 2: Install in Your Editors**

#### **For Cursor:**
```bash
# Method 1: Command line
cursor --install-extension aimemory-2.0.0.vsix

# Method 2: Through Cursor UI
# 1. Open Cursor
# 2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
# 3. Type "Extensions: Install from VSIX"
# 4. Select the aimemory-2.0.0.vsix file
```

#### **For VS Code:**
```bash
# Method 1: Command line
code --install-extension aimemory-2.0.0.vsix

# Method 2: Through VS Code UI
# 1. Open VS Code
# 2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
# 3. Type "Extensions: Install from VSIX"
# 4. Select the aimemory-2.0.0.vsix file
```

### **Step 3: Verify Installation**
```bash
# Open Command Palette in either editor
# Type: "Memory Bank: Open Dashboard"
# You should see the memory bank dashboard open
```

## 🚀 AUTOMATIC INTEGRATION SETUP

### **CURSOR AUTO-INTEGRATION**

#### **Automatic MCP Configuration**
The extension automatically configures Cursor's MCP integration. Here's what happens:

1. **Auto-Configuration File**: `~/.cursor/mcp.json`
```json
{
  "servers": {
    "memory-bank": {
      "command": "node",
      "args": ["/path/to/memory-bank-server.js"],
      "env": {}
    }
  }
}
```

2. **Verification Steps**:
```bash
# 1. Install the extension
cursor --install-extension aimemory-2.0.0.vsix

# 2. Open any project in Cursor
# 3. Press Ctrl+Shift+P and run: "Memory Bank: Start MCP Server"
# 4. Check MCP status: "Memory Bank: Get Server Status"
```

#### **Auto-Mode Integration**
To make Cursor's auto-mode automatically use the memory bank:

1. **Create `.cursorrules` file in your project root**:
```bash
# Memory Bank Auto-Integration Rules

## Context Reading
- Always read memory bank files before starting any task
- Check activeContext.md for current project state
- Review projectbrief.md for project goals
- Check progress.md for completed work

## Memory Bank Files to Read:
- projectbrief.md: Project overview and goals
- productContext.md: User stories and requirements
- activeContext.md: Current tasks and recent changes
- systemPatterns.md: Architecture and design patterns
- techContext.md: Technologies and dependencies
- progress.md: What works and what's left to build

## Auto-Update Rules
- Update activeContext.md when starting new work
- Update progress.md when completing features
- Add new patterns to systemPatterns.md
- Update techContext.md when adding dependencies

## Workflow
1. Read memory bank context before any task
2. Update relevant files during work
3. Summarize changes in progress.md
4. Keep activeContext.md current
```

2. **Enable Auto-Context in Cursor Settings**:
```json
{
  "cursor.memory.autoContext": true,
  "cursor.memory.updateOnChange": true,
  "cursor.mcp.autoConnect": true
}
```

3. **Use Enhanced Chat Commands**:
```bash
# In Cursor chat, use:
"Read my memory bank and help me with [task]"
"Update my memory bank with the changes we made"
"What's the current state of my project based on memory bank?"
```

### **VS CODE AUTO-INTEGRATION**

#### **Extension Configuration**
Add these settings to your VS Code `settings.json`:

```json
{
  "aimemory.autoStart": true,
  "aimemory.autoUpdate": true,
  "aimemory.contextInjection": true,
  "aimemory.serverPort": 7331,
  "aimemory.enableLogging": true,
  "aimemory.hooks": {
    "onFileChange": "updateActiveContext",
    "onTaskComplete": "updateProgress",
    "onNewFeature": "updateSystemPatterns"
  }
}
```

#### **AI Extension Integration**

**For GitHub Copilot:**
```json
{
  "github.copilot.enable": {
    "*": true,
    "memory-bank": true
  },
  "aimemory.integration.copilot": true
}
```

**For Other AI Extensions:**
```json
{
  "aimemory.integration.tabnine": true,
  "aimemory.integration.codeGPT": true,
  "aimemory.integration.aiCommits": true
}
```

#### **Automatic Context Injection**
Set up automatic context injection for AI interactions:

1. **Create Workspace Settings** (`.vscode/settings.json`):
```json
{
  "aimemory.autoInjectContext": true,
  "aimemory.contextTemplate": "Based on my memory bank context:\n\n{context}\n\nPlease help me with: {request}"
}
```

2. **Use Keyboard Shortcuts** (`.vscode/keybindings.json`):
```json
[
  {
    "key": "ctrl+shift+m",
    "command": "aimemory.openDashboard"
  },
  {
    "key": "ctrl+shift+i",
    "command": "aimemory.insertContext"
  },
  {
    "key": "ctrl+shift+u",
    "command": "aimemory.updateActiveContext"
  }
]
```

## 🔄 AUTOMATIC WORKFLOW SETUP

### **Project Initialization Workflow**

1. **Create Project Setup Script** (`setup-memory-bank.sh`):
```bash
#!/bin/bash
# Memory Bank Project Setup

echo "Setting up Memory Bank for project..."

# Create .cursorrules if using Cursor
if command -v cursor &> /dev/null; then
    echo "Creating .cursorrules for Cursor integration..."
    cat > .cursorrules << 'EOF'
# Memory Bank Auto-Integration Rules
- Always read memory bank files before starting tasks
- Update activeContext.md with current work
- Update progress.md when completing features
- Keep memory bank files current and accurate
EOF
fi

# Create VS Code workspace settings
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "aimemory.autoStart": true,
  "aimemory.autoUpdate": true,
  "aimemory.contextInjection": true
}
EOF

# Initialize memory bank
if command -v cursor &> /dev/null; then
    cursor -r . -g "Memory Bank: Open Dashboard"
elif command -v code &> /dev/null; then
    code . -g "Memory Bank: Open Dashboard"
fi

echo "Memory Bank setup complete!"
```

2. **Make it executable and run**:
```bash
chmod +x setup-memory-bank.sh
./setup-memory-bank.sh
```

### **Daily Workflow Integration**

**Morning Routine:**
```bash
# Add to your shell profile (.bashrc, .zshrc, etc.)
alias start-work="cursor . && cursor -g 'Memory Bank: Open Dashboard'"
alias start-vscode="code . && code -g 'Memory Bank: Open Dashboard'"
```

**End of Day Routine:**
```bash
alias end-work="cursor -g 'Memory Bank: Update Progress'"
alias end-vscode="code -g 'Memory Bank: Update Progress'"
```

## 🤖 AI INTEGRATION EXAMPLES

### **Cursor Auto-Mode Examples**

1. **Starting New Feature:**
```
Prompt: "I want to add user authentication. Read my memory bank first, then help me plan and implement this feature."

Auto-mode will:
- Read projectbrief.md for project context
- Check activeContext.md for current state
- Review systemPatterns.md for existing patterns
- Plan the authentication feature
- Update activeContext.md with the new work
```

2. **Bug Fixing:**
```
Prompt: "There's a bug in the user login. Check my memory bank and help me debug it."

Auto-mode will:
- Read techContext.md for technology stack
- Check systemPatterns.md for authentication patterns
- Review activeContext.md for recent changes
- Debug the issue
- Update progress.md with the fix
```

### **VS Code AI Integration Examples**

1. **Context-Aware Coding:**
```bash
# Press Ctrl+Shift+I to inject context, then ask:
"Based on my project context above, help me implement the user dashboard component."
```

2. **Progress Tracking:**
```bash
# Use command palette:
"Memory Bank: Update Progress" 
# Then describe what you completed
```

## 📋 VERIFICATION CHECKLIST

### **Installation Verification:**
- [ ] Extension installed in Cursor
- [ ] Extension installed in VS Code  
- [ ] Memory Bank dashboard opens
- [ ] MCP server starts (Cursor)
- [ ] Six memory bank files created

### **Integration Verification:**
- [ ] `.cursorrules` file created
- [ ] VS Code settings configured
- [ ] Keyboard shortcuts working
- [ ] Auto-context injection working
- [ ] Memory bank updates automatically

### **Workflow Verification:**
- [ ] AI reads memory bank before tasks
- [ ] Memory bank updates during work
- [ ] Progress tracking works
- [ ] Context persists across sessions

## 🆘 TROUBLESHOOTING

### **Common Issues:**

1. **Extension Not Loading:**
```bash
# Restart editor after installation
# Check: Help > Toggle Developer Tools > Console for errors
```

2. **MCP Server Not Starting (Cursor):**
```bash
# Check port availability
lsof -i :7331

# Restart MCP server
Command Palette > "Memory Bank: Restart Server"
```

3. **Memory Bank Files Not Created:**
```bash
# Ensure workspace folder is open
# Run: "Memory Bank: Open Dashboard"
# Check workspace permissions
```

4. **AI Not Using Context:**
```bash
# Cursor: Check ~/.cursor/mcp.json exists
# VS Code: Run "Memory Bank: Insert Context" manually
# Verify settings are applied
```

## 🎯 SUCCESS INDICATORS

You'll know the integration is working when:

✅ **Cursor:**
- AI automatically mentions memory bank context in responses
- Memory bank files update during conversations
- MCP server shows "Running" status

✅ **VS Code:**
- Context injection works with Ctrl+Shift+I
- Memory bank dashboard opens quickly
- AI extensions recognize project context

✅ **Both:**
- Memory bank files stay current with your work
- AI provides more relevant, context-aware responses
- Project context persists across sessions

**You're now ready to use the Memory Bank across all your projects!**
