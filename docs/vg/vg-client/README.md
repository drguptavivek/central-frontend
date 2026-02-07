# VG Client Documentation

This directory contains documentation for VG-specific customizations to the ODK Central frontend (`central-frontend` fork).

## Documents

### [`vg_client_changes.md`](vg_client_changes.md)
**Purpose:** Comprehensive list of all VG-specific features and changes.

**When to update:**
- Adding a new VG feature
- Modifying existing VG functionality
- Removing VG features

**Contents:**
- Overview of VG customizations
- Feature descriptions with status
- Configuration details
- Future enhancement plans
- Modularity guidelines

---

### [`vg_core_client_edits.md`](vg_core_client_edits.md)
**Purpose:** Detailed tracking of modifications to upstream core files.

**When to update:**
- Any time you modify a file that exists in upstream `getodk/central-frontend`
- Before and after rebasing onto upstream master

**Contents:**
- Line-by-line changes to core files
- Merge strategies for each modification
- Rebase instructions
- Conflict resolution guidance
- Removal instructions

---

## Quick Reference

### VG Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| New files | `vg-*.js` | `vg-session-inactivity.js` |
| Components | `vg-*` prefix | `VgSettings.vue` |
| localStorage keys | `vg*` (camelCase) | `vgSessionLastActivityAt` |
| Settings keys | `vg_*` (snake_case) | `vg_app_user_session_ttl_days` |

### Documentation Workflow

```
┌─────────────────────────────────────────┐
│ Making VG Changes                       │
└─────────────────────────────────────────┘
              │
              ├─ New VG file? ─────────────┐
              │                             ├─> Document in vg_client_changes.md
              ├─ Core file edit? ──────────┤
              │                             └─> Document in vg_core_client_edits.md
              ├─ New feature? ──────────────┐
              │                             └─> Add to vg_client_changes.md
              └─ Config change? ────────────┘
                                            └─> Update both docs
```

### Pre-Commit Checklist

- [ ] VG files use `vg-` prefix
- [ ] localStorage keys use `vg` prefix
- [ ] Core edits documented in `vg_core_client_edits.md`
- [ ] Feature documented in `vg_client_changes.md`
- [ ] Tests added/updated
- [ ] Consider upstream merge conflicts

---

## Directory Structure

```
docs/vg/vg-client/
├── README.md                    # This file
├── vg_client_changes.md         # All VG features/changes
└── vg_core_client_edits.md      # Core file modifications
```

---

## Related Documentation

**Meta Repo Documentation:**
- `../../CLAUDE.md` - Agent workflow, project conventions
- `../../docs/vg/` - VG documentation root

**Server Documentation:**
- `../../docs/vg/vg-server/` - Backend VG customizations

**Knowledge Base:**
- `../../agentic_kb/` - Reusable cross-project knowledge

---

## Maintenance

**Monthly Review:**
- Check if VG features can be upstreamed
- Review upstream releases for overlapping features
- Update documentation for any changes

**Before Major Upstream Rebase:**
1. Review `vg_core_client_edits.md`
2. Backup current VG implementation
3. Test thoroughly after rebase
4. Update documentation for any conflict resolutions

---

## Questions?

- Review the main project `CLAUDE.md` for workflow guidelines
- Check Beads issues for related work
- See Git history for change context
