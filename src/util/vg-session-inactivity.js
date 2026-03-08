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
    if (event.key === inactivityStorageKey && event.newValue != null) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};

export const createInactivityLogoutHandler = ({
  alert,
  i18n,
  logOut,
  noop,
  requestData,
  router
}) => {
  let lastActivityWhenWarned = null;

  return () => {
    if (router.currentRoute.value.meta.skipAutoLogout) return;
    if (!requestData.session.dataExists) return;

    const now = Date.now();
    const lastActivityAt = getLastActivityAt();
    if (lastActivityAt == null) return;

    const millisSinceActivity = now - lastActivityAt;
    const millisUntilLogout = inactivityLogoutMillis - millisSinceActivity;

    if (lastActivityWhenWarned != null && lastActivityAt > lastActivityWhenWarned)
      lastActivityWhenWarned = null;

    if (millisUntilLogout <= 0) {
      logOut(true)
        .then(() => { alert.info(i18n.t('util.session.alert.expired')); })
        .catch(noop);
    } else if (millisUntilLogout <= 180000 && lastActivityWhenWarned == null) {
      alert.info(i18n.t('util.session.alert.expiresSoon'));
      lastActivityWhenWarned = lastActivityAt;
    }
  };
};

export const setupVgSessionInactivity = (options) => {
  const check = createInactivityLogoutHandler(options);
  const activityHandler = createInactivityActivityHandler();
  const removeInactivityListeners = attachInactivityListeners(activityHandler);
  const removeActivityStorageListener = attachActivityStorageListener(() => {
    check();
  });

  return {
    check,
    cleanup: () => {
      removeInactivityListeners();
      removeActivityStorageListener();
    }
  };
};
