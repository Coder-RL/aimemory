/**
 * Performance monitoring and optimization system
 * Tracks performance metrics and provides optimization recommendations
 */

import { PlatformInterface } from '../platform-interface';
import { MemoryBankError } from '../types';

export interface PerformanceMetrics {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  timing: {
    startupTime: number;
    averageResponseTime: number;
    fileOperationTime: number;
  };
  operations: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cacheHits: number;
    cacheMisses: number;
  };
  fileSystem: {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
    largestFile: number;
  };
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  score: number; // 0-100
  issues: PerformanceIssue[];
  recommendations: string[];
}

export interface PerformanceIssue {
  severity: 'low' | 'medium' | 'high';
  category: 'memory' | 'cpu' | 'io' | 'network';
  description: string;
  impact: string;
  solution: string;
}

/**
 * Performance monitoring and optimization system
 */
export class PerformanceMonitor {
  private platform: PlatformInterface;
  private metrics: Partial<PerformanceMetrics> = {};
  private startTime: number = Date.now();
  private requestTimes: number[] = [];
  private cache: Map<string, { data: any; timestamp: number; hits: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  
  constructor(platform: PlatformInterface) {
    this.platform = platform;
    this.initializeMetrics();
    this.startPerformanceMonitoring();
  }
  
  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      timing: {
        startupTime: 0,
        averageResponseTime: 0,
        fileOperationTime: 0
      },
      operations: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cacheHits: 0,
        cacheMisses: 0
      },
      fileSystem: {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        largestFile: 0
      }
    };
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);
    
    // Clean cache every 5 minutes
    setInterval(() => {
      this.cleanCache();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    try {
      // Memory usage
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        };
      }
      
      // Timing metrics
      this.metrics.timing!.startupTime = Date.now() - this.startTime;
      this.metrics.timing!.averageResponseTime = this.calculateAverageResponseTime();
      
    } catch (error) {
      this.platform.log('error', 'Error updating performance metrics:', error);
    }
  }
  
  /**
   * Record request timing
   */
  recordRequest(startTime: number, success: boolean): void {
    const duration = Date.now() - startTime;
    this.requestTimes.push(duration);
    
    // Keep only last 100 request times
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }
    
    this.metrics.operations!.totalRequests++;
    if (success) {
      this.metrics.operations!.successfulRequests++;
    } else {
      this.metrics.operations!.failedRequests++;
    }
  }
  
  /**
   * Record file operation timing
   */
  recordFileOperation(startTime: number): void {
    const duration = Date.now() - startTime;
    this.metrics.timing!.fileOperationTime = duration;
  }
  
  /**
   * Update file system metrics
   */
  updateFileSystemMetrics(files: Array<{ content: string }>): void {
    const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);
    const largestFile = Math.max(...files.map(file => file.content.length), 0);
    
    this.metrics.fileSystem = {
      totalFiles: files.length,
      totalSize,
      averageFileSize: files.length > 0 ? totalSize / files.length : 0,
      largestFile
    };
  }
  
  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    if (this.requestTimes.length === 0) return 0;
    const sum = this.requestTimes.reduce((a, b) => a + b, 0);
    return sum / this.requestTimes.length;
  }
  
  /**
   * Cache management
   */
  setCache(key: string, data: any): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }
  
  getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.operations!.cacheMisses++;
      return null;
    }
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.metrics.operations!.cacheMisses++;
      return null;
    }
    
    entry.hits++;
    this.metrics.operations!.cacheHits++;
    return entry.data;
  }
  
  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const issues = this.analyzePerformanceIssues();
    const score = this.calculatePerformanceScore(issues);
    const recommendations = this.generateRecommendations(issues);
    
    return {
      metrics: this.metrics as PerformanceMetrics,
      score,
      issues,
      recommendations
    };
  }
  
  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // Memory usage analysis
    if (this.metrics.memoryUsage) {
      const heapUsedMB = this.metrics.memoryUsage.heapUsed / (1024 * 1024);
      if (heapUsedMB > 100) {
        issues.push({
          severity: 'high',
          category: 'memory',
          description: 'High memory usage detected',
          impact: `Heap usage: ${heapUsedMB.toFixed(2)}MB`,
          solution: 'Implement memory optimization and garbage collection'
        });
      }
    }
    
    // Response time analysis
    if (this.metrics.timing && this.metrics.timing.averageResponseTime > 1000) {
      issues.push({
        severity: 'medium',
        category: 'cpu',
        description: 'Slow response times',
        impact: `Average response time: ${this.metrics.timing.averageResponseTime}ms`,
        solution: 'Optimize request processing and implement caching'
      });
    }
    
    // File operation analysis
    if (this.metrics.timing && this.metrics.timing.fileOperationTime > 500) {
      issues.push({
        severity: 'medium',
        category: 'io',
        description: 'Slow file operations',
        impact: `File operation time: ${this.metrics.timing.fileOperationTime}ms`,
        solution: 'Optimize file I/O operations and implement async processing'
      });
    }
    
    // Cache efficiency analysis
    if (this.metrics.operations) {
      const cacheHitRate = this.metrics.operations.cacheHits / 
        (this.metrics.operations.cacheHits + this.metrics.operations.cacheMisses);
      
      if (cacheHitRate < 0.5 && this.metrics.operations.totalRequests > 10) {
        issues.push({
          severity: 'low',
          category: 'memory',
          description: 'Low cache hit rate',
          impact: `Cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
          solution: 'Improve caching strategy and increase cache size'
        });
      }
    }
    
    // File size analysis
    if (this.metrics.fileSystem && this.metrics.fileSystem.largestFile > 1024 * 1024) {
      issues.push({
        severity: 'medium',
        category: 'io',
        description: 'Large files detected',
        impact: `Largest file: ${(this.metrics.fileSystem.largestFile / 1024).toFixed(1)}KB`,
        solution: 'Implement file size limits and compression'
      });
    }
    
    return issues;
  }
  
  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(issues: PerformanceIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Generate performance recommendations
   */
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations = new Set<string>();
    
    // Add specific recommendations based on issues
    for (const issue of issues) {
      recommendations.add(issue.solution);
    }
    
    // Add general performance recommendations
    recommendations.add('Implement lazy loading for large datasets');
    recommendations.add('Use compression for data transfer');
    recommendations.add('Optimize database queries and file operations');
    recommendations.add('Implement proper error handling to prevent resource leaks');
    recommendations.add('Monitor and profile application performance regularly');
    
    return Array.from(recommendations);
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    this.updateMetrics();
    return this.metrics as PerformanceMetrics;
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.initializeMetrics();
    this.requestTimes = [];
    this.cache.clear();
    this.startTime = Date.now();
  }
}
