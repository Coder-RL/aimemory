# Installation Guide

This guide provides detailed installation instructions for the Cross-Platform AI Memory Bank extension across different platforms and environments.

## System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **Memory**: 4GB RAM
- **Storage**: 100MB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

### Recommended Requirements
- **Node.js**: 20.0.0 or higher
- **Memory**: 8GB RAM
- **Storage**: 500MB free space
- **Network**: Stable internet connection for initial setup

### Supported Editors
- **Cursor**: 0.40.0 or higher
- **VS Code**: 1.96.0 or higher

## Installation Methods

### Method 1: Extension Marketplace (Recommended)

#### For Cursor
1. **Open Cursor IDE**
2. **Access Extensions Panel**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
   - Or click the Extensions icon in the Activity Bar
3. **Search for Extension**
   - Type "Cross-Platform AI Memory Bank" in the search box
   - Look for the extension by "CoderOne"
4. **Install Extension**
   - Click the "Install" button
   - Wait for installation to complete
5. **Verify Installation**
   - The extension will automatically configure MCP integration
   - Check for "Memory Bank" commands in Command Palette (`Ctrl+Shift+P`)

#### For VS Code
1. **Open VS Code**
2. **Access Extensions Panel**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
   - Or click the Extensions icon in the Activity Bar
3. **Search for Extension**
   - Type "Cross-Platform AI Memory Bank" in the search box
   - Look for the extension by "CoderOne"
4. **Install Extension**
   - Click the "Install" button
   - Wait for installation to complete
5. **Verify Installation**
   - Check for "Memory Bank" commands in Command Palette (`Ctrl+Shift+P`)
   - Look for the Memory Bank status bar item

### Method 2: Manual Installation from VSIX

