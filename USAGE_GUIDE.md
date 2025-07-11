# Cross-Platform Memory Bank Usage Guide

This guide explains how to use the memory bank system in both Cursor and VS Code, including how to get AI agents to automatically work with and update the memory bank files.

## 🎯 Overview

The Cross-Platform Memory Bank creates six structured files that maintain context across AI sessions:

1. **projectbrief.md** - Project overview and goals
2. **productContext.md** - User stories and requirements  
3. **activeContext.md** - Current tasks and recent changes
4. **systemPatterns.md** - Architecture and design patterns
5. **techContext.md** - Technologies and dependencies
6. **progress.md** - What works and what's left to build

## 🔧 Installation & Setup

### Cursor Installation
1. Open Cursor
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Cross-Platform AI Memory Bank"
4. Click Install
5. **Automatic MCP Configuration**: The extension automatically configures Cursor's MCP integration

### VS Code Installation
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Cross-Platform AI Memory Bank"
4. Click Install
5. **Manual Setup**: Use Command Palette for memory bank operations

## 🚀 Getting Started

### Initialize Memory Bank
```bash
# Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
# Run: "Memory Bank: Open Dashboard"
```

This creates a `memory-bank` folder in your workspace with all six files.

## 📱 Using in Cursor

### 1. Automatic MCP Integration

Once installed, Cursor automatically has access to your memory bank through MCP:

```bash
# The extension automatically configures ~/.cursor/mcp.json
{
  "servers": {
    "memory-bank": {
      "command": "node",
      "args": ["path/to/memory-bank-server.js"],
      "env": {}
    }
  }
}
```

### 2. AI Chat Integration

#### Method 1: Enhanced Chat Command
```bash
# Use the enhanced chat command
Command Palette → "Cursor: New Chat with Memory Context"
```

This automatically includes memory bank context in your chat.

#### Method 2: Natural AI Interaction
When chatting with Cursor AI, it automatically has access to your memory bank files as resources. You can reference them naturally:

```
"Update the project brief with the new requirements we discussed"
"Add the authentication pattern to our system patterns"
"What's our current progress on the user dashboard?"
```

#### Method 3: Direct Memory Commands
```bash
# In Cursor chat, use memory commands:
/memory update projectbrief "New project goals..."
/memory get progress
/memory export json
```

### 3. Auto-Mode Integration

**To get Cursor's auto-mode agent to work with memory bank:**

1. **Enable Auto-Mode Memory Context**:
   ```bash
   # In Cursor settings, enable:
   "cursor.memory.autoContext": true
   "cursor.memory.updateOnChange": true
   ```

2. **Configure Auto-Update Rules**:
   ```bash
   # Add to your .cursorrules file:
   
   # Memory Bank Auto-Update Rules
   When making changes to the project:
   1. Always update activeContext.md with current changes
   2. Update progress.md when completing features
   3. Add new patterns to systemPatterns.md
   4. Update techContext.md when adding dependencies
   
   # Auto-mode should:
   - Read memory bank before starting work
   - Update relevant files during work
   - Summarize changes in progress.md
   ```

3. **Memory Bank Prompts**:
   ```bash
   # Add these prompts to guide auto-mode:
   
   "Before starting any task, read the memory bank files to understand:
   - Current project state (activeContext.md)
   - Project goals (projectbrief.md)
   - Existing patterns (systemPatterns.md)
   - Technical context (techContext.md)
   
   After completing work, update:
   - activeContext.md with what you changed
   - progress.md with what's now working
   - Any relevant patterns or context files"
   ```

## 💻 Using in VS Code

### 1. Command Palette Operations

```bash
# Core Commands
"Memory Bank: Open Dashboard"          # Open web interface
"Memory Bank: Insert Context"         # Insert context into current file
"Memory Bank: Update Active Context"  # Quick update current context
"Memory Bank: Get Server Status"      # Check server status
"Memory Bank: Export Data"            # Export memory bank
"Memory Bank: Import Data"            # Import memory bank
"Memory Bank: Validate Integrity"     # Security check
```

### 2. Status Bar Integration

- **Memory Bank Status**: Shows in status bar
- **Click to Open**: Quick access to dashboard
- **Server Status**: Visual indicator of server health

### 3. AI Extension Integration

#### With GitHub Copilot
```bash
# Add to your VS Code settings:
{
  "github.copilot.enable": {
    "*": true,
    "memory-bank": true
  },
  "aimemory.integration.copilot": true
}
```

#### With Other AI Extensions
The memory bank integrates with popular AI extensions:
- **GitHub Copilot**: Context injection
- **Tabnine**: Project context awareness
- **CodeGPT**: Memory bank as context source

### 4. Auto-Mode Integration for VS Code

**To get AI agents to work with memory bank:**

