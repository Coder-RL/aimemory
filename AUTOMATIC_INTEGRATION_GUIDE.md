# 🤖 Automatic Integration Guide - Memory Bank with Cursor & VS Code

This guide shows you how to set up **automatic** memory bank integration so your AI assistants will automatically read and update your project context without manual intervention.

## 🚀 QUICK SETUP (5 Minutes)

### **Step 1: Install Extension**
```bash
# For Cursor
cursor --install-extension aimemory-2.0.0.vsix

# For VS Code  
code --install-extension aimemory-2.0.0.vsix
```

### **Step 2: Auto-Configure Project**
```bash
# Run the setup script in any project directory
./setup-memory-bank.sh
```

### **Step 3: Verify Integration**
```bash
# Open your editor and run:
# Command Palette → "Memory Bank: Open Dashboard"
# You should see 6 memory bank files created
```

**That's it! Your AI will now automatically use memory bank context.**

## 🎯 HOW AUTOMATIC INTEGRATION WORKS

### **CURSOR AUTO-MODE INTEGRATION**

#### **What Happens Automatically:**
1. **Extension Auto-Configures MCP**: Creates `~/.cursor/mcp.json`
2. **Memory Bank as MCP Resource**: AI can read all 6 memory bank files
3. **Auto-Context Reading**: AI reads memory bank before every task
4. **Auto-Updates**: AI updates memory bank during work

#### **The Magic `.cursorrules` File:**
When you run the setup script, it creates a `.cursorrules` file that tells Cursor's auto-mode:

```bash
# What the AI will do automatically:
✅ Read memory bank files before starting any task
✅ Update activeContext.md with current work
✅ Update progress.md when completing features  
✅ Add new patterns to systemPatterns.md
✅ Update techContext.md when adding dependencies
✅ Keep all context current and accurate
```

#### **Example Auto-Mode Conversation:**
```
You: "Add user authentication to the app"

AI (automatically):
1. Reads projectbrief.md → Understands this is a web app
2. Reads techContext.md → Sees you're using React + Node.js
3. Reads systemPatterns.md → Finds existing auth patterns
4. Reads activeContext.md → Knows current work status
5. Plans authentication feature based on context
6. Updates activeContext.md with new auth work
7. Implements the feature
8. Updates progress.md with completed auth system
```

### **VS CODE AUTO-INTEGRATION**

#### **What Happens Automatically:**
1. **Extension Auto-Starts**: Memory bank server starts with VS Code
2. **Context Injection**: Keyboard shortcuts for instant context
3. **AI Integration**: Works with Copilot, Tabnine, CodeGPT
4. **Auto-Updates**: Hooks into file changes and completions

#### **Automatic Workflows:**
```bash
✅ Ctrl+Shift+I → Instantly injects memory bank context
✅ File changes → Automatically updates activeContext.md
✅ Feature completion → Prompts to update progress.md
✅ New dependencies → Updates techContext.md
✅ AI interactions → Include project context automatically
```

#### **Example VS Code Workflow:**
```
1. You start coding a new feature
2. Press Ctrl+Shift+I → Context injected into current file
3. Ask Copilot: "Help me implement this feature"
4. Copilot sees full project context and provides relevant code
5. When you complete the feature → Extension prompts to update progress
6. Memory bank stays current automatically
```

## 🔧 ADVANCED AUTOMATIC FEATURES

### **Smart Context Detection**
The memory bank automatically detects:
- **New Features**: Updates systemPatterns.md
- **Bug Fixes**: Updates activeContext.md  
- **Dependencies**: Updates techContext.md
- **Architecture Changes**: Updates systemPatterns.md
- **Completed Work**: Updates progress.md

### **Cross-Session Persistence**
- Memory bank persists across editor restarts
- AI remembers project context between sessions
- Work continues seamlessly where you left off

### **Multi-Project Support**
- Each project gets its own memory bank
- Context is project-specific and isolated
- Switch between projects with full context

## 📋 VERIFICATION CHECKLIST

