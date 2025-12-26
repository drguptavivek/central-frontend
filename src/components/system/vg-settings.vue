<template>
  <div id="vg-settings">
    <div class="page-body-heading">
      <p>{{ $t('vgSettings.heading') }}</p>
    </div>
    <loading :state="initiallyLoading"/>
    <form v-if="dataExists" @submit.prevent="submit">
      <form-group v-model.number="ttl" type="number" min="1" required
        :placeholder="$t('vgSettings.ttl')" autocomplete="off"/>
      <form-group v-model.number="cap" type="number" min="1" required
        :placeholder="$t('vgSettings.cap')" autocomplete="off"/>
      <form-group v-model="adminPw" required
        :placeholder="$t('vgSettings.adminPw')" autocomplete="off"/>
      <button type="submit" class="btn btn-primary" :aria-disabled="awaitingResponse">
        {{ $t('action.saveSettings') }} <spinner :state="awaitingResponse"/>
      </button>
    </form>
  </div>
</template>

<script>
import FormGroup from '../form-group.vue';
import Loading from '../loading.vue';
import Spinner from '../spinner.vue';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

export default {
  name: 'VgSettings',
  components: { FormGroup, Loading, Spinner },
  inject: ['alert'],
  setup() {
    const { systemSettings } = useRequestData();
    const { awaitingResponse, initiallyLoading, dataExists } = systemSettings.toRefs();
    return { systemSettings, awaitingResponse, initiallyLoading, dataExists };
  },
  data() {
    return {
      ttl: 3,
      cap: 3,
      adminPw: 'vg_custom'
    };
  },
  created() {
    this.fetchData();
  },
  watch: {
    dataExists: {
      handler(exists) {
        if (exists) {
          this.systemSettings.data.ifDefined(data => {
            // console.log('Settings data:', data);
            this.ttl = data.vg_app_user_session_ttl_days ?? 3;
            this.cap = data.vg_app_user_session_cap ?? 2;
            this.adminPw = data.admin_pw ?? 'vg_custom';
          });
        }
      },
      immediate: true
    }
  },
  methods: {
    fetchData() {
      this.systemSettings.request({ url: '/v1/system/settings' });
    },
    submit() {
      if (this.ttl < 1 || this.cap < 1) {
        this.alert.danger(this.$t('vgSettings.alert.invalidValues'));
        return;
      }
      this.systemSettings.request({
        method: 'PUT',
        url: '/v1/system/settings',
        data: {
          vg_app_user_session_ttl_days: this.ttl,
          vg_app_user_session_cap: this.cap,
          admin_pw: this.adminPw
        }
      })
      .then(() => {
        this.alert.success(this.$t('alert.success'));
      })
      .catch(noop);
    }
  }
};
</script>

<style lang="scss">
#vg-settings {
  .form-group {
    max-width: 400px;
    margin-bottom: 20px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "vgSettings": {
      "heading": "Configure App User Session Settings",
      "ttl": "Session TTL (Days)",
      "cap": "Max Sessions per User",
      "adminPw": "Admin Password (for ODK Collect settings)"
    }
  }
}
</i18n>
