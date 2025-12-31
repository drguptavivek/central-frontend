<template>
  <div id="vg-project-app-user-settings">
    <div class="page-body-heading">
      <p>{{ $t('vgAppUserSettings.heading') }}</p>
    </div>
    <loading :state="initiallyLoading"/>
    <form v-if="dataExists" @submit.prevent="submit">
      <form-group v-model.number="ttl" type="number" min="1" required
        :placeholder="$t('vgAppUserSettings.ttl')" autocomplete="off"/>
      <form-group v-model.number="cap" type="number" min="1" required
        :placeholder="$t('vgAppUserSettings.cap')" autocomplete="off"/>
      <form-group v-model="adminPw" required
        :placeholder="$t('vgAppUserSettings.adminPw')" autocomplete="off"/>
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
  name: 'VgProjectAppUserSettings',
  components: { FormGroup, Loading, Spinner },
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { projectAppUserSettings } = useRequestData();
    const { awaitingResponse, initiallyLoading, dataExists } = projectAppUserSettings.toRefs();
    return { projectAppUserSettings, awaitingResponse, initiallyLoading, dataExists };
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
          this.projectAppUserSettings.data.ifDefined(data => {
            this.ttl = data.vg_app_user_session_ttl_days ?? 3;
            this.cap = data.vg_app_user_session_cap ?? 3;
            this.adminPw = data.admin_pw ?? 'vg_custom';
          });
        }
      },
      immediate: true
    }
  },
  methods: {
    fetchData() {
      this.projectAppUserSettings.request({
        url: `/v1/projects/${this.projectId}/app-users/settings`
      });
    },
    submit() {
      if (this.ttl < 1 || this.cap < 1) {
        this.alert.danger(this.$t('vgAppUserSettings.alert.invalidValues'));
        return;
      }
      this.projectAppUserSettings.request({
        method: 'PUT',
        url: `/v1/projects/${this.projectId}/app-users/settings`,
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
#vg-project-app-user-settings {
  .form-group {
    max-width: 400px;
    margin-bottom: 20px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "vgAppUserSettings": {
      "heading": "Configure Project App User Settings",
      "ttl": "Session TTL (Days)",
      "cap": "Max Sessions per User",
      "adminPw": "Admin Password (for ODK Collect settings)",
      "alert": {
        "invalidValues": "TTL and max sessions must be at least 1."
      }
    }
  }
}
</i18n>
