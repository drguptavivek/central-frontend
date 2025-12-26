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
    <vg-telemetry-simple-map
      :geojson-data="geojsonData"
      :height="600"
      @feature-click="handleFeatureClick"/>
    <vg-telemetry-map-popup :telemetry-id="selectedTelemetryId"
      :feature="selectedFeature" :app-users="appUsers"
      @hide="hidePopup"/>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';

import VgTelemetrySimpleMap from './vg-telemetry-simple-map.vue';
import VgTelemetryMapPopup from './vg-telemetry-map-popup.vue';

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

const selectedFeature = shallowRef(null);
const selectedTelemetryId = shallowRef(null);

const handleFeatureClick = (feature) => {
  if (!feature) return;

  // Convert OpenLayers feature to a simple object with properties
  selectedFeature.value = {
    id: feature.getId(),
    properties: feature.getProperties()
  };
  selectedTelemetryId.value = feature.getId();
};

const hidePopup = () => {
  selectedFeature.value = null;
  selectedTelemetryId.value = null;
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
