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
  <div id="project-telemetry">
    <div class="page-body-heading">
      <p>{{ $t('heading') }}</p>
    </div>
    <loading :state="initiallyLoading"/>
    <form class="telemetry-filters" @submit.prevent="applyFilters">
      <label class="form-group">
        <select v-model.number="filters.appUserId" class="form-control">
          <option :value="null">{{ $t('filter.anyUser') }}</option>
          <option v-for="fieldKey of appUsers" :key="fieldKey.id" :value="fieldKey.id">
            {{ fieldKey.displayName }} ({{ fieldKey.username }})
          </option>
        </select>
        <span class="form-label">{{ $t('filter.appUser') }}</span>
      </label>
      <form-group v-model.trim="filters.deviceId"
        :placeholder="$t('filter.deviceId')" autocomplete="off"/>
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
    <radio-field v-model="dataView" :options="viewOptions"
      :button-appearance="true"/>
    <!-- Debug: show telemetry and geojson counts -->
    <p v-if="dataView === 'map'" style="font-size: 12px; color: #666;">
      Debug: {{ telemetry.length }} telemetry records,
      {{ geojsonData ? geojsonData.features.length : 0 }} with location data
    </p>
    <table v-if="dataView === 'table' && telemetry.length !== 0" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.receivedAt') }}</th>
          <th>{{ $t('header.deviceTime') }}</th>
          <th>{{ $t('header.appUser') }}</th>
          <th>{{ $t('header.deviceId') }}</th>
          <th>{{ $t('header.collectVersion') }}</th>
          <th>{{ $t('header.location') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row of telemetry" :key="row.id">
          <td><date-time :iso="row.dateTime"/></td>
          <td><date-time :iso="row.deviceDateTime"/></td>
          <td>{{ appUserName(row.appUserId) }}</td>
          <td>{{ row.deviceId }}</td>
          <td>{{ row.collectVersion }}</td>
          <td class="location">
            <template v-if="row.location">
              {{ row.location.latitude }}, {{ row.location.longitude }}
            </template>
            <template v-else>{{ $t('common.notAvailable') }}</template>
          </td>
        </tr>
      </tbody>
    </table>
    <vg-telemetry-map-view v-else-if="dataView === 'map' && geojsonData != null"
      :geojson-data="geojsonData" :app-users="appUsers"/>
    <p v-else-if="!initiallyLoading && telemetry.length === 0" class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
    <p v-else-if="!initiallyLoading && dataView === 'map' && (geojsonData == null || geojsonData.features.length === 0)"
       class="empty-table-message">
      {{ $t('emptyMap') }}
    </p>
    <pagination v-if="dataView === 'table' && totalCount > 0" v-model:page="pagination.page"
      v-model:size="pagination.size" :count="totalCount"
      :size-options="pageSizeOptions" :spinner="awaitingResponse"/>
  </div>
</template>

<script>
import DateTime from '../date-time.vue';
import FormGroup from '../form-group.vue';
import Loading from '../loading.vue';
import Pagination from '../pagination.vue';
import RadioField from '../radio-field.vue';
import VgTelemetryMapView from './vg-telemetry-map-view.vue';

import useDataView from '../../composables/data-view';
import useRequest from '../../composables/request';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';

const toIso = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export default {
  name: 'VgProjectTelemetry',
  components: {
    DateTime,
    FormGroup,
    Loading,
    Pagination,
    RadioField,
    VgTelemetryMapView
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-field-keys'],
  setup() {
    const { fieldKeys } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    const { dataView, options: viewOptions } = useDataView();
    return { fieldKeys, request, awaitingResponse, dataView, viewOptions };
  },
  data() {
    return {
      telemetry: [],
      totalCount: 0,
      initiallyLoading: false,
      pageSizeOptions: [10, 25, 50],
      pagination: {
        page: 0,
        size: 10
      },
      filters: {
        appUserId: null,
        deviceId: '',
        dateFrom: '',
        dateTo: ''
      }
    };
  },
  created() {
    this.$emit('fetch-field-keys', false);
    this.fetchTelemetry(true);
  },
  watch: {
    'pagination.page'() {
      this.fetchTelemetry();
    },
    'pagination.size'() {
      this.fetchTelemetry(true);
    }
  },
  computed: {
    appUsers() {
      return (this.fieldKeys != null && this.fieldKeys.dataExists)
        ? Array.from(this.fieldKeys)
        : [];
    },
    geojsonData() {
      if (!this.telemetry || this.telemetry.length === 0) return null;

      return {
        type: 'FeatureCollection',
        features: this.telemetry
          .filter(t => t.location && t.location.latitude != null && t.location.longitude != null)
          .map(t => ({
            type: 'Feature',
            id: `telemetry-${t.id}`,
            geometry: {
              type: 'Point',
              coordinates: [t.location.longitude, t.location.latitude]
            },
            properties: {
              id: t.id,
              deviceId: t.deviceId,
              appUserId: t.appUserId,
              collectVersion: t.collectVersion,
              deviceDateTime: t.deviceDateTime,
              dateTime: t.dateTime,
              location: t.location
            }
          }))
      };
    }
  },
  methods: {
    applyFilters() {
      this.fetchTelemetry(true);
    },
    clearFilters() {
      this.filters.appUserId = null;
      this.filters.deviceId = '';
      this.filters.dateFrom = '';
      this.filters.dateTo = '';
      this.fetchTelemetry(true);
    },
    appUserName(appUserId) {
      const match = (this.fieldKeys != null && this.fieldKeys.dataExists)
        ? this.fieldKeys.find((fieldKey) => fieldKey.id === appUserId)
        : null;
      return match != null ? match.displayName : this.$t('common.unknown');
    },
    fetchTelemetry(resetPage = false) {
      if (resetPage && this.pagination.page !== 0) {
        this.pagination.page = 0;
        return;
      }

      if (this.telemetry.length === 0) this.initiallyLoading = true;
      const query = {
        projectId: Number(this.projectId),
        appUserId: this.filters.appUserId != null ? this.filters.appUserId : undefined,
        deviceId: this.filters.deviceId.trim() !== '' ? this.filters.deviceId.trim() : undefined,
        dateFrom: toIso(this.filters.dateFrom),
        dateTo: toIso(this.filters.dateTo),
        limit: this.pagination.size,
        offset: this.pagination.page * this.pagination.size
      };
      this.request({ url: apiPaths.systemAppUserTelemetry(query) })
        .then((response) => {
          const headerTotal = Number(response.headers['x-total-count']);
          this.totalCount = Number.isFinite(headerTotal)
            ? headerTotal
            : response.data.length;
          this.telemetry = response.data;
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
#project-telemetry {
  .telemetry-filters {
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

  .location {
    white-space: nowrap;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": "App User Telemetry",
    "filter": {
      "appUser": "App User",
      "anyUser": "All App Users",
      "deviceId": "Device ID",
      "dateFrom": "Date From",
      "dateTo": "Date To"
    },
    "action": {
      "apply": "Apply Filters",
      "clear": "Clear"
    },
    "header": {
      "receivedAt": "Received At",
      "deviceTime": "Device Time",
      "appUser": "App User",
      "deviceId": "Device ID",
      "collectVersion": "Collect Version",
      "location": "Location"
    },
    "emptyTable": "No telemetry found for this project.",
    "emptyMap": "No telemetry with location data found for these filters."
  }
}
</i18n>
