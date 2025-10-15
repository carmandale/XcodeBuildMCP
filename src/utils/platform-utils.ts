import { XcodePlatform } from '../types/common.ts';

/**
 * Maps platform string to XcodePlatform enum.
 * Defaults to iOS Simulator if platform is undefined or unknown.
 *
 * @param platformStr - Platform string from tool parameters (e.g., "iOS Simulator", "visionOS Simulator")
 * @returns XcodePlatform enum value
 *
 * @example
 * const platform = mapPlatformStringToEnum('visionOS Simulator');
 * // Returns: XcodePlatform.visionOSSimulator
 */
export function mapPlatformStringToEnum(platformStr?: string): XcodePlatform {
  const platformMap: Record<string, XcodePlatform> = {
    'iOS Simulator': XcodePlatform.iOSSimulator,
    'watchOS Simulator': XcodePlatform.watchOSSimulator,
    'tvOS Simulator': XcodePlatform.tvOSSimulator,
    'visionOS Simulator': XcodePlatform.visionOSSimulator,
  };
  return platformMap[platformStr ?? 'iOS Simulator'] ?? XcodePlatform.iOSSimulator;
}
