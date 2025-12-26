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
  <div ref="mapContainer" class="telemetry-simple-map" :style="{height: height + 'px'}"></div>
</template>

<script setup>
import { onMounted, watch, useTemplateRef } from 'vue';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
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
  }
});

const emit = defineEmits(['feature-click']);

const mapContainer = useTemplateRef('mapContainer');
let map = null;
let vectorSource = null;

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
    })
  });

  // Add click handler
  map.on('click', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
    if (feature) {
      emit('feature-click', feature);
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
.telemetry-simple-map {
  width: 100%;
  min-height: 400px;

  .ol-zoom {
    top: 0.5em;
    left: auto;
    right: 0.5em;
  }
}
</style>
