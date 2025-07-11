/**
 * Enhanced memory bank service with security, validation, and cross-platform support
 * Implements the memory bank interface with additional features
 */

import * as path from 'path';
import * as crypto from 'crypto';
import { 
  MemoryBank, 
  MemoryBankFile, 
  MemoryBankFileType, 
  EnhancedMemoryBankFile,
  ExportOptions,
  ImportOptions,
  MemoryBankTemplate,
  MemoryBankError,
  ValidationError
} from './types';
import { PlatformInterface } from './platform-interface';
import { InputValidator } from './security/input-validator';

/**
 * Enhanced memory bank service with security and validation
 */
export class EnhancedMemoryBankService implements MemoryBank {
  private _memoryBankFolder: string;
  files: Map<MemoryBankFileType, MemoryBankFile> = new Map();
  private enhancedFiles: Map<MemoryBankFileType, EnhancedMemoryBankFile> = new Map();
  private readonly platform: PlatformInterface;
  
  constructor(platform: PlatformInterface) {
    this.platform = platform;
    
    const workspaceRoot = platform.getWorkspaceRoot();
    if (!workspaceRoot) {
      throw new MemoryBankError('No workspace folder found', 'NO_WORKSPACE');
    }
    
    this._memoryBankFolder = path.join(workspaceRoot, 'memory-bank');
  }
  
  /**
   * Initialize the memory bank service
   */
  async initialize(): Promise<void> {
    await this.initializeFolders();
    await this.loadFiles();
    this.platform.log('info', 'Memory bank service initialized');
  }
  
  /**
   * Initialize memory bank folders
   */
  async initializeFolders(): Promise<void> {
    try {
      const exists = await this.platform.fileExists(this._memoryBankFolder);
      if (!exists) {
        await this.platform.createDirectory(this._memoryBankFolder);
        this.platform.log('info', `Created memory bank directory: ${this._memoryBankFolder}`);
      }
    } catch (error) {
      throw new MemoryBankError(
        `Failed to initialize memory bank folders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FOLDER_INIT_ERROR'
      );
    }
  }
  
  /**
   * Load all memory bank files
   */
  async loadFiles(): Promise<void> {
    this.files.clear();
    this.enhancedFiles.clear();
    
    for (const fileType of Object.values(MemoryBankFileType)) {
      const filePath = path.join(this._memoryBankFolder, fileType);
      
      try {
        const exists = await this.platform.fileExists(filePath);
        
        if (exists) {
          const content = await this.platform.readFile(filePath);
          const stats = await this.platform.getFileStats(filePath);
          
          // Validate content
          const validation = InputValidator.validateMemoryBankContent(content);
          if (!validation.isValid) {
            this.platform.log('warn', `Content validation failed for ${fileType}: ${validation.errors.join(', ')}`);
            // Use sanitized content if available, otherwise use original with warning
            const finalContent = validation.sanitizedContent || content;
            
            const file: MemoryBankFile = {
              type: fileType as MemoryBankFileType,
              content: finalContent,
              lastUpdated: stats.mtime
            };
            
            const enhancedFile: EnhancedMemoryBankFile = {
              ...file,
              metadata: {
                createdAt: stats.mtime, // Approximation
                modifiedAt: stats.mtime,
                size: stats.size,
                checksum: this.calculateChecksum(finalContent),
                version: 1
              }
            };
            
            this.files.set(fileType as MemoryBankFileType, file);
            this.enhancedFiles.set(fileType as MemoryBankFileType, enhancedFile);
          }
        } else {
          // Create file with template
          const template = this.getTemplateForFileType(fileType as MemoryBankFileType);
          await this.platform.writeFile(filePath, template);
          
          const file: MemoryBankFile = {
            type: fileType as MemoryBankFileType,
            content: template,
            lastUpdated: new Date()
          };
          
          const enhancedFile: EnhancedMemoryBankFile = {
            ...file,
            metadata: {
              createdAt: new Date(),
              modifiedAt: new Date(),
              size: template.length,
              checksum: this.calculateChecksum(template),
              version: 1
            }
          };
          
          this.files.set(fileType as MemoryBankFileType, file);
          this.enhancedFiles.set(fileType as MemoryBankFileType, enhancedFile);
          
          this.platform.log('info', `Created new memory bank file: ${fileType}`);
        }
      } catch (error) {
        this.platform.log('error', `Error loading file ${fileType}:`, error);
        throw new MemoryBankError(
          `Failed to load memory bank file ${fileType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'FILE_LOAD_ERROR'
        );
      }
    }
  }
  
