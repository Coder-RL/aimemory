/**
 * Enhanced webview manager that works with the platform abstraction layer
 * Provides cross-platform webview functionality for the memory bank dashboard
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { PlatformInterface } from './platform-interface';
import { EnhancedMemoryBankService } from './memory-bank-service';
import { WebviewPanel } from './types';

export class EnhancedWebviewManager {
  private panel: WebviewPanel | undefined;
  private readonly platform: PlatformInterface;
  private readonly memoryBank: EnhancedMemoryBankService;
  private readonly context: vscode.ExtensionContext;
  
  constructor(
    context: vscode.ExtensionContext,
    memoryBank: EnhancedMemoryBankService,
    platform: PlatformInterface
  ) {
    this.context = context;
    this.memoryBank = memoryBank;
    this.platform = platform;
  }
  
  /**
   * Create or show the webview panel
   */
  createOrShowWebview(): void {
    const column = vscode.ViewColumn.One;
    
    // If we already have a panel, show it
    if (this.panel) {
      this.panel.reveal(column);
      return;
    }
    
    // Otherwise, create a new panel
    this.panel = this.platform.createWebviewPanel(
      'memoryBankDashboard',
      'Memory Bank Dashboard',
      column,
      {
        enableScripts: true,
        localResourceRoots: [this.platform.getExtensionPath()],
        retainContextWhenHidden: true
      }
    );
    
    // Set the webview's initial html content
    this.panel.webview.html = this.getWebviewContent();
    
    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        await this.handleWebviewMessage(message);
      }
    );
    
    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
    
    this.platform.log('info', 'Memory bank webview created');
  }
  
  /**
   * Handle messages from the webview
   */
  private async handleWebviewMessage(message: any): Promise<void> {
    try {
      switch (message.command) {
        case 'getMemoryBankData':
          await this.sendMemoryBankData();
          break;
          
        case 'updateFile':
          await this.handleUpdateFile(message.fileType, message.content);
          break;
          
        case 'exportData':
          await this.handleExportData(message.format);
          break;
          
        case 'importData':
          await this.handleImportData(message.data);
          break;
          
        case 'validateIntegrity':
          await this.handleValidateIntegrity();
          break;
          
        case 'getStatistics':
          await this.sendStatistics();
          break;
          
        default:
          this.platform.log('warn', `Unknown webview command: ${message.command}`);
      }
    } catch (error) {
      this.platform.log('error', 'Error handling webview message:', error);
      await this.sendError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Send memory bank data to webview
   */
  private async sendMemoryBankData(): Promise<void> {
    const files = this.memoryBank.getAllEnhancedFiles();
    const isInitialized = await this.memoryBank.getIsMemoryBankInitialized();
    
    await this.panel?.webview.postMessage({
      command: 'memoryBankData',
      data: {
        files,
        isInitialized,
        platform: this.platform.config.name
      }
    });
  }
  
  /**
   * Handle file update from webview
   */
  private async handleUpdateFile(fileType: string, content: string): Promise<void> {
    await this.memoryBank.updateFile(fileType as any, content);
    await this.sendMemoryBankData(); // Refresh data
    await this.sendSuccess(`Successfully updated ${fileType}`);
  }
  
  /**
   * Handle export data request
   */
  private async handleExportData(format: 'json' | 'markdown'): Promise<void> {
    const exportData = await this.memoryBank.exportData({
      format,
      includeMetadata: true,
      includeTemplates: false,
      compression: false
    });
    
    await this.panel?.webview.postMessage({
      command: 'exportResult',
      data: {
        format,
        content: exportData,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  /**
   * Handle import data request
   */
  private async handleImportData(data: string): Promise<void> {
    await this.memoryBank.importData(data, {
      overwriteExisting: true,
      validateContent: true,
      createBackup: true
    });
    
    await this.sendMemoryBankData(); // Refresh data
    await this.sendSuccess('Memory bank data imported successfully');
  }
  
  /**
   * Handle integrity validation request
   */
  private async handleValidateIntegrity(): Promise<void> {
    const validation = await this.memoryBank.validateIntegrity();
    
    await this.panel?.webview.postMessage({
      command: 'validationResult',
      data: validation
    });
  }
  
  /**
   * Send statistics to webview
   */
  private async sendStatistics(): Promise<void> {
    const stats = this.memoryBank.getStatistics();
    
    await this.panel?.webview.postMessage({
      command: 'statistics',
      data: stats
    });
  }
  
  /**
   * Send success message to webview
   */
  private async sendSuccess(message: string): Promise<void> {
    await this.panel?.webview.postMessage({
      command: 'success',
      message
    });
  }
  
  /**
   * Send error message to webview
   */
  private async sendError(message: string): Promise<void> {
    await this.panel?.webview.postMessage({
      command: 'error',
      message
    });
  }
  
  /**
   * Get the webview HTML content
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memory Bank Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .platform-badge {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .file-section {
            margin-bottom: 30px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        .file-header {
            background: var(--vscode-editor-background);
            padding: 10px 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .file-content {
            padding: 15px;
        }
        textarea {
            width: 100%;
            min-height: 200px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 10px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .secondary-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .secondary-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 5px;
        }
        .message {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
        }
        .success {
            background: var(--vscode-inputValidation-infoBackground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            color: var(--vscode-inputValidation-infoForeground);
        }
        .error {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            color: var(--vscode-inputValidation-errorForeground);
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        .search-container {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .search-input {
            flex: 1;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        .file-tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
            overflow-x: auto;
        }
        .file-tab {
            padding: 10px 20px;
            background: var(--vscode-tab-inactiveBackground);
            color: var(--vscode-tab-inactiveForeground);
            border: none;
            cursor: pointer;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
        }
        .file-tab.active {
            background: var(--vscode-tab-activeBackground);
            color: var(--vscode-tab-activeForeground);
            border-bottom-color: var(--vscode-tab-activeBorder);
        }
        .file-tab:hover {
            background: var(--vscode-tab-hoverBackground);
        }
        .editor-container {
            display: none;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
        }
        .editor-container.active {
            display: block;
        }
        .editor-header {
            background: var(--vscode-editor-background);
            padding: 10px 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .editor-content {
            padding: 0;
        }
        .editor-textarea {
            width: 100%;
            min-height: 400px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: none;
            padding: 15px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: vertical;
            line-height: 1.5;
        }
        .editor-textarea:focus {
            outline: none;
        }
        .toolbar {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 20px;
            padding: 10px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }
        .auto-save-indicator {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .auto-save-indicator.saving {
            color: var(--vscode-textLink-foreground);
        }
        .word-count {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-left: auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Memory Bank Dashboard <span class="platform-badge" id="platform-badge">Loading...</span></h1>
        <div class="toolbar">
            <button onclick="refreshData()">Refresh</button>
            <button onclick="exportData('json')" class="secondary-button">Export JSON</button>
            <button onclick="exportData('markdown')" class="secondary-button">Export Markdown</button>
            <button onclick="validateIntegrity()" class="secondary-button">Validate</button>
            <button onclick="toggleAutoSave()" class="secondary-button" id="auto-save-btn">Auto-save: ON</button>
            <span class="auto-save-indicator" id="auto-save-status">Ready</span>
        </div>
    </div>

    <div class="search-container">
        <input type="text" class="search-input" id="search-input" placeholder="Search memory bank content..." onkeyup="searchContent()">
        <button onclick="clearSearch()" class="secondary-button">Clear</button>
    </div>
    
    <div id="messages"></div>
    
    <div id="statistics" class="stats-grid" style="display: none;">
        <!-- Statistics will be populated here -->
    </div>
    
    <div class="file-tabs" id="file-tabs" style="display: none;">
        <!-- File tabs will be populated here -->
    </div>

    <div id="content">
        <div class="loading">Loading memory bank data...</div>
    </div>

    <div id="editors" style="display: none;">
        <!-- File editors will be populated here -->
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let memoryBankData = null;
        let autoSaveEnabled = true;
        let autoSaveTimeout = null;
        let currentActiveTab = null;
        let searchResults = [];

        // Request initial data
        vscode.postMessage({ command: 'getMemoryBankData' });
        vscode.postMessage({ command: 'getStatistics' });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'memoryBankData':
                    memoryBankData = message.data;
                    renderMemoryBank(message.data);
                    break;
                case 'statistics':
                    renderStatistics(message.data);
                    break;
                case 'success':
                    showMessage(message.message, 'success');
                    break;
                case 'error':
                    showMessage(message.message, 'error');
                    break;
                case 'exportResult':
                    downloadExport(message.data);
                    break;
                case 'validationResult':
                    showValidationResult(message.data);
                    break;
            }
        });

        function renderMemoryBank(data) {
            const platformBadge = document.getElementById('platform-badge');
            platformBadge.textContent = data.platform.toUpperCase();

            const content = document.getElementById('content');
            const fileTabs = document.getElementById('file-tabs');
            const editors = document.getElementById('editors');

            if (!data.isInitialized) {
                content.innerHTML = '<div class="message error">Memory bank not initialized. Please initialize it first.</div>';
                fileTabs.style.display = 'none';
                editors.style.display = 'none';
                return;
            }

            // Show tabbed interface
            content.style.display = 'none';
            fileTabs.style.display = 'flex';
            editors.style.display = 'block';

            // Render file tabs
            fileTabs.innerHTML = data.files.map((file, index) => \`
                <button class="file-tab \${index === 0 ? 'active' : ''}"
                        onclick="switchTab('\${file.type}')"
                        id="tab-\${file.type}">
                    \${file.type}
                    <span style="margin-left: 8px; font-size: 10px; opacity: 0.7;">
                        \${(file.content.length / 1024).toFixed(1)}KB
                    </span>
                </button>
            \`).join('');

            // Render file editors
            editors.innerHTML = data.files.map((file, index) => \`
                <div class="editor-container \${index === 0 ? 'active' : ''}" id="editor-\${file.type}">
                    <div class="editor-header">
                        <div>
                            <h3>\${file.type}</h3>
                            <small>Modified: \${new Date(file.lastUpdated).toLocaleString()}</small>
                        </div>
                        <div>
                            <span class="word-count" id="word-count-\${file.type}">
                                \${file.content.split(/\\s+/).filter(w => w.length > 0).length} words
                            </span>
                            <button onclick="updateFile('\${file.type}')" style="margin-left: 10px;">Save</button>
                        </div>
                    </div>
                    <div class="editor-content">
                        <textarea class="editor-textarea"
                                  id="content-\${file.type}"
                                  placeholder="Enter content for \${file.type}..."
                                  oninput="handleContentChange('\${file.type}')">\${file.content}</textarea>
                    </div>
                </div>
            \`).join('');

            // Set current active tab
            if (data.files.length > 0) {
                currentActiveTab = data.files[0].type;
            }
        }

        function renderStatistics(stats) {
            const statsDiv = document.getElementById('statistics');
            statsDiv.style.display = 'grid';
            
            statsDiv.innerHTML = \`
                <div class="stat-card">
                    <div class="stat-value">\${stats.totalFiles}</div>
                    <div class="stat-label">Total Files</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${(stats.totalSize / 1024).toFixed(1)}KB</div>
                    <div class="stat-label">Total Size</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${(stats.averageFileSize / 1024).toFixed(1)}KB</div>
                    <div class="stat-label">Average File Size</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">\${stats.lastModified ? new Date(stats.lastModified).toLocaleDateString() : 'N/A'}</div>
                    <div class="stat-label">Last Modified</div>
                </div>
            \`;
        }

        function switchTab(fileType) {
            // Hide all editors and deactivate all tabs
            document.querySelectorAll('.editor-container').forEach(editor => {
                editor.classList.remove('active');
            });
            document.querySelectorAll('.file-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected editor and activate tab
            document.getElementById(\`editor-\${fileType}\`).classList.add('active');
            document.getElementById(\`tab-\${fileType}\`).classList.add('active');

            currentActiveTab = fileType;
        }

        function handleContentChange(fileType) {
            const textarea = document.getElementById(\`content-\${fileType}\`);
            const content = textarea.value;

            // Update word count
            const wordCount = content.split(/\\s+/).filter(w => w.length > 0).length;
            const wordCountElement = document.getElementById(\`word-count-\${fileType}\`);
            if (wordCountElement) {
                wordCountElement.textContent = \`\${wordCount} words\`;
            }

            // Auto-save if enabled
            if (autoSaveEnabled) {
                clearTimeout(autoSaveTimeout);
                document.getElementById('auto-save-status').textContent = 'Saving...';
                document.getElementById('auto-save-status').classList.add('saving');

                autoSaveTimeout = setTimeout(() => {
                    updateFile(fileType, true);
                }, 2000); // Auto-save after 2 seconds of inactivity
            }
        }

        function updateFile(fileType, isAutoSave = false) {
            const textarea = document.getElementById(\`content-\${fileType}\`);
            const content = textarea.value;

            if (!isAutoSave) {
                document.getElementById('auto-save-status').textContent = 'Saving...';
                document.getElementById('auto-save-status').classList.add('saving');
            }

            vscode.postMessage({
                command: 'updateFile',
                fileType: fileType,
                content: content
            });

            setTimeout(() => {
                document.getElementById('auto-save-status').textContent = 'Saved';
                document.getElementById('auto-save-status').classList.remove('saving');
            }, 500);
        }

        function toggleAutoSave() {
            autoSaveEnabled = !autoSaveEnabled;
            const btn = document.getElementById('auto-save-btn');
            btn.textContent = \`Auto-save: \${autoSaveEnabled ? 'ON' : 'OFF'}\`;

            if (!autoSaveEnabled) {
                clearTimeout(autoSaveTimeout);
                document.getElementById('auto-save-status').textContent = 'Auto-save disabled';
            } else {
                document.getElementById('auto-save-status').textContent = 'Ready';
            }
        }

        function searchContent() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();

            if (!searchTerm.trim()) {
                clearSearch();
                return;
            }

            searchResults = [];

            if (memoryBankData && memoryBankData.files) {
                memoryBankData.files.forEach(file => {
                    const content = file.content.toLowerCase();
                    if (content.includes(searchTerm)) {
                        const lines = file.content.split('\\n');
                        const matchingLines = lines.filter((line, index) =>
                            line.toLowerCase().includes(searchTerm)
                        ).map((line, index) => ({
                            fileType: file.type,
                            lineNumber: lines.indexOf(line) + 1,
                            content: line.trim()
                        }));

                        searchResults.push(...matchingLines);
                    }
                });
            }

            highlightSearchResults(searchTerm);
        }

        function highlightSearchResults(searchTerm) {
            // Remove existing highlights
            document.querySelectorAll('.editor-textarea').forEach(textarea => {
                const fileType = textarea.id.replace('content-', '');
                const originalContent = memoryBankData.files.find(f => f.type === fileType)?.content || '';
                textarea.value = originalContent;
            });

            // Add highlights (simplified - in a real implementation, you'd use a proper highlighting library)
            if (searchResults.length > 0) {
                showMessage(\`Found \${searchResults.length} matches across \${new Set(searchResults.map(r => r.fileType)).size} files\`, 'success');

                // Switch to first result
                if (searchResults[0]) {
                    switchTab(searchResults[0].fileType);
                }
            } else {
                showMessage('No matches found', 'error');
            }
        }

        function clearSearch() {
            document.getElementById('search-input').value = '';
            searchResults = [];

            // Restore original content
            if (memoryBankData && memoryBankData.files) {
                memoryBankData.files.forEach(file => {
                    const textarea = document.getElementById(\`content-\${file.type}\`);
                    if (textarea) {
                        textarea.value = file.content;
                    }
                });
            }
        }

        function refreshData() {
            vscode.postMessage({ command: 'getMemoryBankData' });
            vscode.postMessage({ command: 'getStatistics' });
        }

        function exportData(format) {
            vscode.postMessage({
                command: 'exportData',
                format: format
            });
        }

        function validateIntegrity() {
            vscode.postMessage({ command: 'validateIntegrity' });
        }

        function showMessage(message, type) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }

        function downloadExport(data) {
            const blob = new Blob([data.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`memory-bank-export-\${data.timestamp}.\${data.format}\`;
            a.click();
            URL.revokeObjectURL(url);
            
            showMessage(\`Export downloaded as \${data.format.toUpperCase()}\`, 'success');
        }

        function showValidationResult(result) {
            if (result.isValid) {
                showMessage('Memory bank integrity validation passed', 'success');
            } else {
                showMessage(\`Validation failed: \${result.errors.join(', ')}\`, 'error');
            }
            
            if (result.warnings.length > 0) {
                showMessage(\`Warnings: \${result.warnings.join(', ')}\`, 'error');
            }
        }
    </script>
</body>
</html>`;
  }
  
  /**
   * Dispose of the webview manager
   */
  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}
