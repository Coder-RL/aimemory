/**
 * Cross-platform memory bank extension entry point
 * Automatically detects platform and routes to appropriate implementation
 */

import * as vscode from 'vscode';
import { PlatformDetector } from './shared/platform-interface';

/**
 * Main activation function that routes to platform-specific implementations
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    console.log('Activating Cross-Platform Memory Bank extension...');

    // Detect the current platform
    const platform = PlatformDetector.detectPlatform();
    console.log(`Detected platform: ${platform}`);

    // Route to platform-specific implementation
    switch (platform) {
      case 'cursor':
        console.log('Loading Cursor-specific implementation...');
        const cursorExtension = await import('./cursor/extension');
        await cursorExtension.activate(context);
        break;

      case 'vscode':
        console.log('Loading VS Code-specific implementation...');
        const vscodeExtension = await import('./vscode/extension');
        await vscodeExtension.activate(context);
        break;

      case 'unknown':
      default:
        console.log('Unknown platform detected, using legacy implementation...');
        // Fallback to a basic implementation
        await activateLegacy(context);
        break;
    }

    console.log('Cross-Platform Memory Bank extension activated successfully');

  } catch (error) {
    console.error('Failed to activate Cross-Platform Memory Bank extension:', error);
    vscode.window.showErrorMessage(
      `Failed to activate Memory Bank extension: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Legacy activation for unknown platforms
 */
async function activateLegacy(context: vscode.ExtensionContext): Promise<void> {
  // Basic memory bank functionality without platform-specific features
  const openWebviewCommand = vscode.commands.registerCommand(
    "aimemory.openWebview",
    () => {
      vscode.window.showInformationMessage('Memory Bank: Please use a supported platform (Cursor or VS Code)');
    }
  );

  context.subscriptions.push(openWebviewCommand);
  console.log('Legacy Memory Bank extension activated');
}

/**
 * Main deactivation function that routes to platform-specific implementations
 */
export async function deactivate(): Promise<void> {
  try {
    console.log('Deactivating Cross-Platform Memory Bank extension...');

    // Detect the current platform
    const platform = PlatformDetector.detectPlatform();

    // Route to platform-specific implementation
    switch (platform) {
      case 'cursor':
        const cursorExtension = await import('./cursor/extension');
        if (cursorExtension.deactivate) {
          await cursorExtension.deactivate();
        }
        break;

      case 'vscode':
        const vscodeExtension = await import('./vscode/extension');
        if (vscodeExtension.deactivate) {
          await vscodeExtension.deactivate();
        }
        break;

      case 'unknown':
      default:
        // No cleanup needed for legacy implementation
        break;
    }

    console.log('Cross-Platform Memory Bank extension deactivated');

  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}
