# VG Client Changes

This document tracks VG-specific customizations to the ODK Central frontend (`central-frontend` fork).

## Overview

VG customizations are designed to be modular and minimize conflicts when rebasing onto upstream `master`. Changes follow these conventions:
- New files: `vg-*.js` prefix
- localStorage keys: `vg*` prefix (camelCase)
- Components: `vg-*` prefix
- Core file edits: Documented in `vg_core_client_edits.md`

---

## Session Management Enhancements

### Session Inactivity Auto-Logout

**Status:** ✅ Implemented
**Files:**
- `src/util/vg-session-inactivity.js` (new)
- `src/util/session.js` (modified - see `vg_core_client_edits.md`)
- `test/unit/session.spec.js` (tests added)

**Description:**
Automatically logs out users after 30 minutes of inactivity across all browser tabs. Activity in any tab resets the timer for all tabs.

**Features:**
- **Cross-tab synchronization:** Activity in Tab A prevents logout in Tab B
- **Warning before logout:** Shows alert 3 minutes before timeout (at 27-minute mark)
- **Activity detection:** Monitors click, keydown, mousedown, mousemove, scroll, touchstart events
- **Throttled updates:** Updates localStorage max once per 15 seconds to reduce I/O
- **localStorage key:** `vgSessionLastActivityAt`

**Configuration:**
- Timeout: 30 minutes (hard-coded)
- Warning: 3 minutes before timeout
- Activity check interval: 15 seconds
- Activity update throttle: 15 seconds

**Future Enhancements:**
- Make timeout configurable via backend settings (`vg_web_user_inactivity_timeout_minutes`)
- Different alert message for inactivity vs session expiration
- Handle clock changes (DST, timezone adjustments)

**Related Issues:**
- See Beads issues for follow-up work

---

## App User Authentication UI Overhaul

**Status:** ✅ Implemented (from earlier VG work)
**Description:** Username/password login, secure QR codes, session management.

See upstream VG documentation for details on:
- App User auth UI changes
- System Settings UI
- Dev environment customizations

---

## Documentation Guidelines

When adding new VG features:

1. **New VG-specific files:**
   - Use `vg-` prefix
   - Add VG feature comment in header
   - List here with description

2. **Modifications to core upstream files:**
   - Document in `vg_core_client_edits.md`
   - Keep changes minimal
   - Add inline comments marking VG sections

3. **Tests:**
   - Place VG tests in describe blocks with clear naming
   - Mark as VG-specific in test descriptions where helpful

4. **localStorage/sessionStorage:**
   - Use `vg` prefix for all keys
   - Document format and purpose

5. **i18n keys:**
   - Consider using `vg.*` namespace for VG-specific messages
   - Or reuse existing keys where appropriate (current approach)

---

## Modularity Checklist

Before committing VG changes, verify:

- [ ] New files use `vg-` prefix
- [ ] localStorage/session keys use `vg` prefix
- [ ] Core file modifications documented in `vg_core_client_edits.md`
- [ ] Changes listed in this document
- [ ] Tests added/updated
- [ ] Consider upstream merge conflicts (keep diff small)

---

## Maintenance Notes

**Rebasing onto upstream:**
1. New VG files (`vg-*.js`) won't conflict
2. Check `vg_core_client_edits.md` for files that need manual merge
3. Review upstream changes for features that conflict/overlap with VG additions
4. Update this documentation after resolving conflicts

**Removing VG features:**
- Each feature is isolated in its own file(s)
- Core file edits are documented for easy reversal
- Remove VG-prefixed localStorage keys from user browsers (migration script if needed)
