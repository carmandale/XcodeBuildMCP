#!/bin/bash

################################################################################
# XcodeBuildMCP Uninstaller
#
# This script removes XcodeBuildMCP from:
# - MCP client configurations (Claude Code, Claude Desktop, Cursor, Factory Droid)
# - Documentation files from repositories
# - Optional: The XcodeBuildMCP installation itself
#
# Usage: bash uninstall-xcodebuildmcp.sh [--force] [--remove-installation] [--backup]
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FORCE_DELETE=false
REMOVE_INSTALLATION=false
CREATE_BACKUP=false
BACKUP_DIR="${HOME}/.xcodebuildmcp-backups/$(date +%Y%m%d_%H%M%S)"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_DELETE=true
            shift
            ;;
        --remove-installation)
            REMOVE_INSTALLATION=true
            shift
            ;;
        --backup)
            CREATE_BACKUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash uninstall-xcodebuildmcp.sh [--force] [--remove-installation] [--backup]"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       XcodeBuildMCP Uninstaller                               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Function to safely remove MCP configuration entry
remove_mcp_config() {
    local config_file=$1
    local tool_name="XcodeBuildMCP"

    if [ ! -f "$config_file" ]; then
        echo -e "${YELLOW}⊘${NC} Config file not found: $config_file"
        return 0
    fi

    # Create backup if requested
    if [ "$CREATE_BACKUP" = true ]; then
        mkdir -p "$BACKUP_DIR"
        cp "$config_file" "$BACKUP_DIR/$(basename $config_file).backup"
        echo -e "${GREEN}✓${NC} Backup created: $BACKUP_DIR/$(basename $config_file).backup"
    fi

    # Check if XcodeBuildMCP is in the config
    if grep -q "XcodeBuildMCP\|xcodebuildmcp" "$config_file"; then
        # Use a temporary file for safe editing
        local temp_file="${config_file}.tmp"

        # Remove XcodeBuildMCP entry using jq (JSON processing)
        if command -v jq &> /dev/null; then
            jq 'del(.XcodeBuildMCP)' "$config_file" > "$temp_file" 2>/dev/null || {
                echo -e "${YELLOW}⊘${NC} Could not parse JSON in $config_file (may be invalid JSON)"
                rm -f "$temp_file"
                return 1
            }
            mv "$temp_file" "$config_file"
            print_status 0 "Removed XcodeBuildMCP from $config_file"
        else
            echo -e "${YELLOW}⊘${NC} jq not found - skipping JSON processing for $config_file"
            echo "   Install jq to automatically update config: brew install jq"
        fi
    else
        echo -e "${YELLOW}⊘${NC} XcodeBuildMCP not found in $config_file"
    fi
}

# Function to remove XcodeBuildMCP content from a file
remove_xcodebuildmcp_content() {
    local file_path="$1"
    local temp_file="${file_path}.tmp"

    # Count lines before and after filtering
    local original_count=$(wc -l < "$file_path")

    # Filter out lines containing XcodeBuildMCP (case-insensitive search)
    grep -iv "xcodebuildmcp" "$file_path" > "$temp_file" || true

    local filtered_count=$(wc -l < "$temp_file")
    local removed_count=$((original_count - filtered_count))

    if [ $removed_count -eq 0 ]; then
        rm -f "$temp_file"
        echo 0
        return
    fi

    # In preview mode, return the count without making changes
    if [ "$FORCE_DELETE" = false ]; then
        rm -f "$temp_file"
        echo $removed_count
        return
    fi

    # Force mode: create backup and make changes
    if [ "$CREATE_BACKUP" = true ]; then
        local safe_repo_name=$(basename "$(dirname "$file_path")" | sed 's/[^a-zA-Z0-9._-]/_/g')
        mkdir -p "$BACKUP_DIR/content"
        cp "$file_path" "$BACKUP_DIR/content/${safe_repo_name}_$(basename "$file_path").backup"
        echo -e "${GREEN}✓${NC} Backed up: $(basename "$file_path")"
    fi

    # If no lines remain, delete the file
    if [ $filtered_count -eq 0 ]; then
        rm -f "$temp_file" "$file_path"
        echo $removed_count
        return
    fi

    # Write back the filtered content
    mv "$temp_file" "$file_path"
    echo $removed_count
}

