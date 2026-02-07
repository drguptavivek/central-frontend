/*
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
VG-Specific Feature: Session Inactivity Tracking
Tracks user activity across tabs and automatically logs out users after
30 minutes of inactivity. Activity in any tab resets the timer for all tabs.
*/

import { localStore } from './storage';

export const inactivityStorageKey = 'vgSessionLastActivityAt';
export const inactivityLogoutMillis = 30 * 60 * 1000;

const activityEvents = [
  'click',
  'keydown',
  'mousedown',
  'mousemove',
  'scroll',
  'touchstart'
];

export const getLastActivityAt = () => {
  const value = localStore.getItem(inactivityStorageKey);
  if (value == null) return null;
  const millis = Number.parseInt(value, 10);
  return Number.isNaN(millis) ? null : millis;
};

export const setLastActivityAt = (millis = Date.now()) => {
  localStore.setItem(inactivityStorageKey, millis.toString());
};

export const clearLastActivityAt = () => {
  localStore.removeItem(inactivityStorageKey);
};

export const createInactivityActivityHandler = (throttleMillis = 15000) => {
  let lastSavedAt = 0;
  return () => {
    const now = Date.now();
    if (now - lastSavedAt < throttleMillis) return;
    setLastActivityAt(now);
    lastSavedAt = now;
  };
};

export const isInactivityTimeoutReached = (now = Date.now()) => {
  const lastActivityAt = getLastActivityAt();
  if (lastActivityAt == null) return false;
  return now - lastActivityAt >= inactivityLogoutMillis;
};

export const attachInactivityListeners = (handler) => {
  for (const event of activityEvents)
    window.addEventListener(event, handler, { passive: true });
  return () => {
    for (const event of activityEvents)
      window.removeEventListener(event, handler);
  };
};

export const attachActivityStorageListener = (callback) => {
  const handler = (event) => {
    // Detect activity from other tabs via storage events
    if (event.key === inactivityStorageKey && event.newValue != null) {
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};
