# MCP Configuration Locations

> **Purpose:** Reference guide for where each AI tool stores MCP server configurations
> **Last Updated:** 2025-10-10
> **Status:** All configs point to local XcodeBuildMCP build

## Configuration Files by Tool

### 1. Claude Code

**Location:**
```
~/.claude.json
```

**Format:** JSON

**Current Configuration:**
```json
{
  "mcpServers": {
    "XcodeBuildMCP": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"
      ],
      "env": {}
    }
  }
}
```

**Status:** ✅ Using local build

**To Update:**
```bash
# Backup first
cp ~/.claude.json ~/.claude.json.backup

# Edit the file to change XcodeBuildMCP section
```

---

### 2. Cursor

**Location:**
```
~/.cursor/mcp.json
```

**Format:** JSON

**Current Configuration:**
```json
{
  "mcpServers": {
    "XcodeBuildMCP-Production": {
      "command": "node",
      "args": [
        "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"
      ],
      "env": {
        "XCODEBUILDMCP_ENABLED_WORKFLOWS": "simulator,device,logging,project-discovery,ui-testing",
        "XCODEBUILDMCP_SENTRY_DISABLED": "true",
        "INCREMENTAL_BUILDS_ENABLED": "false"
      }
    },
    "XcodeBuildMCP-Dev": {
      "command": "node",
      "args": [
        "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"
      ],
      "env": {
        "XCODEBUILDMCP_DEBUG": "true",
        "XCODEBUILDMCP_ENABLED_WORKFLOWS": "simulator,device,logging,project-discovery,ui-testing,project-scaffolding",
        "XCODEBUILDMCP_SENTRY_DISABLED": "true",
        "INCREMENTAL_BUILDS_ENABLED": "false"
      }
    }
  }
}
```

**Status:** ✅ Both Production and Dev use local build

**Notes:**
- Has two configurations (Production and Dev)
- Both point to same local build
- Dev includes additional workflows (project-scaffolding)

---

### 3. Claude Desktop

**Location:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Format:** JSON

**Status:** ❌ Not installed/not used

**If you install Claude Desktop:**
```json
{
  "mcpServers": {
    "XcodeBuildMCP": {
      "command": "node",
      "args": [
        "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"
      ]
    }
  }
}
```

---

### 4. Factory Droid CLI (Codex)

**Location:** Per-project configs
```
{project-root}/.factory/config.toml
```

**Format:** TOML

**Status:** ⚠️ No configs exist in orchestrator projects yet

**If you use Factory Droid, create this file in each project:**

**Example `.factory/config.toml`:**
```toml
[mcp_servers.xcodebuildmcp]
command = "node"
args = ["/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"]
```

**Projects that would need this:**
- `groovetech-media-server/.factory/config.toml`
- `PfizerOutdoCancerV2/.factory/config.toml`
- `groovetech-media-player/.factory/config.toml`
- `orchestrator/.factory/config.toml`
- `AVPStreamKit/.factory/config.toml`

---

## Quick Reference

| Tool | Config Path | Format | Status |
|------|-------------|--------|--------|
| **Claude Code** | `~/.claude.json` | JSON | ✅ Local build |
| **Cursor** | `~/.cursor/mcp.json` | JSON | ✅ Local build (2 servers) |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` | JSON | ❌ Not installed |
| **Factory Droid** | `{project}/.factory/config.toml` | TOML | ⚠️ No configs |

---

## Updating Configuration

### When XcodeBuildMCP Code Changes

After making changes to XcodeBuildMCP:

```bash
# 1. Build the project
cd "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP"
npm run build

# 2. Restart your AI tool to reload MCP servers
# - Claude Code: Quit and relaunch
# - Cursor: Quit and relaunch
# - Factory Droid: Restart the CLI session
```

### Switching Between Published and Local

**To use published package (stable):**
```json
{
  "command": "npx",
  "args": ["-y", "xcodebuildmcp@latest"]
}
```

**To use local build (your changes):**
```json
{
  "command": "node",
  "args": ["/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/XcodeBuildMCP/build/index.js"]
}
```

---

## Verification

**Check which version is running:**

In any AI tool, ask:
```
"What version of XcodeBuildMCP are you using?"
```

Should show:
- Version: 1.14.1 (from package.json)
- Using local build path if configured correctly

**Or check processes:**
```bash
ps aux | grep xcodebuildmcp | grep -v grep
```

Should show paths to your local build, not npm cache.

---

## Backups

**Before modifying configs, backups are created:**
- `~/.claude.json.backup-TIMESTAMP`
- `~/.cursor/mcp.json.backup-TIMESTAMP`

**To restore:**
```bash
cp ~/.claude.json.backup ~/.claude.json
cp ~/.cursor/mcp.json.backup ~/.cursor/mcp.json
```

---

## Summary

✅ **Claude Code** - Using local build
✅ **Cursor** - Using local build (both Production and Dev)
❌ **Claude Desktop** - Not installed
⚠️ **Factory Droid** - No configs created yet (would need per-project TOML files)

**All active AI tools are using your local XcodeBuildMCP build with the visionOS platform fix.**
