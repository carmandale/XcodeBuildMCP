# XcodeBuildMCP Uninstallation - Quick Reference

## TL;DR

Three simple steps to uninstall XcodeBuildMCP:

**Note:** Paths with spaces are fully supported. Example: `/path/to/My Projects/repo`

### Step 1: Preview (See What Will Be Removed)
```bash
bash uninstall-xcodebuildmcp.sh
# or
python3 uninstall-xcodebuildmcp.py
```

### Step 2: Backup & Execute
```bash
bash uninstall-xcodebuildmcp.sh --force --backup
# or
python3 uninstall-xcodebuildmcp.py --force --backup
```

### Step 3: Restart IDEs
Restart Claude Code, Cursor, etc.

---

## Common Commands

| Task | Bash | Python |
|------|------|--------|
| **Preview removal** | `bash uninstall-xcodebuildmcp.sh` | `python3 uninstall-xcodebuildmcp.py` |
| **Remove (no backup)** | `bash uninstall-xcodebuildmcp.sh --force` | `python3 uninstall-xcodebuildmcp.py --force` |
| **Remove with backup** | `bash uninstall-xcodebuildmcp.sh --force --backup` | `python3 uninstall-xcodebuildmcp.py --force --backup` |
| **Remove everything** | `bash uninstall-xcodebuildmcp.sh --force --backup --remove-installation` | `python3 uninstall-xcodebuildmcp.py --force --backup --remove-installation` |

---

## What Gets Removed

### MCP Client Configs
- `~/.claude.json` (Claude Code)
- `~/.config/claude/mcp.json` (Claude Desktop)
- `~/.cursor/mcp.json` (Cursor)
- `~/.factory/mcp.json` (Factory Droid)

### Documentation Files
- AGENTS.md
- CLAUDE.md
- AGENT_QUICK_START.md
- INSTALLER-USAGE.md
- INSTALL-XCODE-SCRIPTS.md
- AVP_WORKFLOW_GUIDE.md
- .claude/ directory
- .claude/scripts/ directory

### Optional (with --remove-installation)
- `~/Projects/dev/XcodeBuildMCP`
- `~/Developer/XcodeBuildMCP`
- `/usr/local/lib/node_modules/xcodebuildmcp`
- `~/.local/lib/node_modules/xcodebuildmcp`

---

## Restoration

If you used `--backup`, restore from:
```
~/.xcodebuildmcp-backups/YYYYMMDD_HHMMSS/
```

Example:
```bash
# Restore Claude config
cp ~/.xcodebuildmcp-backups/20250121_140530/claude.json ~/.claude.json

# Restore documentation
cp ~/.xcodebuildmcp-backups/20250121_140530/docs/* /path/to/repo/
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Files still there | Use `--force` flag |
| Changes not taking effect | Restart your IDE/Editor |
| JSON errors | Use Python version: `python3 uninstall-xcodebuildmcp.py` |
| jq not found | Use Python version or: `brew install jq` |
| Backup directory full | Delete old backups: `rm -rf ~/.xcodebuildmcp-backups/` |

---

## Script Differences

| Feature | Bash | Python |
|---------|------|--------|
| Cross-platform | macOS/Linux | macOS/Linux/Windows |
| Dependencies | bash, jq (optional) | Python 3.7+ |
| JSON handling | jq or manual | Native (automatic) |
| Error handling | Basic | Detailed |
| Backup support | Yes | Yes |

**Recommendation:** Use **Python** for best cross-platform compatibility and automatic JSON parsing.

---

## Examples

### Safe Uninstallation (Recommended)
```bash
# 1. Preview what will happen
python3 uninstall-xcodebuildmcp.py

# 2. Actually remove with backup
python3 uninstall-xcodebuildmcp.py --force --backup

# 3. Restart IDEs
killall 'Claude Code' 2>/dev/null || true
killall 'Cursor' 2>/dev/null || true
```

### Clean Uninstallation (Remove Everything)
```bash
python3 uninstall-xcodebuildmcp.py --force --backup --remove-installation
```

### Manual Config Removal
```bash
# Remove from Claude Code only
jq 'del(.XcodeBuildMCP)' ~/.claude.json > ~/.claude.json.tmp
mv ~/.claude.json.tmp ~/.claude.json
```

---

## Before You Uninstall

- [ ] Check if other projects depend on XcodeBuildMCP
- [ ] Note the path to your XcodeBuildMCP installation (if you want to keep it)
- [ ] Consider using backups (`--backup` flag)
- [ ] Close your IDEs/Editors

## After You Uninstall

- [ ] Restart Claude Code/Cursor/other IDEs
- [ ] Verify MCP config doesn't reference XcodeBuildMCP: `cat ~/.claude.json | grep XcodeBuildMCP`
- [ ] Check that documentation files are gone from repositories
- [ ] Install other MCP tools if needed

---

## Full Documentation

For complete details, see: [UNINSTALL.md](UNINSTALL.md)

---

**Last Updated:** 2025-01-21