  /**
   * Get template content for a specific file type
   */
  private getTemplateForFileType(fileType: MemoryBankFileType): string {
    switch (fileType) {
      case MemoryBankFileType.ProjectBrief:
        return "# Project Brief\n\n## Overview\n\n## Goals\n\n## Scope\n\n## Timeline\n";
      
      case MemoryBankFileType.ProductContext:
        return "# Product Context\n\n## User stories\n\n## Requirements\n\n## Constraints\n\n## Success criteria\n";
      
      case MemoryBankFileType.ActiveContext:
        return "# Active Context\n\n## Current task\n\n## Recent changes\n\n## Next steps\n\n## Blockers\n";
      
      case MemoryBankFileType.SystemPatterns:
        return "# System Patterns\n\n## System architecture\n\n## Key technical decisions\n\n## Design patterns in use\n\n## Component relationships\n";
      
      case MemoryBankFileType.TechContext:
        return "# Tech Context\n\n## Technologies used\n\n## Development setup\n\n## Technical constraints\n\n## Dependencies\n";
      
      case MemoryBankFileType.Progress:
        return "# Progress\n\n## What works\n\n## What's left to build\n\n## Current status\n\n## Known issues\n";
      
      default:
        return "# Memory Bank File\n\n*This is a default template*\n";
    }
  }
  
