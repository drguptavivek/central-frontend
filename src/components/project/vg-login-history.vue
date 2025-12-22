<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-login-history">
    <div class="page-body-heading">
      <p>{{ $t('heading') }}</p>
    </div>
    <loading :state="initiallyLoading"/>
    <form class="login-history-filters" @submit.prevent="applyFilters">
      <label class="form-group">
        <select v-model.number="filters.appUserId" class="form-control">
          <option :value="null">{{ $t('filter.anyUser') }}</option>
          <option v-for="fieldKey of appUsers" :key="fieldKey.id" :value="fieldKey.id">
            {{ fieldKey.displayName }} ({{ fieldKey.username }})
          </option>
        </select>
        <span class="form-label">{{ $t('filter.appUser') }}</span>
      </label>
      <form-group v-model="filters.dateFrom" type="datetime-local"
        :placeholder="$t('filter.dateFrom')" autocomplete="off"/>
      <form-group v-model="filters.dateTo" type="datetime-local"
        :placeholder="$t('filter.dateTo')" autocomplete="off"/>
      <div class="filter-actions">
        <button type="submit" class="btn btn-primary"
          :aria-disabled="awaitingResponse">
          {{ $t('action.apply') }}
        </button>
        <button type="button" class="btn btn-link" @click="clearFilters">
          {{ $t('action.clear') }}
        </button>
      </div>
    </form>
    <table v-if="sessions.length !== 0" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.created') }}</th>
          <th>{{ $t('header.expires') }}</th>
          <th>{{ $t('header.appUser') }}</th>
          <th>{{ $t('header.status') }}</th>
          <th>{{ $t('header.ip') }}</th>
          <th>{{ $t('header.deviceId') }}</th>
          <th>{{ $t('header.comments') }}</th>
          <th>{{ $t('header.userAgent') }}</th>
          <th class="actions">{{ $t('header.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="session of sessions" :key="session.id">
          <td><date-time :iso="session.createdAt"/></td>
          <td><date-time :iso="session.expiresAt"/></td>
          <td>{{ appUserName(session.appUserId) }}</td>
          <td>{{ statusLabel(session.expiresAt) }}</td>
          <td>{{ session.ip || $t('common.notAvailable') }}</td>
          <td class="device-id">{{ session.deviceId || $t('common.notAvailable') }}</td>
          <td class="comments">
            <template v-if="session.comments">
              <div v-for="(line, index) in commentLines(session.comments)"
                :key="index">
                {{ line }}
              </div>
            </template>
            <span v-else>{{ $t('common.notAvailable') }}</span>
          </td>
          <td class="user-agent">{{ session.userAgent || $t('common.notAvailable') }}</td>
          <td class="actions">
            <button v-if="isActive(session.expiresAt)" type="button"
              class="btn btn-danger btn-xs" @click="revokeSession(session)">
              {{ $t('action.deactivate') }}
            </button>
            <span v-else>{{ $t('status.inactive') }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!initiallyLoading" class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
    <pagination v-if="totalCount > 0" v-model:page="pagination.page"
      v-model:size="pagination.size" :count="totalCount"
      :size-options="pageSizeOptions" :spinner="awaitingResponse"/>
    <confirmation v-bind="confirmModal" :title="$t('confirm.title')"
      :awaiting-response="awaitingResponse" @hide="confirmModal.hide()"
      @success="confirmRevoke">
      <template #body>
        <i18n-t tag="p" keypath="confirm.body.full">
          <template #appUser>
            <strong>{{ confirmAppUser }}</strong>
          </template>
          <template #device>
            <strong>{{ confirmDevice }}</strong>
          </template>
        </i18n-t>
      </template>
    </confirmation>
  </div>
</template>

<script>
import { useRoute } from 'vue-router';

import Confirmation from '../confirmation.vue';
import DateTime from '../date-time.vue';
import FormGroup from '../form-group.vue';
import Loading from '../loading.vue';
import Pagination from '../pagination.vue';

import useRequest from '../../composables/request';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';

const toIso = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const toOptionalInt = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export default {
  name: 'VgProjectLoginHistory',
  components: {
    Confirmation,
    DateTime,
    FormGroup,
    Loading,
    Pagination
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-field-keys'],
  inject: ['alert'],
  setup() {
    const { fieldKeys } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    const route = useRoute();
    return { fieldKeys, request, awaitingResponse, route };
  },
  data() {
    return {
      confirmModal: modalData(),
      sessions: [],
      totalCount: 0,
      initiallyLoading: false,
      pageSizeOptions: [10, 25, 50],
      pagination: {
        page: 0,
        size: 10
      },
      filters: {
        appUserId: null,
        dateFrom: '',
        dateTo: ''
      }
    };
  },
  computed: {
    appUsers() {
      return (this.fieldKeys != null && this.fieldKeys.dataExists)
        ? this.fieldKeys
        : [];
    },
    confirmAppUser() {
      if (!this.confirmModal.session) return this.$t('common.unknown');
      return this.appUserName(this.confirmModal.session.appUserId);
    },
    confirmDevice() {
      if (!this.confirmModal.session) return this.$t('common.notAvailable');
      return this.confirmModal.session.deviceId || this.$t('common.notAvailable');
    }
  },
  created() {
    this.$emit('fetch-field-keys', false);
    this.filters.appUserId = toOptionalInt(this.route.query.appUserId);
    this.fetchSessions(true);
  },
  watch: {
    'pagination.page'() {
      this.fetchSessions();
    },
    'pagination.size'() {
      this.fetchSessions(true);
    },
    'route.query.appUserId'(value) {
      this.filters.appUserId = toOptionalInt(value);
      this.fetchSessions(true);
    }
  },
  methods: {
    applyFilters() {
      this.fetchSessions(true);
    },
    clearFilters() {
      this.filters.appUserId = null;
      this.filters.dateFrom = '';
      this.filters.dateTo = '';
      this.fetchSessions(true);
    },
    appUserName(appUserId) {
      const match = (this.fieldKeys != null && this.fieldKeys.dataExists)
        ? this.fieldKeys.find((fieldKey) => fieldKey.id === appUserId)
        : null;
      return match != null ? match.displayName : this.$t('common.unknown');
    },
    statusLabel(expiresAt) {
      if (!expiresAt) return this.$t('status.unknown');
      return new Date(expiresAt) > new Date()
        ? this.$t('status.active')
        : this.$t('status.inactive');
    },
    isActive(expiresAt) {
      return expiresAt != null && new Date(expiresAt) > new Date();
    },
    commentLines(comments) {
      const parts = comments.split(/[;,]+/).map((part) => part.trim()).filter(Boolean);
      return parts.map((part) => {
        const [key, ...rest] = part.split('=');
        if (rest.length === 0) return part;
        const value = rest.join('=').trim();
        return `${key.trim()}: ${value}`;
      });
    },
    revokeSession(session) {
      if (!this.isActive(session.expiresAt)) return;
      this.confirmModal.show({ session });
    },
    confirmRevoke() {
      const { session } = this.confirmModal;
      if (session == null) return;
      this.request({
        method: 'POST',
        url: apiPaths.projectAppUserSessionRevoke(this.projectId, session.id)
      })
        .then(() => {
          this.alert.success(this.$t('alert.deactivated'));
          this.confirmModal.hide();
          this.fetchSessions(true);
        })
        .catch(() => {});
    },
    fetchSessions(resetPage = false) {
      if (resetPage && this.pagination.page !== 0) {
        this.pagination.page = 0;
        return;
      }

      if (this.sessions.length === 0) this.initiallyLoading = true;
      const query = {
        appUserId: this.filters.appUserId != null ? this.filters.appUserId : undefined,
        dateFrom: toIso(this.filters.dateFrom),
        dateTo: toIso(this.filters.dateTo),
        limit: this.pagination.size,
        offset: this.pagination.page * this.pagination.size
      };
      this.request({
        url: apiPaths.projectAppUserSessions(this.projectId, query)
      })
        .then((response) => {
          const headerTotal = Number(response.headers['x-total-count']);
          this.totalCount = Number.isFinite(headerTotal)
            ? headerTotal
            : response.data.length;
          this.sessions = response.data;
          this.initiallyLoading = false;
        })
        .catch(() => {
          this.initiallyLoading = false;
        });
    }
  }
};
</script>

<style lang="scss">
#project-login-history {
  .login-history-filters {
    display: grid;
    gap: 10px 15px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    margin-bottom: 15px;
  }

  .filter-actions {
    align-items: center;
    display: flex;
    gap: 10px;
  }

  .comments {
    max-width: 260px;
    white-space: normal;
  }

  .user-agent {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .device-id {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .actions {
    width: 140px;
    white-space: nowrap;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": "App User Login History",
    "filter": {
      "appUser": "App User",
      "anyUser": "All App Users",
      "dateFrom": "Date From",
      "dateTo": "Date To"
    },
    "action": {
      "apply": "Apply Filters",
      "clear": "Clear",
      "deactivate": "Deactivate"
    },
    "confirm": {
      "title": "Deactivate Session",
      "body": {
        "full": "Deactivate the session for {appUser} on device {device}?"
      }
    },
    "alert": {
      "deactivated": "Session deactivated."
    },
    "header": {
      "created": "Signed In",
      "expires": "Expires",
      "appUser": "App User",
      "status": "Status",
      "ip": "IP",
      "deviceId": "Device ID",
      "comments": "Comments",
      "userAgent": "User Agent",
      "actions": "Actions"
    },
    "emptyTable": "No login history found for this project."
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "unknown": "Unknown"
  }
}
</i18n>
