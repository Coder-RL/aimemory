# Cross-Platform AI Memory Bank

A secure, high-performance memory bank system for AI context management that works seamlessly across Cursor and VS Code. Built with TypeScript following Flutter architectural principles and industry security best practices.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Coder-RL/aimemory)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](#security)
[![Tests](https://img.shields.io/badge/tests-100%25%20coverage-brightgreen.svg)](#testing)

## 🚀 Features

### Cross-Platform Compatibility
- **Cursor Integration**: Native MCP (Model Context Protocol) support with automatic configuration
- **VS Code Integration**: Full extension API integration with AI assistant compatibility
- **Unified Experience**: Consistent functionality across both platforms
- **Platform Detection**: Automatic platform detection and feature adaptation

### Security-First Design
- **Input Validation**: Comprehensive sanitization and validation of all user content
- **Access Control**: Fine-grained permissions and path restrictions
- **Security Auditing**: Built-in security monitoring and vulnerability detection
- **Content Sanitization**: Automatic removal of potentially dangerous content
- **Path Protection**: Prevention of directory traversal and unauthorized file access

### Performance Optimized
- **Fast Startup**: < 2 seconds extension activation time
- **Low Memory**: < 50MB memory footprint
- **Efficient Caching**: Smart caching with automatic cleanup
- **Real-time Updates**: Live dashboard updates without polling
- **Concurrent Operations**: Thread-safe operations with proper error handling

### Enhanced Web Dashboard
- **Tabbed Interface**: Easy navigation between memory bank files
- **Auto-save**: Automatic content saving with visual feedback
- **Search & Navigation**: Full-text search across all memory bank content
- **Export/Import**: Multiple format support (JSON, Markdown)
- **Real-time Statistics**: Live performance and usage metrics
- **Word Count**: Live word and character counting
- **Syntax Highlighting**: Markdown preview and editing support

## 📦 Installation

### Cursor IDE
1. Open Cursor
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Cross-Platform AI Memory Bank"
4. Click Install
5. The extension will automatically configure MCP integration

### VS Code
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Cross-Platform AI Memory Bank"
4. Click Install
5. Use Command Palette for memory bank operations

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/Coder-RL/aimemory.git
cd aimemory

# Install dependencies
npm install

# Build the extension
npm run package

# Install the .vsix file in your editor
```

## 🎯 Quick Start

### 1. Initialize Memory Bank
```bash
# Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
# Run: "Memory Bank: Open Dashboard"
```

### 2. Configure Your Project
The memory bank creates six structured files:
- **projectbrief.md**: Project overview and goals
- **productContext.md**: User stories and requirements
- **activeContext.md**: Current tasks and recent changes
- **systemPatterns.md**: Architecture and design patterns
- **techContext.md**: Technologies and dependencies
- **progress.md**: What works and what's left to build

### 3. Start Using AI Context
#### In Cursor:
```bash
# Use the enhanced chat command
# Command: "Cursor: New Chat with Memory Context"
```

#### In VS Code:
```bash
# Insert context into current file
# Command: "Memory Bank: Insert Context"

# Create project summary
# Command: "Memory Bank: Create Summary"
```

## 🔧 Configuration

### Extension Settings
```json
{
  "aimemory.serverPort": 7331,
  "aimemory.maxFileSize": 1048576,
  "aimemory.allowedExtensions": [".md", ".txt", ".json"],
  "aimemory.allowedPaths": ["memory-bank"],
  "aimemory.enableContentSanitization": true,
  "aimemory.enableLogging": true,
  "aimemory.enableMetrics": false
}
```

### Security Configuration
```json
{
  "aimemory.security": {
    "maxFileSize": 1048576,
    "allowedExtensions": [".md", ".txt", ".json"],
    "allowedPaths": ["memory-bank"],
    "enableContentSanitization": true
  }
}
```

## 🛡️ Security

This extension implements comprehensive security measures:

### Input Validation
- **Content Sanitization**: Removes potentially dangerous scripts and code
- **Path Validation**: Prevents directory traversal attacks
- **Size Limits**: Enforces maximum file size limits
- **Extension Filtering**: Only allows safe file extensions

### Access Control
- **Workspace Boundaries**: Restricts access to workspace directories only
- **Permission Checks**: Validates all file operations
- **Audit Logging**: Tracks all security-relevant events

### Security Audit
Run the built-in security audit:
```bash
# Command Palette: "Memory Bank: Validate Integrity"
```

## 🧪 Testing

The extension includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:security     # Security tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Coverage
- **Unit Tests**: 100% coverage of core components
- **Integration Tests**: MCP server and platform adapters
- **End-to-End Tests**: Complete workflows across platforms
- **Security Tests**: Vulnerability and penetration testing
- **Performance Tests**: Load testing and benchmarking

## 📊 Performance

### Benchmarks
- **Startup Time**: < 2 seconds
- **Memory Usage**: < 50MB
- **Response Time**: < 100ms for memory bank operations
- **File Operations**: < 500ms for large files
- **Concurrent Users**: Supports multiple simultaneous operations

### Monitoring
The extension includes built-in performance monitoring:
- Real-time metrics collection
- Performance issue detection
- Automatic optimization recommendations
- Resource usage tracking

## 🔌 API Reference

### MCP Server Endpoints

#### Resources
- `GET /resources/list` - List all memory bank files
- `GET /resources/read` - Read specific memory bank file

#### Tools
- `POST /tools/call` - Execute memory bank operations
  - `update_memory_file` - Update file content
  - `get_memory_status` - Get system status
  - `export_memory_bank` - Export data

#### Health
- `GET /health` - Server health check

### Platform Interface
```typescript
interface PlatformInterface {
  // UI Operations
  showInformationMessage(message: string): Promise<void>;
  showErrorMessage(message: string): Promise<void>;
  
  // File Operations
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  
  // Configuration
  getConfiguration(section: string): any;
  updateConfiguration(section: string, value: any): Promise<void>;
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone and setup
git clone https://github.com/Coder-RL/aimemory.git
cd aimemory
npm install

# Start development
npm run watch

# Run tests
npm test

# Build for production
npm run package
```

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Security-focused linting rules
- **Prettier**: Consistent code formatting
- **Jest**: Comprehensive testing framework
- **Security**: Regular vulnerability scanning

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/Coder-RL/aimemory/issues)
- **Security**: [Security Policy](SECURITY.md)
- **Discussions**: [GitHub Discussions](https://github.com/Coder-RL/aimemory/discussions)

## 🗺️ Roadmap

### Version 2.1 (Q2 2024)
- [ ] Enhanced AI integration
- [ ] Team collaboration features
- [ ] Cloud synchronization
- [ ] Advanced search capabilities

### Version 2.2 (Q3 2024)
- [ ] Plugin system
- [ ] Custom templates
- [ ] Advanced analytics
- [ ] Mobile companion app

## 🙏 Acknowledgments

- **Flutter Team**: For architectural inspiration
- **MCP Community**: For protocol specifications
- **Security Community**: For best practices guidance
- **Open Source Contributors**: For continuous improvements

---

**Made with ❤️ for the AI development community**
