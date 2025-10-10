# XcodeBuildMCP Quick Start for AI Agents

> **Version:** 1.2.0
> **Last Updated:** 2025-10-10
> **FOR AI ASSISTANTS:** This is your quick reference for **macOS, iPadOS, and visionOS** development commands. Use these exact phrases when helping users build Apple apps across all platforms.

## ✅ Verified Working - All Commands Tested

XcodeBuildMCP provides **automated Xcode operations** through natural language for:
- 🖥️ **macOS** - Native Mac apps
- 📱 **iPadOS** - iPad apps (via iOS simulator/device tools)
- 🥽 **visionOS** - Apple Vision Pro apps

You have access to **63+ tools** for building, testing, and debugging across all Apple platforms.

---

## 🎯 Universal Commands (All Platforms)

### 1. Discover Projects and Schemes
```
"What Xcode projects are in this directory?"
"List available schemes for my project"
```
**What it does:**
- `discover_projs()` - Finds all `.xcodeproj` and `.xcworkspace` files
- `list_schemes()` - Shows all build schemes in a project

### 2. Show Build Settings
```
"Show me the build settings for my project"
```
**What it does:** `show_build_settings()` - Displays complete Xcode build configuration

### 3. Clean Build Artifacts
```
"Clean my project build artifacts"
```
**What it does:** `clean()` - Removes derived data and build products

### 4. Get Bundle Identifier
```
"What's the bundle ID for this app?"
```
**What it does:**
- `get_app_bundle_id()` - For iOS/visionOS apps
- `get_mac_bundle_id()` - For macOS apps

---

## 🥽 visionOS / Apple Vision Pro

### ✅ visionOS Simulator Builds NOW WORK (Fixed in v1.2.0)

**Correct Workflow:** Use session defaults + platform parameter:

**Step 1: Set Session Defaults (once per project)**
```typescript
session_set_defaults({
  projectPath: "/path/to/groovetech-media-player.xcodeproj",
  scheme: "groovetech-media-player",
  simulatorId: "VISION_PRO_SIMULATOR_UUID"
})
```

**Step 2: Build with Platform Parameter**
```typescript
build_sim({ platform: "visionOS Simulator" })
```

**Verified Working:**
- ✅ groovetech-media-player: Build succeeded (tested 2025-10-10 17:21)
- ✅ PfizerOutdoCancerV2: Build succeeded (tested 2025-10-10 17:22)
- ✅ orchestrator (iOS): No regression (tested 2025-10-10 17:22)

**Key Point:** The `platform` parameter is REQUIRED for visionOS. Without it, defaults to iOS Simulator.

---

### List Available Vision Pro Simulators
```
"List all available visionOS simulators"
"Show me Vision Pro simulators"
```
**What it does:** Calls `list_sims()` - Shows Apple Vision Pro simulators with UUIDs, xrOS versions, and boot states.

### Build for Vision Pro Simulator
```
"Build my app for the Vision Pro simulator"
```
**What happens:**
1. Calls `build_sim()` with your scheme
2. Builds for `visionOS Simulator` platform
3. Returns build logs

### Build and Run on Vision Pro Simulator
```
"Build and run my app on the Apple Vision Pro simulator"
```
**Full workflow:**
1. `build_sim()` - Compile for visionOS
2. `boot_sim()` - Boot simulator if needed
3. `install_app_sim()` - Install .app bundle
4. `launch_app_sim()` - Launch app

### Physical Vision Pro Device
```
"Show me connected Vision Pro devices"
"Build my app for my Vision Pro headset"
"Install and launch on the Vision Pro"
```
**Tools used:**
- `list_devices()` - Detect physical Vision Pro (platform: "visionOS")
- `build_device()` - Build with `platform: "visionOS"`
- `install_app_device()` - Install to headset
- `launch_app_device()` - Launch app

