/**
 * Test setup and configuration
 * Sets up global test environment and mocks
 */

import * as path from 'path';
import * as fs from 'fs/promises';

// Mock VS Code API
const mockVSCode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    createWebviewPanel: jest.fn(),
    activeTextEditor: null
  },
  workspace: {
    workspaceFolders: [
      {
        uri: { fsPath: '/test/workspace' },
        name: 'test-workspace',
        index: 0
      }
    ],
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue?: any) => defaultValue),
      update: jest.fn()
    })),
    fs: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      stat: jest.fn(),
      createDirectory: jest.fn(),
      delete: jest.fn()
    },
    onDidChangeWorkspaceFolders: jest.fn(),
    onDidChangeConfiguration: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
    registerTextEditorCommand: jest.fn(() => ({ dispose: jest.fn() })),
    executeCommand: jest.fn()
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
    parse: jest.fn((uri: string) => ({ fsPath: uri, scheme: 'file' }))
  },
  FileType: {
    File: 1,
    Directory: 2
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3
  }
};

// Mock Node.js modules
jest.mock('vscode', () => mockVSCode, { virtual: true });

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
  access: jest.fn()
}));

// Mock HTTP module
jest.mock('http', () => ({
  createServer: jest.fn(),
  get: jest.fn()
}));

// Global test utilities
global.testUtils = {
  createMockPlatform: () => ({
    config: {
      name: 'test',
      version: '1.0.0',
      capabilities: {
        mcpIntegration: true,
        aiChatProvider: true,
        customCommands: true
      }
    },
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    getWorkspaceRoot: jest.fn(() => '/test/workspace'),
    getWorkspaceFolders: jest.fn(() => []),
    onDidChangeWorkspaceFolders: jest.fn(() => ({ dispose: jest.fn() })),
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
    executeCommand: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    fileExists: jest.fn(),
    createDirectory: jest.fn(),
    deleteFile: jest.fn(),
    getFileStats: jest.fn(),
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue?: any) => defaultValue)
    })),
    updateConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
    createWebviewPanel: jest.fn(),
    setupPlatformIntegration: jest.fn(),
    teardownPlatformIntegration: jest.fn(),
    getExtensionPath: jest.fn(() => '/test/extension'),
    getGlobalStoragePath: jest.fn(() => '/test/global-storage'),
    getWorkspaceStoragePath: jest.fn(() => '/test/workspace-storage'),
    onEvent: jest.fn(() => ({ dispose: jest.fn() })),
    emitEvent: jest.fn(),
    onActivate: jest.fn(),
    onDeactivate: jest.fn(),
    log: jest.fn(),
    dispose: jest.fn()
  }),

  createMockMemoryBankFile: (type: string, content: string = 'test content') => ({
    type,
    content,
    lastUpdated: new Date(),
    metadata: {
      createdAt: new Date(),
      modifiedAt: new Date(),
      size: content.length,
      checksum: 'test-checksum',
      version: 1
    }
  }),

  createMockSecurityConfig: () => ({
    maxFileSize: 1024 * 1024,
    allowedExtensions: ['.md', '.txt', '.json'],
    allowedPaths: ['memory-bank'],
    enableContentSanitization: true
  }),

  createMockMCPOptions: () => ({
    port: 7331,
    security: global.testUtils.createMockSecurityConfig(),
    platform: {
      name: 'test' as const,
      version: '1.0.0',
      capabilities: {
        mcpIntegration: true,
        aiChatProvider: true,
        customCommands: true
      }
    },
    enableLogging: true,
    enableMetrics: false
  }),

  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  createTempDir: async () => {
    const tempDir = path.join(__dirname, 'temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },

  cleanupTempDir: async (dir: string) => {
    try {
      await fs.rmdir(dir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  }
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset VS Code mocks
  mockVSCode.workspace.getConfiguration.mockReturnValue({
    get: jest.fn((key: string, defaultValue?: any) => defaultValue),
    update: jest.fn()
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMemoryBankFile(): R;
      toHaveSecurityViolation(): R;
      toBePerformant(threshold: number): R;
    }
  }
  
  var testUtils: {
    createMockPlatform: () => any;
    createMockMemoryBankFile: (type: string, content?: string) => any;
    createMockSecurityConfig: () => any;
    createMockMCPOptions: () => any;
    delay: (ms: number) => Promise<void>;
    createTempDir: () => Promise<string>;
    cleanupTempDir: (dir: string) => Promise<void>;
  };
}

// Custom Jest matchers
expect.extend({
  toBeValidMemoryBankFile(received) {
    const pass = received && 
                 typeof received.type === 'string' &&
                 typeof received.content === 'string' &&
                 received.lastUpdated instanceof Date;
    
    return {
      message: () => `expected ${received} to be a valid memory bank file`,
      pass
    };
  },

  toHaveSecurityViolation(received) {
    const pass = received && 
                 received.errors && 
                 received.errors.length > 0;
    
    return {
      message: () => `expected ${received} to have security violations`,
      pass
    };
  },

  toBePerformant(received, threshold) {
    const pass = received < threshold;
    
    return {
      message: () => `expected ${received}ms to be less than ${threshold}ms`,
      pass
    };
  }
});

export {};
