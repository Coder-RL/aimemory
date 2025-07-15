# Memory Bank Usage Guide

## 🎯 What You Have

A complete memory bank system that works with **any editor** and **any AI assistant** - no extensions required!

## 📁 Files Created

### Memory Bank Files:
- `memory-bank/projectbrief.md` - Project overview and goals
- `memory-bank/activeContext.md` - Current work and context
- `memory-bank/progress.md` - Progress tracking
- `memory-bank/techContext.md` - Technology stack
- `memory-bank/systemPatterns.md` - Architecture patterns
- `memory-bank/productContext.md` - User requirements

### Helper Scripts:
- `get-context.sh` - Get full context for any AI
- `update-memory.sh` - Quick memory updates
- `cursor-update.sh` - Cursor-specific updates
- `read-memory.sh` - Read memory for Cursor

### Integration Files:
- `.cursorrules` - Cursor auto-reads memory bank
- VS Code snippets - Type shortcuts for context

## 🚀 How to Use

### With Cursor (Automatic):
1. Open Cursor in your project
2. Ask: "What should I work on next?"
3. Cursor automatically reads your memory bank!

### With VS Code + Augment Code:
1. Type `memorycontext` and press Tab
2. Fill in the context template
3. Ask Augment Code your question

### With Any AI (Manual):
1. Run: `./get-context.sh`
2. Copy the output
3. Paste before your AI question

## 🔄 Updating Memory Bank

### Quick Update:
```bash
./update-memory.sh
```

### Manual Edit:
Edit files in `memory-bank/` directory directly

### Cursor Update:
```bash
./cursor-update.sh
```

## 💡 Tips

1. **Keep it current**: Update memory bank after major changes
2. **Be specific**: Add detailed context for better AI responses
3. **Use templates**: VS Code snippets make it easy
4. **Share with team**: Commit memory bank files to git

## 🎯 Success Indicators

- ✅ Cursor gives context-aware responses automatically
- ✅ VS Code snippets inject project context easily
- ✅ AI assistants understand your project without explanation
- ✅ Context persists across sessions and team members

## 🆘 Troubleshooting

**Cursor not reading context?**
- Check `.cursorrules` file exists
- Try asking: "Read my memory bank and help me with [task]"

**VS Code snippets not working?**
- Restart VS Code
- Type snippet prefix and press Tab

**Need fresh context?**
- Run `./get-context.sh` and copy output