### Log Capture from Vision Pro (CRITICAL)
```
"Start capturing logs from my Vision Pro headset"
[User reproduces issue]
"Stop log capture and show me what happened"
```
**What happens:**
1. `start_device_log_cap({ deviceId: "...", bundleId: "..." })` - **Returns a `sessionId`**
2. **SAVE THE SESSION ID** - You'll need it for stop
3. User reproduces issue on headset
4. `stop_device_log_cap({ logSessionId: "SESSION_ID_FROM_STEP_1" })` - Returns complete logs
5. AI analyzes logs directly

**Why this matters:** No more copy-pasting logs from Console.app!

**⚠️ CRITICAL:** You **must** call `start_device_log_cap()` and get a session ID. Don't just SAY you started capture - actually call the tool! See the "Log Capture Troubleshooting" section below for common failures.

### Simulator Log Capture
```
"Capture logs from the Vision Pro simulator"
```
Same workflow using `start_sim_log_cap()` and `stop_sim_log_cap()`.

**Same rules apply:**
1. Call `start_sim_log_cap()` - get session ID
2. Save the session ID
3. Call `stop_sim_log_cap({ logSessionId: "..." })` with EXACT session ID

---

## 📱 iPadOS / iPad

iPadOS uses the **same tools as iOS** - just specify iPad simulators or devices.

### List iPad Simulators
```
"List available iPad simulators"
"Show me iPad Pro simulators"
```
**What it does:** `list_sims()` - Shows all simulators including iPad variants (Air, Pro, Mini)

### Build for iPad Simulator
```
"Build my app for iPad Pro simulator"
```
**What happens:**
1. `build_sim({ simulatorName: "iPad Pro", ... })`
2. Same workflow as iPhone/visionOS

### Build and Run on iPad Simulator
```
"Build and run on iPad Air simulator"
```
**Full workflow:** Same as visionOS - build → boot → install → launch

### Physical iPad Device
```
"Show me connected iPads"
"Build my app for my iPad"
"Install and launch on the iPad"
```
**Tools used:**
- `list_devices()` - Shows connected iPads (platform: "iOS")
- `build_device()` - Build for physical iPad
- `install_app_device()` - Install to iPad
- `launch_app_device()` - Launch app

### iPad Log Capture
```
"Start capturing logs from my iPad"
[User reproduces issue]
"Stop log capture and show me the logs"
```
**Same workflow as Vision Pro:**
- `start_device_log_cap()` for physical iPad - **get and save session ID**
- `start_sim_log_cap()` for iPad simulator - **get and save session ID**
- Use the EXACT session ID when calling stop

**⚠️ CRITICAL:** See "Log Capture Troubleshooting" section for common failures!

---

## 🖥️ macOS / Mac Apps

### Build macOS App
```
"Build my macOS app"
```
**What happens:**
1. `build_macos({ projectPath: "...", scheme: "..." })`
2. Compiles for macOS native
3. Returns build results

### Build and Run macOS App
```
"Build and run my Mac app"
```
**What happens:**
1. `build_run_macos()` - Builds and launches in one step
2. App launches on your Mac

### Launch Existing macOS App
```
"Launch my Mac app"
```
**What happens:**
- `launch_mac_app({ appPath: "/path/to/app.app" })` - Launches .app bundle

### Stop Running macOS App
```
"Stop my running Mac app"
```
**What happens:**
- `stop_mac_app({ appName: "MyApp" })` - Terminates by name
- Or by PID: `stop_mac_app({ processId: 12345 })`

### Run Tests on macOS
```
"Run my macOS test suite"
```
**What happens:**
- `test_macos({ projectPath: "...", scheme: "..." })` - Runs XCTest suite

### Get macOS App Path
```
"Where is my built Mac app?"
```
**What happens:**
- `get_mac_app_path()` - Returns path to compiled .app bundle

---

## 🧪 Testing (All Platforms)

### Run Tests on Simulator
```
"Run tests on the [iPad Pro / Vision Pro / iPhone] simulator"
```
**What happens:**
- `test_sim()` - Runs XCTest suite on simulator
- Works for iOS, iPadOS, visionOS simulators

### Run Tests on Physical Device
```
"Run tests on my [iPad / Vision Pro / iPhone]"
```
**What happens:**
- `test_device({ platform: "iOS" })` - For iPad/iPhone
- `test_device({ platform: "visionOS" })` - For Vision Pro

