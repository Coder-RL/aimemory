#!/bin/bash

# Simple Memory Bank System - No Extension Required
# Works with any project, any editor

PROJECT_NAME=$(basename "$PWD")
MEMORY_DIR="memory-bank"

echo "🧠 Simple Memory Bank Setup for: $PROJECT_NAME"
echo "=============================================="

# Create memory bank directory
mkdir -p "$MEMORY_DIR"

# Create memory bank files with templates
cat > "$MEMORY_DIR/projectbrief.md" << EOF
# $PROJECT_NAME Project Brief

## Overview
[Describe your project's main purpose and goals]

## Key Features
- [Feature 1]
- [Feature 2] 
- [Feature 3]

## Target Users
- [User type 1]
- [User type 2]

## Success Criteria
- [Criteria 1]
- [Criteria 2]

---
*Last updated: $(date)*
EOF

cat > "$MEMORY_DIR/activeContext.md" << EOF
# $PROJECT_NAME Active Context

## Current Work
- [What you're working on right now]

## Recent Changes
- [Recent changes made]

## Next Steps
- [What to do next]

## Blockers
- [Any current blockers]

## Notes
- [Important notes to remember]

---
*Last updated: $(date)*
EOF

cat > "$MEMORY_DIR/progress.md" << EOF
# $PROJECT_NAME Progress

## Completed ✅
- [Completed item 1]
- [Completed item 2]

## In Progress 🔄
- [In progress item 1]
- [In progress item 2]

## Planned 📋
- [Planned item 1]
- [Planned item 2]

## Metrics
- Lines of code: [number]
- Features complete: [number]
- Tests passing: [number]

---
*Last updated: $(date)*
EOF

cat > "$MEMORY_DIR/techContext.md" << EOF
# $PROJECT_NAME Technical Context

## Technology Stack
- **Frontend**: [e.g., React, Vue, etc.]
- **Backend**: [e.g., Node.js, Python, etc.]
- **Database**: [e.g., PostgreSQL, MongoDB, etc.]
- **Deployment**: [e.g., AWS, Vercel, etc.]

## Dependencies
- [Key dependency 1]
- [Key dependency 2]

## Architecture
- [Architecture pattern used]
- [Key design decisions]

## Setup Instructions
1. [Step 1]
2. [Step 2]
3. [Step 3]

---
*Last updated: $(date)*
EOF

cat > "$MEMORY_DIR/systemPatterns.md" << EOF
# $PROJECT_NAME System Patterns

## Design Patterns
- [Pattern 1]: [Description]
- [Pattern 2]: [Description]

## Code Standards
- [Standard 1]
- [Standard 2]

## Best Practices
- [Practice 1]
- [Practice 2]

## Common Solutions
- [Problem]: [Solution]
- [Problem]: [Solution]

---
*Last updated: $(date)*
EOF

cat > "$MEMORY_DIR/productContext.md" << EOF
# $PROJECT_NAME Product Context

## User Stories
- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Features
- [Feature 1]: [Description]
- [Feature 2]: [Description]

## User Feedback
- [Feedback 1]
- [Feedback 2]

---
*Last updated: $(date)*
EOF

# Create helper scripts
cat > "memory-context.sh" << 'EOF'
#!/bin/bash
# Memory Bank Context Helper

echo "# PROJECT MEMORY BANK CONTEXT"
echo "# Generated: $(date)"
echo ""

for file in memory-bank/*.md; do
    if [ -f "$file" ]; then
        echo "## $(basename "$file" .md | tr '[:lower:]' '[:upper:]')"
        echo ""
        head -20 "$file" | sed 's/^/# /'
        echo ""
        echo "---"
        echo ""
    fi
done
EOF

chmod +x memory-context.sh

cat > "update-memory.sh" << 'EOF'
#!/bin/bash
# Quick Memory Bank Update

echo "🧠 Memory Bank Quick Update"
echo "=========================="

echo "What did you just complete? (Enter to skip)"
read -r completed
if [ -n "$completed" ]; then
    echo "- $completed" >> memory-bank/progress.md
    echo "✅ Added to progress"
fi

echo "What are you working on now? (Enter to skip)"
read -r current
if [ -n "$current" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "## Current Work ($(date))" >> memory-bank/activeContext.md
    echo "- $current" >> memory-bank/activeContext.md
    echo "✅ Updated active context"
fi

echo "Any important notes? (Enter to skip)"
read -r notes
if [ -n "$notes" ]; then
    echo "" >> memory-bank/activeContext.md
    echo "## Notes ($(date))" >> memory-bank/activeContext.md
    echo "- $notes" >> memory-bank/activeContext.md
    echo "✅ Added notes"
fi

echo ""
echo "🎯 Memory bank updated!"
EOF

chmod +x update-memory.sh

echo ""
echo "✅ Memory Bank Created Successfully!"
echo ""
echo "📁 Files created:"
ls -la "$MEMORY_DIR/"
echo ""
echo "🛠️ Helper scripts:"
echo "- ./memory-context.sh - Get full context for AI"
echo "- ./update-memory.sh - Quick updates"
echo ""
echo "🎯 Usage:"
echo "1. Edit files in memory-bank/ directory"
echo "2. Run ./memory-context.sh to get context for AI"
echo "3. Copy/paste context to Cursor or Augment Code"
echo "4. Use ./update-memory.sh for quick updates"
echo ""
echo "🤖 AI Integration:"
echo "Before asking AI questions, run:"
echo "  ./memory-context.sh"
echo "Then copy the output and paste it before your question."
