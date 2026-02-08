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
  <div id="user-edit-vg-totp-settings" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('title') }}</h1>
    </div>
    <div class="panel-body">
      <loading :state="!dataExists"/>
      <div v-if="dataExists">
        <p>{{ $t('intro') }}</p>
        <div class="vg-totp-status">
          <p v-if="totpEnabled" class="text-success">
            <span class="glyphicon glyphicon-ok"></span>
            {{ $t('status.enabled') }}
            <span v-if="lastEnabled" class="text-muted">
              ({{ $t('status.enabledSince', { date: formatDate(lastEnabled) }) }})
            </span>
          </p>
          <p v-else class="text-danger">
            <span class="glyphicon glyphicon-remove"></span>
            {{ $t('status.disabled') }}
          </p>
        </div>
        <div class="vg-totp-actions">
          <button v-if="!totpEnabled" type="button" class="btn btn-primary"
            :aria-disabled="awaitingResponse" @click="showSetupModal = true">
            {{ $t('action.enable') }} <spinner :state="awaitingResponse"/>
          </button>
          <template v-else>
            <button type="button" class="btn btn-default"
              :aria-disabled="awaitingResponse" @click="showRegenerateModal = true">
              {{ $t('action.regenerateBackup') }}
            </button>
            <button type="button" class="btn btn-danger"
              :aria-disabled="awaitingResponse" @click="showDisableModal = true">
              {{ $t('action.disable') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Disable modal -->
    <modal id="vg-totp-disable" :state="showDisableModal" :hideable="!awaitingResponse"
      backdrop @hide="showDisableModal = false">
      <template #title>{{ $t('disable.title') }}</template>
      <template #body>
        <div class="modal-introduction">
          <p>{{ $t('disable.warning') }}</p>
        </div>
        <div class="modal-actions">
          <form-group id="vg-totp-disable-password" v-model="confirmPassword"
            type="password" :placeholder="$t('field.password')" required/>
          <div style="margin-top: 15px;">
            <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
              @click="showDisableModal = false">
              {{ $t('action.cancel') }}
            </button>
            <button type="button" class="btn btn-danger"
              :aria-disabled="awaitingResponse" @click="disableTotp">
              {{ $t('action.disable') }} <spinner :state="awaitingResponse"/>
            </button>
          </div>
        </div>
      </template>
    </modal>

    <!-- Regenerate backup codes modal -->
    <modal id="vg-totp-regenerate" :state="showRegenerateModal"
      :hideable="!awaitingResponse" backdrop @hide="showRegenerateModal = false">
      <template #title>{{ $t('regenerate.title') }}</template>
      <template #body>
        <div class="modal-introduction">
          <p v-if="!showBackupCodes">{{ $t('regenerate.warning') }}</p>
        </div>
        <div v-if="!showBackupCodes">
          <form-group id="vg-totp-regenerate-password" v-model="regeneratePassword"
            type="password" :placeholder="$t('field.password')" required/>
          <div style="margin-top: 15px;">
            <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
              @click="showRegenerateModal = false">
              {{ $t('action.cancel') }}
            </button>
            <button type="button" class="btn btn-primary"
              :aria-disabled="awaitingResponse" @click="regenerateBackupCodes">
              {{ $t('action.regenerateBackup') }} <spinner :state="awaitingResponse"/>
            </button>
          </div>
        </div>
        <div v-else class="modal-actions">
          <div class="vg-backup-codes">
            <p><strong>{{ $t('regenerate.saveCodes') }}</strong></p>
            <table class="backup-codes-table">
              <tbody>
                <tr v-for="idx in 5" :key="idx">
                  <td class="backup-code">{{ newBackupCodes[idx - 1] }}</td>
                  <td class="backup-code">{{ newBackupCodes[idx + 4] }}</td>
                </tr>
              </tbody>
            </table>
            <p class="text-muted text-small">
              {{ $t('regenerate.codesWarning') }}
            </p>
          </div>
          <button type="button" class="btn btn-primary" @click="closeRegenerateModal">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </modal>

    <!-- Setup modal -->
    <vg-totp-setup-modal :state="showSetupModal" :user-id="user.id"
      @hide="showSetupModal = false" @success="onSetupSuccess"/>
  </div>
</template>

<script>
import FormGroup from '../../form-group.vue';
import Loading from '../../loading.vue';
import Modal from '../../modal.vue';
import Spinner from '../../spinner.vue';
import VgTotpSetupModal from '../../vg/vg-totp-setup-modal.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { useRequestData } from '../../../request-data';

export default {
  name: 'UserEditVgTotpSettings',
  components: { FormGroup, Loading, Modal, Spinner, VgTotpSetupModal },
  inject: ['alert'],
  setup() {
    const { user } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    return { user, request, awaitingResponse };
  },
  data() {
    return {
      dataExists: false,
      totpEnabled: false,
      lastEnabled: null,
      showSetupModal: false,
      showDisableModal: false,
      showRegenerateModal: false,
      showBackupCodes: false,
      confirmPassword: '',
      regeneratePassword: '',
      newBackupCodes: []
    };
  },
  watch: {
    'user.id': {
      handler() {
        if (this.user.dataExists) this.fetchStatus();
      }
    }
  },
  created() {
    if (this.user.dataExists) this.fetchStatus();
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString(this.$i18n.locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    fetchStatus() {
      this.request({
        method: 'GET',
        url: apiPaths.totpStatus(this.user.id)
      })
        .then(({ data }) => {
          this.totpEnabled = data.enabled || false;
          this.lastEnabled = data.enabledAt || null;
          this.dataExists = true;
        })
        .catch(noop);
    },
    disableTotp() {
      this.request({
        method: 'POST',
        url: apiPaths.totpDisable(this.user.id),
        data: { password: this.confirmPassword },
        problemToAlert: ({ code }) => {
          if (code === 401.2) return this.$t('alert.incorrectPassword');
          return null;
        }
      })
        .then(() => {
          this.alert.success(this.$t('alert.disableSuccess'));
          this.showDisableModal = false;
          this.confirmPassword = '';
          this.fetchStatus();
        })
        .catch(noop);
    },
    regenerateBackupCodes() {
      this.request({
        method: 'POST',
        url: apiPaths.totpBackupCodes(this.user.id),
        data: { password: this.regeneratePassword }
      })
        .then(({ data }) => {
          this.newBackupCodes = data.backupCodes || [];
          this.showBackupCodes = true;
          this.regeneratePassword = '';
        })
        .catch(noop);
    },
    closeRegenerateModal() {
      this.showRegenerateModal = false;
      this.showBackupCodes = false;
      this.regeneratePassword = '';
      this.newBackupCodes = [];
      this.alert.success(this.$t('alert.regenerateSuccess'));
      this.fetchStatus();
    },
    onSetupSuccess() {
      this.fetchStatus();
    }
  }
};
</script>

<style lang="scss" scoped>
#user-edit-vg-totp-settings {
  .vg-totp-status {
    margin: 15px 0;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 3px;

    p {
      margin: 0;
    }

    .glyphicon {
      margin-right: 5px;
    }
  }

  .vg-totp-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;

    button {
      margin: 0;
    }
  }

  .vg-backup-codes {
    margin: 15px 0;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 3px;

    .backup-codes-table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 15px 0 !important;

      tr {
        &:not(:last-child) td {
          padding-bottom: 6px;
        }
      }

      td {
        &:first-child {
          padding-right: 6px;
        }

        &.backup-code {
          padding: 12px !important;
          background-color: #fff !important;
          border: 1px solid #ddd !important;
          border-radius: 3px !important;
          font-family: 'Monaco', 'Courier New', monospace !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
          word-break: break-all !important;
          text-align: center !important;
          letter-spacing: 2px !important;
          width: 50% !important;
          box-sizing: border-box !important;
          user-select: all !important;
        }
      }
    }
  }

  .text-small {
    font-size: 12px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Two-Factor Authentication (2FA)",
    "intro": "Add an extra layer of security to your account by requiring a code from your authenticator app in addition to your password.",
    "status": {
      "enabled": "Two-factor authentication is enabled",
      "disabled": "Two-factor authentication is not enabled",
      "enabledSince": "Enabled on {date}"
    },
    "action": {
      "enable": "Enable 2FA",
      "disable": "Disable 2FA",
      "regenerateBackup": "Regenerate Backup Codes",
      "cancel": "Cancel",
      "done": "Done"
    },
    "disable": {
      "title": "Disable Two-Factor Authentication",
      "warning": "This will make your account less secure. Enter your password to confirm."
    },
    "regenerate": {
      "title": "Regenerate Backup Codes",
      "warning": "Your old backup codes will no longer work. Save the new codes in a secure location.",
      "saveCodes": "Save these backup codes in a secure location:",
      "codesWarning": "These codes are the only way to access your account if you lose access to your authenticator app. If you lose these codes, you will not be able to use backup codes to log in."
    },
    "field": {
      "password": "Your Password"
    },
    "alert": {
      "incorrectPassword": "Incorrect password. Please try again.",
      "disableSuccess": "Two-factor authentication has been disabled.",
      "regenerateSuccess": "New backup codes generated successfully."
    }
  }
}
</i18n>
