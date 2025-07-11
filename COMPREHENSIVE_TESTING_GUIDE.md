# Comprehensive Testing Guide for Cross-Platform Memory Bank

This guide provides detailed testing recommendations aligned with the objectives outlined in the Planning document. It covers all aspects of testing the cross-platform memory bank system.

## 🎯 Testing Objectives (Aligned with Planning Document)

Based on the Planning document objectives, our testing must verify:

### Functional Requirements
- ✅ **Cross-Platform Compatibility**: Works seamlessly on both Cursor and VS Code
- ✅ **Zero Dependencies**: No external dependencies or API keys required
- ✅ **Session Persistence**: Maintains context across sessions
- ✅ **Web Dashboard**: Provides intuitive web interface
- ✅ **Memory Bank Management**: Supports all file operations

### Non-Functional Requirements
- ✅ **Performance**: Fast startup time (< 2 seconds), low memory usage (< 50MB)
- ✅ **Reliability**: Reliable file operations and error handling
- ✅ **Security**: Secure input validation and access control
- ✅ **Quality**: Comprehensive test coverage (> 80%), TypeScript compliance

## 🧪 Testing Strategy

### 1. Unit Testing (Target: 100% Coverage)

#### 1.1 Core Components Testing
```bash
# Test memory bank service
npm run test:unit -- tests/unit/shared/memory-bank-service.test.ts

# Test security components
npm run test:unit -- tests/unit/security/

# Test platform adapters
npm run test:unit -- tests/unit/cursor/
npm run test:unit -- tests/unit/vscode/
```

**Key Test Areas:**
- **Memory Bank Service**: File CRUD operations, validation, integrity checks
- **Security Framework**: Input validation, access control, audit logging
- **Platform Adapters**: VS Code/Cursor API integration, command registration
- **MCP Server**: Resource exposure, tool definitions, request handling

#### 1.2 Security Testing
```bash
# Run security-specific tests
npm run test:security

# Test input validation
npm run test:unit -- tests/unit/security/input-validator.test.ts
```

**Security Test Cases:**
- XSS prevention in content validation
- Directory traversal protection
- Malicious file path rejection
- Content sanitization effectiveness
- Access control enforcement

### 2. Integration Testing

#### 2.1 MCP Server Integration
```bash
# Test MCP server functionality
npm run test:integration -- tests/integration/mcp-server.test.ts
```

**Integration Test Areas:**
- HTTP server startup and shutdown
- SSE connection establishment
- MCP message handling
- Resource and tool exposure
- Error handling and recovery

#### 2.2 Platform Integration
```bash
# Test platform-specific integrations
npm run test:integration -- tests/integration/platform-*.test.ts
```

**Platform Integration Tests:**
- Extension activation/deactivation
- Command registration and execution
- Configuration management
- UI integration (webview, status bar)

### 3. End-to-End Testing

#### 3.1 Cross-Platform Workflow Testing
```bash
# Run complete E2E tests
npm run test:e2e -- tests/e2e/cross-platform.test.ts
```

**E2E Test Scenarios:**
- Complete memory bank lifecycle (create → update → export → import)
- Cross-platform data consistency
- Concurrent operations handling
- Error recovery scenarios
- Performance under load

#### 3.2 User Journey Testing
**Cursor User Journey:**
1. Install extension → Auto MCP configuration
2. Open dashboard → View memory bank files
3. Update project brief → Auto-save verification
4. Use AI chat → Context inclusion verification
5. Export data → Import verification

**VS Code User Journey:**
1. Install extension → Extension activation
2. Open dashboard → File management
3. Insert context → AI integration
4. Command palette usage → Feature access
5. Status bar interaction → Quick access

## 🔍 Specific Test Cases

### 1. Security Validation Tests

#### Test Case: XSS Prevention
```typescript
describe('XSS Prevention', () => {
  it('should reject script tags in content', async () => {
    const maliciousContent = '<script>alert("xss")</script>';
    await expect(
      memoryBankService.updateFile('projectbrief.md', maliciousContent)
    ).rejects.toThrow('Content validation failed');
  });
});
```

#### Test Case: Directory Traversal Protection
```typescript
describe('Path Security', () => {
  it('should prevent directory traversal', async () => {
    const maliciousPath = '../../../etc/passwd';
    const validation = InputValidator.validateFilePath(maliciousPath, '/workspace');
    expect(validation.isValid).toBe(false);
  });
});
```

### 2. Performance Tests

#### Test Case: Startup Performance
```typescript
describe('Performance', () => {
  it('should start within 2 seconds', async () => {
    const startTime = Date.now();
    await mcpServer.start();
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000);
  });
});
```

