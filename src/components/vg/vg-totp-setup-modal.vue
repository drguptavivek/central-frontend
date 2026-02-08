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
  <modal id="vg-totp-setup" :state="state" :hideable="false" backdrop>
    <template #title>{{ stepTitle }}</template>
    <template #body>
      <div class="modal-introduction">
        <!-- Step 1: QR Code -->
        <div v-if="step === 1">
          <p>{{ $t('step1.intro') }}</p>
          <div v-if="qrCodeDataUrl" class="vg-totp-qr-container">
            <img :src="qrCodeDataUrl" :alt="$t('step1.qrAlt')" class="vg-totp-qr">
          </div>
          <div v-if="secret" class="vg-totp-secret">
            <p><strong>{{ $t('step1.manualEntry') }}</strong></p>
            <div class="secret-key">{{ secret }}</div>
            <p class="text-muted text-small">{{ $t('step1.secretNote') }}</p>
          </div>
          <p class="text-muted">{{ $t('step1.instructions') }}</p>
        </div>

        <!-- Step 2: Verification -->
        <div v-else-if="step === 2">
          <p>{{ $t('step2.intro') }}</p>
          <form-group v-model="verificationCode" type="text" inputmode="numeric"
            :placeholder="$t('field.totp')" maxlength="6" pattern="[0-9]{6}" required
            @keyup.enter="nextStep"/>
          <p v-if="verificationError" class="text-danger">
            {{ verificationError }}
          </p>
        </div>

        <!-- Step 3: Backup Codes -->
        <div v-else-if="step === 3">
          <p>{{ $t('step3.intro') }}</p>
          <p class="text-danger"><strong>{{ $t('step3.warning') }}</strong></p>
          <div class="vg-backup-codes">
            <p>{{ $t('step3.saveCodes') }}</p>
            <table class="backup-codes-table">
              <tbody>
                <tr v-for="idx in 5" :key="idx">
                  <td class="backup-code">{{ backupCodes[idx - 1] }}</td>
                  <td class="backup-code">{{ backupCodes[idx + 4] }}</td>
                </tr>
              </tbody>
            </table>
            <div class="backup-actions">
              <button type="button" class="btn btn-default btn-sm"
                @click="downloadBackupCodes">
                <span class="glyphicon glyphicon-download"></span>
                {{ $t('step3.download') }}
              </button>
              <button type="button" class="btn btn-default btn-sm"
                @click="copyBackupCodes">
                <span class="glyphicon glyphicon-copy"></span>
                {{ $t('step3.copy') }}
              </button>
            </div>
            <p v-if="copySuccess" class="text-success text-small">
              {{ $t('step3.copySuccess') }}
            </p>
          </div>
        </div>

        <!-- Step 4: Confirmation -->
        <div v-else-if="step === 4">
          <p>{{ $t('step4.intro') }}</p>
          <div class="vg-totp-confirm">
            <div class="checkbox">
              <label>
                <input v-model="codesConfirmed" type="checkbox">
                {{ $t('step4.confirmCheckbox') }}
              </label>
            </div>
            <p class="text-muted text-small">{{ $t('step4.note') }}</p>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button v-if="step > 1" type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="previousStep">
          {{ $t('action.back') }}
        </button>
        <button type="button" class="btn btn-primary" :aria-disabled="isNextDisabled"
          @click="nextStep">
          {{ stepButtonText }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import qrcode from 'qrcode-generator';
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'VgTotpSetupModal',
  components: { FormGroup, Modal, Spinner },
  inject: ['alert'],
  props: {
    state: Boolean,
    userId: {
      type: [String, Number],
      required: true
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  data() {
    return {
      step: 1,
      qrCodeDataUrl: null,
      secret: null,
      verificationCode: '',
      verificationError: '',
      backupCodes: [],
      codesConfirmed: false,
      copySuccess: false,
      sessionSecret: null
    };
  },
  computed: {
    stepTitle() {
      const titles = {
        1: this.$t('step1.title'),
        2: this.$t('step2.title'),
        3: this.$t('step3.title'),
        4: this.$t('step4.title')
      };
      return titles[this.step] || '';
    },
    stepButtonText() {
      if (this.step === 4) return this.$t('action.enable');
      if (this.step === 3) return this.$t('action.next');
      return this.$t('action.next');
    },
    isNextDisabled() {
      if (this.awaitingResponse) return true;
      if (this.step === 2) return this.verificationCode.length !== 6;
      if (this.step === 4) return !this.codesConfirmed;
      return false;
    }
  },
  watch: {
    state(newVal) {
      if (newVal && this.step === 1 && !this.qrCodeDataUrl) {
        this.fetchSetup();
      }
    }
  },
  methods: {
    fetchSetup() {
      this.request({
        method: 'POST',
        url: apiPaths.totpSetup(this.userId)
      })
        .then(({ data }) => {
          this.secret = data.secret;
          this.sessionSecret = data.secret;
          this.backupCodes = data.backupCodes || [];
          this.generateQrCode(data.qrCode || data.secret);
        })
        .catch(noop);
    },
    generateQrCode(data) {
      // If data looks like a URL or contains special characters, use it as-is
      // Otherwise, generate a TOTP provisioning URI and create QR code
      if (data.startsWith('data:') || data.startsWith('http')) {
        this.qrCodeDataUrl = data;
      } else {
        // Generate TOTP provisioning URI (standard format)
        // otpauth://totp/label?secret=SECRET&issuer=ISSUER
        const uri = `otpauth://totp/${encodeURIComponent('ODK Central')}?secret=${encodeURIComponent(data)}&issuer=${encodeURIComponent('ODK Central')}`;

        try {
          const qr = qrcode(0, 'M');
          qr.addData(uri);
          qr.make();
          this.qrCodeDataUrl = qr.createDataURL(6);
        } catch {
          // Fallback: show just the secret
          this.qrCodeDataUrl = null;
        }
      }
    },
    nextStep() {
      if (this.step === 1) {
        this.step = 2;
      } else if (this.step === 2) {
        this.verifyCode();
      } else if (this.step === 3) {
        this.step = 4;
      } else if (this.step === 4) {
        this.completeSetup();
      }
    },
    previousStep() {
      if (this.step > 1) {
        this.step -= 1;
        this.verificationError = '';
        this.copySuccess = false;
      }
    },
    verifyCode() {
      this.verificationError = '';
      this.request({
        method: 'POST',
        url: apiPaths.totpEnable(this.userId),
        data: { token: this.verificationCode }
      })
        .then(() => {
          this.step = 3;
        })
        .catch(({ problem }) => {
          if (problem.code === 401.7) {
            this.verificationError = this.$t('alert.invalidCode');
          } else {
            this.verificationError = this.$t('alert.verificationFailed');
          }
        });
    },
    completeSetup() {
      this.$emit('success');
      this.$emit('hide');
      this.alert.success(this.$t('alert.setupSuccess'));
      this.reset();
    },
    downloadBackupCodes() {
      const text = this.backupCodes.join('\n');
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
      element.setAttribute('download', 'odk-central-backup-codes.txt');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    copyBackupCodes() {
      const text = this.backupCodes.join('\n');
      navigator.clipboard.writeText(text)
        .then(() => {
          this.copySuccess = true;
          setTimeout(() => {
            this.copySuccess = false;
          }, 3000);
        })
        .catch(() => {
          this.alert.danger(this.$t('alert.copyFailed'));
        });
    },
    reset() {
      this.step = 1;
      this.qrCodeDataUrl = null;
      this.secret = null;
      this.verificationCode = '';
      this.verificationError = '';
      this.backupCodes = [];
      this.codesConfirmed = false;
      this.copySuccess = false;
      this.sessionSecret = null;
    }
  }
};
</script>

<style lang="scss" scoped>
#vg-totp-setup {
  .vg-totp-qr-container {
    text-align: center;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 3px;
    margin: 20px 0;

    .vg-totp-qr {
      max-width: 300px;
      height: auto;
      border: 1px solid #ddd;
      padding: 5px;
    }
  }

  .vg-totp-secret {
    margin: 20px 0;
    padding: 15px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 3px;

    .secret-key {
      font-family: monospace;
      font-size: 14px;
      letter-spacing: 2px;
      word-break: break-all;
      padding: 10px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      margin: 10px 0;
    }
  }

  .vg-backup-codes {
    margin: 20px 0;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 3px;

    .backup-codes-table {
      width: 70% !important;
      border-collapse: collapse !important;
      margin: 15px 0 !important;
      border: 2px solid #333 !important;

      tr {
        &:not(:last-child) {
          border-bottom: 1px solid #ddd !important;
        }
      }

      td {
        &:not(:last-child) {
          border-right: 1px solid #ddd !important;
        }

        &.backup-code {
          padding: 12px 20px !important;
          background-color: #fff !important;
          font-family: 'Monaco', 'Courier New', monospace !important;
          font-size: 13px !important;
          line-height: 1.5 !important;
          word-break: break-all !important;
          text-align: center !important;
          letter-spacing: 2px !important;
          width: 50% !important;
          min-width: 200px !important;
          box-sizing: border-box !important;
          user-select: all !important;
        }
      }
    }

    .backup-actions {
      display: flex;
      gap: 10px;
      margin: 15px 0;

      button {
        margin: 0;

        .glyphicon {
          margin-right: 5px;
        }
      }
    }
  }

  .vg-totp-confirm {
    margin: 20px 0;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 3px;

    .checkbox {
      margin-bottom: 10px;

      label {
        margin: 0;
        font-weight: normal;

        input {
          margin-right: 8px;
        }
      }
    }
  }

  .text-small {
    font-size: 12px;
  }

  .text-muted {
    color: #999;
  }

  .text-danger {
    color: #d9534f;
  }

  .text-success {
    color: #5cb85c;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "step1": {
      "title": "Scan QR Code",
      "intro": "Use an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.) to scan the QR code below.",
      "qrAlt": "QR code for TOTP setup",
      "manualEntry": "Can't scan?",
      "secretNote": "If you can't scan the QR code, you can enter this key manually in your authenticator app.",
      "instructions": "After scanning, your authenticator app will generate a 6-digit code that changes every 30 seconds."
    },
    "step2": {
      "title": "Verify Code",
      "intro": "Enter the 6-digit code from your authenticator app to verify it's working correctly."
    },
    "step3": {
      "title": "Save Backup Codes",
      "intro": "Save these backup codes in a secure location. Each code can be used once if you lose access to your authenticator app.",
      "warning": "Important: Save these codes before proceeding. You won't be able to see them again.",
      "saveCodes": "Your backup codes:",
      "download": "Download Codes",
      "copy": "Copy to Clipboard",
      "copySuccess": "Codes copied to clipboard!"
    },
    "step4": {
      "title": "Confirm Setup",
      "intro": "Two-factor authentication will be enabled on your account.",
      "confirmCheckbox": "I have saved my backup codes in a secure location",
      "note": "Make sure you have saved your backup codes before enabling 2FA."
    },
    "field": {
      "totp": "6-digit code"
    },
    "action": {
      "next": "Next",
      "back": "Back",
      "enable": "Enable 2FA"
    },
    "alert": {
      "invalidCode": "Invalid code. Please check your authenticator app and try again.",
      "verificationFailed": "Verification failed. Please try again.",
      "setupSuccess": "Two-factor authentication has been enabled successfully!",
      "copyFailed": "Failed to copy codes. Please try again."
    }
  }
}
</i18n>