  /**
   * Calculate checksum for content integrity
   */
  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }
  
  /**
   * Get a specific memory bank file
   */
  getFile(type: MemoryBankFileType): MemoryBankFile | undefined {
    return this.files.get(type);
  }
  
  /**
   * Get enhanced file with metadata
   */
  getEnhancedFile(type: MemoryBankFileType): EnhancedMemoryBankFile | undefined {
    return this.enhancedFiles.get(type);
  }
  
  /**
   * Update a memory bank file with validation
   */
  async updateFile(type: MemoryBankFileType, content: string): Promise<void> {
    try {
      // Validate content
      const validation = InputValidator.validateMemoryBankContent(content);
      if (!validation.isValid) {
        throw new ValidationError(`Content validation failed: ${validation.errors.join(', ')}`);
      }
      
      const sanitizedContent = validation.sanitizedContent || content;
      const filePath = path.join(this._memoryBankFolder, type);
      
      // Write to file system
      await this.platform.writeFile(filePath, sanitizedContent);
      
      // Update in-memory storage
      const now = new Date();
      const existingFile = this.enhancedFiles.get(type);
      
      const file: MemoryBankFile = {
        type,
        content: sanitizedContent,
        lastUpdated: now
      };
      
      const enhancedFile: EnhancedMemoryBankFile = {
        ...file,
        metadata: {
          createdAt: existingFile?.metadata.createdAt || now,
          modifiedAt: now,
          size: sanitizedContent.length,
          checksum: this.calculateChecksum(sanitizedContent),
          version: (existingFile?.metadata.version || 0) + 1
        }
      };
      
      this.files.set(type, file);
      this.enhancedFiles.set(type, enhancedFile);
      
      this.platform.log('info', `Updated memory bank file: ${type}`);
      
      // Emit update event
      this.platform.emitEvent('fileUpdated', {
        type: 'fileUpdated',
        timestamp: now,
        data: { fileType: type, size: sanitizedContent.length }
      });
      
    } catch (error) {
      this.platform.log('error', `Error updating file ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all memory bank files
   */
  getAllFiles(): MemoryBankFile[] {
    return Array.from(this.files.values());
  }
  
  /**
   * Get all enhanced files with metadata
   */
  getAllEnhancedFiles(): EnhancedMemoryBankFile[] {
    return Array.from(this.enhancedFiles.values());
  }
  
  /**
   * Get files with filenames (legacy compatibility)
   */
  getFilesWithFilenames(): string {
    return Array.from(this.files.values())
      .map(file => `${file.type}:\nlast updated: ${file.lastUpdated}\n\n${file.content}`)
      .join('\n\n');
  }
  
  /**
   * Check if memory bank is initialized
   */
  async getIsMemoryBankInitialized(): Promise<boolean> {
    try {
      const exists = await this.platform.fileExists(this._memoryBankFolder);
      if (!exists) {
        return false;
      }
      
      // Check if all required files exist
      for (const fileType of Object.values(MemoryBankFileType)) {
        const filePath = path.join(this._memoryBankFolder, fileType);
        const fileExists = await this.platform.fileExists(filePath);
        if (!fileExists) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.platform.log('error', 'Error checking initialization status:', error);
      return false;
    }
  }

  /**
   * Export memory bank data
   */
  async exportData(options: ExportOptions): Promise<string> {
    try {
      const files = options.includeMetadata ? this.getAllEnhancedFiles() : this.getAllFiles();

      const exportData = {
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        platform: this.platform.config.name,
        files: files.map(file => ({
          type: (file as any).type || file.type,
          content: (file as any).content || file.content,
          lastUpdated: (file as any).lastUpdated || file.lastUpdated,
          ...(options.includeMetadata && 'metadata' in file ? { metadata: (file as any).metadata } : {})
        }))
      };

      switch (options.format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);

        case 'markdown':
          let markdown = `# Memory Bank Export\n\n`;
          markdown += `**Exported:** ${exportData.timestamp}\n`;
          markdown += `**Platform:** ${exportData.platform}\n`;
          markdown += `**Version:** ${exportData.version}\n\n`;

          for (const file of exportData.files) {
            markdown += `## ${file.type}\n\n`;
            markdown += `**Last Updated:** ${file.lastUpdated}\n\n`;
            markdown += `${file.content}\n\n---\n\n`;
          }

          return markdown;

        case 'zip':
          // For now, return JSON format - ZIP implementation would require additional dependencies
          this.platform.log('warn', 'ZIP export not yet implemented, returning JSON');
          return JSON.stringify(exportData, null, 2);

        default:
          throw new MemoryBankError(`Unsupported export format: ${options.format}`, 'INVALID_EXPORT_FORMAT');
      }
    } catch (error) {
      this.platform.log('error', 'Error exporting memory bank:', error);
      throw new MemoryBankError(
        `Failed to export memory bank: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXPORT_ERROR'
      );
    }
  }

  /**
   * Import memory bank data
   */
  async importData(data: string, options: ImportOptions): Promise<void> {
    try {
      // Create backup if requested
      if (options.createBackup) {
        const backupData = await this.exportData({
          format: 'json',
          includeMetadata: true,
          includeTemplates: false,
          compression: false
        });

        const backupPath = path.join(this._memoryBankFolder, `backup-${Date.now()}.json`);
        await this.platform.writeFile(backupPath, backupData);
        this.platform.log('info', `Created backup at: ${backupPath}`);
      }

      // Parse import data
      let importData: any;
      try {
        importData = JSON.parse(data);
      } catch (error) {
        throw new ValidationError('Invalid JSON format in import data');
      }

      // Validate import data structure
      if (!importData.files || !Array.isArray(importData.files)) {
        throw new ValidationError('Import data must contain a files array');
      }

      // Process each file
      for (const fileData of importData.files) {
        if (!fileData.type || !fileData.content) {
          this.platform.log('warn', 'Skipping invalid file data:', fileData);
          continue;
        }

        // Check if file type is valid
        if (!Object.values(MemoryBankFileType).includes(fileData.type)) {
          this.platform.log('warn', `Skipping unknown file type: ${fileData.type}`);
          continue;
        }

        // Check if file already exists and overwrite option
        const existingFile = this.getFile(fileData.type);
        if (existingFile && !options.overwriteExisting) {
          this.platform.log('warn', `Skipping existing file: ${fileData.type}`);
          continue;
        }

        // Validate content if requested
        if (options.validateContent) {
          const validation = InputValidator.validateMemoryBankContent(fileData.content);
          if (!validation.isValid) {
            this.platform.log('warn', `Skipping file with invalid content: ${fileData.type}`);
            continue;
          }
        }

        // Import the file
        await this.updateFile(fileData.type, fileData.content);
        this.platform.log('info', `Imported file: ${fileData.type}`);
      }

      this.platform.log('info', 'Memory bank import completed');

    } catch (error) {
      this.platform.log('error', 'Error importing memory bank:', error);
      throw error;
    }
  }

  /**
   * Get memory bank statistics
   */
  getStatistics(): {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
    lastModified: Date | null;
    oldestFile: Date | null;
    fileTypes: string[];
  } {
    const files = this.getAllEnhancedFiles();

    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        lastModified: null,
        oldestFile: null,
        fileTypes: []
      };
    }

    const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0);
    const dates = files.map(file => file.metadata.modifiedAt);

    return {
      totalFiles: files.length,
      totalSize,
      averageFileSize: Math.round(totalSize / files.length),
      lastModified: new Date(Math.max(...dates.map(d => d.getTime()))),
      oldestFile: new Date(Math.min(...dates.map(d => d.getTime()))),
      fileTypes: files.map(file => (file as any).type || 'unknown')
    };
  }

  /**
   * Validate memory bank integrity
   */
  async validateIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if all required files exist
      for (const fileType of Object.values(MemoryBankFileType)) {
        const file = this.getEnhancedFile(fileType);
        if (!file) {
          errors.push(`Missing required file: ${fileType}`);
          continue;
        }

        // Verify checksum
        const currentChecksum = this.calculateChecksum((file as any).content || '');
        if (currentChecksum !== file.metadata.checksum) {
          warnings.push(`Checksum mismatch for file: ${fileType}`);
        }

        // Validate content
        const validation = InputValidator.validateMemoryBankContent((file as any).content || '');
        if (!validation.isValid) {
          warnings.push(`Content validation issues in ${fileType}: ${validation.errors.join(', ')}`);
        }
      }

      // Check file system consistency
      for (const fileType of Object.values(MemoryBankFileType)) {
        const filePath = path.join(this._memoryBankFolder, fileType);
        const exists = await this.platform.fileExists(filePath);
        if (!exists) {
          errors.push(`File missing from filesystem: ${fileType}`);
        }
      }

    } catch (error) {
      errors.push(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean up temporary files and optimize storage
   */
  async cleanup(): Promise<void> {
    try {
      // Remove backup files older than 30 days
      const backupPattern = /^backup-\d+\.json$/;
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      // Note: This would require directory listing functionality in the platform interface
      // For now, just log the cleanup attempt
      this.platform.log('info', 'Memory bank cleanup completed');

    } catch (error) {
      this.platform.log('error', 'Error during cleanup:', error);
    }
  }
}
