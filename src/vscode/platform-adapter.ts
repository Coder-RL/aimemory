/**
 * VS Code platform adapter implementation
 * Provides VS Code-specific functionality while implementing the platform interface
 */

import * as vscode from 'vscode';
import * as path from 'path';

import { 
  BasePlatformAdapter, 
  PlatformInterface 
} from '../shared/platform-interface';
import {
  Disposable,
  WorkspaceFolder,
  WebviewOptions,
  WebviewPanel,
  PlatformConfig
} from '../shared/types';

/**
 * VS Code-specific platform adapter
 */
export class VSCodePlatformAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'vscode',
    version: '2.0.0',
    capabilities: {
      mcpIntegration: false, // VS Code doesn't have built-in MCP support
      aiChatProvider: true,  // Can integrate with AI extensions
      customCommands: true
    }
  };
  
  constructor(private context: vscode.ExtensionContext) {
    super();
    this.log('info', 'VS Code platform adapter initialized');
  }
  
  // UI Operations
  async showInformationMessage(message: string): Promise<void> {
    vscode.window.showInformationMessage(message);
  }
  
  async showErrorMessage(message: string): Promise<void> {
    vscode.window.showErrorMessage(message);
  }
  
  async showWarningMessage(message: string): Promise<void> {
    vscode.window.showWarningMessage(message);
  }
  
  async showInputBox(options: {
    prompt?: string;
    placeholder?: string;
    value?: string;
    password?: boolean;
  }): Promise<string | undefined> {
    return vscode.window.showInputBox({
      prompt: options.prompt,
      placeHolder: options.placeholder,
      value: options.value,
      password: options.password
    });
  }
  
  // Workspace Operations
  getWorkspaceRoot(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath;
  }
  
  getWorkspaceFolders(): WorkspaceFolder[] {
    const folders = vscode.workspace.workspaceFolders || [];
    return folders.map(folder => ({
      uri: {
        fsPath: folder.uri.fsPath,
        scheme: folder.uri.scheme
      },
      name: folder.name,
      index: folder.index
    }));
  }
  
  onDidChangeWorkspaceFolders(listener: (event: any) => void): Disposable {
    const subscription = vscode.workspace.onDidChangeWorkspaceFolders(listener);
    this.disposables.push(subscription);
    return subscription;
  }
  
  // Command Registration and Execution
  registerCommand(command: string, callback: (...args: any[]) => any): Disposable {
    const subscription = vscode.commands.registerCommand(command, callback);
    this.disposables.push(subscription);
    return subscription;
  }
  
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    return vscode.commands.executeCommand(command, ...args);
  }
  
  // File System Operations
  async readFile(path: string): Promise<string> {
    try {
      const uri = vscode.Uri.file(path);
      const data = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(data).toString('utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(path);
      const data = Buffer.from(content, 'utf8');
      await vscode.workspace.fs.writeFile(uri, data);
    } catch (error) {
      throw new Error(`Failed to write file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async fileExists(path: string): Promise<boolean> {
    try {
      const uri = vscode.Uri.file(path);
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }
  
  async createDirectory(path: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(path);
      await vscode.workspace.fs.createDirectory(uri);
    } catch (error) {
      throw new Error(`Failed to create directory ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async deleteFile(path: string): Promise<void> {
    try {
      const uri = vscode.Uri.file(path);
      await vscode.workspace.fs.delete(uri);
    } catch (error) {
      throw new Error(`Failed to delete file ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getFileStats(path: string): Promise<{
    size: number;
    mtime: Date;
    isFile: boolean;
    isDirectory: boolean;
  }> {
    try {
      const uri = vscode.Uri.file(path);
      const stat = await vscode.workspace.fs.stat(uri);
      return {
        size: stat.size,
        mtime: new Date(stat.mtime),
        isFile: stat.type === vscode.FileType.File,
        isDirectory: stat.type === vscode.FileType.Directory
      };
    } catch (error) {
      throw new Error(`Failed to get file stats for ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Configuration Management
  getConfiguration(section: string): any {
    return vscode.workspace.getConfiguration(section);
  }
  
  async updateConfiguration(
    section: string, 
    value: any, 
    target: 'global' | 'workspace' = 'workspace'
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const configTarget = target === 'global' 
      ? vscode.ConfigurationTarget.Global 
      : vscode.ConfigurationTarget.Workspace;
    
    await config.update(section, value, configTarget);
  }
  
  onDidChangeConfiguration(listener: (event: any) => void): Disposable {
    const subscription = vscode.workspace.onDidChangeConfiguration(listener);
    this.disposables.push(subscription);
    return subscription;
  }
  
  // Webview Operations
  createWebviewPanel(
    viewType: string,
    title: string,
    column: number,
    options: WebviewOptions
  ): WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      column,
      {
        enableScripts: options.enableScripts,
        localResourceRoots: options.localResourceRoots?.map(root => vscode.Uri.parse(root)),
        retainContextWhenHidden: options.retainContextWhenHidden
      }
    );
    
    return {
      webview: {
        get html() { return panel.webview.html; },
        set html(value: string) { panel.webview.html = value; },
        postMessage: (message: any) => panel.webview.postMessage(message),
        onDidReceiveMessage: (listener: (message: any) => void) => {
          const subscription = panel.webview.onDidReceiveMessage(listener);
          return subscription;
        },
        asWebviewUri: (uri: any) => panel.webview.asWebviewUri(uri)
      },
      reveal: (column?: number) => panel.reveal(column),
      onDidDispose: (listener: () => void) => {
        const subscription = panel.onDidDispose(listener);
        return subscription;
      },
      dispose: () => panel.dispose()
    };
  }
  
  // Platform-Specific Integration
  async setupPlatformIntegration(serverPort: number): Promise<void> {
    try {
      // For VS Code, we set up alternative integration methods
      await this.setupVSCodeIntegration(serverPort);
      this.log('info', `VS Code integration setup completed on port ${serverPort}`);
    } catch (error) {
      this.log('error', 'Failed to setup VS Code integration:', error);
      throw error;
    }
  }
  
  async teardownPlatformIntegration(): Promise<void> {
    // Clean up VS Code-specific integrations
    this.log('info', 'VS Code platform integration teardown completed');
  }
  
  // Extension Context
  getExtensionPath(): string {
    return this.context.extensionPath;
  }
  
  getGlobalStoragePath(): string {
    return this.context.globalStorageUri.fsPath;
  }
  
  getWorkspaceStoragePath(): string {
    return this.context.storageUri?.fsPath || this.context.globalStorageUri.fsPath;
  }
  
  /**
   * Setup VS Code-specific integration
   * Since VS Code doesn't have built-in MCP support, we use alternative methods
   */
  private async setupVSCodeIntegration(serverPort: number): Promise<void> {
    try {
      // Store server configuration in VS Code settings
      await this.updateConfiguration('aimemory.serverPort', serverPort, 'workspace');
      await this.updateConfiguration('aimemory.serverUrl', `http://localhost:${serverPort}`, 'workspace');
      
      // Register VS Code-specific commands for memory bank interaction
      this.registerVSCodeCommands(serverPort);
      
      // Setup status bar integration
      this.setupStatusBarIntegration(serverPort);
      
      // Notify user about VS Code integration
      await this.showInformationMessage(
        `Memory Bank server started on port ${serverPort}. Use the command palette to interact with memory bank.`
      );
      
      this.log('info', 'VS Code integration configured successfully');
      
    } catch (error) {
      this.log('error', 'Failed to setup VS Code integration:', error);
      throw error;
    }
  }
  
  /**
   * Register VS Code-specific commands
   */
  private registerVSCodeCommands(serverPort: number): void {
    // Command to open memory bank dashboard
    this.registerCommand('aimemory.openDashboard', () => {
      this.executeCommand('aimemory.openWebview');
    });
    
    // Command to update memory bank file
    this.registerCommand('aimemory.updateMemoryFile', async () => {
      const fileType = await vscode.window.showQuickPick([
        'projectbrief.md',
        'productContext.md',
        'activeContext.md',
        'systemPatterns.md',
        'techContext.md',
        'progress.md'
      ], {
        placeHolder: 'Select memory bank file to update'
      });
      
      if (fileType) {
        const content = await vscode.window.showInputBox({
          prompt: `Enter content for ${fileType}`,
          value: '',
          ignoreFocusOut: true
        });
        
        if (content) {
          // Send update request to MCP server
          try {
            const response = await fetch(`http://localhost:${serverPort}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                method: 'tools/call',
                params: {
                  name: 'update_memory_file',
                  arguments: { fileType, content }
                }
              })
            });
            
            if (response.ok) {
              await this.showInformationMessage(`Successfully updated ${fileType}`);
            } else {
              await this.showErrorMessage(`Failed to update ${fileType}`);
            }
          } catch (error) {
            await this.showErrorMessage(`Error updating memory bank: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    });
    
    // Command to get memory bank status
    this.registerCommand('aimemory.getStatus', async () => {
      try {
        const response = await fetch(`http://localhost:${serverPort}/health`);
        if (response.ok) {
          const status = await response.json();
          await this.showInformationMessage(`Memory Bank Status: ${status.status} (${status.platform})`);
        } else {
          await this.showErrorMessage('Failed to get memory bank status');
        }
      } catch (error) {
        await this.showErrorMessage(`Error getting status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
  
  /**
   * Setup status bar integration
   */
  private setupStatusBarIntegration(serverPort: number): void {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(database) Memory Bank";
    statusBarItem.tooltip = `Memory Bank Server (Port: ${serverPort})`;
    statusBarItem.command = 'aimemory.openDashboard';
    statusBarItem.show();
    
    // Add to disposables for cleanup
    this.disposables.push(statusBarItem);
  }
}
