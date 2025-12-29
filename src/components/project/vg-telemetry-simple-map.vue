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
  <div class="telemetry-map-wrapper">
    <div ref="mapContainer" class="telemetry-simple-map" :style="{height: height + 'px'}"></div>
    <div ref="tooltipElement" class="telemetry-tooltip" v-show="tooltip.visible">
      <div><strong>{{ tooltip.user }}</strong></div>
      <div>Device: {{ tooltip.device }}</div>
      <div>{{ tooltip.dateTime }}</div>
      <div v-if="tooltip.eventType">Event: {{ tooltip.eventType }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, useTemplateRef, reactive } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';
import { Style, Icon, Circle, Fill, Stroke } from 'ol/style';
import { fromLonLat } from 'ol/proj';

defineOptions({
  name: 'VgTelemetrySimpleMap'
});

const props = defineProps({
  geojsonData: {
    type: Object,
    required: true
  },
  height: {
    type: Number,
    default: 600
  },
  appUsers: {
    type: Array,
    default: () => []
  }
});

const mapContainer = useTemplateRef('mapContainer');
const tooltipElement = useTemplateRef('tooltipElement');
let map = null;
let vectorSource = null;
let tooltipOverlay = null;

const tooltip = reactive({
  visible: false,
  user: '',
  device: '',
  dateTime: '',
  eventType: ''
});

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString();
};

const getAppUserName = (appUserId) => {
  const user = props.appUsers.find(u => u.id === appUserId);
  return user?.displayName || 'Unknown';
};

onMounted(() => {
  // Create vector source
  vectorSource = new VectorSource();

  // Create vector layer with custom styling
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: (feature) => {
      const markerIcon = feature.get('markerIcon');
      const markerColor = feature.get('markerColor') || '#3388ff';

      if (markerIcon) {
        // Use custom colored icon from SVG data URI
        return new Style({
          image: new Icon({
            src: markerIcon,
            scale: 1.5
          })
        });
      }

      // Fallback to circle style
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: markerColor }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      });
    }
  });

  // Create tooltip overlay
  tooltipOverlay = new Overlay({
    element: tooltipElement.value,
    positioning: 'bottom-center',
    stopEvent: false,
    offset: [0, -15]
  });

  // Create map
  map = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({ source: new OSM() }),
      vectorLayer
    ],
    view: new View({
      center: fromLonLat([0, 0]),
      zoom: 2
    }),
    overlays: [tooltipOverlay]
  });

  // Add hover handler
  map.on('pointermove', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

    if (feature) {
      // Show tooltip
      const appUserId = feature.get('appUserId');
      const deviceId = feature.get('deviceId');
      const dateTime = feature.get('dateTime');
      const event = feature.get('event');

      tooltip.user = getAppUserName(appUserId);
      tooltip.device = deviceId || 'Unknown';
      tooltip.dateTime = formatDateTime(dateTime);
      tooltip.eventType = (event && typeof event === 'object')
        ? (event.type || '')
        : '';
      tooltip.visible = true;

      tooltipOverlay.setPosition(evt.coordinate);

      // Change cursor to pointer
      map.getTargetElement().style.cursor = 'pointer';
    } else {
      // Hide tooltip
      tooltip.visible = false;
      map.getTargetElement().style.cursor = '';
    }
  });

  // Load initial data
  loadFeatures();
});

const loadFeatures = () => {
  if (!props.geojsonData || !vectorSource) return;

  // Clear existing features
  vectorSource.clear();

  // Read features from GeoJSON
  const features = new GeoJSON().readFeatures(props.geojsonData, {
    featureProjection: 'EPSG:3857'
  });

  if (features.length === 0) return;

  // Add features to source
  vectorSource.addFeatures(features);

  // Fit map to features
  const extent = vectorSource.getExtent();
  map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 16 });
};

// Watch for data changes
watch(() => props.geojsonData, () => {
  loadFeatures();
}, { deep: true });
</script>

<style lang="scss">
.telemetry-map-wrapper {
  position: relative;
}

.telemetry-simple-map {
  width: 100%;
  min-height: 400px;

  .ol-zoom {
    top: 0.5em;
    left: auto;
    right: 0.5em;
  }
}

.telemetry-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;

  strong {
    font-weight: 600;
  }

  div {
    margin: 2px 0;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(0, 0, 0, 0.85);
  }
}
</style>
