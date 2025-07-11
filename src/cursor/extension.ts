/**
 * Cursor extension entry point
 * Integrates with the cross-platform memory bank system
 */

import * as vscode from 'vscode';
import { CursorPlatformAdapter } from './platform-adapter';
import { PlatformAgnosticMCPServer } from '../shared/mcp-server';
import { EnhancedMemoryBankService } from '../shared/memory-bank-service';
import { MCPServerOptions, SecurityConfig } from '../shared/types';
import { WebviewManager } from '../webviewManager';

let mcpServer: PlatformAgnosticMCPServer | null = null;
let memoryBankService: EnhancedMemoryBankService | null = null;
let platformAdapter: CursorPlatformAdapter | null = null;
let webviewManager: WebviewManager | null = null;

/**
 * Activate the Cursor extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('Activating Cursor Memory Bank extension...');
    
    // Initialize platform adapter
    platformAdapter = new CursorPlatformAdapter(context);
    
    // Initialize memory bank service
    memoryBankService = new EnhancedMemoryBankService(platformAdapter);
    
    // Get configuration
    const config = platformAdapter.getConfiguration('aimemory');
    const port = config.get<number>('serverPort', 7331);
    
    // Create security configuration
    const securityConfig: SecurityConfig = {
      maxFileSize: config.get<number>('maxFileSize', 1024 * 1024), // 1MB
      allowedExtensions: config.get<string[]>('allowedExtensions', ['.md', '.txt', '.json']),
      allowedPaths: config.get<string[]>('allowedPaths', ['memory-bank']),
      enableContentSanitization: config.get<boolean>('enableContentSanitization', true)
    };
    
    // Create MCP server options
    const mcpOptions: MCPServerOptions = {
      port,
      security: securityConfig,
      platform: platformAdapter.config,
      enableLogging: config.get<boolean>('enableLogging', true),
      enableMetrics: config.get<boolean>('enableMetrics', false)
    };
    
    // Initialize MCP server
    mcpServer = new PlatformAgnosticMCPServer(
      platformAdapter,
      memoryBankService,
      mcpOptions
    );
    
    // Initialize webview manager
    webviewManager = new WebviewManager(context, memoryBankService, platformAdapter);
    
    // Register commands
    registerCommands(context, platformAdapter, mcpServer, memoryBankService, webviewManager);
    
    // Start MCP server
    await mcpServer.start();
    
    // Register Cursor-specific commands
    registerCursorSpecificCommands(context, platformAdapter);
    
    platformAdapter.log('info', 'Cursor Memory Bank extension activated successfully');
    
  } catch (error) {
    console.error('Failed to activate Cursor Memory Bank extension:', error);
    vscode.window.showErrorMessage(
      `Failed to activate Memory Bank extension: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Deactivate the extension
 */
