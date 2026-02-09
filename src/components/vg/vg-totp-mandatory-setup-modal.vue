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
  <modal id="vg-totp-mandatory-setup" :state="state" :hideable="false" backdrop>
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-warnings">
        <p><strong>{{ $t('warning.title') }}</strong></p>
        <p>{{ $t('warning.message') }}</p>
      </div>

      <div class="modal-introduction">
        <p>{{ $t('intro') }}</p>
        <ul class="setup-steps">
          <li>{{ $t('steps.scan') }}</li>
          <li>{{ $t('steps.verify') }}</li>
          <li>{{ $t('steps.backup') }}</li>
        </ul>
        <p class="help-text">{{ $t('helpText') }}</p>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary btn-lg" @click="beginSetup">
          {{ $t('action.setupNow') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';

export default {
  name: 'VgTotpMandatorySetupModal',
  components: { Modal },
  props: {
    state: Boolean,
    userId: {
      type: [String, Number],
      required: true
    }
  },
  emits: ['setup'],
  methods: {
    beginSetup() {
      // Emit event to parent to start mandatory enrollment flow
      this.$emit('setup');
    }
  }
};
</script>

<style lang="scss" scoped>
#vg-totp-mandatory-setup {
  .modal-warnings {
    strong {
      font-size: 16px;
    }
  }

  .modal-introduction {
    margin-top: 15px;

    .setup-steps {
      margin: 15px 0 20px 20px;
      padding: 0;
      list-style: decimal;

      li {
        margin-bottom: 10px;
        line-height: 1.5;
      }
    }

    .help-text {
      margin-top: 20px;
      padding: 12px;
      background-color: #f0f7ff;
      border-left: 4px solid #3498db;
      font-weight: 500;
      color: #2c3e50;
    }
  }

  .modal-actions {
    text-align: center;

    .btn-lg {
      padding: 12px 30px;
      font-size: 16px;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Two-Factor Authentication Required",
    "warning": {
      "title": "Your account requires 2FA",
      "message": "As a user with elevated privileges, you must enable two-factor authentication before you can access the system."
    },
    "intro": "This security requirement helps protect sensitive data and administrative functions. The setup process will take about 2 minutes:",
    "steps": {
      "scan": "Scan a QR code with your authenticator app",
      "verify": "Enter a verification code to confirm setup",
      "backup": "Save backup codes in a secure location"
    },
    "helpText": "You must complete this setup to continue using the system.",
    "action": {
      "setupNow": "Set Up 2FA Now"
    }
  }
}
</i18n>