# Function to remove documentation files
remove_documentation_files() {
    local repo_path="$1"  # Properly quote to preserve spaces in paths
    local content_removal_files=("AGENTS.md" "CLAUDE.md")
    local files_to_delete=("AGENT_QUICK_START.md" "INSTALLER-USAGE.md" "INSTALL-XCODE-SCRIPTS.md" "AVP_WORKFLOW_GUIDE.md")
    local files_found=0
    local files_removed=0

    # Debug: Show path being processed
    echo -e "${BLUE}Processing path: $repo_path${NC}"

    if [ ! -d "$repo_path" ]; then
        echo -e "${RED}✗${NC} Repository not found: $repo_path"
        echo -e "${YELLOW}  Make sure the path exists and you have permission to access it${NC}"
        return 1
    fi

    echo -e "${BLUE}Cleaning documentation from: $(basename "$repo_path")${NC}"

    # Handle selective content removal for AGENTS.md and CLAUDE.md
    for file in "${content_removal_files[@]}"; do
        local file_path="${repo_path}/${file}"
        if [ -f "$file_path" ]; then
            files_found=$((files_found + 1))
            local removed_lines=$(remove_xcodebuildmcp_content "$file_path")

            if [ "$removed_lines" -gt 0 ]; then
                if [ "$FORCE_DELETE" = false ]; then
                    echo -e "${YELLOW}✓${NC} Found: $file - Will remove $removed_lines XcodeBuildMCP line(s), rest preserved"
                else
                    files_removed=$((files_removed + 1))
                    print_status 0 "Removed $removed_lines XcodeBuildMCP line(s) from $file, rest preserved"
                fi
            else
                echo -e "${YELLOW}⊘${NC} $file: No XcodeBuildMCP content found"
            fi
        fi
    done

    # Handle complete file deletion
    for file in "${files_to_delete[@]}"; do
        local file_path="${repo_path}/${file}"
        if [ -f "$file_path" ]; then
            files_found=$((files_found + 1))
            if [ "$CREATE_BACKUP" = true ]; then
                mkdir -p "$BACKUP_DIR/docs"
                local safe_repo_name=$(basename "$repo_path" | sed 's/[^a-zA-Z0-9._-]/_/g')
                cp "$file_path" "$BACKUP_DIR/docs/${safe_repo_name}_${file}.backup"
                echo -e "${GREEN}✓${NC} Backed up: $file"
            fi

            if [ "$FORCE_DELETE" = false ]; then
                echo -e "${YELLOW}✓${NC} Found: $file - Will delete entire file (XcodeBuildMCP-specific)"
            else
                rm "$file_path"
                files_removed=$((files_removed + 1))
                print_status 0 "Deleted: $file (XcodeBuildMCP-specific file)"
            fi
        fi
    done

    # Remove .claude directory if it exists
    local claude_dir="${repo_path}/.claude"
    if [ -d "$claude_dir" ]; then
        files_found=$((files_found + 1))
        if [ "$FORCE_DELETE" = true ]; then
            if [ "$CREATE_BACKUP" = true ]; then
                mkdir -p "$BACKUP_DIR/.claude"
                local safe_repo_name
                safe_repo_name=$(basename "$repo_path" | sed 's/[^a-zA-Z0-9._-]/_/g')
                cp -r "$claude_dir" "$BACKUP_DIR/.claude/${safe_repo_name}.backup"
                echo -e "${GREEN}✓${NC} Backed up: .claude directory"
            fi
            rm -rf "$claude_dir"
            files_removed=$((files_removed + 1))
            print_status 0 "Deleted: .claude directory (XcodeBuildMCP-specific)"
        else
            echo -e "${YELLOW}✓${NC} Found: .claude directory - Will delete (XcodeBuildMCP-specific)"
        fi
    fi

    # Summary for this repo
    if [ $files_found -eq 0 ]; then
        echo -e "${YELLOW}⊘${NC} No XcodeBuildMCP files found in this repository"
    else
        if [ $files_removed -eq 0 ] && [ "$FORCE_DELETE" = false ]; then
            echo -e "${YELLOW}ℹ${NC} Found $files_found file(s)"
            # Ask if user wants to proceed
            echo ""
            read -p "$(echo -e ${YELLOW}Do you want to remove these items now? \(y/n\): ${NC})" response
            response=$(echo "$response" | tr '[:upper:]' '[:lower:]')
            if [ "$response" = "y" ] || [ "$response" = "yes" ]; then
                echo -e "\n${GREEN}Proceeding with removal...${NC}\n"
                # Enable force mode for this repo only
                FORCE_DELETE=true
                remove_documentation_files "$repo_path"
                FORCE_DELETE=false
            else
                echo -e "${YELLOW}Skipped removal for this repository${NC}"
            fi
        elif [ $files_removed -gt 0 ]; then
            echo -e "${GREEN}✓${NC} Cleaned: $files_removed of $files_found item(s)"
        fi
    fi
    echo ""
}

# Main uninstallation process

echo -e "${BLUE}Step 1: Removing from MCP Client Configurations${NC}"
echo "─────────────────────────────────────────────────"

# Define MCP configs to check
declare -a mcp_configs=(
    "${HOME}/.claude.json:Claude Code"
    "${HOME}/.config/claude/mcp.json:Claude Desktop"
    "${HOME}/.cursor/mcp.json:Cursor"
    "${HOME}/.factory/mcp.json:Factory Droid"
)