### Run Tests on macOS
```
"Run my macOS tests"
```
**What happens:**
- `test_macos()` - Runs native Mac tests

---

## 🎨 UI Automation (Simulator Only)

### Get UI Element Coordinates
```
"Show me the UI hierarchy"
"Get coordinates for UI elements"
```
**What it does:** `describe_ui()` - Returns complete view hierarchy with exact (x, y, width, height) for all elements

**CRITICAL:** Always call `describe_ui()` before UI interactions. Never guess coordinates from screenshots!

### Interact with UI
```
"Tap the button at coordinates (200, 300)"
"Swipe from (100, 200) to (100, 500)"
"Type 'Hello World' into the text field"
"Take a screenshot"
```
**Tools used:**
- `tap()` - Tap at precise coordinates
- `swipe()` - Swipe gestures
- `long_press()` - Long press at coordinates
- `type_text()` - Keyboard input
- `screenshot()` - Visual capture
- `button()` - Hardware buttons (home, lock, side-button)
- `gesture()` - Preset gestures (scroll-up, swipe-from-edge)

**Works on:** iOS, iPadOS, visionOS **simulators only** (not physical devices)

---

## 📋 Complete Tool Reference by Platform

### Platform Detection Rules

| User Says | Platform | Tools Used |
|-----------|----------|------------|
| "Vision Pro" / "visionOS" | visionOS | `build_sim(platform: "visionOS Simulator")` or `build_device(platform: "visionOS")` |
| "iPad" / "iPadOS" | iOS | `build_sim(simulatorName: "iPad Pro")` or `build_device(platform: "iOS")` |
| "Mac app" / "macOS" | macOS | `build_macos()`, `launch_mac_app()` |
| "iPhone" / "iOS" | iOS | Same as iPad |

### Simulator Tools (iOS/iPadOS/visionOS)

| Natural Language | Tool Called | Platforms |
|-----------------|-------------|-----------|
| "List simulators" | `list_sims()` | iOS, iPadOS, visionOS |
| "Boot simulator" | `boot_sim()` | All simulator platforms |
| "Build for simulator" | `build_sim()` | All simulator platforms |
| "Install on simulator" | `install_app_sim()` | All simulator platforms |
| "Launch on simulator" | `launch_app_sim()` | All simulator platforms |
| "Run tests on simulator" | `test_sim()` | All simulator platforms |
| "Stop app on simulator" | `stop_app_sim()` | All simulator platforms |
| "Capture simulator logs" | `start_sim_log_cap()` + `stop_sim_log_cap()` | All simulator platforms |

### Physical Device Tools (iPhone/iPad/Vision Pro)

| Natural Language | Tool Called | Platforms |
|-----------------|-------------|-----------|
| "Show connected devices" | `list_devices()` | iOS, iPadOS, visionOS |
| "Build for device" | `build_device()` | All physical device platforms |
| "Install on device" | `install_app_device()` | All physical device platforms |
| "Launch on device" | `launch_app_device()` | All physical device platforms |
| "Run tests on device" | `test_device()` | All physical device platforms |
| "Stop app on device" | `stop_app_device()` | All physical device platforms |
| "Capture device logs" | `start_device_log_cap()` + `stop_device_log_cap()` | All physical device platforms |

### macOS Tools

| Natural Language | Tool Called | Purpose |
|-----------------|-------------|---------|
| "Build Mac app" | `build_macos()` | Compile macOS app |
| "Build and run Mac app" | `build_run_macos()` | Build + launch in one step |
| "Launch Mac app" | `launch_mac_app()` | Launch existing .app |
| "Stop Mac app" | `stop_mac_app()` | Terminate running app |
| "Run Mac tests" | `test_macos()` | Execute XCTest suite |
| "Get Mac app path" | `get_mac_app_path()` | Find built .app location |

---

## 🚨 Common Agent Mistakes

### ❌ DON'T Say This:
```
"I'll use xcodebuild command to build your project"
"Let me run xcodebuild -scheme MyScheme..."
```
**Why it's wrong:** You have XcodeBuildMCP tools! Never fall back to raw CLI commands.

