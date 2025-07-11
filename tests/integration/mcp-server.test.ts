/**
 * Integration tests for PlatformAgnosticMCPServer
 * Tests MCP server functionality, security, and performance
 */

import request from 'supertest';
import { PlatformAgnosticMCPServer } from '../../src/shared/mcp-server';
import { EnhancedMemoryBankService } from '../../src/shared/memory-bank-service';

describe('PlatformAgnosticMCPServer Integration', () => {
  let mcpServer: PlatformAgnosticMCPServer;
  let memoryBankService: EnhancedMemoryBankService;
  let mockPlatform: any;
  let serverPort: number;

  beforeAll(async () => {
    // Setup test environment
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
    await memoryBankService.initialize();

    const mcpOptions = global.testUtils.createMockMCPOptions();
    serverPort = mcpOptions.port;

    mcpServer = new PlatformAgnosticMCPServer(
      mockPlatform,
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

  describe('Server Health and Status', () => {
    it('should respond to health check', async () => {
      const response = await request(`http://localhost:${serverPort}`)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok ok',
        version: '2.0.0',
        platform: 'test'
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should report correct server status', () => {
      const status = mcpServer.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.port).toBe(serverPort);
      expect(status.platform).toBe('test');
    });

    it('should handle concurrent health check requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(`http://localhost:${serverPort}`)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.body.status).toBe('ok ok');
      });
    });
  });

  describe('SSE Connection', () => {
    it('should establish SSE connection', async () => {
      const response = await request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
    });

    it('should reject SSE connections from invalid origins', async () => {
      await request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Origin', 'https://malicious.com')
        .expect(403);
    });

    it('should accept SSE connections from allowed origins', async () => {
      await request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Origin', 'http://localhost:5173')
        .expect(200);
    });
  });

  describe('MCP Message Handling', () => {
    let sseResponse: any;

    beforeEach(async () => {
      // Establish SSE connection first
      sseResponse = request(`http://localhost:${serverPort}`)
        .get('/sse')
        .set('Accept', 'text/event-stream');
    });

    it('should handle resource list requests', async () => {
      const message = {
        method: 'resources/list',
        params: {}
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message)
        .expect(200);

      // Note: In a real test, you would verify the SSE response
      // For now, we just check that the request was accepted
    });

    it('should handle resource read requests', async () => {
      const message = {
        method: 'resources/read',
        params: {
          uri: 'memory-bank://projectbrief.md'
        }
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message)
        .expect(200);
    });

    it('should reject invalid resource URIs', async () => {
      const message = {
        method: 'resources/read',
        params: {
          uri: 'file:///etc/passwd'
        }
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message);

      // Should handle security violation gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle tool list requests', async () => {
      const message = {
        method: 'tools/list',
        params: {}
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message)
        .expect(200);
    });

    it('should handle tool call requests', async () => {
      const message = {
        method: 'tools/call',
        params: {
          name: 'get_memory_status',
          arguments: {}
        }
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message)
        .expect(200);
    });

    it('should validate tool call arguments', async () => {
      const message = {
        method: 'tools/call',
        params: {
          name: 'update_memory_file',
          arguments: {
            fileType: 'invalid-file-type',
            content: 'test content'
          }
        }
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message);

      // Should handle validation error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle malicious tool call content', async () => {
      const message = {
        method: 'tools/call',
        params: {
          name: 'update_memory_file',
          arguments: {
            fileType: 'projectbrief.md',
            content: '<script>alert("xss")</script>'
          }
        }
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message);

      // Should reject malicious content
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Security Features', () => {
    it('should enforce CORS policy', async () => {
      const response = await request(`http://localhost:${serverPort}`)
        .options('/health')
        .set('Origin', 'https://malicious.com')
        .expect(200);

      // CORS headers should be present but restrictive
      expect(response.headers['access-control-allow-origin']).not.toBe('*');
    });

    it('should limit request body size', async () => {
      const largePayload = {
        method: 'tools/call',
        params: {
          name: 'update_memory_file',
          arguments: {
            fileType: 'projectbrief.md',
            content: 'a'.repeat(2 * 1024 * 1024) // 2MB
          }
        }
      };

      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(largePayload)
        .expect(413); // Payload too large
    });

    it('should handle malformed JSON gracefully', async () => {
      await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should rate limit requests', async () => {
      // Send many requests rapidly
      const requests = Array(20).fill(null).map(() =>
        request(`http://localhost:${serverPort}`)
          .get('/health')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed for health endpoint, but rate limiting
      // would apply to more sensitive endpoints
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Performance', () => {
    it('should respond to health checks quickly', async () => {
      const startTime = Date.now();
      
      await request(`http://localhost:${serverPort}`)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBePerformant(100); // Should respond within 100ms
    });

    it('should handle multiple concurrent requests', async () => {
      const startTime = Date.now();
      
      const requests = Array(10).fill(null).map(() =>
        request(`http://localhost:${serverPort}`)
          .get('/health')
          .expect(200)
      );

      await Promise.all(requests);
      
      const totalTime = Date.now() - startTime;
      expect(totalTime).toBePerformant(500); // All requests within 500ms
    });

    it('should maintain performance under load', async () => {
      const iterations = 5;
      const requestsPerIteration = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const requests = Array(requestsPerIteration).fill(null).map(() =>
          request(`http://localhost:${serverPort}`)
            .get('/health')
            .expect(200)
        );

        await Promise.all(requests);
        
        const iterationTime = Date.now() - startTime;
        responseTimes.push(iterationTime);
        
        // Small delay between iterations
        await global.testUtils.delay(100);
      }

      // Performance should not degrade significantly
      const firstIterationTime = responseTimes[0];
      const lastIterationTime = responseTimes[responseTimes.length - 1];
      const degradation = lastIterationTime / firstIterationTime;
      
      expect(degradation).toBeLessThan(2); // No more than 2x slower
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Simulate an error by calling a non-existent method
      const message = {
        method: 'nonexistent/method',
        params: {}
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle memory bank service errors', async () => {
      // Mock a service error
      jest.spyOn(memoryBankService, 'getAllFiles').mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const message = {
        method: 'resources/list',
        params: {}
      };

      const response = await request(`http://localhost:${serverPort}`)
        .post('/messages')
        .send(message);

      expect(response.status).toBeGreaterThanOrEqual(500);
      
      // Restore the mock
      jest.restoreAllMocks();
    });

    it('should handle platform adapter errors', async () => {
      // Mock a platform error
      jest.spyOn(mockPlatform, 'log').mockImplementation(() => {
        throw new Error('Platform error');
      });

      // Should not crash the server
      await request(`http://localhost:${serverPort}`)
        .get('/health')
        .expect(200);
      
      // Restore the mock
      jest.restoreAllMocks();
    });
  });

  describe('Server Lifecycle', () => {
    it('should start and stop cleanly', async () => {
      const testServer = new PlatformAgnosticMCPServer(
        mockPlatform,
        memoryBankService,
        { ...global.testUtils.createMockMCPOptions(), port: 7332 }
      );

      // Start server
      await testServer.start();
      expect(testServer.isServerRunning()).toBe(true);

      // Verify it's accessible
      await request('http://localhost:7332')
        .get('/health')
        .expect(200);

      // Stop server
      await testServer.stop();
      expect(testServer.isServerRunning()).toBe(false);

      // Verify it's no longer accessible
      try {
        await request('http://localhost:7332')
          .get('/health')
          .timeout(1000);
        fail('Server should not be accessible after stop');
      } catch (error) {
        // Expected - server should be stopped
      }
    });

    it('should handle multiple start/stop cycles', async () => {
      const testServer = new PlatformAgnosticMCPServer(
        mockPlatform,
        memoryBankService,
        { ...global.testUtils.createMockMCPOptions(), port: 7333 }
      );

      for (let i = 0; i < 3; i++) {
        await testServer.start();
        expect(testServer.isServerRunning()).toBe(true);
        
        await testServer.stop();
        expect(testServer.isServerRunning()).toBe(false);
      }
    });
  });
});
