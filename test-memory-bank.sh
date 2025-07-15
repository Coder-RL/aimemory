#!/bin/bash

# Memory Bank Test Script
echo "🧪 Testing Memory Bank Extension..."
echo "=================================="

# Test 1: Check if extension is installed
echo "📋 Test 1: Checking extension installation..."

echo "VS Code extensions:"
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --list-extensions | grep aimemory
if [ $? -eq 0 ]; then
    echo "✅ VS Code: AI Memory extension found"
else
    echo "❌ VS Code: AI Memory extension NOT found"
fi

echo ""
echo "Cursor extensions:"
cursor --list-extensions | grep aimemory
if [ $? -eq 0 ]; then
    echo "✅ Cursor: AI Memory extension found"
else
    echo "❌ Cursor: AI Memory extension NOT found"
fi

# Test 2: Check memory bank files
echo ""
echo "📋 Test 2: Checking memory bank files..."
if [ -d "memory-bank" ]; then
    echo "✅ Memory bank directory exists"
    echo "Files found:"
    ls -la memory-bank/
else
    echo "❌ Memory bank directory NOT found"
fi

# Test 3: Test VS Code command
echo ""
echo "📋 Test 3: Testing VS Code commands..."
echo "Opening VS Code in current directory..."
"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" . &
sleep 3

echo ""
echo "📋 Test 4: Testing Cursor commands..."
echo "Opening Cursor in current directory..."
cursor . &
sleep 3

echo ""
echo "🎯 Manual Tests Required:"
echo "========================"
echo "1. In VS Code:"
echo "   - Press Cmd+Shift+P"
echo "   - Type 'Memory Bank: Open Dashboard'"
echo "   - Should open dashboard with 6 files"
echo ""
echo "2. In Cursor:"
echo "   - Press Cmd+Shift+P"
echo "   - Type 'Memory Bank: Open Dashboard'"
echo "   - Should open dashboard with 6 files"
echo ""
echo "3. Keyboard shortcuts (VS Code):"
echo "   - Cmd+Shift+M → Open Dashboard"
echo "   - Cmd+Shift+I → Insert Context"
echo "   - Cmd+Shift+U → Update Active Context"
echo "   - Cmd+Shift+J → Update Progress"
echo ""
echo "✅ Automated tests complete!"
echo "Please test the manual commands above."