export async function deactivate(): Promise<void> {
  try {
    console.log('Deactivating Cursor Memory Bank extension...');
    
    // Stop MCP server
    if (mcpServer) {
      await mcpServer.stop();
      mcpServer = null;
    }
    
    // Dispose webview manager
    if (webviewManager) {
      webviewManager.dispose();
      webviewManager = null;
    }
    
    // Dispose platform adapter
    if (platformAdapter) {
      platformAdapter.dispose();
      platformAdapter = null;
    }
    
    memoryBankService = null;
    
    console.log('Cursor Memory Bank extension deactivated');
    
  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}

/**
 * Register common commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  platform: CursorPlatformAdapter,
  server: PlatformAgnosticMCPServer,
  memoryBank: EnhancedMemoryBankService,
  webview: WebviewManager
): void {
  
  // Open memory bank webview
  const openWebviewCommand = platform.registerCommand('aimemory.openWebview', () => {
    webview.createOrShowWebview();
  });
  
  // Start MCP server
  const startServerCommand = platform.registerCommand('aimemory.startServer', async () => {
    try {
      if (server.isServerRunning()) {
        await platform.showInformationMessage('MCP server is already running');
        return;
      }
      
      await server.start();
      await platform.showInformationMessage(`MCP server started on port ${server.getPort()}`);
    } catch (error) {
      await platform.showErrorMessage(`Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Stop MCP server
  const stopServerCommand = platform.registerCommand('aimemory.stopServer', async () => {
    try {
      if (!server.isServerRunning()) {
        await platform.showInformationMessage('MCP server is not running');
        return;
      }
      
      await server.stop();
      await platform.showInformationMessage('MCP server stopped');
    } catch (error) {
      await platform.showErrorMessage(`Failed to stop MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Get server status
  const getStatusCommand = platform.registerCommand('aimemory.getStatus', async () => {
    try {
      const status = server.getStatus();
      const statusMessage = `Memory Bank Server Status:
- Running: ${status.isRunning}
- Port: ${status.port}
- Platform: ${status.platform}
- Uptime: ${status.uptime ? Math.round((Date.now() - status.uptime) / 1000) + 's' : 'N/A'}`;
      
      await platform.showInformationMessage(statusMessage);
    } catch (error) {
      await platform.showErrorMessage(`Failed to get server status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Export memory bank
  const exportCommand = platform.registerCommand('aimemory.export', async () => {
    try {
      const format = await vscode.window.showQuickPick(['json', 'markdown'], {
        placeHolder: 'Select export format'
      });
      
      if (!format) return;
      
      const exportData = await memoryBank.exportData({
        format: format as 'json' | 'markdown',
        includeMetadata: true,
        includeTemplates: false,
        compression: false
      });
      
      // Save to file
      const workspaceRoot = platform.getWorkspaceRoot();
      if (workspaceRoot) {
        const exportPath = `${workspaceRoot}/memory-bank-export-${Date.now()}.${format}`;
        await platform.writeFile(exportPath, exportData);
        await platform.showInformationMessage(`Memory bank exported to: ${exportPath}`);
      }
    } catch (error) {
      await platform.showErrorMessage(`Failed to export memory bank: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Validate memory bank integrity
  const validateCommand = platform.registerCommand('aimemory.validate', async () => {
    try {
      const validation = await memoryBank.validateIntegrity();
      
      if (validation.isValid) {
        await platform.showInformationMessage('Memory bank integrity check passed');
      } else {
        const errorMessage = `Memory bank integrity check failed:\n${validation.errors.join('\n')}`;
        await platform.showErrorMessage(errorMessage);
      }
      
      if (validation.warnings.length > 0) {
        const warningMessage = `Warnings found:\n${validation.warnings.join('\n')}`;
        await platform.showWarningMessage(warningMessage);
      }
    } catch (error) {
      await platform.showErrorMessage(`Failed to validate memory bank: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Add commands to context for disposal
  context.subscriptions.push(
    openWebviewCommand,
    startServerCommand,
    stopServerCommand,
    getStatusCommand,
    exportCommand,
    validateCommand
  );
}

/**
 * Register Cursor-specific commands
 */
function registerCursorSpecificCommands(
  context: vscode.ExtensionContext,
  platform: CursorPlatformAdapter
): void {
  
  // Intercept Cursor's new chat command to include memory bank context
  const newChatCommand = platform.registerCommand('cursor.newChatWithMemory', async () => {
    try {
      if (!memoryBankService) {
        await platform.showErrorMessage('Memory bank service not initialized');
        return;
      }
      
      // Get memory bank context
      const files = memoryBankService.getAllFiles();
      const context = files.map(file => `## ${file.type}\n${file.content}`).join('\n\n');
      
      // Create context message
      const contextMessage = `Here is the current memory bank context for this project:\n\n${context}\n\nPlease use this context to assist with the following request:`;
      
      // Execute Cursor's new chat command with context
      await platform.executeCommand('_cursor.newChat', contextMessage);
      
    } catch (error) {
      platform.log('error', 'Error in newChatWithMemory command:', error);
      await platform.showErrorMessage(`Failed to start new chat with memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Command to update memory bank from current selection
  const updateFromSelectionCommand = vscode.commands.registerTextEditorCommand(
    'aimemory.updateFromSelection',
    async (textEditor: vscode.TextEditor) => {
      try {
        const selection = textEditor.selection;
        const selectedText = textEditor.document.getText(selection);
        
        if (!selectedText.trim()) {
          await platform.showWarningMessage('No text selected');
          return;
        }
        
        // Ask user which memory bank file to update
        const fileType = await vscode.window.showQuickPick([
          'projectbrief.md',
          'productContext.md',
          'activeContext.md',
          'systemPatterns.md',
          'techContext.md',
          'progress.md'
        ], {
          placeHolder: 'Select memory bank file to update with selection'
        });
        
        if (fileType && memoryBankService) {
          await memoryBankService.updateFile(fileType as any, selectedText);
          await platform.showInformationMessage(`Updated ${fileType} with selected text`);
        }
        
      } catch (error) {
        await platform.showErrorMessage(`Failed to update memory bank from selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
  
  context.subscriptions.push(newChatCommand, updateFromSelectionCommand);
}