### **Cursor Integration Working:**
- [ ] Open Cursor in any project
- [ ] AI mentions "based on your memory bank" in responses
- [ ] Memory bank files update during conversations
- [ ] MCP server shows "Running" status
- [ ] AI provides project-specific context

### **VS Code Integration Working:**
- [ ] Ctrl+Shift+I injects context successfully
- [ ] Memory bank dashboard opens quickly
- [ ] AI extensions recognize project context
- [ ] Status bar shows "Memory Bank: Active"
- [ ] File changes trigger context updates

## 🎯 DAILY WORKFLOW EXAMPLES

### **Starting Your Day:**
```bash
# Cursor
1. Open project → AI automatically reads memory bank
2. Ask: "What should I work on today?"
3. AI responds based on progress.md and activeContext.md

# VS Code
1. Open project → Memory bank auto-starts
2. Press Ctrl+Shift+I → Context injected
3. Ask Copilot: "What's the current project status?"
```

### **During Development:**
```bash
# Cursor (Automatic)
- AI reads context before every response
- Updates memory bank during conversations
- Tracks progress automatically

# VS Code (Semi-Automatic)
- Press Ctrl+Shift+I before AI interactions
- Extension prompts for updates after major changes
- Context stays current with minimal effort
```

### **End of Day:**
```bash
# Both Editors
- AI automatically updates progress.md
- activeContext.md reflects current state
- Ready for tomorrow's work
```

## 🔍 TROUBLESHOOTING AUTO-INTEGRATION

### **Cursor Issues:**

**AI Not Reading Memory Bank:**
```bash
# Check MCP configuration
cat ~/.cursor/mcp.json

# Restart MCP server
Command Palette → "Memory Bank: Restart Server"

# Verify .cursorrules exists in project
ls -la .cursorrules
```

**Memory Bank Not Updating:**
```bash
# Check if extension is active
Command Palette → "Memory Bank: Get Server Status"

# Verify auto-update is enabled
Check: cursor settings → memory.autoUpdate: true
```

### **VS Code Issues:**

**Context Injection Not Working:**
```bash
# Check extension is installed
code --list-extensions | grep aimemory

# Verify keyboard shortcuts
File → Preferences → Keyboard Shortcuts → Search "aimemory"

# Check workspace settings
cat .vscode/settings.json
```

**AI Not Using Context:**
```bash
# Manual context injection
Press Ctrl+Shift+I before AI interactions

# Check AI extension compatibility
Ensure Copilot/Tabnine is enabled and working

# Verify memory bank server
Command Palette → "Memory Bank: Get Server Status"
```

## 🎉 SUCCESS INDICATORS

### **You Know It's Working When:**

**Cursor:**
- ✅ AI says "Based on your memory bank context..."
- ✅ Responses are project-specific and relevant
- ✅ Memory bank files update during conversations
- ✅ AI remembers previous work and decisions

**VS Code:**
- ✅ Ctrl+Shift+I instantly adds project context
- ✅ Copilot suggestions are more relevant
- ✅ AI understands your project architecture
- ✅ Context persists across sessions

**Both:**
- ✅ No more explaining project context to AI
- ✅ AI provides consistent, informed responses
- ✅ Project knowledge accumulates over time
- ✅ Seamless context across different AI tools

## 🚀 ADVANCED TIPS

### **Maximize Auto-Integration:**

1. **Keep Memory Bank Current**: Let AI update files during work
2. **Use Descriptive Commits**: AI learns from commit messages
3. **Regular Progress Updates**: Help AI understand project evolution
4. **Consistent Patterns**: AI learns your coding patterns over time

### **Custom Auto-Rules:**
Add to `.cursorrules` for project-specific behavior:
```bash
# Custom rules for your project type
- For React projects: Always check component patterns
- For API projects: Always review endpoint documentation  
- For mobile apps: Consider platform-specific requirements
```

### **Team Integration:**
- Share `.cursorrules` and `.vscode/settings.json` with team
- Memory bank becomes shared project knowledge
- Consistent AI behavior across team members

**Your AI assistants are now fully integrated with your project context!**
**They will automatically understand your project and keep context current.**

🎯 **Enjoy context-aware AI development!**
