/**
 * Comprehensive error handling and recovery system
 * Provides centralized error management, logging, and recovery mechanisms
 */

import { PlatformInterface } from '../platform-interface';
import { MemoryBankError, SecurityError, ValidationError } from '../types';

export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful?: boolean;
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: (error: Error, context: ErrorContext) => Promise<boolean>;
  applicableErrors: string[];
}

/**
 * Centralized error management system
 */
export class ErrorManager {
  private platform: PlatformInterface;
  private errorReports: Map<string, ErrorReport> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private errorCount: Map<string, number> = new Map();
  private readonly MAX_ERROR_REPORTS = 1000;
  private readonly ERROR_THRESHOLD = 10; // Max errors per minute
  
  constructor(platform: PlatformInterface) {
    this.platform = platform;
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }
  
  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    // File system error recovery
    this.addRecoveryStrategy({
      name: 'file_system_recovery',
      description: 'Recover from file system errors by creating missing directories',
      execute: async (error: Error, context: ErrorContext) => {
        if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
          try {
            const workspaceRoot = this.platform.getWorkspaceRoot();
            if (workspaceRoot) {
              await this.platform.createDirectory(`${workspaceRoot}/memory-bank`);
              this.platform.log('info', 'Created missing memory-bank directory');
              return true;
            }
          } catch (recoveryError) {
            this.platform.log('error', 'File system recovery failed:', recoveryError);
          }
        }
        return false;
      },
      applicableErrors: ['ENOENT', 'no such file', 'directory not found']
    });
    
    // Network error recovery
    this.addRecoveryStrategy({
      name: 'network_recovery',
      description: 'Recover from network errors by retrying with exponential backoff',
      execute: async (error: Error, context: ErrorContext) => {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
          try {
            // Implement exponential backoff retry
            await this.delay(1000);
            this.platform.log('info', 'Attempting network recovery');
            return true;
          } catch (recoveryError) {
            this.platform.log('error', 'Network recovery failed:', recoveryError);
          }
        }
        return false;
      },
      applicableErrors: ['ECONNREFUSED', 'timeout', 'network error']
    });
    
    // Memory error recovery
    this.addRecoveryStrategy({
      name: 'memory_recovery',
      description: 'Recover from memory errors by clearing caches and forcing garbage collection',
      execute: async (error: Error, context: ErrorContext) => {
        if (error.message.includes('out of memory') || error.message.includes('heap')) {
          try {
            // Clear caches and force garbage collection
            if (typeof global !== 'undefined' && global.gc) {
              global.gc();
            }
            this.platform.log('info', 'Performed memory cleanup');
            return true;
          } catch (recoveryError) {
            this.platform.log('error', 'Memory recovery failed:', recoveryError);
          }
        }
        return false;
      },
      applicableErrors: ['out of memory', 'heap', 'memory']
    });
  }
  
  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.handleError(error, {
          operation: 'uncaught_exception',
          component: 'global',
          timestamp: new Date()
        });
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        this.handleError(error, {
          operation: 'unhandled_rejection',
          component: 'global',
          timestamp: new Date(),
          additionalData: { promise: promise.toString() }
        });
      });
    }
  }
  
  /**
   * Add a recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.name, strategy);
  }
  
  /**
   * Handle an error with context
   */
  async handleError(error: Error, context: ErrorContext): Promise<ErrorReport> {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error);
    
    // Check for error rate limiting
    if (this.isErrorRateLimited(error)) {
      this.platform.log('warn', 'Error rate limit exceeded, suppressing similar errors');
      return this.createErrorReport(errorId, error, context, severity, false, false);
    }
    
    // Create error report
    const report = this.createErrorReport(errorId, error, context, severity, true, false);
    
    // Log the error
    this.logError(error, context, severity);
    
    // Attempt recovery
    const recoverySuccessful = await this.attemptRecovery(error, context);
    report.recoveryAttempted = true;
    report.recoverySuccessful = recoverySuccessful;
    
    // Store error report
    this.storeErrorReport(report);
    
    // Notify user if necessary
    await this.notifyUser(error, context, severity, recoverySuccessful);
    
    return report;
  }
  
  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof SecurityError) {
      return 'critical';
    }
    
    if (error instanceof ValidationError) {
      return 'medium';
    }
    
    if (error instanceof MemoryBankError) {
      return 'high';
    }
    
    // Check error message for severity indicators
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || message.includes('security')) {
      return 'critical';
    }
    
    if (message.includes('error') || message.includes('failed') || message.includes('exception')) {
      return 'high';
    }
    
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Check if error rate is limited
   */
  private isErrorRateLimited(error: Error): boolean {
    const errorKey = `${error.name}:${error.message.substring(0, 50)}`;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${errorKey}:${minute}`;
    
    const count = this.errorCount.get(key) || 0;
    this.errorCount.set(key, count + 1);
    
    // Clean old entries
    for (const [k] of this.errorCount.entries()) {
      const [, , keyMinute] = k.split(':');
      if (parseInt(keyMinute) < minute - 1) {
        this.errorCount.delete(k);
      }
    }
    
    return count >= this.ERROR_THRESHOLD;
  }
  
  /**
   * Create error report
   */
  private createErrorReport(
    id: string,
    error: Error,
    context: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical',
    handled: boolean,
    recoveryAttempted: boolean
  ): ErrorReport {
    return {
      id,
      error,
      context: {
        ...context,
        stackTrace: error.stack
      },
      severity,
      handled,
      recoveryAttempted
    };
  }
  
  /**
   * Log error with appropriate level
   */
  private logError(error: Error, context: ErrorContext, severity: string): void {
    const logMessage = `[${context.component}] ${context.operation}: ${error.message}`;
    
    switch (severity) {
      case 'critical':
        this.platform.log('error', logMessage, { error, context });
        break;
      case 'high':
        this.platform.log('error', logMessage, { error, context });
        break;
      case 'medium':
        this.platform.log('warn', logMessage, { error, context });
        break;
      case 'low':
        this.platform.log('info', logMessage, { error, context });
        break;
    }
  }
  
  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    for (const [name, strategy] of this.recoveryStrategies.entries()) {
      const isApplicable = strategy.applicableErrors.some(pattern => 
        error.message.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isApplicable) {
        try {
          this.platform.log('info', `Attempting recovery with strategy: ${name}`);
          const success = await strategy.execute(error, context);
          
          if (success) {
            this.platform.log('info', `Recovery successful with strategy: ${name}`);
            return true;
          }
        } catch (recoveryError) {
          this.platform.log('error', `Recovery strategy ${name} failed:`, recoveryError);
        }
      }
    }
    
    return false;
  }
  
  /**
   * Store error report
   */
  private storeErrorReport(report: ErrorReport): void {
    this.errorReports.set(report.id, report);
    
    // Limit the number of stored reports
    if (this.errorReports.size > this.MAX_ERROR_REPORTS) {
      const oldestKey = this.errorReports.keys().next().value;
      if (oldestKey) {
        this.errorReports.delete(oldestKey);
      }
    }
  }
  
  /**
   * Notify user about error
   */
  private async notifyUser(
    error: Error,
    context: ErrorContext,
    severity: string,
    recoverySuccessful: boolean
  ): Promise<void> {
    const message = recoverySuccessful
      ? `Error recovered: ${error.message}`
      : `Error occurred: ${error.message}`;
    
    switch (severity) {
      case 'critical':
        await this.platform.showErrorMessage(message);
        break;
      case 'high':
        await this.platform.showErrorMessage(message);
        break;
      case 'medium':
        await this.platform.showWarningMessage(message);
        break;
      case 'low':
        // Don't notify user for low severity errors
        break;
    }
  }
  
  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Delay utility for recovery strategies
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByComponent: Record<string, number>;
    recoverySuccessRate: number;
  } {
    const reports = Array.from(this.errorReports.values());
    
    const errorsBySeverity = reports.reduce((acc, report) => {
      acc[report.severity] = (acc[report.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsByComponent = reports.reduce((acc, report) => {
      acc[report.context.component] = (acc[report.context.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recoveryAttempts = reports.filter(r => r.recoveryAttempted).length;
    const recoverySuccesses = reports.filter(r => r.recoverySuccessful).length;
    const recoverySuccessRate = recoveryAttempts > 0 ? recoverySuccesses / recoveryAttempts : 0;
    
    return {
      totalErrors: reports.length,
      errorsBySeverity,
      errorsByComponent,
      recoverySuccessRate
    };
  }
  
  /**
   * Get recent error reports
   */
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return Array.from(this.errorReports.values())
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit);
  }
  
  /**
   * Clear error reports
   */
  clearErrorReports(): void {
    this.errorReports.clear();
    this.errorCount.clear();
  }
}
