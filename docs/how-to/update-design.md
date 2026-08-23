# How to Update the Design

This guide explains how to update the design prototype from a new Claude Design export.

## Prerequisites

- A new export ZIP file from [Claude Design](https://claude.ai/design)
- The `scripts/update-design.sh` script (included in the repository)

## Steps

### 1. Export from Claude Design

In Claude Design, export your updated design as a ZIP file.

### 2. Run the Update Script

```bash
./scripts/update-design.sh /path/to/your-export.zip
```

For example:

```bash
./scripts/update-design.sh ~/Downloads/Coms-export.zip
```

### 3. What the Script Does

The script automatically:

1. **Backs up** the current `design/` folder to `design-backup-YYYYMMDD-HHMMSS/`
2. **Preserves** any files in `design/local/` (your local customizations)
3. **Extracts** the new export to `design/`
4. **Restores** your local customizations

### 4. Verify the Update

Open the updated design in your browser:

```bash
open design/Coms.dc.html
```

Check that your changes appear correctly.

## Preserving Local Customizations

Any files you place in `design/local/` are preserved across updates.

Use this directory for:
- Custom CSS overrides
- Local images or assets
- Configuration specific to your environment

## Troubleshooting

### Script fails with "File not found"

Verify the path to your export ZIP file is correct:

```bash
ls /path/to/your-export.zip
```

### Script fails with permission denied

Make the script executable:

```bash
chmod +x scripts/update-design.sh
```

### Something went wrong with the update

Restore from the backup:

```bash
# List backups
ls -d design-backup-*

# Restore (replace timestamp with actual backup name)
rm -rf design
mv design-backup-YYYYMMDD-HHMMSS design
```

## Notes

- Backups are excluded from git (see `.gitignore`)
- The design system ID in `_ds/industry-*` may change with major updates
- Update any hardcoded design system paths in your code after updates

---

**Script location:** `scripts/update-design.sh`

**See also:** [Design System Reference](../reference/design-system.md)
