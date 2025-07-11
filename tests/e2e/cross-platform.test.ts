/**
 * End-to-end tests for cross-platform memory bank system
 * Tests complete workflows across different platforms
 */

import { PlatformDetector } from '../../src/shared/platform-interface';
import { CursorPlatformAdapter } from '../../src/cursor/platform-adapter';
import { VSCodePlatformAdapter } from '../../src/vscode/platform-adapter';
import { PlatformAgnosticMCPServer } from '../../src/shared/mcp-server';
import { EnhancedMemoryBankService } from '../../src/shared/memory-bank-service';
import { SecurityAuditor } from '../../src/shared/security/security-audit';
import { PerformanceMonitor } from '../../src/shared/performance/performance-monitor';
import { ErrorManager } from '../../src/shared/error-handling/error-manager';
import request from 'supertest';

describe('Cross-Platform Memory Bank E2E', () => {
  describe('Platform Detection', () => {
    it('should detect platform correctly', () => {
      // Mock different platform environments
      const originalEnv = process.env;

      // Test Cursor detection
      process.env = { ...originalEnv, CURSOR_USER_DATA_DIR: '/test/cursor' };
      expect(PlatformDetector.detectPlatform()).toBe('cursor');

      // Test VS Code detection
      process.env = { ...originalEnv, VSCODE_PID: '12345' };
      expect(PlatformDetector.detectPlatform()).toBe('vscode');

      // Test unknown platform
      process.env = { ...originalEnv };
      delete process.env.CURSOR_USER_DATA_DIR;
      delete process.env.VSCODE_PID;
      expect(PlatformDetector.detectPlatform()).toBe('unknown');

      // Restore environment
      process.env = originalEnv;
    });

    it('should provide correct platform capabilities', () => {
      const cursorCapabilities = PlatformDetector.getPlatformCapabilities('cursor');
      expect(cursorCapabilities.mcpIntegration).toBe(true);
      expect(cursorCapabilities.aiChatProvider).toBe(true);

      const vscodeCapabilities = PlatformDetector.getPlatformCapabilities('vscode');
      expect(vscodeCapabilities.mcpIntegration).toBe(false);
      expect(vscodeCapabilities.aiChatProvider).toBe(true);
    });
  });

  describe('Complete Memory Bank Workflow', () => {
    let platform: any;
    let memoryBankService: EnhancedMemoryBankService;
    let mcpServer: PlatformAgnosticMCPServer;
    let serverPort: number;

    beforeAll(async () => {
      // Setup complete system
      platform = global.testUtils.createMockPlatform();
      platform.fileExists.mockResolvedValue(true);
      platform.readFile.mockResolvedValue('# Initial Content\n\nThis is initial content.');
      platform.getFileStats.mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isFile: true,
        isDirectory: false
      });

      memoryBankService = new EnhancedMemoryBankService(platform);
      await memoryBankService.initialize();

      const mcpOptions = global.testUtils.createMockMCPOptions();
      serverPort = mcpOptions.port;

      mcpServer = new PlatformAgnosticMCPServer(
        platform,
        memoryBankService,
        mcpOptions
      );

      await mcpServer.start();
    });

    afterAll(async () => {
      if (mcpServer) {
        await mcpServer.stop();
      }
    });

    it('should complete full memory bank lifecycle', async () => {
      // 1. Check initial status
      const healthResponse = await request(`http://localhost:${serverPort}`)
        .get('/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('ok ok');

      // 2. Get memory bank status
      const statusMessage = {
        method: 'tools/call',
        params: {
          name: 'get_memory_status',
          arguments: {}
        }
      };

      // Establish SSE connection first
      const sseConnection = request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Accept', 'text/event-stream');

      // Send status request
      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(statusMessage)
        .expect(200);

      // 3. Update a memory bank file
      const updateMessage = {
        method: 'tools/call',
        params: {
          name: 'update_memory_file',
          arguments: {
            fileType: 'projectbrief.md',
            content: '# Updated Project Brief\n\nThis is the updated project brief with new information.'
          }
        }
      };

      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(updateMessage)
        .expect(200);

      // 4. Verify the update
      const readMessage = {
        method: 'resources/read',
        params: {
          uri: 'memory-bank://projectbrief.md'
        }
      };

      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(readMessage)
        .expect(200);

      // 5. Export data
      const exportMessage = {
        method: 'tools/call',
        params: {
          name: 'export_memory_bank',
          arguments: {
            format: 'json',
            includeMetadata: true
          }
        }
      };

      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(exportMessage)
        .expect(200);

      // Verify file was updated in memory bank service
      const updatedFile = memoryBankService.getFile('projectbrief.md' as any);
      expect(updatedFile?.content).toContain('Updated Project Brief');
    });

    it('should handle concurrent operations safely', async () => {
      // Establish SSE connection
      const sseConnection = request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Accept', 'text/event-stream');

      // Create multiple concurrent update operations
      const updateOperations = Array(5).fill(null).map((_, index) => ({
        method: 'tools/call',
        params: {
          name: 'update_memory_file',
          arguments: {
            fileType: 'activeContext.md',
            content: `# Active Context Update ${index}\n\nThis is concurrent update ${index}.`
          }
        }
      }));

      // Execute all operations concurrently
      const responses = await Promise.all(
        updateOperations.map(operation =>
          request(`http://localhost:${serverPort}`)
            .post('/messages')
            .send(operation)
        )
      );

      // All operations should complete successfully
      responses.forEach(response => {
        expect([200, 202]).toContain(response.status);
      });

      // Verify final state is consistent
      const finalFile = memoryBankService.getFile('activeContext.md' as any);
      expect(finalFile?.content).toContain('Active Context Update');
    });

    it('should maintain data integrity under stress', async () => {
      const iterations = 10;
      const operationsPerIteration = 3;

      for (let i = 0; i < iterations; i++) {
        // Perform multiple operations
        const operations = [
          {
            method: 'tools/call',
            params: {
              name: 'update_memory_file',
              arguments: {
                fileType: 'progress.md',
                content: `# Progress Update ${i}\n\nIteration ${i} progress update.`
              }
            }
          },
          {
            method: 'resources/read',
            params: {
              uri: 'memory-bank://progress.md'
            }
          },
          {
            method: 'tools/call',
            params: {
              name: 'get_memory_status',
              arguments: {}
            }
          }
        ];

        // Execute operations
        for (const operation of operations) {
          await request(`http://localhost:${serverPort}`)
            .post('/messages')
            .send(operation);
        }

        // Validate integrity
        const validation = await memoryBankService.validateIntegrity();
        expect(validation.isValid).toBe(true);

        // Small delay between iterations
        await global.testUtils.delay(50);
      }
    });
  });

  describe('Security Integration', () => {
    let platform: any;
    let memoryBankService: EnhancedMemoryBankService;
    let securityAuditor: SecurityAuditor;

    beforeAll(async () => {
      platform = global.testUtils.createMockPlatform();
      platform.fileExists.mockResolvedValue(true);
      platform.readFile.mockResolvedValue('# Test Content');
      platform.getFileStats.mockResolvedValue({
        size: 100,
        mtime: new Date(),
        isFile: true,
        isDirectory: false
      });

      memoryBankService = new EnhancedMemoryBankService(platform);
      await memoryBankService.initialize();

      const securityConfig = global.testUtils.createMockSecurityConfig();
      const accessControl = new (require('../../src/shared/security/access-control').AccessControl)(platform, securityConfig);
      securityAuditor = new SecurityAuditor(platform, securityConfig, accessControl);
    });

    it('should pass comprehensive security audit', async () => {
      const auditResult = await securityAuditor.performSecurityAudit();

      expect(auditResult.score).toBeGreaterThanOrEqual(80);
      expect(auditResult.passed).toBe(true);
      
      // Should not have critical security issues
      const criticalIssues = auditResult.findings.filter(f => f.severity === 'critical');
      expect(criticalIssues).toHaveLength(0);
    });

    it('should detect and prevent security violations', async () => {
      // Test various security scenarios
      const securityTests = [
        {
          name: 'XSS Prevention',
          content: '<script>alert("xss")</script>',
          shouldFail: true
        },
        {
          name: 'Directory Traversal Prevention',
          path: '../../../etc/passwd',
          shouldFail: true
        },
        {
          name: 'Valid Content',
          content: '# Valid Markdown\n\nThis is safe content.',
          shouldFail: false
        }
      ];

      for (const test of securityTests) {
        if (test.content) {
          try {
            await memoryBankService.updateFile('projectbrief.md' as any, test.content);
            if (test.shouldFail) {
              fail(`${test.name} should have failed but didn't`);
            }
          } catch (error) {
            if (!test.shouldFail) {
              fail(`${test.name} should have succeeded but failed: ${error}`);
            }
          }
        }
      }
    });
  });

  describe('Performance Integration', () => {
    let platform: any;
    let performanceMonitor: PerformanceMonitor;

    beforeAll(() => {
      platform = global.testUtils.createMockPlatform();
      performanceMonitor = new PerformanceMonitor(platform);
    });

    it('should maintain good performance metrics', async () => {
      // Simulate various operations
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        // Simulate file operation
        await global.testUtils.delay(Math.random() * 50);
        performanceMonitor.recordFileOperation(startTime);
        
        // Simulate request
        const requestStart = Date.now();
        await global.testUtils.delay(Math.random() * 100);
        performanceMonitor.recordRequest(requestStart, true);
      }

      const report = performanceMonitor.generatePerformanceReport();
      
      expect(report.score).toBeGreaterThanOrEqual(70);
      expect(report.metrics.operations.totalRequests).toBe(10);
      expect(report.metrics.operations.successfulRequests).toBe(10);
      expect(report.metrics.operations.failedRequests).toBe(0);
    });

    it('should detect performance issues', async () => {
      // Simulate slow operations
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await global.testUtils.delay(200); // Slow operation
        performanceMonitor.recordRequest(startTime, true);
      }

      const report = performanceMonitor.generatePerformanceReport();
      
      // Should detect slow response times
      const slowResponseIssues = report.issues.filter(issue => 
        issue.description.includes('response times')
      );
      expect(slowResponseIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    let platform: any;
    let errorManager: ErrorManager;

    beforeAll(() => {
      platform = global.testUtils.createMockPlatform();
      errorManager = new ErrorManager(platform);
    });

    it('should handle and recover from errors', async () => {
      // Simulate file system error
      const fileError = new Error('ENOENT: no such file or directory');
      
      const report = await errorManager.handleError(fileError, {
        operation: 'file_read',
        component: 'memory_bank',
        timestamp: new Date()
      });

      expect(report.handled).toBe(true);
      expect(report.recoveryAttempted).toBe(true);
      
      // File system recovery should have been attempted
      expect(platform.createDirectory).toHaveBeenCalled();
    });

    it('should provide accurate error statistics', async () => {
      // Generate various types of errors
      const errors = [
        new Error('Network timeout'),
        new Error('Permission denied'),
        new Error('Out of memory'),
        new Error('Invalid input')
      ];

      for (const error of errors) {
        await errorManager.handleError(error, {
          operation: 'test_operation',
          component: 'test_component',
          timestamp: new Date()
        });
      }

      const stats = errorManager.getErrorStatistics();
      expect(stats.totalErrors).toBe(errors.length);
      expect(stats.recoverySuccessRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Platform-Specific Features', () => {
    it('should handle Cursor-specific functionality', () => {
      const mockContext = {
        extensionPath: '/test/extension',
        globalStorageUri: { fsPath: '/test/global' },
        storageUri: { fsPath: '/test/workspace' },
        subscriptions: []
      };

      const cursorAdapter = new CursorPlatformAdapter(mockContext as any);
      
      expect(cursorAdapter.config.name).toBe('cursor');
      expect(cursorAdapter.config.capabilities.mcpIntegration).toBe(true);
    });

    it('should handle VS Code-specific functionality', () => {
      const mockContext = {
        extensionPath: '/test/extension',
        globalStorageUri: { fsPath: '/test/global' },
        storageUri: { fsPath: '/test/workspace' },
        subscriptions: []
      };

      const vscodeAdapter = new VSCodePlatformAdapter(mockContext as any);
      
      expect(vscodeAdapter.config.name).toBe('vscode');
      expect(vscodeAdapter.config.capabilities.mcpIntegration).toBe(false);
      expect(vscodeAdapter.config.capabilities.aiChatProvider).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency across platform switches', async () => {
      // This test simulates switching between platforms while maintaining data
      const sharedData = {
        projectbrief: '# Shared Project Brief\n\nThis should be consistent.',
        activeContext: '# Shared Active Context\n\nThis should persist.'
      };

      // Test with Cursor platform
      const cursorPlatform = global.testUtils.createMockPlatform();
      cursorPlatform.config.name = 'cursor';
      cursorPlatform.readFile.mockImplementation((path: string) => {
        const filename = path.split('/').pop();
        return Promise.resolve(sharedData[filename as keyof typeof sharedData] || '# Default');
      });

      const cursorMemoryBank = new EnhancedMemoryBankService(cursorPlatform);
      await cursorMemoryBank.initialize();

      // Test with VS Code platform
      const vscodePlatform = global.testUtils.createMockPlatform();
      vscodePlatform.config.name = 'vscode';
      vscodePlatform.readFile.mockImplementation((path: string) => {
        const filename = path.split('/').pop();
        return Promise.resolve(sharedData[filename as keyof typeof sharedData] || '# Default');
      });

      const vscodeMemoryBank = new EnhancedMemoryBankService(vscodePlatform);
      await vscodeMemoryBank.initialize();

      // Both should have the same data
      const cursorFiles = cursorMemoryBank.getAllFiles();
      const vscodeFiles = vscodeMemoryBank.getAllFiles();

      expect(cursorFiles).toHaveLength(vscodeFiles.length);
      
      // Content should be consistent
      for (let i = 0; i < cursorFiles.length; i++) {
        if (cursorFiles[i].type === vscodeFiles[i].type) {
          expect(cursorFiles[i].content).toBe(vscodeFiles[i].content);
        }
      }
    });
  });
});
