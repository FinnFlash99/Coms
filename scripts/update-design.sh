#!/bin/bash
#
# Update Claude Design export
#
# Usage:
#   ./scripts/update-design.sh /path/to/export.zip
#
# This script replaces the design/ folder with a fresh Claude Design export
# while preserving any local customizations in design/local/

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/update-design.sh /path/to/claude-design-export.zip"
  exit 1
fi

ZIP_FILE="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESIGN_DIR="$PROJECT_ROOT/design"
BACKUP_DIR="$PROJECT_ROOT/design-backup-$(date +%Y%m%d-%H%M%S)"

if [ ! -f "$ZIP_FILE" ]; then
  echo "Error: File not found: $ZIP_FILE"
  exit 1
fi

echo "Updating Claude Design export..."

# Backup current design folder
if [ -d "$DESIGN_DIR" ]; then
  echo "Backing up current design to $BACKUP_DIR"
  cp -r "$DESIGN_DIR" "$BACKUP_DIR"
fi

# Clear design folder (except local/ if it exists)
if [ -d "$DESIGN_DIR/local" ]; then
  echo "Preserving design/local/"
  mv "$DESIGN_DIR/local" /tmp/coms-design-local-$$
fi

rm -rf "$DESIGN_DIR"
mkdir -p "$DESIGN_DIR"

# Extract new export
echo "Extracting $ZIP_FILE"
unzip -o "$ZIP_FILE" -d "$DESIGN_DIR"

# Restore local customizations
if [ -d "/tmp/coms-design-local-$$" ]; then
  echo "Restoring design/local/"
  mv /tmp/coms-design-local-$$ "$DESIGN_DIR/local"
fi

echo ""
echo "Done! Design updated."
echo "Backup saved to: $BACKUP_DIR"
echo ""
echo "To view the design, open:"
echo "  $DESIGN_DIR/Coms.dc.html"
