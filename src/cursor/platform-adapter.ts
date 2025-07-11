/**
 * Cursor platform adapter implementation
 * Provides Cursor-specific functionality while implementing the platform interface
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';

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
 * Cursor-specific platform adapter
 */
export class CursorPlatformAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'cursor',
    version: '2.0.0',
    capabilities: {
      mcpIntegration: true,
      aiChatProvider: true,
      customCommands: true
    }
  };
  
  constructor(private context: vscode.ExtensionContext) {
    super();
    this.log('info', 'Cursor platform adapter initialized');
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
      await this.updateCursorMCPConfig(serverPort);
      this.log('info', `Cursor MCP integration setup completed on port ${serverPort}`);
    } catch (error) {
      this.log('error', 'Failed to setup Cursor MCP integration:', error);
      throw error;
    }
  }
  
  async teardownPlatformIntegration(): Promise<void> {
    // For Cursor, we typically don't need to remove the MCP config
    // as it's useful to keep it for future sessions
    this.log('info', 'Cursor platform integration teardown completed');
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
   * Update Cursor MCP configuration
   */
  private async updateCursorMCPConfig(port: number): Promise<void> {
    try {
      const homeDir = os.homedir();
      const mcpConfigPath = path.join(homeDir, '.cursor', 'mcp.json');
      
      // Create server config
      const serverConfig = {
        name: "Cross-Platform Memory Bank",
        url: `http://localhost:${port}/sse`,
      };
      
      // Ensure .cursor directory exists
      const cursorDir = path.join(homeDir, '.cursor');
      try {
        await fs.mkdir(cursorDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }
      
      // Read existing config
      let existingConfig: { mcpServers?: Record<string, any> } = {};
      try {
        const fileContent = await fs.readFile(mcpConfigPath, 'utf-8');
        existingConfig = JSON.parse(fileContent);
      } catch (err) {
        // File doesn't exist or isn't valid JSON
        existingConfig = { mcpServers: {} };
      }
      
      // Initialize mcpServers if needed
      if (!existingConfig.mcpServers) {
        existingConfig.mcpServers = {};
      }
      
      // Update configuration
      const serverKey = "Cross-Platform Memory Bank";
      const existingEntry = existingConfig.mcpServers[serverKey];
      
      if (!existingEntry || existingEntry.url !== serverConfig.url) {
        existingConfig.mcpServers[serverKey] = serverConfig;
        
        await fs.writeFile(
          mcpConfigPath,
          JSON.stringify(existingConfig, null, 2)
        );
        
        this.log('info', `Cursor MCP config updated for port ${port}`);
        await this.showInformationMessage(
          `Cursor MCP config updated to use Cross-Platform Memory Bank on port ${port}`
        );
      } else {
        this.log('debug', 'Cursor MCP config already up to date');
      }
      
    } catch (error) {
      this.log('error', 'Failed to update Cursor MCP config:', error);
      await this.showErrorMessage(
        `Failed to update Cursor MCP config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}
