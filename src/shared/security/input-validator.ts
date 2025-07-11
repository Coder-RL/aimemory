/**
 * Input validation and sanitization for the memory bank system
 * Implements security best practices for user-generated content
 */

import { ValidationResult, SecurityError } from '../types';
import * as path from 'path';

/**
 * Comprehensive input validator with security-focused validation rules
 */
export class InputValidator {
  private static readonly MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB
  private static readonly MAX_FILENAME_LENGTH = 255;
  private static readonly ALLOWED_EXTENSIONS = ['.md', '.txt', '.json'];
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi
  ];
  
  /**
   * Validates and sanitizes memory bank file content
   */
  static validateMemoryBankContent(content: string): ValidationResult {
    const errors: string[] = [];
    
    // Check content length
    if (content.length > this.MAX_CONTENT_LENGTH) {
      errors.push(`Content exceeds maximum length of ${this.MAX_CONTENT_LENGTH} characters`);
    }
    
    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        errors.push('Content contains potentially dangerous scripts or code');
        break;
      }
    }
    
    // Sanitize content if no critical errors
    let sanitizedContent = content;
    if (errors.length === 0) {
      sanitizedContent = this.sanitizeMarkdownContent(content);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedContent
    };
  }
  
  /**
   * Validates file paths to prevent directory traversal attacks
   */
  static validateFilePath(filePath: string, allowedBasePath: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      // Normalize paths to prevent traversal
      const normalizedPath = path.normalize(filePath);
      const normalizedBasePath = path.normalize(allowedBasePath);
      
      // Check if path is within allowed base path
      const resolvedPath = path.resolve(normalizedBasePath, normalizedPath);
      const resolvedBasePath = path.resolve(normalizedBasePath);
      
      if (!resolvedPath.startsWith(resolvedBasePath)) {
        errors.push('File path is outside allowed directory');
      }
      
      // Check for dangerous path components
      if (normalizedPath.includes('..')) {
        errors.push('File path contains directory traversal sequences');
      }
      
      // Validate filename length
      const filename = path.basename(normalizedPath);
      if (filename.length > this.MAX_FILENAME_LENGTH) {
        errors.push(`Filename exceeds maximum length of ${this.MAX_FILENAME_LENGTH} characters`);
      }
      
      // Validate file extension
      const extension = path.extname(filename).toLowerCase();
      if (extension && !this.ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`File extension '${extension}' is not allowed`);
      }
      
      // Check for null bytes and other dangerous characters
      if (normalizedPath.includes('\0') || normalizedPath.includes('\x00')) {
        errors.push('File path contains null bytes');
      }
      
    } catch (error) {
      errors.push(`Invalid file path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates command input to prevent injection attacks
   */
  static validateCommandInput(command: string, args: string[]): ValidationResult {
    const errors: string[] = [];
    
    // Validate command name
    if (!command || typeof command !== 'string') {
      errors.push('Command must be a non-empty string');
    } else {
      // Check for dangerous command patterns
      if (command.includes(';') || command.includes('|') || command.includes('&')) {
        errors.push('Command contains dangerous shell operators');
      }
      
      // Whitelist allowed commands
      const allowedCommands = [
        'memory.get',
        'memory.update',
        'memory.list',
        'memory.export',
        'memory.import',
        'server.start',
        'server.stop',
        'server.status'
      ];
      
      if (!allowedCommands.includes(command)) {
        errors.push(`Command '${command}' is not allowed`);
      }
    }
    
    // Validate arguments
    if (args && Array.isArray(args)) {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg !== 'string') {
          errors.push(`Argument ${i} must be a string`);
          continue;
        }
        
        // Check for injection patterns in arguments
        if (arg.includes(';') || arg.includes('|') || arg.includes('&') || arg.includes('`')) {
          errors.push(`Argument ${i} contains dangerous characters`);
        }
        
        // Check argument length
        if (arg.length > 1000) {
          errors.push(`Argument ${i} exceeds maximum length`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates configuration values
   */
  static validateConfiguration(config: any): ValidationResult {
    const errors: string[] = [];
    
    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { isValid: false, errors };
    }
    
    // Validate port number
    if (config.port !== undefined) {
      if (!Number.isInteger(config.port) || config.port < 1024 || config.port > 65535) {
        errors.push('Port must be an integer between 1024 and 65535');
      }
    }
    
    // Validate security settings
    if (config.security) {
      if (config.security.maxFileSize && (!Number.isInteger(config.security.maxFileSize) || config.security.maxFileSize < 0)) {
        errors.push('Security maxFileSize must be a non-negative integer');
      }
      
      if (config.security.allowedExtensions && !Array.isArray(config.security.allowedExtensions)) {
        errors.push('Security allowedExtensions must be an array');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Sanitizes markdown content while preserving formatting
   */
  private static sanitizeMarkdownContent(content: string): string {
    // Remove potentially dangerous HTML tags while preserving markdown
    let sanitized = content;
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove javascript: and data: URLs
    sanitized = sanitized.replace(/(?:javascript|data|vbscript):[^"'\s>]*/gi, '');
    
    // Remove style attributes that could contain expressions
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');
    
    // Normalize line endings
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    return sanitized;
  }
  
  /**
   * Validates URL inputs
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      const parsedUrl = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }
      
      // Prevent localhost access in production
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        // This might be allowed in development mode
        console.warn('Localhost URL detected:', url);
      }
      
    } catch (error) {
      errors.push('Invalid URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validates JSON input
   */
  static validateJson(jsonString: string): ValidationResult {
    const errors: string[] = [];
    let parsedJson: any;
    
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (error) {
      errors.push('Invalid JSON format');
      return { isValid: false, errors };
    }
    
    // Check for dangerous object properties
    if (typeof parsedJson === 'object' && parsedJson !== null) {
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      for (const key of dangerousKeys) {
        if (key in parsedJson) {
          errors.push(`Dangerous property '${key}' found in JSON`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedContent: JSON.stringify(parsedJson)
    };
  }
}
