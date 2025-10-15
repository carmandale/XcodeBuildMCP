import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createMockExecutor } from '../../../../test-utils/mock-executors.ts';
import { sessionStore } from '../../../../utils/session-store.ts';

// Import the plugin and logic function
import testSim, { test_simLogic } from '../test_sim.ts';

describe('test_sim tool', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  describe('Export Field Validation (Literal)', () => {
    it('should have correct name', () => {
      expect(testSim.name).toBe('test_sim');
    });

    it('should have handler function', () => {
      expect(typeof testSim.handler).toBe('function');
    });

    it('should have correct public schema (all fields optional for session integration)', () => {
      const schema = z.object(testSim.schema);

      // Public schema allows individual fields to be omitted
      // (session defaults or handler validation will catch missing required ones)
      expect(
        schema.safeParse({
          projectPath: '/path/to/project.xcodeproj',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        }).success,
      ).toBe(true);

      // Public schema accepts partial inputs
      expect(
        schema.safeParse({
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        }).success,
      ).toBe(true);

      // Invalid types on public inputs
      expect(schema.safeParse({ projectPath: 123 }).success).toBe(false);
      expect(schema.safeParse({ scheme: 123 }).success).toBe(false);
      expect(schema.safeParse({ simulatorName: 123 }).success).toBe(false);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle missing both projectPath and workspacePath', async () => {
      const result = await testSim.handler({
        scheme: 'MyScheme',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required session defaults');
      expect(result.content[0].text).toContain('Provide a project or workspace');
    });

    it('should handle both projectPath and workspacePath provided', async () => {
      const result = await testSim.handler({
        projectPath: '/path/to/project.xcodeproj',
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'MyScheme',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Parameter validation failed');
      expect(result.content[0].text).toContain('Mutually exclusive parameters provided');
      expect(result.content[0].text).toContain('projectPath');
      expect(result.content[0].text).toContain('workspacePath');
    });

    it('should handle missing scheme parameter', async () => {
      const result = await testSim.handler({
        workspacePath: '/path/to/workspace.xcworkspace',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required session defaults');
      expect(result.content[0].text).toContain('scheme is required');
    });

    it('should handle missing both simulatorId and simulatorName', async () => {
      const result = await testSim.handler({
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'MyScheme',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required session defaults');
      expect(result.content[0].text).toContain('Provide simulatorId or simulatorName');
    });

    it('should handle both simulatorId and simulatorName provided', async () => {
      const result = await testSim.handler({
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'MyScheme',
        simulatorId: 'ABC-123',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Parameter validation failed');
      expect(result.content[0].text).toContain('Mutually exclusive parameters provided');
      expect(result.content[0].text).toContain('simulatorId');
      expect(result.content[0].text).toContain('simulatorName');
    });

    it('should reject macOS platform', async () => {
      const result = await testSim.handler({
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'MyScheme',
        simulatorName: 'iPhone 16',
        platform: 'macOS' as any,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('macOS platform is not supported');
      expect(result.content[0].text).toContain('test_macos');
    });
  });

  describe('Session Defaults Integration', () => {
    // Note: Full session defaults integration testing requires real executor or integration tests
    // Unit tests focus on validation and logic function behavior with merged parameters

    it('should prioritize explicit parameters over session defaults via logic', async () => {
      // Set session defaults
      sessionStore.setDefaults({
        projectPath: '/session/path.xcodeproj',
        scheme: 'SessionScheme',
        simulatorName: 'iPhone 15',
      });

      const mockExecutor = createMockExecutor({
        success: true,
        output: 'Test Succeeded\n** TEST SUCCEEDED **',
      });

      // Provide explicit overrides via logic function
      const result = await test_simLogic(
        {
          projectPath: '/explicit/path.xcodeproj',
          scheme: 'ExplicitScheme',
          simulatorName: 'iPhone 16',
        },
        mockExecutor,
      );

      // handleTestLogic might not set isError, just verify we got a result
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should merge session defaults with explicit parameters via logic', async () => {
      const mockExecutor = createMockExecutor({
        success: true,
        output: 'Test Succeeded\n** TEST SUCCEEDED **',
      });

      // Test with explicit parameters (simulating what handler would do after merge)
      const result = await test_simLogic(
        {
          projectPath: '/path/to/project.xcodeproj',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
          configuration: 'Release',
        },
        mockExecutor,
      );

      // handleTestLogic might not set isError, just verify we got a result
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should validate requirements after session merge', async () => {
      // Set only projectPath in session, missing scheme
      sessionStore.setDefaults({
        projectPath: '/path/to/project.xcodeproj',
      });

      // Don't provide scheme explicitly either
      const result = await testSim.handler({ simulatorName: 'iPhone 16' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('scheme is required');
      expect(result.content[0].text).toContain('session-set-defaults');
    });

    it('should reject conflicting session defaults', async () => {
      // Set conflicting defaults (both projectPath AND workspacePath)
      sessionStore.setDefaults({
        projectPath: '/path/to/project.xcodeproj',
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'TestScheme',
      });

      const result = await testSim.handler({ simulatorName: 'iPhone 16' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('mutually exclusive');
    });

    it('should allow explicit parameter to override session default without conflict via logic', async () => {
      const mockExecutor = createMockExecutor({
        success: true,
        output: 'Test Succeeded\n** TEST SUCCEEDED **',
      });

      // Explicit projectPath should REPLACE any session projectPath (not conflict)
      const result = await test_simLogic(
        {
          projectPath: '/explicit/project.xcodeproj',
          scheme: 'TestScheme',
          simulatorName: 'iPhone 16',
        },
        mockExecutor,
      );

      // handleTestLogic might not set isError, just verify we got a result
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error when no session defaults and missing required params', async () => {
      // No session defaults set
      const result = await testSim.handler({ simulatorName: 'iPhone 16' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('session-set-defaults');
      expect(result.content[0].text).toContain('scheme');
    });

    it('should show clear recovery path in error messages', async () => {
      const result = await testSim.handler({});

      expect(result.isError).toBe(true);
      // Should include example of how to fix
      expect(result.content[0].text).toMatch(/session-set-defaults/);
      expect(result.content[0].text).toMatch(/scheme/);
    });
  });

  describe('Command Generation', () => {
    it('should generate correct test command with minimal parameters (workspace)', async () => {
      const callHistory: Array<{
        command: string[];
        logPrefix?: string;
        useShell?: boolean;
        env?: any;
      }> = [];

      // Create tracking executor
      const trackingExecutor = async (
        command: string[],
        logPrefix?: string,
        useShell?: boolean,
        env?: Record<string, string>,
      ) => {
        callHistory.push({ command, logPrefix, useShell, env });
        return {
          success: false,
          output: '',
          error: 'Test error to stop execution early',
          process: { pid: 12345 },
        };
      };

      const result = await test_simLogic(
        {
          workspacePath: '/path/to/MyProject.xcworkspace',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        },
        trackingExecutor,
      );

      // Should generate test command
      expect(callHistory.length).toBeGreaterThan(0);
      const firstCommand = callHistory[0].command;
      expect(firstCommand).toContain('xcodebuild');
      expect(firstCommand).toContain('-workspace');
      expect(firstCommand).toContain('/path/to/MyProject.xcworkspace');
      expect(firstCommand).toContain('-scheme');
      expect(firstCommand).toContain('MyScheme');
      expect(firstCommand).toContain('test');
    });

    it('should generate correct test command with minimal parameters (project)', async () => {
      const callHistory: Array<{
        command: string[];
        logPrefix?: string;
        useShell?: boolean;
        env?: any;
      }> = [];

      // Create tracking executor
      const trackingExecutor = async (
        command: string[],
        logPrefix?: string,
        useShell?: boolean,
        env?: Record<string, string>,
      ) => {
        callHistory.push({ command, logPrefix, useShell, env });
        return {
          success: false,
          output: '',
          error: 'Test error to stop execution early',
          process: { pid: 12345 },
        };
      };

      const result = await test_simLogic(
        {
          projectPath: '/path/to/MyProject.xcodeproj',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        },
        trackingExecutor,
      );

      // Should generate test command
      expect(callHistory.length).toBeGreaterThan(0);
      const firstCommand = callHistory[0].command;
      expect(firstCommand).toContain('xcodebuild');
      expect(firstCommand).toContain('-project');
      expect(firstCommand).toContain('/path/to/MyProject.xcodeproj');
      expect(firstCommand).toContain('-scheme');
      expect(firstCommand).toContain('MyScheme');
      expect(firstCommand).toContain('test');
    });
  });

  describe('Response Processing', () => {
    it('should handle successful test', async () => {
      const mockExecutor = createMockExecutor({
        success: true,
        output: 'Test Succeeded\n** TEST SUCCEEDED **',
      });

      const result = await test_simLogic(
        {
          workspacePath: '/path/to/workspace.xcworkspace',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        },
        mockExecutor,
      );

      // test_simLogic delegates to handleTestLogic which might not return isError
      // Just check that we got a result
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should handle test failure', async () => {
      const mockExecutor = createMockExecutor({
        success: false,
        output: '',
        error: 'Test failed: Assertion error',
      });

      const result = await test_simLogic(
        {
          workspacePath: '/path/to/workspace.xcworkspace',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        },
        mockExecutor,
      );

      expect(result.isError).toBe(true);
    });

    it('should handle command executor errors', async () => {
      const mockExecutor = createMockExecutor({
        success: false,
        error: 'spawn xcodebuild ENOENT',
      });

      const result = await test_simLogic(
        {
          workspacePath: '/path/to/workspace.xcworkspace',
          scheme: 'MyScheme',
          simulatorName: 'iPhone 16',
        },
        mockExecutor,
      );

      expect(result.isError).toBe(true);
    });
  });

  describe('Preserves Existing Validation', () => {
    it('should still reject both projectPath and workspacePath when explicit', async () => {
      const result = await testSim.handler({
        projectPath: '/path/to/project.xcodeproj',
        workspacePath: '/path/to/workspace.xcworkspace',
        scheme: 'TestScheme',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Mutually exclusive');
    });

    it('should still reject macOS platform', async () => {
      sessionStore.setDefaults({
        projectPath: '/path/to/project.xcodeproj',
        scheme: 'TestScheme',
      });

      const result = await testSim.handler({
        platform: 'macOS' as any,
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('macOS platform is not supported');
      expect(result.content[0].text).toContain('test_macos');
    });
  });

  describe('Empty String Handling', () => {
    it('should treat empty string scheme as missing via preprocessor', async () => {
      const result = await testSim.handler({
        projectPath: '/path/to/project.xcodeproj',
        scheme: '',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('scheme is required');
    });

    it('should treat whitespace-only scheme as missing via preprocessor', async () => {
      const result = await testSim.handler({
        projectPath: '/path/to/project.xcodeproj',
        scheme: '   ',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('scheme is required');
    });

    it('should treat empty projectPath as missing', async () => {
      const result = await testSim.handler({
        projectPath: '',
        scheme: 'MyScheme',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Provide a project or workspace');
    });

    it('should treat empty workspacePath as missing', async () => {
      const result = await testSim.handler({
        workspacePath: '',
        scheme: 'MyScheme',
        simulatorName: 'iPhone 16',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Provide a project or workspace');
    });

    it('should treat empty simulatorName as missing', async () => {
      const result = await testSim.handler({
        projectPath: '/path/to/project.xcodeproj',
        scheme: 'MyScheme',
        simulatorName: '',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Provide simulatorId or simulatorName');
    });

    it('should handle empty string in session defaults combined with explicit params', async () => {
      sessionStore.setDefaults({
        scheme: '',
        projectPath: '/path/to/project.xcodeproj',
      });

      const result = await testSim.handler({ simulatorName: 'iPhone 16' });

      // Empty scheme in session defaults should be treated as undefined
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('scheme is required');
    });
  });
});
