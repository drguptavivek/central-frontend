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
  <modal id="field-key-edit" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusInput">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <form @submit.prevent="submit">
        <form-group ref="displayName" v-model.trim="displayName"
          :placeholder="$t('field.displayName')" required autocomplete="off"/>
        <form-group v-model.trim="phone"
          :placeholder="$t('field.phoneWithFormat')" autocomplete="off"
          pattern="^.{0,25}$" maxlength="25"/>
        <div v-if="state && actorProperties.dataExists"
          class="field-key-edit-properties">
          <actor-properties-upsert v-model:propertyValues="propertyValues"
            :create="false" :property-defs="actorProperties.data"/>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.save') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';
import Modal from '../modal.vue';
import ActorPropertiesUpsert from '../actor-properties/upsert.vue';

import useRequest from '../../composables/request';
import { useRequestData } from '../../request-data';
import { vgApiPaths } from '../../util/vg-request';
import { noop } from '../../util/util';

export default {
  name: 'VgFieldKeyEdit',
  components: { FormGroup, Spinner, Modal, ActorPropertiesUpsert },
  inject: ['redAlert', 'alert'],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: Number,
      required: true
    },
    fieldKey: {
      type: Object,
      required: true
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    const { actorProperties } = useRequestData();
    return { request, awaitingResponse, actorProperties };
  },
  data() {
    return {
      displayName: '',
      phone: '',
      propertyValues: Object.create(null)
    };
  },
  watch: {
    fieldKey: {
      immediate: true,
      handler(fk) {
        if (fk != null) {
          this.displayName = fk.displayName ?? '';
          this.phone = fk.phone ?? '';
          this.propertyValues = Object.assign(Object.create(null), fk.properties);
        }
      }
    },
    state(showing) {
      if (!showing) return;
      this.$nextTick(() => this.focusInput());
    }
  },
  methods: {
    focusInput() {
      if (this.$refs.displayName != null) this.$refs.displayName.focus();
    },
    submit() {
      this.request({
        method: 'PATCH',
        url: vgApiPaths.fieldKeyUpdate(this.projectId, this.fieldKey.id),
        data: {
          fullName: this.displayName,
          phone: this.phone,
          properties: this.propertyValues
        }
      })
        .then(({ data }) => {
          this.redAlert.hide();
          this.alert.success(this.$t('alert.updated', data));
          this.$emit('success', data);
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "title": "Edit App User",
    "field": {
      "displayName": "Display Name",
      "phoneWithFormat": "Phone (+1 555 123 1234)"
    },
    "action": {
      "cancel": "Cancel",
      "save": "Save"
    },
    "alert": {
      "updated": "The App User “{displayName}” was updated."
    }
  }
}
</i18n>
