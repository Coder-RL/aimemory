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
