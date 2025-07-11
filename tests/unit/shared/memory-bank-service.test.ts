/**
 * Unit tests for EnhancedMemoryBankService
 * Tests memory bank functionality, validation, and data integrity
 */

import { EnhancedMemoryBankService } from '../../../src/shared/memory-bank-service';
import { MemoryBankFileType } from '../../../src/shared/types';

describe('EnhancedMemoryBankService', () => {
  let memoryBankService: EnhancedMemoryBankService;
  let mockPlatform: any;

  beforeEach(() => {
    mockPlatform = global.testUtils.createMockPlatform();
    mockPlatform.fileExists.mockResolvedValue(true);
    mockPlatform.readFile.mockResolvedValue('# Test Content\n\nThis is test content.');
    mockPlatform.getFileStats.mockResolvedValue({
      size: 100,
      mtime: new Date(),
      isFile: true,
      isDirectory: false
    });
    
    memoryBankService = new EnhancedMemoryBankService(mockPlatform);
  });

  describe('initialization', () => {
    it('should initialize with workspace root', () => {
      expect(mockPlatform.getWorkspaceRoot).toHaveBeenCalled();
    });

    it('should throw error if no workspace root', () => {
      const platformWithoutWorkspace = global.testUtils.createMockPlatform();
      platformWithoutWorkspace.getWorkspaceRoot.mockReturnValue(undefined);
      
      expect(() => new EnhancedMemoryBankService(platformWithoutWorkspace))
        .toThrow('No workspace folder found');
    });

    it('should create memory bank directory if it does not exist', async () => {
      mockPlatform.fileExists.mockResolvedValueOnce(false);
      
      await memoryBankService.initialize();
      
      expect(mockPlatform.createDirectory).toHaveBeenCalledWith('/test/workspace/memory-bank');
    });
  });

  describe('file operations', () => {
    beforeEach(async () => {
      await memoryBankService.initialize();
    });

    it('should load existing files during initialization', async () => {
      const files = memoryBankService.getAllFiles();
      
      expect(files).toHaveLength(Object.keys(MemoryBankFileType).length);
      expect(files[0]).toBeValidMemoryBankFile();
    });

    it('should create template files for missing files', async () => {
      mockPlatform.fileExists.mockResolvedValue(false);
      
      await memoryBankService.initialize();
      
      expect(mockPlatform.writeFile).toHaveBeenCalledTimes(Object.keys(MemoryBankFileType).length);
    });

    it('should update file content with validation', async () => {
      const testContent = '# Updated Content\n\nThis is updated content.';
      
      await memoryBankService.updateFile(MemoryBankFileType.ProjectBrief, testContent);
      
      expect(mockPlatform.writeFile).toHaveBeenCalledWith(
        '/test/workspace/memory-bank/projectbrief.md',
        testContent
      );
      
      const file = memoryBankService.getFile(MemoryBankFileType.ProjectBrief);
      expect(file?.content).toBe(testContent);
    });

    it('should reject malicious content during update', async () => {
      const maliciousContent = '<script>alert("xss")</script>';
      
      await expect(
        memoryBankService.updateFile(MemoryBankFileType.ProjectBrief, maliciousContent)
      ).rejects.toThrow('Content validation failed');
    });

    it('should update file metadata on content change', async () => {
      const testContent = '# New Content';
      const beforeUpdate = Date.now();
      
      await memoryBankService.updateFile(MemoryBankFileType.ProjectBrief, testContent);
      
      const enhancedFile = memoryBankService.getEnhancedFile(MemoryBankFileType.ProjectBrief);
      expect(enhancedFile?.metadata.modifiedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
      expect(enhancedFile?.metadata.size).toBe(testContent.length);
      expect(enhancedFile?.metadata.version).toBeGreaterThan(1);
    });

    it('should calculate checksums for content integrity', async () => {
      const testContent = '# Test Content for Checksum';
      
      await memoryBankService.updateFile(MemoryBankFileType.ProjectBrief, testContent);
      
      const enhancedFile = memoryBankService.getEnhancedFile(MemoryBankFileType.ProjectBrief);
      expect(enhancedFile?.metadata.checksum).toBeDefined();
      expect(enhancedFile?.metadata.checksum).toHaveLength(64); // SHA-256 hex length
    });
  });

  describe('data export and import', () => {
    beforeEach(async () => {
      await memoryBankService.initialize();
    });

    it('should export data in JSON format', async () => {
      const exportData = await memoryBankService.exportData({
        format: 'json',
        includeMetadata: true,
        includeTemplates: false,
        compression: false
      });
      
      const parsed = JSON.parse(exportData);
      expect(parsed.version).toBe('2.0.0');
      expect(parsed.platform).toBe('test');
      expect(parsed.files).toHaveLength(Object.keys(MemoryBankFileType).length);
      expect(parsed.files[0]).toHaveProperty('metadata');
    });

    it('should export data in markdown format', async () => {
      const exportData = await memoryBankService.exportData({
        format: 'markdown',
        includeMetadata: false,
        includeTemplates: false,
        compression: false
      });
      
      expect(exportData).toContain('# Memory Bank Export');
      expect(exportData).toContain('## projectbrief.md');
      expect(exportData).toContain('**Exported:**');
    });

    it('should import valid data', async () => {
      const importData = {
        version: '2.0.0',
        files: [
          {
            type: 'projectbrief.md',
            content: '# Imported Content\n\nThis is imported content.',
            lastUpdated: new Date().toISOString()
          }
        ]
      };
      
      await memoryBankService.importData(JSON.stringify(importData), {
        overwriteExisting: true,
        validateContent: true,
        createBackup: false
      });
      
      const file = memoryBankService.getFile(MemoryBankFileType.ProjectBrief);
      expect(file?.content).toBe('# Imported Content\n\nThis is imported content.');
    });

    it('should create backup during import when requested', async () => {
      const importData = {
        version: '2.0.0',
        files: [
          {
            type: 'projectbrief.md',
            content: '# Imported Content',
            lastUpdated: new Date().toISOString()
          }
        ]
      };
      
      await memoryBankService.importData(JSON.stringify(importData), {
        overwriteExisting: true,
        validateContent: true,
        createBackup: true
      });
      
      expect(mockPlatform.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/backup-\d+\.json$/),
        expect.any(String)
      );
    });

    it('should reject invalid import data', async () => {
      const invalidData = 'not valid json';
      
      await expect(
        memoryBankService.importData(invalidData, {
          overwriteExisting: true,
          validateContent: true,
          createBackup: false
        })
      ).rejects.toThrow('Invalid JSON format');
    });

    it('should skip files with invalid content during import', async () => {
      const importData = {
        version: '2.0.0',
        files: [
          {
            type: 'projectbrief.md',
            content: '<script>alert("xss")</script>',
            lastUpdated: new Date().toISOString()
          }
        ]
      };
      
      await memoryBankService.importData(JSON.stringify(importData), {
        overwriteExisting: true,
        validateContent: true,
        createBackup: false
      });
      
      // Should not update the file with malicious content
      const file = memoryBankService.getFile(MemoryBankFileType.ProjectBrief);
      expect(file?.content).not.toContain('<script>');
    });
  });

  describe('statistics and validation', () => {
    beforeEach(async () => {
      await memoryBankService.initialize();
    });

    it('should provide accurate statistics', () => {
      const stats = memoryBankService.getStatistics();
      
      expect(stats.totalFiles).toBe(Object.keys(MemoryBankFileType).length);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageFileSize).toBeGreaterThan(0);
      expect(stats.lastModified).toBeInstanceOf(Date);
      expect(stats.fileTypes).toHaveLength(Object.keys(MemoryBankFileType).length);
    });

    it('should validate memory bank integrity', async () => {
      const validation = await memoryBankService.validateIntegrity();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect integrity issues', async () => {
      // Simulate a missing file
      mockPlatform.fileExists.mockResolvedValueOnce(false);
      
      const validation = await memoryBankService.validateIntegrity();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('File missing from filesystem')
      )).toBe(true);
    });

    it('should detect checksum mismatches', async () => {
      // Manually corrupt a file's checksum
      const file = memoryBankService.getEnhancedFile(MemoryBankFileType.ProjectBrief);
      if (file) {
        file.metadata.checksum = 'corrupted-checksum';
      }
      
      const validation = await memoryBankService.validateIntegrity();
      
      expect(validation.warnings.some(warning => 
        warning.includes('Checksum mismatch')
      )).toBe(true);
    });
  });

  describe('initialization status', () => {
    it('should report initialization status correctly', async () => {
      mockPlatform.fileExists.mockResolvedValue(true);
      
      const isInitialized = await memoryBankService.getIsMemoryBankInitialized();
      
      expect(isInitialized).toBe(true);
    });

    it('should report false when directory does not exist', async () => {
      mockPlatform.fileExists.mockResolvedValue(false);
      
      const isInitialized = await memoryBankService.getIsMemoryBankInitialized();
      
      expect(isInitialized).toBe(false);
    });

    it('should report false when files are missing', async () => {
      mockPlatform.fileExists
        .mockResolvedValueOnce(true) // Directory exists
        .mockResolvedValue(false); // But files don't exist
      
      const isInitialized = await memoryBankService.getIsMemoryBankInitialized();
      
      expect(isInitialized).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      mockPlatform.readFile.mockRejectedValue(new Error('Permission denied'));
      
      await expect(memoryBankService.initialize()).rejects.toThrow('Failed to load memory bank file');
    });

    it('should handle file write errors gracefully', async () => {
      await memoryBankService.initialize();
      mockPlatform.writeFile.mockRejectedValue(new Error('Disk full'));
      
      await expect(
        memoryBankService.updateFile(MemoryBankFileType.ProjectBrief, 'test content')
      ).rejects.toThrow('Disk full');
    });

    it('should handle directory creation errors', async () => {
      mockPlatform.fileExists.mockResolvedValue(false);
      mockPlatform.createDirectory.mockRejectedValue(new Error('Permission denied'));
      
      await expect(memoryBankService.initialize()).rejects.toThrow('Failed to initialize memory bank folders');
    });
  });
});