#### Test Case: Memory Usage
```typescript
describe('Memory Usage', () => {
  it('should use less than 50MB', async () => {
    const memUsage = process.memoryUsage();
    expect(memUsage.heapUsed).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 3. Cross-Platform Compatibility Tests

#### Test Case: Platform Detection
```typescript
describe('Platform Detection', () => {
  it('should detect Cursor correctly', () => {
    process.env.CURSOR_USER_DATA_DIR = '/test/cursor';
    expect(PlatformDetector.detectPlatform()).toBe('cursor');
  });
  
  it('should detect VS Code correctly', () => {
    process.env.VSCODE_PID = '12345';
    expect(PlatformDetector.detectPlatform()).toBe('vscode');
  });
});
```

#### Test Case: Data Consistency
```typescript
describe('Data Consistency', () => {
  it('should maintain same data across platforms', async () => {
    const cursorData = await cursorMemoryBank.exportData();
    const vscodeData = await vscodeMemoryBank.exportData();
    expect(cursorData.files).toEqual(vscodeData.files);
  });
});
```

## 🚀 Test Execution Plan

### Phase 1: Core Functionality (Week 1)
```bash
# Day 1-2: Unit tests for core components
npm run test:unit

# Day 3-4: Security testing
npm run test:security

# Day 5: Integration testing
npm run test:integration
```

### Phase 2: Platform Testing (Week 2)
```bash
# Day 1-2: Cursor platform testing
npm run test:platform:cursor

# Day 3-4: VS Code platform testing
npm run test:platform:vscode

# Day 5: Cross-platform compatibility
npm run test:e2e
```

### Phase 3: Performance & Load Testing (Week 3)
```bash
# Day 1-2: Performance benchmarking
npm run test:performance

# Day 3-4: Load testing
npm run test:load

# Day 5: Stress testing
npm run test:stress
```

## 📊 Test Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 95% line coverage, 90% branch coverage
- **Integration Tests**: 85% feature coverage
- **E2E Tests**: 100% user journey coverage
- **Security Tests**: 100% attack vector coverage

### Coverage Verification
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:coverage:check
```

## 🔧 Test Environment Setup

### Prerequisites
```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest supertest

# Setup test environment
npm run test:setup
```

### Mock Configuration
```typescript
// tests/setup.ts
global.testUtils = {
  createMockPlatform: () => ({ /* mock implementation */ }),
  createMockMemoryBank: () => ({ /* mock implementation */ }),
  createMockSecurityConfig: () => ({ /* mock implementation */ })
};
```

## 🐛 Bug Testing Scenarios

### Critical Bug Scenarios
1. **Data Loss**: File corruption during concurrent writes
2. **Security Breach**: Unauthorized file access
3. **Performance Degradation**: Memory leaks over time
4. **Platform Incompatibility**: Extension fails to load

### Edge Cases
1. **Large Files**: Files exceeding size limits
2. **Special Characters**: Unicode and special character handling
3. **Network Issues**: Server connectivity problems
4. **Disk Space**: Low disk space scenarios

## 📈 Performance Benchmarks

### Startup Performance
- **Target**: < 2 seconds from activation to ready
- **Measurement**: Extension activation time
- **Test**: Automated startup timing tests

### Memory Usage
- **Target**: < 50MB total memory usage
- **Measurement**: Process memory monitoring
- **Test**: Memory usage tracking over time

### Response Time
- **Target**: < 100ms for memory bank operations
- **Measurement**: API response times
- **Test**: Load testing with concurrent requests

## 🔒 Security Testing Checklist

### Input Validation
- [ ] XSS prevention in all user inputs
- [ ] SQL injection prevention (if applicable)
- [ ] Path traversal protection
- [ ] File type validation
- [ ] Content size limits

### Access Control
- [ ] Workspace boundary enforcement
- [ ] File permission validation
- [ ] Command authorization
- [ ] Configuration access control

### Data Protection
- [ ] Content sanitization
- [ ] Secure file operations
- [ ] Error message sanitization
- [ ] Audit logging

## 📋 Test Reporting

### Test Results Format
```json
{
  "summary": {
    "total": 150,
    "passed": 148,
    "failed": 2,
    "coverage": "96.5%"
  },
  "categories": {
    "unit": { "passed": 95, "failed": 0 },
    "integration": { "passed": 28, "failed": 1 },
    "e2e": { "passed": 25, "failed": 1 }
  }
}
```

### Continuous Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

This comprehensive testing guide ensures that all aspects of the cross-platform memory bank system are thoroughly validated against the objectives outlined in the Planning document.
