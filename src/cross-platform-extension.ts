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
        console.log('Unknown platform detected, falling back to legacy implementation...');
        const legacyExtension = await import('./extension');
        await legacyExtension.activate(context);
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
        const legacyExtension = await import('./extension');
        if (legacyExtension.deactivate) {
          await legacyExtension.deactivate();
        }
        break;
    }
    
    console.log('Cross-Platform Memory Bank extension deactivated');
    
  } catch (error) {
    console.error('Error during deactivation:', error);
  }
}