# First, scan for configs that contain XcodeBuildMCP
declare -a configs_to_remove=()
for config_entry in "${mcp_configs[@]}"; do
    IFS=':' read -r config_path app_name <<< "$config_entry"

    if [ -f "$config_path" ]; then
        if grep -q "XcodeBuildMCP\|xcodebuildmcp" "$config_path"; then
            configs_to_remove+=("$config_entry")
            echo -e "${YELLOW}✓${NC} Found: $app_name - Will remove XcodeBuildMCP configuration"
        fi
    fi
done

# If configs found and not in force mode, ask for confirmation
if [ ${#configs_to_remove[@]} -gt 0 ] && [ "$FORCE_DELETE" = false ]; then
    echo ""
    read -p "$(echo -e "${YELLOW}Remove XcodeBuildMCP from ${#configs_to_remove[@]} MCP client(s)? (y/n): ${NC}")" response
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')

    if [ "$response" = "y" ] || [ "$response" = "yes" ]; then
        echo -e "\n${GREEN}Proceeding with MCP config removal...${NC}\n"
        for config_entry in "${configs_to_remove[@]}"; do
            IFS=':' read -r config_path app_name <<< "$config_entry"
            remove_mcp_config "$config_path"
        done
    else
        echo -e "${YELLOW}Skipped MCP configuration removal${NC}"
    fi
elif [ ${#configs_to_remove[@]} -gt 0 ] && [ "$FORCE_DELETE" = true ]; then
    for config_entry in "${configs_to_remove[@]}"; do
        IFS=':' read -r config_path app_name <<< "$config_entry"
        remove_mcp_config "$config_path"
    done
elif [ ${#configs_to_remove[@]} -eq 0 ]; then
    echo -e "${YELLOW}⊘${NC} XcodeBuildMCP not found in any MCP client configurations"
fi

echo ""
echo -e "${BLUE}Step 2: Removing Documentation Files${NC}"
echo "─────────────────────────────────────────────────"
echo -e "${YELLOW}Tip: Paths with spaces are supported. Example: /path/to/My Projects/repo${NC}"
echo ""

# Prompt for repositories to clean
read -p "Enter path to repository to clean (or press Enter to skip): " repo_path

while [ ! -z "$repo_path" ]; do
    # Expand tilde and handle paths with spaces
    expanded_path="${repo_path/#\~/$HOME}"
    remove_documentation_files "$expanded_path"
    read -p "Enter another repository path (or press Enter to skip): " repo_path
done

# Optional: Remove installation directory
if [ "$REMOVE_INSTALLATION" = true ]; then
    echo ""
    echo -e "${BLUE}Step 3: Removing XcodeBuildMCP Installation${NC}"
    echo "─────────────────────────────────────────────────"

    # Try common installation paths
    local installation_paths=(
        "$HOME/Projects/dev/XcodeBuildMCP"
        "$HOME/Developer/XcodeBuildMCP"
        "/usr/local/lib/node_modules/xcodebuildmcp"
        "$HOME/.local/lib/node_modules/xcodebuildmcp"
    )

    for path in "${installation_paths[@]}"; do
        if [ -d "$path" ]; then
            if [ "$CREATE_BACKUP" = true ]; then
                mkdir -p "$BACKUP_DIR/installations"
                cp -r "$path" "$BACKUP_DIR/installations/$(basename $path).backup"
                echo -e "${GREEN}✓${NC} Backup created: $BACKUP_DIR/installations/$(basename $path).backup"
            fi

            if [ "$FORCE_DELETE" = true ]; then
                rm -rf "$path"
                print_status 0 "Removed installation: $path"
            else
                echo -e "${YELLOW}?${NC} Would remove: $path (use --force to actually remove)"
            fi
        fi
    done
fi

# Cleanup and summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Uninstallation Summary                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$CREATE_BACKUP" = true ] && [ -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}✓${NC} Backups saved to: $BACKUP_DIR"
    echo "  To restore, manually copy files back from the backup directory"
    echo ""
fi

if [ "$FORCE_DELETE" = true ]; then
    echo -e "${GREEN}✓${NC} XcodeBuildMCP has been successfully uninstalled"
else
    echo -e "${YELLOW}ℹ${NC} Preview mode: No files were actually removed"
    echo "  Run with --force flag to actually remove files:"
    echo "  bash uninstall-xcodebuildmcp.sh --force"
fi

echo ""
echo "After uninstallation, you may need to:"
echo "  1. Restart your IDE/Editor (Claude Code, Cursor, etc.)"
echo "  2. Manually restart MCP clients if they're currently running"
echo "  3. Clear any cached tool lists in your applications"
echo ""
