/*
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, or distributed except according
to the terms contained in the LICENSE file.
*/
import { queryString } from './request';

// VG-only API paths live here so the upstream request utility remains focused
// on paths shared by the core application and its components.
// eslint-disable-next-line import/prefer-default-export
export const vgApiPaths = {
  fieldKeyUpdate: (projectId, id) => `/v1/projects/${projectId}/app-users/${id}`,
  fieldKeyResetPassword: (projectId, id) =>
    `/v1/projects/${projectId}/app-users/${id}/password/reset`,
  fieldKeyRevoke: (projectId, id) =>
    `/v1/projects/${projectId}/app-users/${id}/revoke-admin`,
  fieldKeyActive: (projectId, id) => `/v1/projects/${projectId}/app-users/${id}/active`,
  projectAppUserSessions: (projectId, query = undefined) =>
    `/v1/projects/${projectId}/app-users/sessions${queryString(query)}`,
  projectAppUserSessionRevoke: (projectId, sessionId) =>
    `/v1/projects/${projectId}/app-users/sessions/${sessionId}/revoke`,
  projectAppUserTelemetry: (projectId, query = undefined) =>
    `/v1/projects/${projectId}/app-users/telemetry${queryString(query)}`,
  projectAppUserSettings: (projectId) =>
    `/v1/projects/${projectId}/app-users/settings`,
  systemSettings: () => '/v1/system/settings',
  enketoStatus: (query = undefined) =>
    `/v1/system/enketo-status${queryString(query)}`,
  enketoStatusRegenerate: () => '/v1/system/enketo-status/regenerate'
};
