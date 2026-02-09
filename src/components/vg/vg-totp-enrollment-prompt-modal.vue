<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="vg-totp-enrollment-prompt" :state="state" :hideable="true" backdrop
    @hide="handleHide">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('intro') }}</p>
        <ul class="benefits-list">
          <li>{{ $t('benefits.protection') }}</li>
          <li>{{ $t('benefits.prevention') }}</li>
          <li>{{ $t('benefits.compliance') }}</li>
        </ul>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="setupNow">
          {{ $t('action.setupNow') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-default"
          :aria-disabled="awaitingResponse" @click="remindLater">
          {{ $t('action.remindLater') }}
        </button>
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="dontAskAgain">
          {{ $t('action.dontAskAgain') }}
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
  name: 'VgTotpEnrollmentPromptModal',
  components: { Modal, Spinner },
  inject: ['alert'],
  props: {
    state: Boolean,
    userId: {
      type: [String, Number],
      required: true
    }
  },
  emits: ['hide', 'setup'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  methods: {
    setupNow() {
      // Emit event to parent to start enrollment flow
      this.$emit('setup');
      this.$emit('hide');
    },
    remindLater() {
      // Dismiss for 7 days
      this.dismissPrompt(7, this.$t('alert.remindLaterSuccess'));
    },
    dontAskAgain() {
      // Permanent dismissal
      this.dismissPrompt(null, this.$t('alert.dontAskAgainSuccess'));
    },
    dismissPrompt(remindAfterDays, successMessage) {
      this.request({
        method: 'POST',
        url: apiPaths.totpDismissEnrollment(this.userId),
        data: { remindAfterDays }
      })
        .then(() => {
          this.$emit('hide');
          this.alert.success(successMessage);
        })
        .catch(noop);
    },
    handleHide() {
      // User closed modal without making a choice - treat as "remind later"
      this.remindLater();
    }
  }
};
</script>

<style lang="scss" scoped>
#vg-totp-enrollment-prompt {
  .modal-introduction {
    p {
      margin-bottom: 15px;
    }

    .benefits-list {
      margin: 15px 0 20px 20px;
      padding: 0;
      list-style: disc;

      li {
        margin-bottom: 10px;
        line-height: 1.5;
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;

    button {
      margin: 0;
    }

    .btn-link {
      margin-left: auto;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Secure Your Account with 2FA",
    "intro": "Two-factor authentication (2FA) adds an extra layer of security to your account. We recommend enabling it to protect your data.",
    "benefits": {
      "protection": "Protects against password theft and unauthorized access",
      "prevention": "Prevents account takeover even if your password is compromised",
      "compliance": "Meets security compliance requirements for sensitive data"
    },
    "action": {
      "setupNow": "Set Up Now",
      "remindLater": "Remind Me in 7 Days",
      "dontAskAgain": "Don't Ask Again"
    },
    "alert": {
      "remindLaterSuccess": "You will be reminded about 2FA setup in 7 days.",
      "dontAskAgainSuccess": "You won't be asked about 2FA setup again."
    }
  }
}
</i18n>
