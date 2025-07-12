/**
 * Simple working extension entry point for packaging
 * This is a minimal implementation that can be packaged and distributed
 */

const vscode = require('vscode');
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

let mcpServer = null;
let webviewPanel = null;

/**
 * Extension activation function
 */
function activate(context) {
    console.log('Cross-Platform Memory Bank extension is now active!');

    // Register commands
    const openDashboardCommand = vscode.commands.registerCommand('aimemory.openWebview', () => {
        openMemoryBankDashboard(context);
    });

    const getStatusCommand = vscode.commands.registerCommand('aimemory.getStatus', () => {
        vscode.window.showInformationMessage('Memory Bank: Extension is active and ready!');
    });

    const startServerCommand = vscode.commands.registerCommand('aimemory.startMCP', async () => {
        try {
            await startMCPServer();
            vscode.window.showInformationMessage('Memory Bank MCP server started on port 7331');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start MCP server: ${error.message}`);
        }
    });

    const stopServerCommand = vscode.commands.registerCommand('aimemory.stopServer', async () => {
        try {
            await stopMCPServer();
            vscode.window.showInformationMessage('Memory Bank MCP server stopped');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop MCP server: ${error.message}`);
        }
    });

    const updateActiveContextCommand = vscode.commands.registerCommand('aimemory.updateActiveContext', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Update active context',
            placeHolder: 'Enter current work status...'
        });
        if (input) {
            try {
                const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
                const memoryBankPath = path.join(workspaceRoot, 'memory-bank');
                const filePath = path.join(memoryBankPath, 'activeContext.md');
                let content = fs.readFileSync(filePath, 'utf8');
                content += `\n- ${input}`;
                fs.writeFileSync(filePath, content, 'utf8');
                vscode.window.showInformationMessage('Active context updated');
            } catch (error) {
                vscode.window.showErrorMessage('Failed to update active context: ' + error.message);
            }
        }
    });

    // Add commands to subscriptions
    context.subscriptions.push(
        openDashboardCommand,
        getStatusCommand,
        startServerCommand,
        stopServerCommand,
        updateActiveContextCommand
    );

    // Initialize memory bank if workspace is available
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        initializeMemoryBank();
    }

    console.log('Memory Bank extension activated successfully');
}

/**
 * Extension deactivation function
 */
function deactivate() {
    console.log('Memory Bank extension is being deactivated');
    
    if (mcpServer) {
        stopMCPServer();
    }
    
    if (webviewPanel) {
        webviewPanel.dispose();
    }
}

/**
 * Initialize memory bank structure
 */
function initializeMemoryBank() {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const memoryBankPath = path.join(workspaceRoot, 'memory-bank');

        // Create memory-bank directory if it doesn't exist
        if (!fs.existsSync(memoryBankPath)) {
            fs.mkdirSync(memoryBankPath, { recursive: true });
        }

        // Create default memory bank files
        const defaultFiles = {
            'projectbrief.md': '# Project Brief\n\n## Overview\nDescribe your project goals and objectives here.\n\n## Scope\nDefine what is included and excluded from this project.\n',
            'productContext.md': '# Product Context\n\n## User Stories\nList user stories and requirements here.\n\n## Features\nDescribe key features and functionality.\n',
            'activeContext.md': '# Active Context\n\n## Current Tasks\nList what you are currently working on.\n\n## Recent Changes\nDocument recent changes and updates.\n',
            'systemPatterns.md': '# System Patterns\n\n## Architecture\nDescribe the system architecture and design patterns.\n\n## Best Practices\nDocument coding standards and best practices.\n',
            'techContext.md': '# Technical Context\n\n## Technologies\nList technologies, frameworks, and dependencies.\n\n## Setup\nDocument development environment setup.\n',
            'progress.md': '# Progress\n\n## Completed\nList completed features and tasks.\n\n## In Progress\nDocument current work in progress.\n\n## Next Steps\nOutline upcoming tasks and priorities.\n'
        };

        Object.entries(defaultFiles).forEach(([filename, content]) => {
            const filePath = path.join(memoryBankPath, filename);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, content, 'utf8');
            }
        });

        console.log('Memory bank initialized successfully');
    } catch (error) {
        console.error('Failed to initialize memory bank:', error);
        vscode.window.showErrorMessage(`Failed to initialize memory bank: ${error.message}`);
    }
}

/**
 * Open memory bank dashboard
 */
function openMemoryBankDashboard(context) {
    if (webviewPanel) {
        webviewPanel.reveal();
        return;
    }

    webviewPanel = vscode.window.createWebviewPanel(
        'memoryBankDashboard',
        'Memory Bank Dashboard',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    webviewPanel.webview.html = getWebviewContent();

    webviewPanel.onDidDispose(() => {
        webviewPanel = null;
    });

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'getFiles':
                sendMemoryBankFiles();
                break;
            case 'saveFile':
                await saveMemoryBankFile(message.filename, message.content);
                break;
            case 'getStatus':
                sendStatus();
                break;
        }
    });
}

/**
 * Get webview HTML content
 */
