# XcodeBuildMCP Uninstallation Guide

This guide explains how to safely uninstall XcodeBuildMCP from your system, including removing it from MCP client configurations and project repositories.

## Overview

The uninstaller handles removal from:

- **MCP Client Configurations**
  - Claude Code (`~/.claude.json`)
  - Claude Desktop (`~/.config/claude/mcp.json`)
  - Cursor (`~/.cursor/mcp.json`)
  - Factory Droid (`~/.factory/mcp.json`)

- **Project Repositories**
  - AGENTS.md
  - CLAUDE.md
  - AGENT_QUICK_START.md
  - INSTALLER-USAGE.md
  - INSTALL-XCODE-SCRIPTS.md
  - AVP_WORKFLOW_GUIDE.md
  - .claude/ directory
  - .claude/scripts/ directory

- **Installation Directory** (optional)
  - XcodeBuildMCP source code and build artifacts

## Installation

Both a Bash script and Python script are provided for maximum compatibility.

**Important:** Both scripts fully support repository paths with spaces (e.g., `/path/to/My Projects/repo`).

### Bash Version (macOS/Linux)

```bash
bash uninstall-xcodebuildmcp.sh [options]
```

**Requirements:**
- Bash 4.0+
- `jq` (optional, for automatic JSON parsing)

### Python Version (Cross-Platform)

```bash
python3 uninstall-xcodebuildmcp.py [options]
```

**Requirements:**
- Python 3.7+
- No external dependencies

## Usage

### Preview Mode (Recommended First Step)

Run without any flags to see what will be removed **without actually removing anything**:

```bash
# Bash
bash uninstall-xcodebuildmcp.sh

# Python
python3 uninstall-xcodebuildmcp.py
```

### Actual Uninstallation

Use the `--force` flag to actually remove files:

```bash
# Bash
bash uninstall-xcodebuildmcp.sh --force

# Python
python3 uninstall-xcodebuildmcp.py --force
```

### With Backups

Create timestamped backups before removing (stored in `~/.xcodebuildmcp-backups/`):

```bash
# Bash
bash uninstall-xcodebuildmcp.sh --force --backup

# Python
python3 uninstall-xcodebuildmcp.py --force --backup
```

### Remove Installation Directory

Also remove the XcodeBuildMCP installation itself:

```bash
# Bash
bash uninstall-xcodebuildmcp.sh --force --remove-installation

# Python
python3 uninstall-xcodebuildmcp.py --force --remove-installation
```

### Combine Options

```bash
# Bash - backup and remove installation
bash uninstall-xcodebuildmcp.sh --force --backup --remove-installation

# Python - backup and remove installation
python3 uninstall-xcodebuildmcp.py --force --backup --remove-installation
```

## Step-by-Step Walkthrough

### Step 1: Preview the Changes

```bash
bash uninstall-xcodebuildmcp.sh
```

Output example:
```
╔════════════════════════════════════════════════════════════════╗
║       XcodeBuildMCP Uninstaller                               ║
╚════════════════════════════════════════════════════════════════╝

Step 1: Removing from MCP Client Configurations
─────────────────────────────────────────────────
✓ Removed XcodeBuildMCP from /Users/username/.claude.json
⊘ Config file not found: /Users/username/.config/claude/mcp.json
✓ Removed XcodeBuildMCP from /Users/username/.cursor/mcp.json
⊘ Config file not found: /Users/username/.factory/mcp.json

Step 2: Removing Documentation Files
─────────────────────────────────────────────────
Enter path to repository to clean (or press Enter to skip): /path/to/repo1
✓ Removed: AGENTS.md
✓ Removed: CLAUDE.md
...
```

### Step 2: Review the Output

The script will show you:
- Which MCP client configurations will be modified
- Which documentation files will be removed
- Which directories will be cleaned
- Any files that couldn't be processed

### Step 3: Execute Uninstallation

If everything looks correct, run with `--force`:

```bash
bash uninstall-xcodebuildmcp.sh --force
```

### Step 4: Verify Removal

Check that:
- MCP configurations no longer reference XcodeBuildMCP
- Documentation files have been removed from repositories
- Installation directory is gone (if `--remove-installation` was used)

```bash
# Verify MCP config
cat ~/.claude.json | grep XcodeBuildMCP
# (should return nothing)

# Check for remaining documentation
grep -r "AGENT_QUICK_START" /path/to/repo
# (should return nothing)
```

## Recovery

### Restore from Backups

If you used `--backup`, backups are saved in:

```
~/.xcodebuildmcp-backups/YYYYMMDD_HHMMSS/
```

To restore a specific file:

```bash
# Example: Restore Claude Code configuration
cp ~/.xcodebuildmcp-backups/20250121_140530/claude.json ~/.claude.json

# Example: Restore repository documentation
cp ~/.xcodebuildmcp-backups/20250121_140530/docs/* /path/to/repo/
```

### Manual Restoration

If backups weren't created, you can manually restore by:

1. **Reinstalling XcodeBuildMCP**
   ```bash
   cd XcodeBuildMCP
   npm run build
   ```

2. **Re-running the installer scripts**
   ```bash
   bash install-xcode-scripts.sh
   ```

3. **Re-configuring MCP clients** to point to XcodeBuildMCP

## Troubleshooting

### Python Script Error: "JSONDecodeError"

Your MCP configuration file has invalid JSON. Fix it manually:

```bash
# Use jq to validate and fix
jq . ~/.claude.json
```

### Bash Script Error: "jq not found"

The Bash script uses `jq` for JSON processing. Either:

1. Install jq: `brew install jq`
2. Use the Python script instead: `python3 uninstall-xcodebuildmcp.py`
3. Manually edit JSON files to remove XcodeBuildMCP

### Files Still Present After Uninstallation

Make sure you used the `--force` flag:

```bash
bash uninstall-xcodebuildmcp.sh --force
```

### Configuration Changes Not Taking Effect

After uninstallation, you may need to:

1. **Restart your IDE/Editor**
   ```bash
   # Kill and restart Claude Code, Cursor, etc.
   ```

2. **Clear MCP tool cache**
   - Restart your IDE/Editor
   - Quit and relaunch MCP clients

3. **Verify configuration**
   ```bash
   cat ~/.claude.json | grep -i xcode
   # (should be empty)
   ```

## Advanced Usage

### Custom Installation Path

If XcodeBuildMCP is installed in a non-standard location, manually specify it:

**Bash:**
```bash
# Edit the script to add your path to installation_paths array
vi uninstall-xcodebuildmcp.sh
```

**Python:**
```bash
# Edit the script to modify installation_paths list
vi uninstall-xcodebuildmcp.py
```

### Dry Run (No Changes Made)

Both scripts support a "dry run" mode. Run without `--force`:

```bash
bash uninstall-xcodebuildmcp.sh
python3 uninstall-xcodebuildmcp.py
```

This shows exactly what would be removed without making any changes.

### Script Integration

Integrate into your own installation/deployment scripts:

**Bash:**
```bash
#!/bin/bash
source uninstall-xcodebuildmcp.sh
remove_mcp_config "/path/to/config.json"
```

**Python:**
```python
from uninstall_xcodebuildmcp import XcodeBuildMCPUninstaller

uninstaller = XcodeBuildMCPUninstaller(force=True, backup=True)
uninstaller.run()
```

## What Gets Removed

### MCP Configuration Entries

**Before:**
```json
{
  "XcodeBuildMCP": {
    "command": "node",
    "args": ["/path/to/build/index.js"]
  },
  "OtherTool": {
    "command": "node",
    "args": ["/path/to/other.js"]
  }
}
```

**After:**
```json
{
  "OtherTool": {
    "command": "node",
    "args": ["/path/to/other.js"]
  }
}
```

### Documentation Files

These files will be removed from each repository:
- `AGENTS.md` - Agent-specific guidance
- `CLAUDE.md` - Project documentation
- `AGENT_QUICK_START.md` - Quick start guide
- `INSTALLER-USAGE.md` - Installer documentation
- `INSTALL-XCODE-SCRIPTS.md` - Script installation guide
- `AVP_WORKFLOW_GUIDE.md` - visionOS workflow guide

### Directories

These directories will be removed:
- `.claude/` - Configuration directory
- `.claude/scripts/` - Custom scripts directory

## Manual Uninstallation

If you prefer to manually remove XcodeBuildMCP:

### 1. Remove from MCP Clients

Edit each configuration file and remove the `XcodeBuildMCP` entry:

```bash
# Claude Code
nano ~/.claude.json

# Claude Desktop
nano ~/.config/claude/mcp.json

# Cursor
nano ~/.cursor/mcp.json

# Factory Droid
nano ~/.factory/mcp.json
```

### 2. Remove from Repositories

```bash
# Remove documentation files
rm AGENTS.md CLAUDE.md AGENT_QUICK_START.md
rm INSTALLER-USAGE.md INSTALL-XCODE-SCRIPTS.md AVP_WORKFLOW_GUIDE.md

# Remove configuration directory
rm -rf .claude/
```

### 3. Remove Installation

```bash
# If installed locally
rm -rf ~/Projects/dev/XcodeBuildMCP

# If installed globally
npm uninstall -g xcodebuildmcp
```

## FAQ

### Q: Will uninstalling break my existing projects?

**A:** No. Uninstallation only removes:
- MCP server registration
- Documentation files
- Installation directory (if `--remove-installation` used)

Your project code remains unchanged.

### Q: Can I reinstall later?

**A:** Yes. Run the installer script again:
```bash
bash install-xcode-scripts.sh
```

### Q: What if I only want to remove from one MCP client?

**A:** Manually edit that specific configuration file:
```bash
# Edit and remove XcodeBuildMCP entry
jq 'del(.XcodeBuildMCP)' ~/.claude.json > ~/.claude.json.tmp
mv ~/.claude.json.tmp ~/.claude.json
```

### Q: Are there any side effects?

**A:** None, as long as no other tools depend on XcodeBuildMCP. The uninstaller:
- Only removes XcodeBuildMCP configuration
- Leaves all other configurations intact
- Doesn't affect other npm packages or tools

### Q: Do I need to uninstall if I just want to update?

**A:** No. To update XcodeBuildMCP:
```bash
cd ~/Projects/dev/XcodeBuildMCP
git pull origin main
npm run build
```

The MCP configuration will automatically use the updated version.

## Support

For issues or questions about uninstallation:

1. Check this guide's Troubleshooting section
2. Review the script output carefully
3. Try the alternative script (Bash vs Python)
4. Check backups if you used `--backup`

---

**Last Updated:** 2025-01-21
