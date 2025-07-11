/**
 * VS Code extension entry point
 * Integrates with the cross-platform memory bank system
 */

import * as vscode from 'vscode';
import { VSCodePlatformAdapter } from './platform-adapter';
import { PlatformAgnosticMCPServer } from '../shared/mcp-server';
import { EnhancedMemoryBankService } from '../shared/memory-bank-service';
import { MCPServerOptions, SecurityConfig } from '../shared/types';
import { WebviewManager } from '../webviewManager';

let mcpServer: PlatformAgnosticMCPServer | null = null;
let memoryBankService: EnhancedMemoryBankService | null = null;
let platformAdapter: VSCodePlatformAdapter | null = null;
let webviewManager: WebviewManager | null = null;

/**
 * Activate the VS Code extension
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('Activating VS Code Memory Bank extension...');
    
    // Initialize platform adapter
    platformAdapter = new VSCodePlatformAdapter(context);
    
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
    
    // Register VS Code-specific commands
    registerVSCodeSpecificCommands(context, platformAdapter);
    
    // Setup AI integration if available
    await setupAIIntegration(context, platformAdapter);
    
    platformAdapter.log('info', 'VS Code Memory Bank extension activated successfully');
    
  } catch (error) {
    console.error('Failed to activate VS Code Memory Bank extension:', error);
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
    console.log('Deactivating VS Code Memory Bank extension...');
    
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
    
    console.log('VS Code Memory Bank extension deactivated');
    
  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}

/**
 * Register common commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  platform: VSCodePlatformAdapter,
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
 * Register VS Code-specific commands
 */
function registerVSCodeSpecificCommands(
  context: vscode.ExtensionContext,
  platform: VSCodePlatformAdapter
): void {
  
  // Command to insert memory bank context into current editor
  const insertContextCommand = platform.registerCommand('aimemory.insertContext', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !memoryBankService) {
        await platform.showWarningMessage('No active editor or memory bank service not available');
        return;
      }
      
      // Get memory bank context
      const files = memoryBankService.getAllFiles();
      const context = files.map(file => `## ${file.type}\n${file.content}`).join('\n\n');
      
      // Insert at cursor position
      const position = editor.selection.active;
      await editor.edit(editBuilder => {
        editBuilder.insert(position, `\n<!-- Memory Bank Context -->\n${context}\n<!-- End Memory Bank Context -->\n`);
      });
      
      await platform.showInformationMessage('Memory bank context inserted');
      
    } catch (error) {
      await platform.showErrorMessage(`Failed to insert context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Command to create memory bank summary
  const createSummaryCommand = platform.registerCommand('aimemory.createSummary', async () => {
    try {
      if (!memoryBankService) {
        await platform.showErrorMessage('Memory bank service not initialized');
        return;
      }
      
      const stats = memoryBankService.getStatistics();
      const files = memoryBankService.getAllFiles();
      
      const summary = `# Memory Bank Summary
      
Generated: ${new Date().toISOString()}

## Statistics
- Total Files: ${stats.totalFiles}
- Total Size: ${stats.totalSize} bytes
- Average File Size: ${stats.averageFileSize} bytes
- Last Modified: ${stats.lastModified?.toISOString() || 'N/A'}

## Files
${files.map(file => `### ${file.type}
Last Updated: ${file.lastUpdated?.toISOString() || 'N/A'}
Size: ${file.content.length} characters

${file.content.substring(0, 200)}${file.content.length > 200 ? '...' : ''}
`).join('\n')}`;
      
      // Create new document with summary
      const doc = await vscode.workspace.openTextDocument({
        content: summary,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(doc);
      
    } catch (error) {
      await platform.showErrorMessage(`Failed to create summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Command to update memory bank from current file
  const updateFromFileCommand = platform.registerCommand('aimemory.updateFromFile', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !memoryBankService) {
        await platform.showWarningMessage('No active editor or memory bank service not available');
        return;
      }
      
      const content = editor.document.getText();
      if (!content.trim()) {
        await platform.showWarningMessage('Current file is empty');
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
        placeHolder: 'Select memory bank file to update with current file content'
      });
      
      if (fileType) {
        await memoryBankService.updateFile(fileType as any, content);
        await platform.showInformationMessage(`Updated ${fileType} with current file content`);
      }
      
    } catch (error) {
      await platform.showErrorMessage(`Failed to update memory bank from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  context.subscriptions.push(
    insertContextCommand,
    createSummaryCommand,
    updateFromFileCommand
  );
}

/**
 * Setup AI integration with available VS Code AI extensions
 */
async function setupAIIntegration(
  context: vscode.ExtensionContext,
  platform: VSCodePlatformAdapter
): Promise<void> {
  try {
    // Check for GitHub Copilot
    const copilotExtension = vscode.extensions.getExtension('GitHub.copilot');
    if (copilotExtension) {
      platform.log('info', 'GitHub Copilot detected, setting up integration');
      // Setup Copilot integration if needed
    }
    
    // Check for other AI extensions
    const aiExtensions = vscode.extensions.all.filter(ext => 
      ext.id.toLowerCase().includes('ai') || 
      ext.id.toLowerCase().includes('copilot') ||
      ext.id.toLowerCase().includes('assistant')
    );
    
    if (aiExtensions.length > 0) {
      platform.log('info', `Found ${aiExtensions.length} AI-related extensions`);
    }
    
    // Register AI integration commands
    const aiIntegrationCommand = platform.registerCommand('aimemory.aiIntegration', async () => {
      await platform.showInformationMessage(
        'AI Integration: Memory bank context is available through the web dashboard and can be manually copied to AI assistants.'
      );
    });
    
    context.subscriptions.push(aiIntegrationCommand);
    
  } catch (error) {
    platform.log('warn', 'Failed to setup AI integration:', error);
  }
}
