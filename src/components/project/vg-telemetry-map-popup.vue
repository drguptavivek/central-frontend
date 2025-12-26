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
  <map-popup v-show="telemetryId != null" id="telemetry-map-popup"
    @hide="$emit('hide')">
    <template #title>
      <span v-tooltip.text>{{ $t('title', { deviceId: properties?.deviceId ?? '' }) }}</span>
    </template>
    <template #body>
      <dl v-if="properties">
        <div>
          <dt>{{ $t('field.deviceId') }}</dt>
          <dd v-tooltip.text>{{ properties.deviceId }}</dd>
        </div>
        <div>
          <dt>{{ $t('field.appUser') }}</dt>
          <dd v-tooltip.text>{{ appUserName }}</dd>
        </div>
        <div>
          <dt>{{ $t('field.collectVersion') }}</dt>
          <dd v-tooltip.text>{{ properties.collectVersion }}</dd>
        </div>
        <div>
          <dt>{{ $t('field.receivedAt') }}</dt>
          <dd><date-time :iso="properties.dateTime"/></dd>
        </div>
        <div>
          <dt>{{ $t('field.deviceTime') }}</dt>
          <dd><date-time :iso="properties.deviceDateTime"/></dd>
        </div>
      </dl>
      <dl v-if="properties?.location">
        <div>
          <dt>{{ $t('location.latitude') }}</dt>
          <dd>{{ properties.location.latitude }}</dd>
        </div>
        <div>
          <dt>{{ $t('location.longitude') }}</dt>
          <dd>{{ properties.location.longitude }}</dd>
        </div>
        <div v-if="properties.location.accuracy != null">
          <dt>{{ $t('location.accuracy') }}</dt>
          <dd>{{ properties.location.accuracy }} m</dd>
        </div>
        <div v-if="properties.location.altitude != null">
          <dt>{{ $t('location.altitude') }}</dt>
          <dd>{{ properties.location.altitude }} m</dd>
        </div>
        <div v-if="properties.location.speed != null">
          <dt>{{ $t('location.speed') }}</dt>
          <dd>{{ properties.location.speed }} m/s</dd>
        </div>
        <div v-if="properties.location.bearing != null">
          <dt>{{ $t('location.bearing') }}</dt>
          <dd>{{ properties.location.bearing }}°</dd>
        </div>
        <div v-if="properties.location.provider">
          <dt>{{ $t('location.provider') }}</dt>
          <dd v-tooltip.text>{{ properties.location.provider }}</dd>
        </div>
      </dl>
    </template>
  </map-popup>
</template>

<script setup>
import { computed } from 'vue';

import DateTime from '../date-time.vue';
import MapPopup from '../map/popup.vue';

defineOptions({
  name: 'VgTelemetryMapPopup'
});

const props = defineProps({
  telemetryId: {
    type: String,
    default: null
  },
  feature: {
    type: Object,
    default: null
  },
  appUsers: {
    type: Array,
    default: () => []
  }
});

defineEmits(['hide']);

const properties = computed(() => props.feature?.properties ?? null);

const appUserName = computed(() => {
  if (!properties.value?.appUserId) return 'Unknown';
  const match = props.appUsers.find(u => u.id === properties.value.appUserId);
  return match?.displayName ?? 'Unknown';
});
</script>

<style lang="scss">
@import '../../assets/scss/mixins';
@import '../../assets/scss/variables';

#telemetry-map-popup {
  dl:first-of-type {
    padding-bottom: $padding-block-dl;
    border-bottom: $border-bottom-dl;
  }
  dl:last-of-type {
    padding-top: $padding-block-dl;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Device: {deviceId}",
    "field": {
      "deviceId": "Device ID",
      "appUser": "App User",
      "collectVersion": "Collect Version",
      "receivedAt": "Received At",
      "deviceTime": "Device Time"
    },
    "location": {
      "latitude": "Latitude",
      "longitude": "Longitude",
      "accuracy": "Accuracy",
      "altitude": "Altitude",
      "speed": "Speed",
      "bearing": "Bearing",
      "provider": "Location Provider"
    }
  }
}
</i18n>
