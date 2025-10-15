/**
 * Simulator Build Plugin: Build Simulator (Unified)
 *
 * Builds an app from a project or workspace for a specific simulator by UUID or name.
 * Accepts mutually exclusive `projectPath` or `workspacePath`.
 * Accepts mutually exclusive `simulatorId` or `simulatorName`.
 */

import { z } from 'zod';
import { log } from '../../../utils/logging/index.ts';
import { executeXcodeBuildCommand } from '../../../utils/build/index.ts';
import { ToolResponse, XcodePlatform } from '../../../types/common.ts';
import type { CommandExecutor } from '../../../utils/execution/index.ts';
import { getDefaultCommandExecutor } from '../../../utils/execution/index.ts';
import { createSessionAwareTool } from '../../../utils/typed-tool-factory.ts';
import { nullifyEmptyStrings } from '../../../utils/schema-helpers.ts';

// Unified schema: XOR between projectPath and workspacePath, and XOR between simulatorId and simulatorName
const baseOptions = {
  scheme: z.string().describe('The scheme to use (Required)'),
  platform: z
    .enum(['iOS Simulator', 'watchOS Simulator', 'tvOS Simulator', 'visionOS Simulator'])
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
};

const baseSchemaObject = z.object({
  projectPath: z
    .string()
    .optional()
    .describe('Path to .xcodeproj file. Provide EITHER this OR workspacePath, not both'),
  workspacePath: z
    .string()
    .optional()
    .describe('Path to .xcworkspace file. Provide EITHER this OR projectPath, not both'),
  ...baseOptions,
});

const baseSchema = z.preprocess(nullifyEmptyStrings, baseSchemaObject);

const buildSimulatorSchema = baseSchema
  .refine((val) => val.projectPath !== undefined || val.workspacePath !== undefined, {
    message: 'Either projectPath or workspacePath is required.',
  })
  .refine((val) => !(val.projectPath !== undefined && val.workspacePath !== undefined), {
    message: 'projectPath and workspacePath are mutually exclusive. Provide only one.',
  })
  .refine((val) => val.simulatorId !== undefined || val.simulatorName !== undefined, {
    message: 'Either simulatorId or simulatorName is required.',
  })
  .refine((val) => !(val.simulatorId !== undefined && val.simulatorName !== undefined), {
    message: 'simulatorId and simulatorName are mutually exclusive. Provide only one.',
  });

export type BuildSimulatorParams = z.infer<typeof buildSimulatorSchema>;

// Internal logic for building Simulator apps.
async function _handleSimulatorBuildLogic(
  params: BuildSimulatorParams,
  executor: CommandExecutor = getDefaultCommandExecutor(),
): Promise<ToolResponse> {
  const projectType = params.projectPath ? 'project' : 'workspace';
  const filePath = params.projectPath ?? params.workspacePath;

  // Map platform string to XcodePlatform enum
  const platformMap: Record<string, XcodePlatform> = {
    'iOS Simulator': XcodePlatform.iOSSimulator,
    'watchOS Simulator': XcodePlatform.watchOSSimulator,
    'tvOS Simulator': XcodePlatform.tvOSSimulator,
    'visionOS Simulator': XcodePlatform.visionOSSimulator,
  };

  const platform = platformMap[params.platform ?? 'iOS Simulator'] ?? XcodePlatform.iOSSimulator;
  const platformName = params.platform ?? 'iOS Simulator';

  // Log warning if useLatestOS is provided with simulatorId
  if (params.simulatorId && params.useLatestOS !== undefined) {
    log(
      'warning',
      `useLatestOS parameter is ignored when using simulatorId (UUID implies exact device/OS)`,
    );
  }

  log(
    'info',
    `Starting ${platformName} build for scheme ${params.scheme} from ${projectType}: ${filePath}`,
  );

  // Ensure configuration has a default value for SharedBuildParams compatibility
  const sharedBuildParams = {
    ...params,
    configuration: params.configuration ?? 'Debug',
  };

  // executeXcodeBuildCommand handles both simulatorId and simulatorName
  return executeXcodeBuildCommand(
    sharedBuildParams,
    {
      platform: platform,
      simulatorName: params.simulatorName,
      simulatorId: params.simulatorId,
      useLatestOS: params.simulatorId ? false : params.useLatestOS, // Ignore useLatestOS with ID
      logPrefix: `${platformName} Build`,
    },
    params.preferXcodebuild ?? false,
    'build',
    executor,
  );
}

export async function build_simLogic(
  params: BuildSimulatorParams,
  executor: CommandExecutor,
): Promise<ToolResponse> {
  // Provide defaults
  const processedParams: BuildSimulatorParams = {
    ...params,
    configuration: params.configuration ?? 'Debug',
    useLatestOS: params.useLatestOS ?? true, // May be ignored if simulatorId is provided
    preferXcodebuild: params.preferXcodebuild ?? false,
  };

  return _handleSimulatorBuildLogic(processedParams, executor);
}

// Public schema = all fields optional (session defaults can provide values)
// This allows agents to provide parameters explicitly OR rely on session defaults
const publicSchemaObject = baseSchemaObject;

export default {
  name: 'build_sim',
  description: 'Builds an app for a simulator.',
  schema: publicSchemaObject.shape, // MCP SDK compatibility (public inputs only)
  handler: createSessionAwareTool<BuildSimulatorParams>({
    // Type assertion required: Zod's .refine() changes the schema type signature,
    // but the validated output type is still BuildSimulatorParams
    internalSchema: buildSimulatorSchema as unknown as z.ZodType<BuildSimulatorParams>,
    logicFunction: build_simLogic,
    getExecutor: getDefaultCommandExecutor,
    requirements: [
      { allOf: ['scheme'], message: 'scheme is required' },
      { oneOf: ['projectPath', 'workspacePath'], message: 'Provide a project or workspace' },
      { oneOf: ['simulatorId', 'simulatorName'], message: 'Provide simulatorId or simulatorName' },
    ],
    exclusivePairs: [
      ['projectPath', 'workspacePath'],
      ['simulatorId', 'simulatorName'],
    ],
  }),
};
