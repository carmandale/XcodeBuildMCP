#!/usr/bin/env python3

"""
XcodeBuildMCP Uninstaller

This script removes XcodeBuildMCP from:
- MCP client configurations (Claude Code, Claude Desktop, Cursor, Factory Droid)
- Documentation files from repositories
- Optional: The XcodeBuildMCP installation itself

Usage:
    python3 uninstall-xcodebuildmcp.py [--force] [--remove-installation] [--backup]
    python3 uninstall-xcodebuildmcp.py --help
"""

import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# Color codes
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color


class XcodeBuildMCPUninstaller:
    """Handles uninstallation of XcodeBuildMCP from various locations."""

    def __init__(self, force: bool = False, remove_installation: bool = False, backup: bool = False):
        self.force = force
        self.remove_installation = remove_installation
        self.backup = backup
        self.backup_dir = None
        self.removed_files: List[str] = []
        self.failed_operations: List[str] = []

        if self.backup:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.backup_dir = Path.home() / ".xcodebuildmcp-backups" / timestamp
            self.backup_dir.mkdir(parents=True, exist_ok=True)

    def print_header(self, title: str):
        """Print a formatted header."""
        print(f"\n{BLUE}{title}{NC}")
        print("─" * 65)

    def print_status(self, status: bool, message: str):
        """Print a status message."""
        symbol = f"{GREEN}✓{NC}" if status else f"{RED}✗{NC}"
        print(f"{symbol} {message}")

    def print_info(self, message: str):
        """Print an info message."""
        print(f"{YELLOW}ℹ{NC} {message}")

    def backup_file(self, file_path: Path) -> bool:
        """Backup a file before deletion."""
        if not self.backup_dir:
            return True

        try:
            backup_path = self.backup_dir / file_path.name
            shutil.copy2(file_path, backup_path)
            self.print_status(True, f"Backed up: {backup_path}")
            return True
        except Exception as e:
            self.print_status(False, f"Failed to backup {file_path}: {str(e)}")
            return False

    def backup_directory(self, dir_path: Path) -> bool:
        """Backup a directory before deletion."""
        if not self.backup_dir:
            return True

        try:
            backup_path = self.backup_dir / dir_path.name
            shutil.copytree(dir_path, backup_path)
            self.print_status(True, f"Backed up directory: {backup_path}")
            return True
        except Exception as e:
            self.print_status(False, f"Failed to backup {dir_path}: {str(e)}")
            return False

    def remove_mcp_config(self, config_file: Path) -> bool:
        """Remove XcodeBuildMCP from MCP configuration file."""
        if not config_file.exists():
            self.print_info(f"Config file not found: {config_file}")
            return True

        try:
            with open(config_file, 'r') as f:
                config = json.load(f)

            if 'XcodeBuildMCP' not in config:
                self.print_info(f"XcodeBuildMCP not found in {config_file.name}")
                return True

            # Backup before modifying
            if self.backup:
                self.backup_file(config_file)

            # Remove the entry
            del config['XcodeBuildMCP']

            if not self.force:
                self.print_info(f"Would remove XcodeBuildMCP from {config_file}")
                return True

            # Write updated config
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)
                f.write('\n')

            self.print_status(True, f"Removed XcodeBuildMCP from {config_file.name}")
            self.removed_files.append(str(config_file))
            return True

        except json.JSONDecodeError as e:
            self.print_status(False, f"Invalid JSON in {config_file}: {str(e)}")
            return False
        except Exception as e:
            self.print_status(False, f"Error processing {config_file}: {str(e)}")
            return False

    def remove_xcodebuildmcp_content(self, file_path: Path) -> int:
        """Remove XcodeBuildMCP-related content from a file.

        Removes lines containing XcodeBuildMCP references and returns the count.
        Preserves the file if there's other content.
        Returns the count even in preview mode.
        """
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()

            # Find lines that mention XcodeBuildMCP
            original_count = len(lines)
            filtered_lines = [
                line for line in lines
                if 'xcodebuildmcp' not in line.lower() and 'XcodeBuildMCP' not in line
            ]
            removed_count = original_count - len(filtered_lines)

            if removed_count == 0:
                return 0

            # In preview mode, just return the count without making changes
            if not self.force:
                return removed_count

            # Force mode: actually make the changes
            if self.backup:
                self.backup_file(file_path)

            # Write back the filtered content
            if filtered_lines:
                with open(file_path, 'w') as f:
                    f.writelines(filtered_lines)
            else:
                # If no lines remain, delete the file
                file_path.unlink()

            return removed_count
        except Exception as e:
            self.print_status(False, f"Error processing {file_path.name}: {str(e)}")
            return 0

    def remove_documentation_files(self, repo_path: Path) -> None:
        """Remove documentation files from a repository.

        Properly handles paths with spaces, special characters, and tilde expansion.
        """
        # Expand user home directory (~) if present
        repo_path = repo_path.expanduser().resolve()

        # Show path being processed - flush immediately
        print(f"\n{BLUE}Processing path: {repo_path}{NC}", flush=True)
        sys.stdout.flush()

        if not repo_path.exists():
            self.print_status(False, f"Repository not found: {repo_path}")
            print(f"{YELLOW}  Make sure the path exists and you have permission to access it{NC}", flush=True)
            sys.stdout.flush()
            return

        if not repo_path.is_dir():
            self.print_status(False, f"Path is not a directory: {repo_path}")
            sys.stdout.flush()
            return

        self.print_header(f"Cleaning documentation from: {repo_path.name}")

        # Files where we remove only XcodeBuildMCP content
        content_removal_files = ["AGENTS.md", "CLAUDE.md"]
        # Files to delete entirely
        files_to_delete = [
            "AGENT_QUICK_START.md",
            "INSTALLER-USAGE.md",
            "INSTALL-XCODE-SCRIPTS.md",
            "AVP_WORKFLOW_GUIDE.md",
        ]

        files_found = 0
        files_removed = 0
        lines_removed = 0

        # Handle selective content removal
        for filename in content_removal_files:
            file_path = repo_path / filename
            if file_path.exists():
                files_found += 1
                removed_lines = self.remove_xcodebuildmcp_content(file_path)

                if removed_lines > 0:
                    if not self.force:
                        print(f"{YELLOW}✓{NC} Found: {filename} - Will remove {removed_lines} XcodeBuildMCP line(s), rest preserved")
                    else:
                        lines_removed += removed_lines
                        self.print_status(True, f"Removed {removed_lines} XcodeBuildMCP line(s) from {filename}, rest preserved")
                        self.removed_files.append(str(file_path))
                        files_removed += 1
                else:
                    print(f"{YELLOW}⊘{NC} {filename}: No XcodeBuildMCP content found")

        # Handle file deletion
        for filename in files_to_delete:
            file_path = repo_path / filename
            if file_path.exists():
                files_found += 1
                if self.backup:
                    self.backup_file(file_path)

                if not self.force:
                    print(f"{YELLOW}✓{NC} Found: {filename} - Will delete entire file (XcodeBuildMCP-specific)")
                    continue

                try:
                    file_path.unlink()
                    files_removed += 1
                    self.print_status(True, f"Deleted: {filename} (XcodeBuildMCP-specific file)")
                    self.removed_files.append(str(file_path))
                except Exception as e:
                    self.print_status(False, f"Failed to remove {filename}: {str(e)}")
                    self.failed_operations.append(str(file_path))

        # Remove .claude directory if it exists
        claude_dir = repo_path / ".claude"
        if claude_dir.exists():
            files_found += 1
            if self.backup:
                self.backup_directory(claude_dir)

            if not self.force:
                print(f"{YELLOW}✓{NC} Found: .claude directory - Will delete (XcodeBuildMCP-specific)")
            else:
                try:
                    shutil.rmtree(claude_dir)
                    files_removed += 1
                    self.print_status(True, "Deleted: .claude directory (XcodeBuildMCP-specific)")
                    self.removed_files.append(str(claude_dir))
                except Exception as e:
                    self.print_status(False, f"Failed to remove .claude directory: {str(e)}")
                    self.failed_operations.append(str(claude_dir))

        # Summary for this repo
        if files_found == 0:
            print(f"{YELLOW}⊘{NC} No XcodeBuildMCP files found in this repository")
        else:
            if files_removed == 0 and self.force:
                print(f"{YELLOW}ℹ{NC} Found {files_found} file(s) but none were removable")
            elif files_removed == 0 and not self.force:
                print(f"{YELLOW}ℹ{NC} Found {files_found} file(s)")
                # Ask if user wants to proceed
                response = input(f"\n{YELLOW}Do you want to remove these items now? (y/n): {NC}").strip().lower()
                if response == 'y' or response == 'yes':
                    print(f"\n{GREEN}Proceeding with removal...{NC}\n")
                    # Enable force mode for this repo only
                    original_force = self.force
                    self.force = True
                    # Re-process this repo with force enabled
                    self.remove_documentation_files(repo_path)
                    self.remove_scripts_directory(repo_path)
                    self.force = original_force
                else:
                    print(f"{YELLOW}Skipped removal for this repository{NC}")
            else:
                print(f"{GREEN}✓{NC} Cleaned: {files_removed} of {files_found} item(s)")

    def remove_scripts_directory(self, repo_path: Path) -> None:
        """Remove scripts directory if it contains only XcodeBuildMCP scripts."""
        scripts_dir = repo_path / ".claude" / "scripts"
        if scripts_dir.exists():
            if self.backup:
                self.backup_directory(scripts_dir)

            if not self.force:
                self.print_info(f"Would remove: .claude/scripts directory")
                return

            try:
                shutil.rmtree(scripts_dir)
                self.print_status(True, "Removed: .claude/scripts directory")
                self.removed_files.append(str(scripts_dir))
            except Exception as e:
                self.print_status(False, f"Failed to remove scripts directory: {str(e)}")
                self.failed_operations.append(str(scripts_dir))

    def remove_installation(self) -> None:
        """Remove XcodeBuildMCP installation directory."""
        self.print_header("Step 3: Removing XcodeBuildMCP Installation")

        installation_paths = [
            Path.home() / "Projects" / "dev" / "XcodeBuildMCP",
            Path.home() / "Developer" / "XcodeBuildMCP",
            Path("/usr/local/lib/node_modules/xcodebuildmcp"),
            Path.home() / ".local" / "lib" / "node_modules" / "xcodebuildmcp",
        ]

        for path in installation_paths:
            if path.exists():
                if self.backup:
                    self.backup_directory(path)

                if not self.force:
                    self.print_info(f"Would remove installation: {path}")
                    continue

                try:
                    shutil.rmtree(path)
                    self.print_status(True, f"Removed installation: {path}")
                    self.removed_files.append(str(path))
                except Exception as e:
                    self.print_status(False, f"Failed to remove {path}: {str(e)}")
                    self.failed_operations.append(str(path))

    def run(self) -> int:
        """Run the uninstallation process."""
        print(f"\n{BLUE}╔════════════════════════════════════════════════════════════════╗{NC}")
        print(f"{BLUE}║       XcodeBuildMCP Uninstaller                               ║{NC}")
        print(f"{BLUE}╚════════════════════════════════════════════════════════════════╝{NC}")

        # Step 1: Remove from MCP configurations
        self.print_header("Step 1: Removing from MCP Client Configurations")

        mcp_configs = [
            (Path.home() / ".claude.json", "Claude Code"),
            (Path.home() / ".config" / "claude" / "mcp.json", "Claude Desktop"),
            (Path.home() / ".cursor" / "mcp.json", "Cursor"),
            (Path.home() / ".factory" / "mcp.json", "Factory Droid"),
        ]

        configs_to_remove = []
        for config_path, app_name in mcp_configs:
            try:
                if config_path.exists():
                    with open(config_path, 'r') as f:
                        config = json.load(f)
                    if 'XcodeBuildMCP' in config:
                        configs_to_remove.append((config_path, app_name))
                        print(f"{YELLOW}✓{NC} Found: {app_name} - Will remove XcodeBuildMCP configuration")
            except Exception as e:
                self.print_status(False, f"Error checking {app_name}: {str(e)}")

        if configs_to_remove and not self.force:
            response = input(f"\n{YELLOW}Remove XcodeBuildMCP from {len(configs_to_remove)} MCP client(s)? (y/n): {NC}").strip().lower()
            if response == 'y' or response == 'yes':
                print(f"\n{GREEN}Proceeding with MCP config removal...{NC}\n")
                for config_path, app_name in configs_to_remove:
                    try:
                        # Temporarily enable force for actual removal
                        original_force = self.force
                        self.force = True
                        self.remove_mcp_config(config_path)
                        self.force = original_force
                    except Exception as e:
                        self.print_status(False, f"Error processing {app_name}: {str(e)}")
                        self.failed_operations.append(str(config_path))
            else:
                print(f"{YELLOW}Skipped MCP configuration removal{NC}")
        elif configs_to_remove and self.force:
            for config_path, app_name in configs_to_remove:
                try:
                    self.remove_mcp_config(config_path)
                except Exception as e:
                    self.print_status(False, f"Error processing {app_name}: {str(e)}")
                    self.failed_operations.append(str(config_path))
        elif not configs_to_remove:
            print(f"{YELLOW}⊘{NC} XcodeBuildMCP not found in any MCP client configurations")

        # Step 2: Remove documentation files
        self.print_header("Step 2: Removing Documentation Files")
        self.print_info("Tip: Paths with spaces are fully supported. Example: /path/to/My Projects/repo")

        while True:
            repo_input = input("\nEnter path to repository to clean (or press Enter to skip): ").strip()
            if not repo_input:
                break

            # Properly expand user paths and handle spaces
            repo_path = Path(repo_input).expanduser().resolve()

            # Process immediately and show feedback
            print(f"\n{BLUE}Processing: {repo_path.name}{NC}", flush=True)
            sys.stdout.flush()

            self.remove_documentation_files(repo_path)
            self.remove_scripts_directory(repo_path)

        # Step 3: Optional installation removal
        if self.remove_installation:
            self.remove_installation()

        # Print summary
        self.print_summary()

        return 0 if not self.failed_operations else 1

    def print_summary(self) -> None:
        """Print uninstallation summary."""
        print(f"\n{BLUE}╔════════════════════════════════════════════════════════════════╗{NC}")
        print(f"{BLUE}║                    Uninstallation Summary                      ║{NC}")
        print(f"{BLUE}╚════════════════════════════════════════════════════════════════╝{NC}\n")

        if self.backup_dir and self.backup_dir.exists():
            print(f"{GREEN}✓{NC} Backups saved to: {self.backup_dir}")
            print("  To restore, manually copy files back from the backup directory\n")

        if self.failed_operations:
            print(f"{RED}Failed operations ({len(self.failed_operations)}):${NC}")
            for op in self.failed_operations:
                print(f"  • {op}")
            print()

        if self.force:
            if self.removed_files:
                print(f"{GREEN}✓{NC} Successfully removed {len(self.removed_files)} items:")
                for item in self.removed_files[:10]:  # Show first 10
                    print(f"  • {item}")
                if len(self.removed_files) > 10:
                    print(f"  ... and {len(self.removed_files) - 10} more")
            print(f"\n{GREEN}✓{NC} XcodeBuildMCP has been successfully uninstalled")
        else:
            print(f"{YELLOW}ℹ{NC} Preview mode: No files were actually removed")
            print("  Run with --force flag to actually remove files:")
            print("  python3 uninstall-xcodebuildmcp.py --force\n")

        print("After uninstallation, you may need to:")
        print("  1. Restart your IDE/Editor (Claude Code, Cursor, etc.)")
        print("  2. Manually restart MCP clients if they're currently running")
        print("  3. Clear any cached tool lists in your applications\n")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Uninstall XcodeBuildMCP from MCP clients and repositories",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Preview what will be removed
  %(prog)s --force                            # Actually remove files
  %(prog)s --force --backup                   # Remove files with backups
  %(prog)s --force --remove-installation      # Also remove installation directory
        """
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Actually remove files (default is preview mode)"
    )
    parser.add_argument(
        "--remove-installation",
        action="store_true",
        help="Also remove the XcodeBuildMCP installation directory"
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Create backups before removing files"
    )

    args = parser.parse_args()

    uninstaller = XcodeBuildMCPUninstaller(
        force=args.force,
        remove_installation=args.remove_installation,
        backup=args.backup
    )

    try:
        return uninstaller.run()
    except KeyboardInterrupt:
        print(f"\n\n{RED}✗{NC} Uninstallation cancelled by user")
        return 1
    except Exception as e:
        print(f"\n{RED}✗ Error during uninstallation: {str(e)}{NC}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