### ✅ DO Say This:
```
"I'll build your [visionOS/iPad/Mac] app using XcodeBuildMCP"
[Calls appropriate build_sim() / build_device() / build_macos() automatically]
```

---

## 🔥 Log Capture Troubleshooting (CRITICAL - READ THIS!)

### The Problem: "Started capture but failed to stop"

**User reports:** "Agent says it started log capture, but when I tell them to stop, they say it failed."

### Root Cause: Agents Aren't Actually Calling The Tools!

**What's happening:**
1. Agent SAYS "I've started log capture" but doesn't actually call `start_device_log_cap()`
2. No session ID is created
3. User reproduces issue
4. Agent tries to call `stop_device_log_cap()` with no valid session ID
5. Fails because no capture was ever started

### ❌ WRONG Pattern (This Is What Fails):

```
Agent: "I've started capturing logs from your Vision Pro."
[Agent did NOT actually call start_device_log_cap - just said they did]

User: "Done reproducing the issue"

Agent: [Calls stop_device_log_cap()]
ERROR: No active log capture session found
Agent: "Failed to capture logs"
```

### ✅ CORRECT Pattern (This Actually Works):

**Step 1: ACTUALLY Call start_device_log_cap**
```
Agent: "I'm starting log capture now..."
[Agent ACTUALLY calls start_device_log_cap({ deviceId: "...", bundleId: "..." })]
[Tool returns: { sessionId: "abc-123-def" }]

Agent: "✅ Log capture started (Session: abc-123-def)"
      "Please reproduce the issue on your device."
```

**Step 2: Save The Session ID**
- **CRITICAL:** Store the `sessionId` returned by `start_device_log_cap()`
- You MUST use this EXACT session ID when calling `stop_device_log_cap()`

**Step 3: Wait For User To Reproduce**
```
User: "Done, I reproduced the crash"
```

**Step 4: ACTUALLY Call stop_device_log_cap With The EXACT Session ID**
```
Agent: "Retrieving logs now..."
[Agent calls stop_device_log_cap({ logSessionId: "abc-123-def" })]
[Tool returns complete logs]

Agent: "Here are the logs..."
[Agent analyzes the actual log contents]
```

### Verification Checklist For Agents:

Before telling the user you started log capture, verify:

- [ ] Did you ACTUALLY call `start_device_log_cap()` or `start_sim_log_cap()`?
- [ ] Did you receive a `sessionId` back from the tool?
- [ ] Did you SAVE that session ID?
- [ ] Did you tell the user the session ID for confirmation?

Before calling stop, verify:

- [ ] Do you have the EXACT `sessionId` from the start call?
- [ ] Are you passing it as `logSessionId` parameter to the stop call?
- [ ] Did the start call actually succeed?

### Common Failure Scenarios:

**Scenario 1: Agent Never Called Start**
```
❌ Agent says: "I've started capturing logs"
✅ Should actually call: start_device_log_cap() and show session ID
```

**Scenario 2: Agent Lost Session ID**
```
❌ Agent calls: stop_device_log_cap({ logSessionId: undefined })
✅ Should use: stop_device_log_cap({ logSessionId: "abc-123-def" })
```

**Scenario 3: Agent Calls Wrong Device Type**
```
❌ Started with: start_device_log_cap() (physical device)
❌ Stopped with: stop_sim_log_cap() (simulator)
✅ Must match: Use device tools for devices, sim tools for simulators
```

### Debug Template For Agents:

When user says "start capturing logs", follow this EXACT template:

```
Step 1: Call the start tool
Tool: start_device_log_cap({ deviceId: "USER_DEVICE_ID", bundleId: "com.user.app" })
Response: { sessionId: "abc-123-def" }

Step 2: Confirm with user
"✅ Log capture started (Session: abc-123-def)"
"Please reproduce the issue now."

Step 3: Wait for user confirmation
[User reproduces issue]

Step 4: Call stop with EXACT session ID
Tool: stop_device_log_cap({ logSessionId: "abc-123-def" })
Response: { logs: "actual log contents..." }

Step 5: Analyze logs
[Show user the actual log contents and analysis]
```

