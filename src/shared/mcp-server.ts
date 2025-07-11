/**
 * Platform-agnostic MCP server implementation
 * Provides secure, cross-platform memory bank functionality
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import * as http from 'http';

import { PlatformInterface } from './platform-interface';
import { SecurityManager } from './security/access-control';
import { InputValidator } from './security/input-validator';
import { 
  MCPServerOptions, 
  MemoryBankEventData, 
  SecurityError,
  MemoryBankError 
} from './types';
import { EnhancedMemoryBankService } from './memory-bank-service';

/**
 * Platform-agnostic MCP server that works across Cursor and VS Code
 */
export class PlatformAgnosticMCPServer {
  private server: McpServer | null = null;
  private app: express.Application;
  private httpServer: http.Server | null = null;
  private transport: SSEServerTransport | null = null;
  private isRunning: boolean = false;
  
  private readonly platform: PlatformInterface;
  private readonly memoryBank: EnhancedMemoryBankService;
  private readonly security: SecurityManager;
  private readonly options: MCPServerOptions;
  
  constructor(
    platform: PlatformInterface,
    memoryBank: EnhancedMemoryBankService,
    options: MCPServerOptions
  ) {
    this.platform = platform;
    this.memoryBank = memoryBank;
    this.options = options;
    this.security = new SecurityManager(platform, options.security);
    
    this.initializeServer();
    this.setupExpress();
    this.registerMCPHandlers();
  }
  
