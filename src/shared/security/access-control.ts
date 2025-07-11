/**
 * Access control system for the memory bank
 * Implements fine-grained permissions and security policies
 */

import { SecurityConfig, SecurityError } from '../types';
import { PlatformInterface } from '../platform-interface';
import { InputValidator } from './input-validator';
import * as path from 'path';

/**
 * Access control manager that enforces security policies
 */
export class AccessControl {
  private allowedPaths: Set<string> = new Set();
  private readonly config: SecurityConfig;
  private readonly platform: PlatformInterface;
  
  constructor(platform: PlatformInterface, config: SecurityConfig) {
    this.platform = platform;
    this.config = config;
    this.initializeAllowedPaths();
  }
  
  /**
   * Initialize allowed paths based on workspace and configuration
   */
  private initializeAllowedPaths(): void {
    const workspaceRoot = this.platform.getWorkspaceRoot();
    if (workspaceRoot) {
      // Add memory bank directory
      this.allowedPaths.add(path.join(workspaceRoot, 'memory-bank'));
      
      // Add configured allowed paths
      for (const allowedPath of this.config.allowedPaths) {
        if (path.isAbsolute(allowedPath)) {
          this.allowedPaths.add(allowedPath);
        } else {
          this.allowedPaths.add(path.join(workspaceRoot, allowedPath));
        }
      }
    }
    
    // Add extension storage paths
    this.allowedPaths.add(this.platform.getGlobalStoragePath());
    this.allowedPaths.add(this.platform.getWorkspaceStoragePath());
  }
  
