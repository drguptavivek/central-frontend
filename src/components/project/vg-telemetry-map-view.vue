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
  <div id="telemetry-map-view" ref="el">
    <p style="font-size: 12px; color: #666;">
      Debug: Map component mounted, data={{geojsonData ? 'present' : 'null'}},
      features={{geojsonData ? geojsonData.features.length : 0}}
    </p>
    <details style="font-size: 11px; margin: 10px 0;">
      <summary>View GeoJSON data</summary>
      <pre>{{ JSON.stringify(geojsonData, null, 2) }}</pre>
    </details>
    <geojson-map ref="map" :data="geojsonData" :sizer="sizeMap"
      @selection-changed="selectionChanged"/>
    <vg-telemetry-map-popup :telemetry-id="selectedTelemetryId"
      :feature="selectedFeature" :app-users="appUsers"
      @hide="hidePopup"/>
  </div>
</template>

<script setup>
import { defineAsyncComponent, shallowRef, useTemplateRef } from 'vue';

import VgTelemetryMapPopup from './vg-telemetry-map-popup.vue';

import { loadAsync } from '../../util/load-async';
import { styleBox } from '../../util/dom';

defineOptions({
  name: 'VgTelemetryMapView'
});

const props = defineProps({
  geojsonData: {
    type: Object,
    default: null
  },
  appUsers: {
    type: Array,
    default: () => []
  }
});

const GeojsonMap = defineAsyncComponent(loadAsync('GeojsonMap'));

const el = useTemplateRef('el');
// Stretches the map to the bottom of the screen.
const sizeMap = () => {
  const rect = el.value.getBoundingClientRect();
  if (rect.height === 0) return '';
  const section = el.value.closest('.page-section');
  const { marginBottom } = styleBox(getComputedStyle(section));
  return document.documentElement.clientHeight - rect.top - marginBottom;
};

const selectedFeature = shallowRef(null);
const selectedTelemetryId = shallowRef(null);

const selectionChanged = (feature) => {
  selectedFeature.value = feature;
  selectedTelemetryId.value = feature != null ? feature.id : null;
};

const map = useTemplateRef('map');
const hidePopup = () => {
  map.value.selectFeature(null);
};
</script>

<style lang="scss">
#telemetry-map-view {
  min-height: 500px;

  .geojson-map {
    min-height: 500px;
  }
}
</style>
