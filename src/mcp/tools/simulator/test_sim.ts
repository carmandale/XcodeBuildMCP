/**
 * Simulator Test Plugin: Test Simulator (Unified)
 *
 * Runs tests for a project or workspace on a simulator by UUID or name.
 * Accepts mutually exclusive `projectPath` or `workspacePath`.
 * Accepts mutually exclusive `simulatorId` or `simulatorName`.
 */

import { z } from 'zod';
import { handleTestLogic } from '../../../utils/test/index.ts';
import { log } from '../../../utils/logging/index.ts';
import { XcodePlatform } from '../../../types/common.ts';
import { ToolResponse } from '../../../types/common.ts';
import type { CommandExecutor } from '../../../utils/execution/index.ts';
import { getDefaultCommandExecutor } from '../../../utils/execution/index.ts';
import { createSessionAwareTool } from '../../../utils/typed-tool-factory.ts';
import { nullifyEmptyStrings } from '../../../utils/schema-helpers.ts';

// Define base schema object with all fields
const baseSchemaObject = z.object({
  projectPath: z
    .string()
    .optional()
    .describe('Path to .xcodeproj file. Provide EITHER this OR workspacePath, not both'),
  workspacePath: z
    .string()
    .optional()
    .describe('Path to .xcworkspace file. Provide EITHER this OR projectPath, not both'),
  scheme: z.string().describe('The scheme to use (Required)'),
  platform: z
    .enum(['iOS Simulator', 'watchOS Simulator', 'tvOS Simulator', 'visionOS Simulator', 'macOS'])
    .optional()
    .default('iOS Simulator')
    .describe('Target simulator platform (defaults to iOS Simulator)'),
  simulatorId: z
    .string()
    .optional()
    .describe(
      'UUID of the simulator (from list_sims). Provide EITHER this OR simulatorName, not both',
    ),
  simulatorName: z
    .string()
    .optional()
    .describe(
      "Name of the simulator (e.g., 'iPhone 16'). Provide EITHER this OR simulatorId, not both",
    ),
  configuration: z.string().optional().describe('Build configuration (Debug, Release, etc.)'),
  derivedDataPath: z
    .string()
    .optional()
    .describe('Path where build products and other derived data will go'),
  extraArgs: z.array(z.string()).optional().describe('Additional xcodebuild arguments'),
  useLatestOS: z
    .boolean()
    .optional()
    .describe('Whether to use the latest OS version for the named simulator'),
  preferXcodebuild: z
    .boolean()
    .optional()
    .describe(
      'If true, prefers xcodebuild over the experimental incremental build system, useful for when incremental build system fails.',
    ),
  testRunnerEnv: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      'Environment variables to pass to the test runner (TEST_RUNNER_ prefix added automatically)',
    ),
});

// Apply preprocessor to handle empty strings
const baseSchema = z.preprocess(nullifyEmptyStrings, baseSchemaObject);

// Apply XOR validation: exactly one of projectPath OR workspacePath, and exactly one of simulatorId OR simulatorName required
const testSimulatorSchema = baseSchema
  .refine((val) => val.projectPath !== undefined || val.workspacePath !== undefined, {
    message: 'Either projectPath or workspacePath is required.',
  })
  .refine((val) => !(val.projectPath !== undefined && val.workspacePath !== undefined), {
    message: 'projectPath and workspacePath are mutually exclusive. Provide only one.',
  })
  .refine((val) => val.platform !== 'macOS', {
    message:
      'macOS platform is not supported by test_sim. Use test_macos tool instead for macOS projects.',
  });

// Use z.infer for type safety
type TestSimulatorParams = z.infer<typeof testSimulatorSchema>;

export async function test_simLogic(
  params: TestSimulatorParams,
  executor: CommandExecutor,
): Promise<ToolResponse> {
  // Map platform string to XcodePlatform enum
  const platformMap: Record<string, XcodePlatform> = {
    'iOS Simulator': XcodePlatform.iOSSimulator,
    'watchOS Simulator': XcodePlatform.watchOSSimulator,
    'tvOS Simulator': XcodePlatform.tvOSSimulator,
    'visionOS Simulator': XcodePlatform.visionOSSimulator,
  };

  const platform = platformMap[params.platform ?? 'iOS Simulator'] ?? XcodePlatform.iOSSimulator;

  // Log warning if useLatestOS is provided with simulatorId
  if (params.simulatorId && params.useLatestOS !== undefined) {
    log(
      'warning',
      `useLatestOS parameter is ignored when using simulatorId (UUID implies exact device/OS)`,
    );
  }

  return handleTestLogic(
    {
      projectPath: params.projectPath,
      workspacePath: params.workspacePath,
      scheme: params.scheme,
      simulatorId: params.simulatorId,
      simulatorName: params.simulatorName,
      configuration: params.configuration ?? 'Debug',
      derivedDataPath: params.derivedDataPath,
      extraArgs: params.extraArgs,
      useLatestOS: params.simulatorId ? false : (params.useLatestOS ?? false),
      preferXcodebuild: params.preferXcodebuild ?? false,
      platform: platform,
      testRunnerEnv: params.testRunnerEnv,
    },
    executor,
  );
}

export default {
  name: 'test_sim',
  description: `Runs tests on a simulator by UUID or name using xcodebuild test and parses xcresult output. Works with both Xcode projects (.xcodeproj) and workspaces (.xcworkspace).

**Session Workflow**: You can provide parameters explicitly OR set defaults once with session-set-defaults.

Required parameters (provide explicitly OR via session):
- scheme: The scheme to test
- projectPath OR workspacePath: Path to project or workspace
- simulatorId OR simulatorName: Simulator identifier

Example with explicit parameters:
test_sim({ projectPath: "/path/to/MyProject.xcodeproj", scheme: "MyScheme", simulatorName: "iPhone 16" })

Example with session defaults:
1. Set defaults once: session-set-defaults({ projectPath: "/path/to/MyProject.xcodeproj", scheme: "MyScheme" })
2. Then call with minimal params: test_sim({ simulatorName: "iPhone 16" })`,
  schema: baseSchemaObject.shape, // MCP SDK compatibility
  handler: createSessionAwareTool<TestSimulatorParams>({
    internalSchema: testSimulatorSchema as unknown as z.ZodType<TestSimulatorParams>,
    logicFunction: test_simLogic,
    getExecutor: getDefaultCommandExecutor,
    requirements: [
      {
        allOf: ['scheme'],
        message: `scheme is required.

Set with: session-set-defaults({ "scheme": "MyScheme" })
OR provide explicitly in test_sim call.`,
      },
      {
        oneOf: ['projectPath', 'workspacePath'],
        message: `Either projectPath or workspacePath required.

Set with: session-set-defaults({ "projectPath": "/path/to/MyApp.xcodeproj" })
OR provide explicitly in test_sim call.`,
      },
      {
        oneOf: ['simulatorId', 'simulatorName'],
        message: `Either simulatorId or simulatorName required.

Set with: session-set-defaults({ "simulatorName": "iPhone 16" })
OR provide explicitly in test_sim call.`,
      },
    ],
    exclusivePairs: [
      ['projectPath', 'workspacePath'],
      ['simulatorId', 'simulatorName'],
    ],
  }),
};