  /**
   * Check if a file path can be accessed
   */
  canAccessPath(filePath: string): boolean {
    try {
      const normalizedPath = path.normalize(filePath);
      const resolvedPath = path.resolve(normalizedPath);
      
      // Check if path is within any allowed directory
      for (const allowedPath of this.allowedPaths) {
        const resolvedAllowedPath = path.resolve(allowedPath);
        if (resolvedPath.startsWith(resolvedAllowedPath)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      this.platform.log('error', 'Error checking path access:', error);
      return false;
    }
  }
  
  /**
   * Check if a file can be modified
   */
  canModifyFile(filePath: string): boolean {
    if (!this.canAccessPath(filePath)) {
      return false;
    }
    
    // Additional checks for modification
    const extension = path.extname(filePath).toLowerCase();
    if (!this.config.allowedExtensions.includes(extension)) {
      return false;
    }
    
    // Check if it's a system file
    const filename = path.basename(filePath);
    const systemFiles = ['.gitignore', '.git', 'node_modules', 'package.json', 'package-lock.json'];
    if (systemFiles.some(sysFile => filename.includes(sysFile))) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if a file can be read
   */
  canReadFile(filePath: string): boolean {
    return this.canAccessPath(filePath);
  }
  
  /**
   * Check if a directory can be created
   */
  canCreateDirectory(dirPath: string): boolean {
    if (!this.canAccessPath(dirPath)) {
      return false;
    }
    
    // Ensure it's within memory bank structure
    const workspaceRoot = this.platform.getWorkspaceRoot();
    if (!workspaceRoot) {
      return false;
    }
    
    const memoryBankPath = path.join(workspaceRoot, 'memory-bank');
    const resolvedDirPath = path.resolve(dirPath);
    const resolvedMemoryBankPath = path.resolve(memoryBankPath);
    
    return resolvedDirPath.startsWith(resolvedMemoryBankPath);
  }
  
  /**
   * Validate and authorize file operation
   */
  async authorizeFileOperation(
    operation: 'read' | 'write' | 'delete' | 'create',
    filePath: string,
    content?: string
  ): Promise<void> {
    // Validate file path
    const workspaceRoot = this.platform.getWorkspaceRoot();
    if (!workspaceRoot) {
      throw new SecurityError('No workspace root available');
    }
    
    const pathValidation = InputValidator.validateFilePath(filePath, workspaceRoot);
    if (!pathValidation.isValid) {
      throw new SecurityError(`Invalid file path: ${pathValidation.errors.join(', ')}`);
    }
    
    // Check operation-specific permissions
    switch (operation) {
      case 'read':
        if (!this.canReadFile(filePath)) {
          throw new SecurityError(`Read access denied for path: ${filePath}`);
        }
        break;
        
      case 'write':
      case 'create':
        if (!this.canModifyFile(filePath)) {
          throw new SecurityError(`Write access denied for path: ${filePath}`);
        }
        
        // Validate content if provided
        if (content !== undefined) {
          const contentValidation = InputValidator.validateMemoryBankContent(content);
          if (!contentValidation.isValid) {
            throw new SecurityError(`Invalid content: ${contentValidation.errors.join(', ')}`);
          }
        }
        
        // Check file size limits
        if (content && content.length > this.config.maxFileSize) {
          throw new SecurityError(`File size exceeds limit of ${this.config.maxFileSize} bytes`);
        }
        break;
        
      case 'delete':
        if (!this.canModifyFile(filePath)) {
          throw new SecurityError(`Delete access denied for path: ${filePath}`);
        }
        
        // Prevent deletion of critical files
        const filename = path.basename(filePath);
        const criticalFiles = ['projectbrief.md', 'productContext.md'];
        if (criticalFiles.includes(filename)) {
          throw new SecurityError(`Cannot delete critical file: ${filename}`);
        }
        break;
        
      default:
        throw new SecurityError(`Unknown operation: ${operation}`);
    }
    
    this.platform.log('debug', `Authorized ${operation} operation for: ${filePath}`);
  }
  
  /**
   * Check if a command can be executed
   */
  canExecuteCommand(command: string, args: string[]): boolean {
    const validation = InputValidator.validateCommandInput(command, args);
    return validation.isValid;
  }
  
  /**
   * Authorize command execution
   */
  async authorizeCommand(command: string, args: string[]): Promise<void> {
    const validation = InputValidator.validateCommandInput(command, args);
    if (!validation.isValid) {
      throw new SecurityError(`Command validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Additional command-specific authorization
    switch (command) {
      case 'memory.export':
        // Check if export is allowed
        if (args.includes('--include-sensitive')) {
          throw new SecurityError('Sensitive data export is not allowed');
        }
        break;
        
      case 'memory.import':
        // Check if import source is trusted
        if (args.length > 0) {
          const sourcePath = args[0];
          if (!this.canAccessPath(sourcePath)) {
            throw new SecurityError(`Import source not accessible: ${sourcePath}`);
          }
        }
        break;
        
      case 'server.start':
        // Check if server can be started
        const port = args.length > 0 ? parseInt(args[0]) : 7331;
        if (isNaN(port) || port < 1024 || port > 65535) {
          throw new SecurityError('Invalid port number for server start');
        }
        break;
    }
    
    this.platform.log('debug', `Authorized command: ${command} with args: ${args.join(', ')}`);
  }
  
  /**
   * Get security context for current operation
   */
  getSecurityContext(): {
    allowedPaths: string[];
    maxFileSize: number;
    allowedExtensions: string[];
    workspaceRoot: string | undefined;
  } {
    return {
      allowedPaths: Array.from(this.allowedPaths),
      maxFileSize: this.config.maxFileSize,
      allowedExtensions: this.config.allowedExtensions,
      workspaceRoot: this.platform.getWorkspaceRoot()
    };
  }
  
  /**
   * Update security configuration
   */
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    Object.assign(this.config, newConfig);
    
    // Reinitialize allowed paths if they changed
    if (newConfig.allowedPaths) {
      this.allowedPaths.clear();
      this.initializeAllowedPaths();
    }
    
    this.platform.log('info', 'Security configuration updated');
  }
  
  /**
   * Audit log for security events
   */
  auditLog(event: string, details: any): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      workspaceRoot: this.platform.getWorkspaceRoot()
    };
    
    this.platform.log('info', `Security audit: ${event}`, auditEntry);
    
    // In a production environment, this could be sent to a security monitoring system
  }
}

/**
 * Security manager that coordinates all security components
 */
export class SecurityManager {
  private accessControl: AccessControl;
  
  constructor(platform: PlatformInterface, config: SecurityConfig) {
    this.accessControl = new AccessControl(platform, config);
  }
  
  /**
   * Get access control instance
   */
  getAccessControl(): AccessControl {
    return this.accessControl;
  }
  
  /**
   * Perform comprehensive security check
   */
  async performSecurityCheck(operation: string, context: any): Promise<void> {
    try {
      switch (operation) {
        case 'file_operation':
          await this.accessControl.authorizeFileOperation(
            context.operation,
            context.filePath,
            context.content
          );
          break;
          
        case 'command_execution':
          await this.accessControl.authorizeCommand(context.command, context.args);
          break;
          
        default:
          throw new SecurityError(`Unknown security check operation: ${operation}`);
      }
      
      this.accessControl.auditLog(`security_check_passed`, { operation, context });
    } catch (error) {
      this.accessControl.auditLog(`security_check_failed`, { operation, context, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