1. **Configure AI Extension Settings**:
   ```json
   {
     "aimemory.autoUpdate": true,
     "aimemory.contextInjection": true,
     "aimemory.updateOnSave": true
   }
   ```

2. **Use Context Injection**:
   ```bash
   # Before AI interactions, run:
   Command Palette → "Memory Bank: Insert Context"
   
   # This adds memory bank context to your current file
   ```

3. **Set Up Auto-Update Hooks**:
   ```json
   {
     "aimemory.hooks": {
       "onFileChange": "updateActiveContext",
       "onTaskComplete": "updateProgress",
       "onNewFeature": "updateSystemPatterns"
     }
   }
   ```

## 🤖 AI Agent Integration Patterns

### Pattern 1: Context-Aware Development

```bash
# Start of session prompt:
"I'm working on [project name]. Please read my memory bank files first:
- projectbrief.md for project overview
- activeContext.md for current state  
- systemPatterns.md for architecture
- techContext.md for technical details
- progress.md for what's working

Then help me with [specific task]."
```

### Pattern 2: Continuous Memory Updates

```bash
# During development:
"As we work, please update:
1. activeContext.md with current changes
2. progress.md when we complete something
3. systemPatterns.md if we create new patterns
4. techContext.md if we add new technologies"
```

### Pattern 3: Session Handoff

```bash
# End of session:
"Please update the memory bank with:
1. What we accomplished today
2. Current state of the work
3. Next steps to take
4. Any new patterns or learnings"
```

## 📊 Dashboard Usage

### Web Interface Features

1. **Tabbed Navigation**: Switch between memory bank files
2. **Live Editing**: Real-time content editing with auto-save
3. **Search**: Full-text search across all files
4. **Export/Import**: Data backup and sharing
5. **Statistics**: Usage metrics and file information

### Dashboard Shortcuts

```bash
# Keyboard shortcuts in dashboard:
Ctrl+S / Cmd+S     # Save current file
Ctrl+F / Cmd+F     # Search
Ctrl+E / Cmd+E     # Export data
Ctrl+I / Cmd+I     # Import data
Tab                # Switch between files
```

## 🔄 Workflow Examples

### Example 1: Starting New Feature

```bash
1. Open memory bank dashboard
2. Read projectbrief.md and activeContext.md
3. Update activeContext.md with new feature plan
4. Start development with AI agent
5. AI agent reads context and helps implement
6. Update progress.md when feature is complete
```

### Example 2: Bug Fix Session

```bash
1. AI agent reads activeContext.md for current issues
2. Reviews systemPatterns.md for architecture
3. Fixes bug following established patterns
4. Updates activeContext.md with fix details
5. Updates progress.md with resolved issue
```

### Example 3: Architecture Review

```bash
1. Review systemPatterns.md with AI agent
2. Discuss improvements and new patterns
3. Update systemPatterns.md with decisions
4. Update techContext.md if new technologies
5. Update projectbrief.md if scope changes
```

## 🛠️ Advanced Configuration

### Custom Memory Bank Structure

```json
{
  "aimemory.customFiles": [
    {
      "name": "apiDesign.md",
      "template": "# API Design\n\n## Endpoints\n\n## Models\n"
    },
    {
      "name": "testStrategy.md", 
      "template": "# Test Strategy\n\n## Unit Tests\n\n## Integration Tests\n"
    }
  ]
}
```

### AI Integration Rules

```json
{
  "aimemory.aiRules": {
    "beforeTask": "Read memory bank context",
    "duringTask": "Update activeContext.md",
    "afterTask": "Update progress.md",
    "onError": "Log in activeContext.md"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Memory Bank Not Loading**
   ```bash
   # Check server status
   Command Palette → "Memory Bank: Get Server Status"
   
   # Restart server
   Command Palette → "Memory Bank: Restart Server"
   ```

2. **AI Not Using Context**
   ```bash
   # Verify MCP configuration (Cursor)
   Check ~/.cursor/mcp.json
   
   # Manual context injection (VS Code)
   Command Palette → "Memory Bank: Insert Context"
   ```

3. **Files Not Updating**
   ```bash
   # Check file permissions
   # Verify workspace folder access
   # Run integrity check
   Command Palette → "Memory Bank: Validate Integrity"
   ```

## 📈 Best Practices

### 1. Regular Updates
- Update activeContext.md at start/end of sessions
- Keep progress.md current with completed work
- Review and update systemPatterns.md weekly

### 2. Clear Documentation
- Use clear, concise language in memory files
- Include specific examples and code snippets
- Keep technical context up to date

### 3. AI Collaboration
- Always start AI sessions by referencing memory bank
- Ask AI to update relevant files during work
- End sessions with memory bank updates

This usage guide ensures you get maximum value from the cross-platform memory bank system across both Cursor and VS Code environments.
