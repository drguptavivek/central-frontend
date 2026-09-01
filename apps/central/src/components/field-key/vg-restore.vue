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
  <modal id="field-key-restore" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n-t tag="p" keypath="introduction[0]">
          <template #displayName>
            <strong>{{ fieldKey != null ? fieldKey.displayName : '' }}</strong>
          </template>
        </i18n-t>
        <p>{{ $t('introduction[1]') }}</p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.noCancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="restore">
          {{ $t('action.yesProceed') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'VgFieldKeyRestore',
  components: { Modal, Spinner },
  props: {
    state: Boolean,
    fieldKey: Object
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  methods: {
    restore() {
      this.request({
        method: 'POST',
        url: apiPaths.fieldKeyActive(this.fieldKey.projectId, this.fieldKey.id),
        data: { active: true }
      })
        .then(() => {
          this.$emit('success', this.fieldKey);
        })
        .catch(noop);
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "title": "Restore User Access",
    "introduction": [
      "Are you sure you want to restore access for the App User {displayName}?",
      "This user will be able to log in and access Forms again."
    ]
  }
}
</i18n>
