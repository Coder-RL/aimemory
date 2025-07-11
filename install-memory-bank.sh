#!/bin/bash

# Cross-Platform Memory Bank - Quick Installer
# Installs the extension in both Cursor and VS Code

echo "🚀 Cross-Platform Memory Bank - Quick Installer"
echo "==============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if VSIX file exists
VSIX_FILE="aimemory-2.0.0.vsix"
if [ ! -f "$VSIX_FILE" ]; then
    print_error "Extension package not found: $VSIX_FILE"
    print_info "Please ensure the VSIX file is in the current directory"
    exit 1
fi

print_success "Found extension package: $VSIX_FILE"

# Install in Cursor
echo ""
print_info "Installing in Cursor..."
if command -v cursor &> /dev/null; then
    if cursor --install-extension "$VSIX_FILE"; then
        print_success "Installed in Cursor successfully"
        CURSOR_INSTALLED=true
    else
        print_error "Failed to install in Cursor"
        CURSOR_INSTALLED=false
    fi
else
    print_warning "Cursor not found - skipping Cursor installation"
    print_info "Install Cursor from: https://cursor.sh"
    CURSOR_INSTALLED=false
fi

# Install in VS Code
echo ""
print_info "Installing in VS Code..."
if command -v code &> /dev/null; then
    if code --install-extension "$VSIX_FILE"; then
        print_success "Installed in VS Code successfully"
        VSCODE_INSTALLED=true
    else
        print_error "Failed to install in VS Code"
        VSCODE_INSTALLED=false
    fi
else
    print_warning "VS Code not found - skipping VS Code installation"
    print_info "Install VS Code from: https://code.visualstudio.com"
    VSCODE_INSTALLED=false
fi

# Summary
echo ""
echo "📊 Installation Summary:"
echo "======================="
if [ "$CURSOR_INSTALLED" = true ]; then
    print_success "Cursor: Extension installed"
else
    print_warning "Cursor: Not installed"
fi

if [ "$VSCODE_INSTALLED" = true ]; then
    print_success "VS Code: Extension installed"
else
    print_warning "VS Code: Not installed"
fi

# Next steps
echo ""
echo "🎯 Next Steps:"
echo "============="

if [ "$CURSOR_INSTALLED" = true ] || [ "$VSCODE_INSTALLED" = true ]; then
    print_info "1. Open your project in Cursor or VS Code"
    print_info "2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)"
    print_info "3. Type: 'Memory Bank: Open Dashboard'"
    print_info "4. Run './setup-memory-bank.sh' in your project for auto-integration"
    
    echo ""
    print_success "Installation complete! 🎉"
    echo ""
    print_info "For automatic AI integration, read:"
    print_info "- AUTOMATIC_INTEGRATION_GUIDE.md"
    print_info "- MANUAL_INSTALLATION_GUIDE.md"
else
    print_error "No editors found. Please install Cursor or VS Code first."
fi

echo ""
print_info "Need help? Check the documentation files:"
echo "  - MANUAL_INSTALLATION_GUIDE.md"
echo "  - AUTOMATIC_INTEGRATION_GUIDE.md"
echo "  - USAGE_GUIDE.md"
