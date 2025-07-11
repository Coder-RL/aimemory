/**
 * Shared types for the cross-platform memory bank system
 * Following Flutter architectural principles and TypeScript best practices
 */

// Re-export existing types for backward compatibility
export * from '../types';

// Platform abstraction types
export interface Disposable {
  dispose(): void;
}

export interface WorkspaceFolder {
  uri: {
    fsPath: string;
    scheme: string;
  };
  name: string;
  index: number;
}

export interface WebviewOptions {
  enableScripts?: boolean;
  localResourceRoots?: string[];
  retainContextWhenHidden?: boolean;
}

export interface WebviewPanel {
  webview: {
    html: string;
    postMessage(message: any): Promise<boolean>;
    onDidReceiveMessage(listener: (message: any) => void): Disposable;
    asWebviewUri(uri: any): any;
  };
  reveal(column?: number): void;
  onDidDispose(listener: () => void): Disposable;
  dispose(): void;
}

// Security types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedContent?: string;
}

export interface SecurityConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  allowedPaths: string[];
  enableContentSanitization: boolean;
}

// Platform-specific configuration
export interface PlatformConfig {
  name: 'cursor' | 'vscode';
  version: string;
  capabilities: {
    mcpIntegration: boolean;
    aiChatProvider: boolean;
    customCommands: boolean;
  };
}

// Enhanced MCP server options
export interface MCPServerOptions {
  port: number;
  security: SecurityConfig;
  platform: PlatformConfig;
  enableLogging: boolean;
  enableMetrics: boolean;
}

// Event system types
export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

// Memory bank events
export type MemoryBankEvent = 
  | 'fileUpdated'
  | 'fileCreated'
  | 'fileDeleted'
  | 'serverStarted'
  | 'serverStopped'
  | 'configurationChanged';

export interface MemoryBankEventData {
  type: MemoryBankEvent;
  timestamp: Date;
  data?: any;
}

// Enhanced memory bank file with metadata
export interface MemoryBankFile {
  type: MemoryBankFileType;
  content: string;
  lastUpdated: Date;
}

export interface EnhancedMemoryBankFile extends MemoryBankFile {
  metadata: {
    createdAt: Date;
    modifiedAt: Date;
    size: number;
    checksum: string;
    version: number;
  };
}

// Template system types
export interface MemoryBankTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: Record<MemoryBankFileType, string>;
  metadata: {
    author: string;
    version: string;
    tags: string[];
  };
}

// Export/Import types
export interface ExportOptions {
  format: 'json' | 'markdown' | 'zip';
  includeMetadata: boolean;
  includeTemplates: boolean;
  compression: boolean;
}

export interface ImportOptions {
  overwriteExisting: boolean;
  validateContent: boolean;
  createBackup: boolean;
}

// Error types
export class MemoryBankError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MemoryBankError';
  }
}

export class SecurityError extends MemoryBankError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', details);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends MemoryBankError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Configuration validation schema
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: any;
    validation?: (value: any) => ValidationResult;
  };
}
