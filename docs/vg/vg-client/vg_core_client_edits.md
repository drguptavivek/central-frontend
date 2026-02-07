# VG Core Client File Edits

This document tracks all modifications to **core upstream files** in the ODK Central frontend. These are files that exist in the upstream `getodk/central-frontend` repository.

**Purpose:** When rebasing onto upstream master, review this document to identify files that may need manual merge conflict resolution.

---

## Modified Core Files

### `src/util/session.js`

**VG Feature:** Session Inactivity Auto-Logout

**Changes Made:**

#### 1. Imports (lines ~67-73)
Added VG session inactivity module imports:
```javascript
import {
  attachActivityStorageListener,
  attachInactivityListeners,
  clearLastActivityAt,
  createInactivityActivityHandler,
  getLastActivityAt,
  inactivityLogoutMillis,
  setLastActivityAt
} from './vg-session-inactivity';
```

**Merge Strategy:** If upstream modifies imports section, add VG import after upstream changes.

---

#### 2. `removeSessionFromStorage()` function (line ~91)
Added call to clear inactivity tracking:
```javascript
const removeSessionFromStorage = () => {
  localStore.setItem('sessionExpires', '0');
  localStore.removeItem('sessionExpires');
  clearLastActivityAt();  // ← VG addition
};
```

**Merge Strategy:** If upstream modifies this function, ensure `clearLastActivityAt()` remains at the end.

---

#### 3. New `logOutAfterInactivity()` function (lines ~199-225)
Entirely new function for VG feature:
```javascript
const logOutAfterInactivity = (container) => {
  const { i18n, requestData, alert, router } = container;
  let lastActivityWhenWarned = null;

  return () => {
    if (router.currentRoute.value.meta.skipAutoLogout) return;
    if (!requestData.session.dataExists) return;

    const now = Date.now();
    const lastActivityAt = getLastActivityAt();
    if (lastActivityAt == null) return;

    const millisSinceActivity = now - lastActivityAt;
    const millisUntilLogout = inactivityLogoutMillis - millisSinceActivity;

    // Reset warning if there was activity since last warning
    if (lastActivityWhenWarned != null && lastActivityAt > lastActivityWhenWarned) {
      lastActivityWhenWarned = null;
    }

    // Log out if timeout reached
    if (millisUntilLogout <= 0) {
      logOut(container, true)
        .then(() => { alert.info(i18n.t('util.session.alert.expired')); })
        .catch(noop);
    }
    // Warn 3 minutes before timeout
    else if (millisUntilLogout <= 180000 && lastActivityWhenWarned == null) {
      alert.info(i18n.t('util.session.alert.expiresSoon'));
      lastActivityWhenWarned = lastActivityAt;
    }
  };
};
```

**Merge Strategy:** This is a new function. If upstream adds session management changes, add this function after their additions. Insert before `useSessions()` function.

---

#### 4. `useSessions()` function (lines ~210-232)
Modified to integrate inactivity checking:

**Original upstream code:**
```javascript
export const useSessions = () => {
  const container = inject('container');
  const checkSessionExpiration = logOutBeforeSessionExpires(container);
  const onInterval = () => {
    checkSessionExpiration();
  };
  const intervalId = setInterval(onInterval, 15000);
  const storageHandler = logOutAfterStorageChange(container);
  window.addEventListener('storage', storageHandler);
  onBeforeUnmount(() => {
    clearInterval(intervalId);
    window.removeEventListener('storage', storageHandler);
  });
  // ... rest of function
```

**VG modifications:**
```javascript
export const useSessions = () => {
  const container = inject('container');
  const checkSessionExpiration = logOutBeforeSessionExpires(container);
  const checkInactivity = logOutAfterInactivity(container);  // ← VG addition
  const onInterval = () => {
    checkSessionExpiration();
    checkInactivity();  // ← VG addition
  };
  const intervalId = setInterval(onInterval, 15000);
  const storageHandler = logOutAfterStorageChange(container);
  const activityHandler = createInactivityActivityHandler();  // ← VG addition
  const removeInactivityListeners = attachInactivityListeners(activityHandler);  // ← VG addition
  // Listen for activity from other tabs and re-check inactivity status
  const removeActivityStorageListener = attachActivityStorageListener(() => {  // ← VG addition
    checkInactivity();  // ← VG addition
  });  // ← VG addition
  window.addEventListener('storage', storageHandler);
  onBeforeUnmount(() => {
    clearInterval(intervalId);
    window.removeEventListener('storage', storageHandler);
    removeInactivityListeners();  // ← VG addition
    removeActivityStorageListener();  // ← VG addition
  });
  // ... rest of function unchanged
```