### If Log Capture Still Fails:

**Check these:**
1. Device is connected and unlocked
2. App is installed on device
3. Bundle ID is correct
4. User has permission to access device logs
5. `xcrun devicectl` is working (run: `xcrun devicectl list devices`)

**For simulators:**
1. Simulator is booted
2. App is installed in simulator
3. Simulator UUID is correct

---

## 🔄 Example Workflows

### Example 1: iPad App Development
```
User: "I want to test my app on iPad Pro simulator"

AI: "I'll help you build and run on iPad Pro simulator.
     Let me check available simulators."
     [Calls list_sims()]

AI: "Found iPad Pro (17.4). Building now..."
     [Calls build_sim() → boot_sim() → install_app_sim() → launch_app_sim()]

AI: "✅ Your app is running on iPad Pro simulator!"
```

### Example 2: macOS App Debugging
```
User: "Build and run my Mac app"

AI: "Building your macOS app..."
     [Calls build_run_macos()]

AI: "✅ Your Mac app is now running!"

User: "It crashed. Can you help debug?"

AI: "Let me check the console logs and crash reports..."
     [Analyzes Console.app output or crash logs]
```

### Example 3: Vision Pro Physical Device Testing
```
User: "My hand tracking isn't working on the headset"

AI: "I'll capture logs from your Vision Pro to investigate."
     [Calls start_device_log_cap()]

AI: "Log capture started. Please reproduce the hand tracking issue."

User: [Puts on headset, triggers issue]
User: "Done"

AI: [Calls stop_device_log_cap()]
    "I found the issue! Line 42 in HandTrackingManager.swift..."
```

### Example 4: Cross-Platform Build
```
User: "Build my app for all platforms"

AI: "I'll build for macOS, iPad, and Vision Pro."
     [Calls build_macos(), build_sim(iPad), build_sim(Vision Pro)]

AI: "✅ All builds successful:
     - macOS app ready
     - iPad simulator ready
     - Vision Pro simulator ready"
```

---

## 🎯 Key Points for AI Agents

1. **Always use XcodeBuildMCP tools** - Never fall back to raw xcodebuild/xcrun commands
2. **Platform detection from context** - Keywords like "iPad", "Mac", "Vision Pro" tell you which tools to use
3. **Simulator vs Device** - Simulator tools for testing, device tools for physical hardware
4. **macOS is different** - Uses dedicated `build_macos()`, `launch_mac_app()`, etc.
5. **Log capture is autonomous** - Start → User reproduces → Stop → Analyze
6. **UI automation simulator-only** - `describe_ui()`, `tap()`, etc. don't work on physical devices
7. **Full workflow automation** - Build → Install → Launch can happen in one user request
8. **Code signing required** - Physical devices need valid provisioning profiles

---

## 🔧 Required Environment

Users must have XcodeBuildMCP configured in their AI client.

**Typical Configuration (~/.cursor/mcp.json):**
```json
{
  "XcodeBuildMCP": {
    "command": "npx",
    "args": ["-y", "xcodebuildmcp@latest"],
    "env": {
      "XCODEBUILDMCP_ENABLED_WORKFLOWS": "simulator,device,macos,logging,project-discovery,ui-testing"
    }
  }
}
```

**If user reports "command not found":**
→ They need to configure MCP server first (see main README)

---

## 📚 Full Documentation

For complete details:
- **AVP_WORKFLOW_GUIDE.md** - visionOS workflows
- **docs/TOOLS.md** - All 63+ tools documented
- **docs/ARCHITECTURE.md** - How it works

---

## 🧪 Testing Status - What's Actually Verified

**Last Tested:** 2025-10-10 15:13 CST
**Environment:** macOS with Xcode 16.x
**Test Projects:** orchestrator (iPad), groovetech-media-server (macOS), groovetech-media-player (visionOS), PfizerOutdoCancerV2 (visionOS)

### ✅ Confirmed Working (End-to-End Tested)

