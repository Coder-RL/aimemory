/**
 * Platform abstraction interface for cross-platform memory bank system
 * Inspired by Flutter's platform channel pattern
 */

import {
  Disposable,
  WorkspaceFolder,
  WebviewOptions,
  WebviewPanel,
  PlatformConfig,
  MemoryBankEventData
} from './types';

/**
 * Core platform interface that abstracts platform-specific operations
 * This interface must be implemented by each platform adapter (Cursor, VS Code)
 */
export interface PlatformInterface {
  // Platform identification
  readonly config: PlatformConfig;
  
  // UI Operations
  showInformationMessage(message: string): Promise<void>;
  showErrorMessage(message: string): Promise<void>;
  showWarningMessage(message: string): Promise<void>;
  showInputBox(options: {
    prompt?: string;
    placeholder?: string;
    value?: string;
    password?: boolean;
  }): Promise<string | undefined>;
  
  // Workspace Operations
  getWorkspaceRoot(): string | undefined;
  getWorkspaceFolders(): WorkspaceFolder[];
  onDidChangeWorkspaceFolders(listener: (event: any) => void): Disposable;
  
  // Command Registration and Execution
  registerCommand(command: string, callback: (...args: any[]) => any): Disposable;
  executeCommand(command: string, ...args: any[]): Promise<any>;
  
  // File System Operations (abstracted)
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  getFileStats(path: string): Promise<{
    size: number;
    mtime: Date;
    isFile: boolean;
    isDirectory: boolean;
  }>;
  
  // Configuration Management
  getConfiguration(section: string): any;
  updateConfiguration(section: string, value: any, target?: 'global' | 'workspace'): Promise<void>;
  onDidChangeConfiguration(listener: (event: any) => void): Disposable;
  
  // Webview Operations
  createWebviewPanel(
    viewType: string,
    title: string,
    column: number,
    options: WebviewOptions
  ): WebviewPanel;
  
  // Event System
  onEvent(event: string, listener: (data: MemoryBankEventData) => void): Disposable;
  emitEvent(event: string, data: MemoryBankEventData): void;
  
  // Platform-Specific Integration
  setupPlatformIntegration(serverPort: number): Promise<void>;
  teardownPlatformIntegration(): Promise<void>;
  
  // Lifecycle Management
  onActivate(callback: () => void): void;
  onDeactivate(callback: () => void): void;
  
  // Extension Context
  getExtensionPath(): string;
  getGlobalStoragePath(): string;
  getWorkspaceStoragePath(): string;
  
  // Logging
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void;
}

/**
 * Base platform adapter that provides common functionality
 * Platform-specific adapters should extend this class
 */
export abstract class BasePlatformAdapter implements PlatformInterface {
  protected eventListeners: Map<string, Set<Function>> = new Map();
  protected disposables: Disposable[] = [];
  
  abstract readonly config: PlatformConfig;
  
  // Abstract methods that must be implemented by platform adapters
  abstract showInformationMessage(message: string): Promise<void>;
  abstract showErrorMessage(message: string): Promise<void>;
  abstract showWarningMessage(message: string): Promise<void>;
  abstract showInputBox(options: any): Promise<string | undefined>;
  
  abstract getWorkspaceRoot(): string | undefined;
  abstract getWorkspaceFolders(): WorkspaceFolder[];
  abstract onDidChangeWorkspaceFolders(listener: (event: any) => void): Disposable;
  
  abstract registerCommand(command: string, callback: (...args: any[]) => any): Disposable;
  abstract executeCommand(command: string, ...args: any[]): Promise<any>;
  
  abstract readFile(path: string): Promise<string>;
  abstract writeFile(path: string, content: string): Promise<void>;
  abstract fileExists(path: string): Promise<boolean>;
  abstract createDirectory(path: string): Promise<void>;
  abstract deleteFile(path: string): Promise<void>;
  abstract getFileStats(path: string): Promise<any>;
  
  abstract getConfiguration(section: string): any;
  abstract updateConfiguration(section: string, value: any, target?: 'global' | 'workspace'): Promise<void>;
  abstract onDidChangeConfiguration(listener: (event: any) => void): Disposable;
  
  abstract createWebviewPanel(
    viewType: string,
    title: string,
    column: number,
    options: WebviewOptions
  ): WebviewPanel;
  
  abstract setupPlatformIntegration(serverPort: number): Promise<void>;
  abstract teardownPlatformIntegration(): Promise<void>;
  
  abstract getExtensionPath(): string;
  abstract getGlobalStoragePath(): string;
  abstract getWorkspaceStoragePath(): string;
  
  // Common event system implementation
  onEvent(event: string, listener: (data: MemoryBankEventData) => void): Disposable {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    
    return {
      dispose: () => {
        this.eventListeners.get(event)?.delete(listener);
      }
    };
  }
  
  emitEvent(event: string, data: MemoryBankEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log('error', `Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  // Common lifecycle management
  onActivate(callback: () => void): void {
    callback();
  }
  
  onDeactivate(callback: () => void): void {
    this.disposables.push({
      dispose: callback
    });
  }
  
  // Common logging implementation
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, ...args);
        break;
      case 'warn':
        console.warn(logMessage, ...args);
        break;
      case 'debug':
        console.debug(logMessage, ...args);
        break;
      default:
        console.log(logMessage, ...args);
    }
  }
  
  // Cleanup method
  dispose(): void {
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        this.log('error', 'Error disposing resource:', error);
      }
    });
    this.disposables = [];
    this.eventListeners.clear();
  }
}

/**
 * Platform adapter factory
 */
export interface PlatformAdapterFactory {
  create(context: any): PlatformInterface;
  supports(platformName: string): boolean;
}

/**
 * Platform detection utilities
 */
export class PlatformDetector {
  static detectPlatform(): 'cursor' | 'vscode' | 'unknown' {
    // Check for Cursor-specific APIs
    if (typeof process !== 'undefined' && process.env.CURSOR_USER_DATA_DIR) {
      return 'cursor';
    }
    
    // Check for VS Code-specific APIs
    if (typeof process !== 'undefined' && process.env.VSCODE_PID) {
      return 'vscode';
    }
    
    // Fallback detection based on available APIs
    try {
      const vscode = require('vscode');
      if (vscode && vscode.version) {
        // Additional checks could be added here to distinguish between platforms
        return 'vscode';
      }
    } catch (error) {
      // Not in a VS Code-like environment
    }
    
    return 'unknown';
  }
  
  static getPlatformCapabilities(platform: string): PlatformConfig['capabilities'] {
    switch (platform) {
      case 'cursor':
        return {
          mcpIntegration: true,
          aiChatProvider: true,
          customCommands: true
        };
      case 'vscode':
        return {
          mcpIntegration: false,
          aiChatProvider: true,
          customCommands: true
        };
      default:
        return {
          mcpIntegration: false,
          aiChatProvider: false,
          customCommands: false
        };
    }
  }
}