#### Download VSIX File
1. Go to [Releases](https://github.com/Coder-RL/aimemory/releases)
2. Download the latest `.vsix` file
3. Save it to a convenient location

#### Install in Cursor
1. **Open Cursor**
2. **Access Command Palette**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. **Install from VSIX**
   - Type "Extensions: Install from VSIX"
   - Select the command
   - Browse and select the downloaded `.vsix` file
4. **Restart Cursor** (if prompted)

#### Install in VS Code
1. **Open VS Code**
2. **Access Command Palette**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
3. **Install from VSIX**
   - Type "Extensions: Install from VSIX"
   - Select the command
   - Browse and select the downloaded `.vsix` file
4. **Restart VS Code** (if prompted)

### Method 3: Development Installation

#### Prerequisites
```bash
# Install Node.js (if not already installed)
# Download from https://nodejs.org/

# Verify installation
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

#### Clone and Build
```bash
# Clone the repository
git clone https://github.com/Coder-RL/aimemory.git
cd aimemory

# Install dependencies
npm install

# Build the extension
npm run package

# The built extension will be in the root directory as aimemory-2.0.0.vsix
```

#### Install Built Extension
Follow the "Manual Installation from VSIX" steps above using the built `.vsix` file.

## Post-Installation Setup

### Initial Configuration

#### 1. Verify Installation
```bash
# Open Command Palette in your editor
# Type: "Memory Bank: Get Server Status"
# You should see server status information
```

#### 2. Initialize Memory Bank
```bash
# Open Command Palette
# Type: "Memory Bank: Open Dashboard"
# This will create the memory bank structure in your workspace
```

#### 3. Configure Settings (Optional)
```json
// In your settings.json
{
  "aimemory.serverPort": 7331,
  "aimemory.maxFileSize": 1048576,
  "aimemory.enableLogging": true,
  "aimemory.enableContentSanitization": true
}
```

### Platform-Specific Setup

#### Cursor-Specific Setup
1. **MCP Configuration**
   - The extension automatically configures `~/.cursor/mcp.json`
   - No manual configuration required
2. **Verify MCP Integration**
   - Open a new chat in Cursor
   - The memory bank should be available as a context source
3. **Test Integration**
   - Use "Cursor: New Chat with Memory Context" command
   - Verify that memory bank context is included

#### VS Code-Specific Setup
1. **AI Extension Integration**
   - Install compatible AI extensions (GitHub Copilot, etc.)
   - The memory bank will integrate automatically
2. **Status Bar**
   - Look for the "Memory Bank" item in the status bar
   - Click it to open the dashboard
3. **Test Integration**
   - Use "Memory Bank: Insert Context" command
   - Verify that context is inserted into the current file

## Workspace Setup

### Creating a New Project
1. **Open Workspace**
   - Open your project folder in Cursor/VS Code
2. **Initialize Memory Bank**
   - Run "Memory Bank: Open Dashboard"
   - The extension will create a `memory-bank` folder
3. **Configure Files**
   - Edit the generated memory bank files
   - Add your project-specific information

### Existing Project Integration
1. **Open Existing Project**
2. **Run Memory Bank Setup**
   - The extension will detect existing memory bank files
   - Or create new ones if none exist
3. **Import Existing Data** (if applicable)
   - Use "Memory Bank: Import Data" if you have existing memory bank exports

## Verification and Testing

### Basic Functionality Test
```bash
# 1. Open Command Palette
# 2. Run: "Memory Bank: Get Server Status"
# Expected: Server status with "Running: true"

# 3. Run: "Memory Bank: Open Dashboard"
# Expected: Web dashboard opens with memory bank files

# 4. Edit a file in the dashboard
# Expected: Auto-save indicator shows "Saved"

# 5. Run: "Memory Bank: Validate Integrity"
# Expected: "Memory bank integrity validation passed"
```

### Security Test
```bash
# 1. Open dashboard
# 2. Try to enter malicious content: <script>alert('test')</script>
# Expected: Content should be sanitized or rejected

# 3. Run: "Memory Bank: Validate Integrity"
# Expected: No security violations reported
```

### Performance Test
```bash
# 1. Open dashboard
# 2. Create large content (several KB)
# Expected: Operations complete within 500ms

# 3. Check memory usage in Task Manager/Activity Monitor
# Expected: Extension uses < 50MB RAM
```

## Troubleshooting

### Common Issues

#### Extension Not Loading
**Symptoms**: Extension commands not available
**Solutions**:
1. Restart your editor
2. Check if extension is enabled in Extensions panel
3. Verify system requirements are met
4. Check console for error messages

#### MCP Server Not Starting
**Symptoms**: "Server not running" status
**Solutions**:
1. Check if port 7331 is available
2. Try different port in settings
3. Check firewall settings
4. Restart extension: "Developer: Reload Window"

#### Memory Bank Files Not Created
**Symptoms**: Dashboard shows "not initialized"
**Solutions**:
1. Ensure workspace folder is open
2. Check write permissions in workspace
3. Verify workspace is not read-only
4. Try manual initialization: "Memory Bank: Open Dashboard"

#### Performance Issues
**Symptoms**: Slow response times
**Solutions**:
1. Check available system memory
2. Close unnecessary applications
3. Reduce file sizes in memory bank
4. Enable performance monitoring in settings

### Getting Help

#### Log Collection
```bash
# Enable detailed logging
# Settings: "aimemory.enableLogging": true

# Check logs in:
# - VS Code: Help > Toggle Developer Tools > Console
# - Cursor: View > Toggle Developer Tools > Console
```

#### Support Channels
- **GitHub Issues**: [Report bugs](https://github.com/Coder-RL/aimemory/issues)
- **Discussions**: [Ask questions](https://github.com/Coder-RL/aimemory/discussions)
- **Documentation**: [Full docs](https://github.com/Coder-RL/aimemory/docs)

## Uninstallation

### Remove Extension
1. **Open Extensions Panel**
2. **Find Extension**
   - Search for "Cross-Platform AI Memory Bank"
3. **Uninstall**
   - Click the gear icon next to the extension
   - Select "Uninstall"
4. **Restart Editor** (if prompted)

### Clean Up Files
```bash
# Remove memory bank files (optional)
rm -rf ./memory-bank

# Remove Cursor MCP configuration (optional)
# Edit ~/.cursor/mcp.json and remove the memory bank entry
```

### Reset Configuration
```bash
# Remove extension settings
# In settings.json, remove all "aimemory.*" entries
```

## Next Steps

After successful installation:
1. **Read the [User Guide](USER_GUIDE.md)**
2. **Explore [Configuration Options](CONFIGURATION.md)**
3. **Check out [Best Practices](BEST_PRACTICES.md)**
4. **Join the [Community](https://github.com/Coder-RL/aimemory/discussions)**