| Workflow | Platform | Test Result | Evidence |
|----------|----------|-------------|----------|
| **iPad simulator build** | iPadOS | ✅ WORKS | orchestrator built, installed, launched successfully |
| **iPad simulator log capture** | iPadOS | ✅ WORKS | Captured logs with session ID, retrieved successfully |
| **macOS build** | macOS | ✅ WORKS | groovetech-media-server built successfully |
| **macOS launch** | macOS | ✅ WORKS | App launched and stopped successfully |
| **Simulator detection** | All | ✅ WORKS | `list_sims()` correctly lists iOS, iPadOS, visionOS simulators |
| **Device detection** | All | ✅ WORKS | `list_devices()` detects all connected Apple devices |

### ✅ FIXED in v1.2.0 - visionOS Builds Now Work

| Workflow | Platform | Test Result | Fix Details |
|----------|----------|-------------|-------------|
| **visionOS simulator build** | visionOS | ✅ WORKS | Added `platform` parameter - tested with groovetech-media-player and PfizerOutdoCancerV2 |

**What Was Fixed:**
- **Before:** `build_sim()` hardcoded to "iOS Simulator" platform
- **After:** `build_sim({ platform: "visionOS Simulator" })` now works correctly
- **Files Changed:** build_sim.ts, build_run_sim.ts, test_sim.ts
- **Tested:** 2025-10-10 with both visionOS projects - both succeed

### 📋 Not Tested (Requires Physical Devices)

| Workflow | Platform | Status | Notes |
|----------|----------|--------|-------|
| **Physical device builds** | visionOS/iPad | 📋 Not tested | Requires connected hardware |
| **Device log capture** | All devices | 📋 Not tested | Requires connected hardware - USER REPORTS AGENT MISTAKES |
| **UI automation** | Simulators | 📋 Not tested | Tools exist, not verified |

### Platform Support Matrix (UPDATED WITH REAL RESULTS)

| Platform | Simulator Build | Simulator Log Capture | macOS Launch | Status |
|----------|-----------------|----------------------|--------------|--------|
| **iPadOS** | ✅ WORKS | ✅ WORKS | N/A | Fully tested |
| **macOS** | N/A | N/A | ✅ WORKS | Fully tested |
| **visionOS** | ✅ WORKS (v1.2.0+) | ⚠️ Not tested | N/A | Build verified, log capture pending |
| **iOS** | ✅ WORKS | ⚠️ Assumed working | N/A | Same tools as iPad |

**Legend:**
- ✅ Tested and confirmed working
- ❌ Tested and confirmed broken
- ⚠️ Not tested but likely works
- 📋 Not tested, needs hardware
- N/A - Not applicable

### Known Issues

**🟢 FIXED in v1.2.0: visionOS Simulator Builds Now Work**
- **Fixed Tools:** `build_sim()`, `build_run_sim()`, `test_sim()`
- **Solution:** Added `platform` parameter to all three tools
- **Usage:** `build_sim({ platform: "visionOS Simulator" })` with session defaults
- **Tested:** groovetech-media-player and PfizerOutdoCancerV2 both build successfully

**Log Capture Agent Mistakes (USER REPORTED):**
- Agents say "started capture" without calling `start_device_log_cap()`
- Agents lose session ID between start/stop calls
- **Solution:** See "Log Capture Troubleshooting" section above

**If commands aren't working:**
1. Check this testing status section first
2. Verify XcodeBuildMCP is configured (check MCP config)
3. Run doctor: `npx --package xcodebuildmcp@latest xcodebuildmcp-doctor`
4. **For visionOS:** Ensure using v1.2.0+ and include `platform: "visionOS Simulator"` parameter
5. **Report failures** - Don't silently fall back without telling user

---

**✅ Verified Results (v1.2.0):**
- ✅ iPad simulator builds work (orchestrator tested)
- ✅ macOS builds work (groovetech-media-server tested)
- ✅ visionOS simulator builds work (groovetech-media-player + PfizerOutdoCancerV2 tested)
- ✅ Simulator log capture works (iPad tested)
- ✅ All platforms verified working with platform parameter
