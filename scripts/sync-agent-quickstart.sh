#!/bin/bash

# sync-agent-quickstart.sh
# Syncs AGENT_QUICK_START.md to all orchestrator repos

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_FILE="$PROJECT_ROOT/AGENT_QUICK_START.md"

# Base directory for all projects
DEV_BASE="/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev"

# Target repositories
REPOS=(
	"groovetech-media-server"
	"PfizerOutdoCancerV2"
	"groovetech-media-player"
	"orchestrator"
	"AVPStreamKit"
)

echo "🔄 Syncing AGENT_QUICK_START.md to orchestrator repos..."
echo ""

# Check source file exists
if [ ! -f "$SOURCE_FILE" ]; then
	echo "❌ Error: Source file not found: $SOURCE_FILE"
	exit 1
fi

# Extract version from source file
VERSION=$(grep "^> \*\*Version:\*\*" "$SOURCE_FILE" | sed 's/> \*\*Version:\*\* //')
if [ -z "$VERSION" ]; then
	echo "⚠️  Warning: Could not extract version from source file"
	VERSION="unknown"
fi

echo "📦 Source: $SOURCE_FILE"
echo "📌 Version: $VERSION"
echo ""

# Sync to each repo
SYNCED=0
SKIPPED=0
FAILED=0

for repo in "${REPOS[@]}"; do
	TARGET_DIR="$DEV_BASE/$repo"
	TARGET_FILE="$TARGET_DIR/AGENT_QUICK_START.md"

	echo "→ Checking $repo..."

	# Check if repo directory exists
	if [ ! -d "$TARGET_DIR" ]; then
		echo "  ⚠️  Skipped: Directory not found"
		((SKIPPED++))
		continue
	fi

	# Check if target file exists and compare versions
	if [ -f "$TARGET_FILE" ]; then
		TARGET_VERSION=$(grep "^> \*\*Version:\*\*" "$TARGET_FILE" | sed 's/> \*\*Version:\*\* //' || echo "")

		if [ "$TARGET_VERSION" = "$VERSION" ]; then
			echo "  ✅ Already up to date (v$VERSION)"
			((SKIPPED++))
			continue
		fi

		echo "  📝 Updating from v${TARGET_VERSION:-unknown} to v$VERSION"
	else
		echo "  📝 Creating new file (v$VERSION)"
	fi

	# Copy file
	if cp "$SOURCE_FILE" "$TARGET_FILE"; then
		echo "  ✅ Synced successfully"
		((SYNCED++))
	else
		echo "  ❌ Failed to copy"
		((FAILED++))
	fi

	echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Sync Summary:"
echo "   ✅ Synced: $SYNCED repos"
echo "   ⏭️  Skipped: $SKIPPED repos (up to date or not found)"
echo "   ❌ Failed: $FAILED repos"
echo ""

if [ $FAILED -gt 0 ]; then
	echo "⚠️  Some syncs failed. Please check manually."
	exit 1
fi

if [ $SYNCED -eq 0 ]; then
	echo "✨ All repos already up to date with version $VERSION"
else
	echo "✨ Sync complete! Version $VERSION deployed to $SYNCED repos."
fi

echo ""
echo "Next steps:"
echo "1. Review changes in each repo"
echo "2. Test workflows if needed"
echo "3. Commit updated files"