**Merge Strategy:**
- If upstream modifies interval logic, ensure `checkInactivity()` is called in `onInterval()`
- If upstream adds cleanup logic, ensure VG cleanup functions are called in `onBeforeUnmount()`
- Keep VG additions grouped together for clarity

---

#### 5. `logIn()` function (line ~290)
Added inactivity tracking initialization:
```javascript
export const logIn = (container, newSession) => {
  // ... existing code ...
  if (newSession) {
    localStore.removeItem('sessionExpires');
    localStore.setItem('sessionExpires', Date.parse(session.expiresAt).toString());
  }
  setLastActivityAt();  // ← VG addition

  return currentUser.request({ url: '/v1/users/current', extended: true })
  // ... rest of function unchanged
```

**Merge Strategy:** If upstream modifies `logIn()`, ensure `setLastActivityAt()` is called after setting `sessionExpires`.

---

## Modified Test Files

### `test/unit/session.spec.js`

**VG Feature:** Session Inactivity Auto-Logout Tests

**Changes Made:**

#### 1. Imports (lines ~4-7)
Added VG module imports:
```javascript
import {
  inactivityLogoutMillis,
  inactivityStorageKey
} from '../../src/util/vg-session-inactivity';
```

**Merge Strategy:** Add after existing imports if upstream modifies import section.

---

#### 2. New test suite (lines ~958-1064)
Entirely new test suite:
```javascript
describe('logout after inactivity', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('logs out after inactivity timeout is reached', () => { /* ... */ });
  it('does not log out if there is activity before timeout', () => { /* ... */ });
  it('shows warning 3 minutes before inactivity timeout', () => { /* ... */ });
  it('resets warning after activity', () => { /* ... */ });
  it('prevents logout when activity detected from other tabs', () => { /* ... */ });
});
```

**Merge Strategy:**
- This is a new test suite, insert before `describe('visiblyLoggedIn', () => {` block
- If upstream adds session tests, VG tests can coexist
- Keep test descriptions clear that these are VG inactivity tests

---

## Summary of Core File Changes

| File | Lines Changed | Type | Merge Difficulty |
|------|---------------|------|------------------|
| `src/util/session.js` | ~60 added | Imports, 1 new function, modifications to 3 functions | Medium |
| `test/unit/session.spec.js` | ~100 added | New test suite | Low |

**Total:** 2 core files modified

---

## Rebase Strategy

When rebasing onto upstream `master`:

1. **Review upstream changes** to these files:
   ```bash
   git log upstream/master -- src/util/session.js test/unit/session.spec.js
   ```

2. **Conflict Resolution:**
   - `session.js`: Manually merge, keeping VG additions grouped
   - `session.spec.js`: Tests usually don't conflict, but verify test framework hasn't changed

3. **Verification:**
   - Run tests: `npm test -- test/unit/session.spec.js`
   - Manually test inactivity logout in browser
   - Check that warnings appear at 27 minutes
   - Verify cross-tab behavior

4. **If upstream adds similar feature:**
   - Evaluate whether to keep VG version or adopt upstream
   - If keeping VG version, ensure no conflicts with upstream approach
   - If adopting upstream, remove VG files and update this documentation

---

## Removal Instructions

To remove VG session inactivity feature:

1. **Revert changes to core files:**
   ```bash
   # Remove VG additions from session.js
   # - Remove vg-session-inactivity import
   # - Remove clearLastActivityAt() call
   # - Remove logOutAfterInactivity() function
   # - Remove VG additions from useSessions()
   # - Remove setLastActivityAt() call from logIn()

   # Remove VG test suite from session.spec.js
   ```

2. **Remove VG-specific file:**
   ```bash
   rm src/util/vg-session-inactivity.js
   ```

3. **Clean up localStorage** (optional migration script):
   ```javascript
   localStorage.removeItem('vgSessionLastActivityAt');
   ```

4. **Update documentation:**
   - Remove entry from `vg_client_changes.md`
   - Remove this section from `vg_core_client_edits.md`
