<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="field-key-reset-password" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="hideOrComplete">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <p class="modal-introduction">{{ $t('introduction') }}</p>
        <form @submit.prevent="submit">
          <div class="modal-actions">
            <button type="button" class="btn btn-link"
              :aria-disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary"
              :aria-disabled="awaitingResponse">
              {{ $t('action.reset') }} <spinner :state="awaitingResponse"/>
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="modal-introduction">
          <div id="field-key-reset-password-success">
            <span class="icon-check-circle"></span>
            <p>
              <strong>{{ $t('common.success') }}</strong>
              <sentence-separator/>
              <span>{{ $t('success[0]', fieldKey) }}</span>
            </p>
          </div>
          <vg-field-key-qr-panel :field-key="fieldKey" :managed="managed" :show-close="false"
            :username="fieldKey.username" :password="password"/>
          <p>{{ $t('success[1]', fieldKey) }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';
import Modal from '../modal.vue';
import VgFieldKeyQrPanel from './vg-qr-panel.vue';
import SentenceSeparator from '../sentence-separator.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { generatePassword } from '../../util/password-generator';

export default {
  name: 'VgFieldKeyResetPassword',
  components: { FormGroup, Spinner, Modal, VgFieldKeyQrPanel, SentenceSeparator },
  props: {
    state: {
      type: Boolean,
      default: false
    },
    fieldKey: Object,
    managed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  data() {
    return {
      step: 0,
      password: ''
    };
  },
  watch: {
    state(state) {
      if (!state) {
        this.step = 0;
        this.password = '';
      }
    }
  },
  methods: {
    submit() {
      const password = generatePassword();
      this.password = password;

      this.request({
        method: 'POST',
        url: apiPaths.fieldKeyResetPassword(this.fieldKey.projectId, this.fieldKey.id),
        data: { newPassword: password },
        problemToAlert: ({ code }) => {
          if (code === 400.20) return this.$t('alert.passwordWeak');
          return null;
        }
      })
        .then(() => {
          this.step = 1;
        })
        .catch(noop);
    },
    complete() {
      this.$emit('success', this.fieldKey);
    },
    hideOrComplete() {
      if (this.step === 0)
        this.$emit('hide');
      else
        this.complete();
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-reset-password-success {
  display: flex;
  align-items: center;

  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 10px;
  }

  > p {
    width: 80%;
    margin-bottom: 0px;
  }

  + .field-key-qr-panel {
    margin: 15px auto 30px;
    box-shadow: $box-shadow-popover;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Reset Password",
    "introduction": "Are you sure you want to reset the password for this App User? A new password will be generated.",
    "field": {
      "password": "New Password"
    },
    "success": [
      "Password for “{displayName}” has been reset.",
      "You can configure a mobile device for “{displayName}” right now."
    ],
    "action": {
      "reset": "Reset Password",
      "generate": "Generate"
    },
    "alert": {
      "passwordWeak": "Password must contain uppercase, lowercase, number, and symbol"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Obnovit heslo",
    "introduction": "Zadejte nové heslo pro tohoto uživatele aplikace.",
    "field": {
      "password": "Nové heslo"
    },
    "success": [
      "Heslo pro “{displayName}” bylo obnoveno.",
      "Mobilní zařízení pro “{displayName}“ můžete nakonfigurovat právě teď."
    ],
    "action": {
      "reset": "Obnovit heslo"
    }
  },
  "de": {
    "title": "Passwort zurücksetzen",
    "introduction": "Geben Sie ein neues Passwort für diesen App-Benutzer ein.",
    "field": {
      "password": "Neues Passwort"
    },
    "success": [
      "Das Passwort für \"{displayName}\" wurde zurückgesetzt.",
      "Sie können jetzt ein mobiles Gerät für \"{displayName}\" konfigurieren."
    ],
    "action": {
      "reset": "Passwort zurücksetzen"
    }
  },
  "es": {
    "title": "Restablecer contraseña",
    "introduction": "Ingrese una nueva contraseña para este usuario móvil.",
    "field": {
      "password": "Nueva contraseña"
    },
    "success": [
      "La contraseña para \"{displayName}\" ha sido restablecida.",
      "Puede configurar un dispositivo móvil para \"{displayName}\" ahora mismo."
    ],
    "action": {
      "reset": "Restablecer contraseña"
    }
  },
  "fr": {
    "title": "Réinitialiser le mot de passe",
    "introduction": "Entrez un nouveau mot de passe pour cet utilisateur mobile.",
    "field": {
      "password": "Nouveau mot de passe"
    },
    "success": [
      "Le mot de passe pour “{displayName}” a été réinitialisé.",
      "Vous pouvez configurer un appareil mobile pour “{displayName}” dés maintenant."
    ],
    "action": {
      "reset": "Réinitialiser le mot de passe"
    }
  },
  "id": {
    "title": "Atur Ulang Kata Sandi",
    "introduction": "Masukkan kata sandi baru untuk Pengguna Aplikasi ini.",
    "field": {
      "password": "Kata Sandi Baru"
    },
    "success": [
      "Kata sandi untuk \"{displayName}\" telah diatur ulang.",
      "Kamu bisa mengkonfigurasi peranti seluler untuk “{displayName}” saat ini juga."
    ],
    "action": {
      "reset": "Atur Ulang Kata Sandi"
    }
  },
  "it": {
    "title": "Reimposta password",
    "introduction": "Inserisci una nuova password per questo Utente App.",
    "field": {
      "password": "Nuova password"
    },
    "success": [
      "La password per \"{displayName}\" è stata reimpostata.",
      "Puoi configurare un dispositivo mobile per \"{displayName}\" in questo momento."
    ],
    "action": {
      "reset": "Reimposta password"
    }
  },
  "ja": {
    "title": "パスワードのリセット",
    "introduction": "このアプリユーザーの新しいパスワードを入力してください。",
    "field": {
      "password": "新しいパスワード"
    },
    "success": [
      "\"{displayName}\"のパスワードがリセットされました。",
      "「{displayName}」に対するモバイル端末を今すぐ設定できます。"
    ],
    "action": {
      "reset": "パスワードをリセット"
    }
  },
  "pt": {
    "title": "Redefinir senha",
    "introduction": "Digite uma nova senha para este usuário de aplicativo.",
    "field": {
      "password": "Nova senha"
    },
    "success": [
      "A senha para \"{displayName}\" foi redefinida.",
      "Você pode configurar um dispositivo móvel para \"{displayName}\" agora."
    ],
    "action": {
      "reset": "Redefinir senha"
    }
  },
  "sw": {
    "title": "Weka Upya Nenosiri",
    "introduction": "Weka nenosiri jipya kwa Mtumiaji huyu wa Programu.",
    "field": {
      "password": "Nenosiri Mpya"
    },
    "success": [
      "Nenosiri la \"{displayName}\" limewekwa upya.",
      "Unaweza kusanidi kifaa cha mkononi kwa ajili ya \"{displayName}\" sasa hivi."
    ],
    "action": {
      "reset": "Weka Upya Nenosiri"
    }
  },
  "zh": {
    "title": "重置密码",
    "introduction": "为此App用户输入新密码。",
    "field": {
      "password": "新密码"
    },
    "success": [
      "“{displayName}”的密码已重置。",
      "您可以立即为“{displayName}”配置移动设备。"
    ],
    "action": {
      "reset": "重置密码"
    }
  },
  "zh-Hant": {
    "title": "重設密碼",
    "introduction": "為此 APP 使用者輸入新密碼。",
    "field": {
      "password": "新密碼"
    },
    "success": [
      "「{displayName}」的密碼已重設。",
      "您可以立即為「{displayName}」設定行動裝置。"
    ],
    "action": {
      "reset": "重設密碼"
    }
  }
}
</i18n>
