#!/bin/bash

# Setup Cursor Memory Bank Integration
echo "🎯 Setting up Cursor Memory Bank Integration..."

# Create enhanced .cursorrules
cat > ".cursorrules" << 'EOF'
# MEMORY BANK INTEGRATION RULES

## Context Reading Protocol
Before responding to any request, ALWAYS read and consider the memory bank files:

### Memory Bank Files (read in this order):
1. `memory-bank/projectbrief.md` - Project overview and goals
2. `memory-bank/activeContext.md` - Current work and immediate context  
3. `memory-bank/progress.md` - What's completed and what's next
4. `memory-bank/techContext.md` - Technology stack and setup
5. `memory-bank/systemPatterns.md` - Architecture and patterns
6. `memory-bank/productContext.md` - User requirements and features

### Response Protocol:
1. Start responses with: "Based on your memory bank context..."
2. Reference specific information from the memory bank files
3. Ensure suggestions align with existing patterns and tech stack
4. Consider current progress and active work

### Memory Bank Updates:
When work is completed or context changes:
1. Update `activeContext.md` with current work
2. Update `progress.md` with completed items
3. Add new patterns to `systemPatterns.md`
4. Update `techContext.md` if dependencies change

### Context Injection Commands:
- "Read my memory bank and help me with [task]"
- "Update my memory bank with [changes]"
- "What's my current project status?"
- "Based on my memory bank, what should I work on next?"

## Memory Bank File Purposes:
- **projectbrief.md**: High-level vision, goals, and scope
- **activeContext.md**: Current tasks, recent changes, immediate focus
- **progress.md**: Completed work, current status, next steps
- **techContext.md**: Technology stack, dependencies, setup instructions
- **systemPatterns.md**: Architecture, design patterns, best practices
- **productContext.md**: User stories, requirements, feature specifications

## Workflow Integration:
1. Always read memory bank before starting any task
2. Provide context-aware responses based on project state
3. Suggest updates to memory bank when appropriate
4. Maintain consistency with established patterns and decisions
EOF

# Create memory bank reader script
cat > "read-memory.sh" << 'EOF'
#!/bin/bash

# Memory Bank Reader for Cursor
echo "# MEMORY BANK CONTEXT FOR CURSOR"
echo "# Project: $(basename "$PWD")"
echo "# Generated: $(date)"
echo ""

if [ ! -d "memory-bank" ]; then
    echo "❌ No memory bank found. Run ./simple-memory-bank.sh first"
    exit 1
fi

echo "## PROJECT OVERVIEW"
if [ -f "memory-bank/projectbrief.md" ]; then
    head -15 "memory-bank/projectbrief.md" | tail -n +2
else
    echo "No project brief found"
fi

echo ""
echo "## CURRENT CONTEXT"
if [ -f "memory-bank/activeContext.md" ]; then
    head -15 "memory-bank/activeContext.md" | tail -n +2
else
    echo "No active context found"
fi

echo ""
echo "## RECENT PROGRESS"
if [ -f "memory-bank/progress.md" ]; then
    head -15 "memory-bank/progress.md" | tail -n +2
else
    echo "No progress found"
fi

echo ""
echo "## TECH STACK"
if [ -f "memory-bank/techContext.md" ]; then
    head -15 "memory-bank/techContext.md" | tail -n +2
else
    echo "No tech context found"
fi

echo ""
echo "---"
echo "💡 Cursor will automatically read these files due to .cursorrules"
echo "💡 You can also copy this context manually if needed"
EOF

chmod +x read-memory.sh

# Create quick update script for Cursor
cat > "cursor-update.sh" << 'EOF'
#!/bin/bash

# Quick Memory Bank Update for Cursor
echo "🎯 Cursor Memory Bank Update"
echo "=========================="

if [ ! -d "memory-bank" ]; then
    echo "❌ No memory bank found. Run ./simple-memory-bank.sh first"
    exit 1
fi

echo "What did you just complete?"
read -r completed
if [ -n "$completed" ]; then
    echo "" >> memory-bank/progress.md
    echo "### $(date '+%Y-%m-%d %H:%M')" >> memory-bank/progress.md
    echo "- ✅ $completed" >> memory-bank/progress.md
fi

echo "What are you working on now?"
read -r current
if [ -n "$current" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "### Current Work ($(date '+%Y-%m-%d %H:%M'))" >> memory-bank/activeContext.md
    echo "- 🔄 $current" >> memory-bank/activeContext.md
fi

echo "Any blockers or important notes?"
read -r notes
if [ -n "$notes" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "### Notes ($(date '+%Y-%m-%d %H:%M'))" >> memory-bank/activeContext.md
    echo "- 📝 $notes" >> memory-bank/activeContext.md
fi

echo ""
echo "✅ Memory bank updated!"
echo "💡 Cursor will automatically read the updated context"
EOF

chmod +x cursor-update.sh

echo "✅ Cursor memory bank integration setup complete!"
echo ""
echo "📁 Files created:"
echo "- .cursorrules (Cursor will auto-read memory bank)"
echo "- read-memory.sh (Manual context reading)"
echo "- cursor-update.sh (Quick updates)"
echo ""
echo "🎯 How it works:"
echo "1. Cursor automatically reads memory bank due to .cursorrules"
echo "2. Just ask: 'What should I work on next?' and Cursor will know your context"
echo "3. Use ./cursor-update.sh to quickly update your progress"