  /**
   * Initialize the MCP server with security-focused configuration
   */
  private initializeServer(): void {
    this.server = new McpServer(
      {
        name: "Cross-Platform Memory Bank",
        version: "2.0.0",
      },
      {
        capabilities: {
          logging: {},
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    if (this.options.enableLogging) {
      this.platform.log('info', 'MCP server initialized with security features');
    }
  }
  
  /**
   * Setup Express application with security middleware
   */
  private setupExpress(): void {
    this.app = express();
    
    // Security middleware
    this.app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true
    }));
    
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    
    // Request logging middleware
    if (this.options.enableLogging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        this.platform.log('debug', `${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        next();
      });
    }
    
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok ok',
        version: '2.0.0',
        platform: this.platform.config.name,
        timestamp: new Date().toISOString()
      });
    });
    
    // SSE endpoint for MCP communication
    this.app.get('/sse', (req: Request, res: Response) => {
      this.handleSSEConnection(req, res);
    });
    
    // Message handling endpoint
    this.app.post('/messages', async (req: Request, res: Response) => {
      await this.handleMessage(req, res);
    });
    
    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.platform.log('error', 'Express error:', error);
      
      if (error instanceof SecurityError) {
        res.status(403).json({ error: 'Security violation', message: error.message });
      } else if (error instanceof MemoryBankError) {
        res.status(400).json({ error: 'Memory bank error', message: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
  
  /**
   * Handle SSE connection with security validation
   */
  private handleSSEConnection(req: express.Request, res: express.Response): void {
    try {
      // Validate request origin
      const origin = req.get('Origin');
      if (origin && !['http://localhost:5173', 'http://localhost:3000'].includes(origin)) {
        res.status(403).json({ error: 'Invalid origin' });
        return;
      }
      
      this.transport = new SSEServerTransport('/messages', res);
      
      // Connect server to transport
      this.server.connect(this.transport)
        .then(() => {
          this.platform.log('debug', 'MCP server connected to SSE transport');
        })
        .catch((error) => {
          this.platform.log('error', 'SSE connection error:', error);
        });
      
      req.on('close', () => {
        this.platform.log('debug', 'SSE connection closed by client');
        this.transport = null;
      });
      
    } catch (error) {
      this.platform.log('error', 'Error setting up SSE connection:', error);
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }
  
  /**
   * Handle incoming messages with security validation
   */
  private async handleMessage(req: express.Request, res: express.Response): Promise<void> {
    try {
      if (!this.transport) {
        res.status(503).json({
          error: 'No active SSE connection',
          message: 'Please reconnect to the SSE endpoint first'
        });
        return;
      }
      
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }
      
      await this.transport.handlePostMessage(req, res);
      
    } catch (error) {
      this.platform.log('error', 'Error handling message:', error);
      res.status(500).json({ error: 'Failed to handle message' });
    }
  }
  
  /**
   * Register MCP handlers with security validation
   */
  private registerMCPHandlers(): void {
    this.registerResourceHandlers();
    this.registerToolHandlers();
    this.registerPromptHandlers();
  }
  
  /**
   * Register resource handlers for memory bank files
   */
  private registerResourceHandlers(): void {
    // Mock MCP server implementation - replace with actual MCP SDK when available
    (this.server as any).setRequestHandler = (method: string, handler: Function) => {
      console.log(`Registered MCP handler for ${method}`);
    };

    (this.server as any).setRequestHandler('resources/list', async () => {
      try {
        const files = await this.memoryBank.getAllFiles();
        
        return {
          resources: files.map(file => ({
            uri: `memory-bank://${file.type}`,
            name: file.type,
            description: `Memory bank file: ${file.type}`,
            mimeType: 'text/markdown'
          }))
        };
      } catch (error) {
        this.platform.log('error', 'Error listing resources:', error);
        throw new MemoryBankError('Failed to list memory bank resources', 'RESOURCE_LIST_ERROR');
      }
    });
    
    (this.server as any).setRequestHandler('resources/read', async (request: any) => {
      try {
        const uri = request.params.uri as string;
        
        // Validate URI format
        if (!uri.startsWith('memory-bank://')) {
          throw new SecurityError('Invalid resource URI');
        }
        
        const fileType = uri.replace('memory-bank://', '');
        
        // Security check
        await this.security.performSecurityCheck('file_operation', {
          operation: 'read',
          filePath: fileType
        });
        
        const file = await this.memoryBank.getFile(fileType as any);
        if (!file) {
          throw new MemoryBankError(`File not found: ${fileType}`, 'FILE_NOT_FOUND');
        }
        
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: file.content
          }]
        };
      } catch (error) {
        this.platform.log('error', 'Error reading resource:', error);
        throw error;
      }
    });
  }
  
  /**
   * Register tool handlers for memory bank operations
   */
  private registerToolHandlers(): void {
    // Update memory bank file tool
    (this.server as any).setRequestHandler('tools/call', async (request: any) => {
      try {
        const { name, arguments: args } = request.params;
        
        switch (name) {
          case 'update_memory_file':
            return await this.handleUpdateMemoryFile(args);
          case 'get_memory_status':
            return await this.handleGetMemoryStatus(args);
          case 'export_memory_bank':
            return await this.handleExportMemoryBank(args);
          default:
            throw new MemoryBankError(`Unknown tool: ${name}`, 'UNKNOWN_TOOL');
        }
      } catch (error) {
        this.platform.log('error', 'Error calling tool:', error);
        throw error;
      }
    });
    
    (this.server as any).setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'update_memory_file',
            description: 'Update a memory bank file with new content',
            inputSchema: {
              type: 'object',
              properties: {
                fileType: { type: 'string', enum: ['projectbrief.md', 'productContext.md', 'activeContext.md', 'systemPatterns.md', 'techContext.md', 'progress.md'] },
                content: { type: 'string' }
              },
              required: ['fileType', 'content']
            }
          },
          {
            name: 'get_memory_status',
            description: 'Get the current status of the memory bank',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'export_memory_bank',
            description: 'Export memory bank data',
            inputSchema: {
              type: 'object',
              properties: {
                format: { type: 'string', enum: ['json', 'markdown'] },
                includeMetadata: { type: 'boolean' }
              }
            }
          }
        ]
      };
    });
  }
  
  /**
   * Register prompt handlers
   */
  private registerPromptHandlers(): void {
    (this.server as any).setRequestHandler('prompts/list', async () => {
      return {
        prompts: [
          {
            name: 'memory_context',
            description: 'Get current memory bank context for AI assistance'
          }
        ]
      };
    });
    
    (this.server as any).setRequestHandler('prompts/get', async (request: any) => {
      const { name } = request.params;
      
      if (name === 'memory_context') {
        const files = await this.memoryBank.getAllFiles();
        const context = files.map(file => `## ${file.type}\n${file.content}`).join('\n\n');
        
        return {
          description: 'Current memory bank context',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Here is the current memory bank context:\n\n${context}`
              }
            }
          ]
        };
      }
      
      throw new MemoryBankError(`Unknown prompt: ${name}`, 'UNKNOWN_PROMPT');
    });
  }

  /**
   * Handle update memory file tool call
   */
  private async handleUpdateMemoryFile(args: any): Promise<any> {
    const schema = z.object({
      fileType: z.string(),
      content: z.string()
    });

    const { fileType, content } = schema.parse(args);

    // Security validation
    await this.security.performSecurityCheck('file_operation', {
      operation: 'write',
      filePath: fileType,
      content
    });

    // Validate content
    const validation = InputValidator.validateMemoryBankContent(content);
    if (!validation.isValid) {
      throw new SecurityError(`Content validation failed: ${validation.errors.join(', ')}`);
    }

    await this.memoryBank.updateFile(fileType as any, validation.sanitizedContent || content);

    // Emit event
    this.platform.emitEvent('fileUpdated', {
      type: 'fileUpdated',
      timestamp: new Date(),
      data: { fileType, contentLength: content.length }
    });

    return {
      content: [{
        type: 'text',
        text: `Successfully updated ${fileType}`
      }]
    };
  }

  /**
   * Handle get memory status tool call
   */
  private async handleGetMemoryStatus(args: any): Promise<any> {
    const files = await this.memoryBank.getAllFiles();
    const status = {
      initialized: files.length > 0,
      fileCount: files.length,
      totalSize: files.reduce((sum, file) => sum + file.content.length, 0),
      lastModified: files.reduce((latest, file) => {
        const fileDate = file.lastUpdated || new Date(0);
        return fileDate > latest ? fileDate : latest;
      }, new Date(0)),
      files: files.map(file => ({
        type: file.type,
        size: file.content.length,
        lastUpdated: file.lastUpdated
      }))
    };

    return {
      content: [{
        type: 'text',
        text: `Memory Bank Status:\n${JSON.stringify(status, null, 2)}`
      }]
    };
  }

  /**
   * Handle export memory bank tool call
   */
  private async handleExportMemoryBank(args: any): Promise<any> {
    const schema = z.object({
      format: z.enum(['json', 'markdown']).default('json'),
      includeMetadata: z.boolean().default(true)
    });

    const { format, includeMetadata } = schema.parse(args);

    // Security check
    await this.security.performSecurityCheck('command_execution', {
      command: 'memory.export',
      args: [format, includeMetadata.toString()]
    });

    const exportData = await this.memoryBank.exportData({
      format,
      includeMetadata,
      includeTemplates: false,
      compression: false
    });

    return {
      content: [{
        type: 'text',
        text: `Memory bank exported in ${format} format:\n\n${exportData}`
      }]
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.platform.log('warn', 'MCP server is already running');
      return;
    }

    try {
      // Initialize memory bank
      await this.memoryBank.initialize();

      return new Promise<void>((resolve, reject) => {
        this.httpServer = this.app.listen(this.options.port, async () => {
          this.isRunning = true;

          // Setup platform-specific integration
          await this.platform.setupPlatformIntegration(this.options.port);

          this.platform.log('info', `Cross-platform MCP server started on port ${this.options.port}`);

          // Emit server started event
          this.platform.emitEvent('serverStarted', {
            type: 'serverStarted',
            timestamp: new Date(),
            data: { port: this.options.port }
          });

          resolve();
        });

        this.httpServer?.on('error', (error: NodeJS.ErrnoException) => {
          this.platform.log('error', 'Server error:', error);

          if (error.code === 'EADDRINUSE') {
            reject(new MemoryBankError(`Port ${this.options.port} is already in use`, 'PORT_IN_USE'));
          } else {
            reject(new MemoryBankError(`Failed to start server: ${error.message}`, 'SERVER_START_ERROR'));
          }
        });
      });
    } catch (error) {
      this.platform.log('error', 'Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.platform.log('warn', 'MCP server is not running');
      return;
    }

    try {
      // Teardown platform integration
      await this.platform.teardownPlatformIntegration();

      // Close HTTP server
      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer!.close(() => {
            this.isRunning = false;
            this.platform.log('info', 'MCP server stopped');

            // Emit server stopped event
            this.platform.emitEvent('serverStopped', {
              type: 'serverStopped',
              timestamp: new Date(),
              data: {}
            });

            resolve();
          });
        });
      }

      // Clean up transport
      this.transport = null;

    } catch (error) {
      this.platform.log('error', 'Error stopping MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    port: number;
    platform: string;
    uptime?: number;
  } {
    return {
      isRunning: this.isRunning,
      port: this.options.port,
      platform: this.platform.config.name,
      uptime: this.isRunning ? Date.now() : undefined
    };
  }

  /**
   * Get server port
   */
  getPort(): number {
    return this.options.port;
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