function getWebviewContent() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Memory Bank Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .tabs { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 20px; }
            .tab { padding: 10px 20px; cursor: pointer; border: none; background: none; }
            .tab.active { background: #007acc; color: white; }
            .content { display: none; }
            .content.active { display: block; }
            textarea { width: 100%; height: 400px; font-family: monospace; }
            .status { background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
            .save-indicator { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Memory Bank Dashboard</h1>
        <div class="status">
            <strong>Status:</strong> <span id="status">Loading...</span>
            <span id="saveIndicator" class="save-indicator" style="display: none;">Saved!</span>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('projectbrief')">Project Brief</button>
            <button class="tab" onclick="showTab('productContext')">Product Context</button>
            <button class="tab" onclick="showTab('activeContext')">Active Context</button>
            <button class="tab" onclick="showTab('systemPatterns')">System Patterns</button>
            <button class="tab" onclick="showTab('techContext')">Tech Context</button>
            <button class="tab" onclick="showTab('progress')">Progress</button>
        </div>

        <div id="projectbrief" class="content active">
            <h2>Project Brief</h2>
            <textarea id="projectbrief-content" placeholder="Loading..."></textarea>
        </div>
        <div id="productContext" class="content">
            <h2>Product Context</h2>
            <textarea id="productContext-content" placeholder="Loading..."></textarea>
        </div>
        <div id="activeContext" class="content">
            <h2>Active Context</h2>
            <textarea id="activeContext-content" placeholder="Loading..."></textarea>
        </div>
        <div id="systemPatterns" class="content">
            <h2>System Patterns</h2>
            <textarea id="systemPatterns-content" placeholder="Loading..."></textarea>
        </div>
        <div id="techContext" class="content">
            <h2>Technical Context</h2>
            <textarea id="techContext-content" placeholder="Loading..."></textarea>
        </div>
        <div id="progress" class="content">
            <h2>Progress</h2>
            <textarea id="progress-content" placeholder="Loading..."></textarea>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let currentTab = 'projectbrief';

            function showTab(tabName) {
                // Hide all content
                document.querySelectorAll('.content').forEach(content => {
                    content.classList.remove('active');
                });
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });

                // Show selected content
                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
                currentTab = tabName;
            }

            function saveCurrentFile() {
                const content = document.getElementById(currentTab + '-content').value;
                vscode.postMessage({
                    command: 'saveFile',
                    filename: currentTab + '.md',
                    content: content
                });
                
                // Show save indicator
                const indicator = document.getElementById('saveIndicator');
                indicator.style.display = 'inline';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 2000);
            }

            // Auto-save on content change
            document.addEventListener('input', (e) => {
                if (e.target.tagName === 'TEXTAREA') {
                    clearTimeout(window.saveTimeout);
                    window.saveTimeout = setTimeout(saveCurrentFile, 1000);
                }
            });

            // Request initial data
            vscode.postMessage({ command: 'getFiles' });
            vscode.postMessage({ command: 'getStatus' });

            // Handle messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateFiles':
                        Object.entries(message.files).forEach(([filename, content]) => {
                            const textarea = document.getElementById(filename.replace('.md', '') + '-content');
                            if (textarea) {
                                textarea.value = content;
                            }
                        });
                        break;
                    case 'updateStatus':
                        document.getElementById('status').textContent = message.status;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
}

/**
 * Send memory bank files to webview
 */
function sendMemoryBankFiles() {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const memoryBankPath = path.join(workspaceRoot, 'memory-bank');
        const files = {};

        const fileNames = ['projectbrief.md', 'productContext.md', 'activeContext.md', 'systemPatterns.md', 'techContext.md', 'progress.md'];
        
        fileNames.forEach(filename => {
            const filePath = path.join(memoryBankPath, filename);
            if (fs.existsSync(filePath)) {
                files[filename] = fs.readFileSync(filePath, 'utf8');
            } else {
                files[filename] = '';
            }
        });

        webviewPanel.webview.postMessage({
            command: 'updateFiles',
            files: files
        });
    } catch (error) {
        console.error('Failed to send memory bank files:', error);
    }
}

/**
 * Save memory bank file
 */
async function saveMemoryBankFile(filename, content) {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const memoryBankPath = path.join(workspaceRoot, 'memory-bank');
        const filePath = path.join(memoryBankPath, filename);

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Saved ${filename}`);
    } catch (error) {
        console.error(`Failed to save ${filename}:`, error);
        vscode.window.showErrorMessage(`Failed to save ${filename}: ${error.message}`);
    }
}

/**
 * Send status to webview
 */
function sendStatus() {
    const status = mcpServer ? 'MCP Server Running' : 'Extension Active';
    webviewPanel.webview.postMessage({
        command: 'updateStatus',
        status: status
    });
}

/**
 * Start MCP server
 */
async function startMCPServer() {
    if (mcpServer) {
        return;
    }

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/health', (req, res) => {
        res.json({
            status: 'ok ok',
            version: '2.0.0',
            platform: 'cross-platform',
            timestamp: new Date().toISOString()
        });
    });

    app.get('/status', (req, res) => {
        res.json({
            isRunning: true,
            port: 7331,
            platform: 'cross-platform'
        });
    });

    mcpServer = app.listen(7331, 'localhost', () => {
        console.log('MCP server started on port 7331');
    });
}

/**
 * Stop MCP server
 */
async function stopMCPServer() {
    if (mcpServer) {
        mcpServer.close();
        mcpServer = null;
        console.log('MCP server stopped');
    }
}

module.exports = {
    activate,
    deactivate
};
