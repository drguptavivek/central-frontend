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
  <div id="vg-totp-settings">
    <div class="page-body-heading">
      <h1 class="page-body-title">{{ $t('title') }}</h1>
      <p>{{ $t('intro') }}</p>
    </div>

    <loading :state="loading"/>

    <div v-if="!loading" class="panel panel-simple">
      <div class="panel-body">
        <p class="help-text">{{ $t('helpText') }}</p>

        <div v-if="roles.length > 0" class="roles-list">
          <div v-for="role in roles" :key="role.system" class="role-item">
            <div class="checkbox">
              <label>
                <input v-model="selectedRoles" type="checkbox" :value="role.system">
                <strong>{{ role.name || role.system }}</strong>
              </label>
            </div>
            <p class="role-description">{{ getRoleDescription(role.system) }}</p>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>{{ $t('alert.noRoles') }}</p>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-primary"
            :aria-disabled="awaitingResponse" @click="save">
            {{ $t('action.save') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'VgTotpSettings',
  components: { Loading, Spinner },
  inject: ['alert'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  data() {
    return {
      loading: true,
      roles: [],
      selectedRoles: []
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        // Fetch all roles and current mandatory roles in parallel
        const [rolesResponse, mandatoryResponse] = await Promise.all([
          this.request({ url: apiPaths.roles() }),
          this.request({ url: apiPaths.totpMandatoryRoles() })
        ]);

        this.roles = rolesResponse.data;
        this.selectedRoles = mandatoryResponse.data.mandatoryRoles || ['admin'];
      } catch (error) {
        this.alert.danger(this.$t('alert.loadError'));
      } finally {
        this.loading = false;
      }
    },
    save() {
      if (this.selectedRoles.length === 0) {
        this.alert.info(this.$t('alert.noRolesSelected'));
        return;
      }

      this.request({
        method: 'PUT',
        url: apiPaths.totpMandatoryRoles(),
        data: { mandatoryRoles: this.selectedRoles }
      })
        .then(() => {
          this.alert.success(this.$t('alert.success'));
        })
        .catch(noop);
    },
    getRoleDescription(roleSystem) {
      const descriptions = {
        admin: this.$t('roles.admin'),
        manager: this.$t('roles.manager'),
        viewer: this.$t('roles.viewer'),
        formfill: this.$t('roles.formfill')
      };
      return descriptions[roleSystem] || this.$t('roles.default', { role: roleSystem });
    }
  }
};
</script>

<style lang="scss" scoped>
#vg-totp-settings {
  .page-body-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .help-text {
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .roles-list {
    margin: 20px 0;

    .role-item {
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
      }

      .checkbox {
        margin: 0 0 8px 0;

        label {
          font-size: 15px;
          font-weight: normal;
          margin: 0;

          input {
            margin-right: 10px;
          }

          strong {
            font-weight: 600;
          }
        }
      }

      .role-description {
        margin: 0 0 0 30px;
        color: #666;
        font-size: 13px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
  }

  .form-actions {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Two-Factor Authentication Settings",
    "intro": "Configure which roles require mandatory 2FA enrollment. Users with these roles must enable 2FA before they can access the system.",
    "helpText": "Select the roles that should require mandatory two-factor authentication:",
    "roles": {
      "admin": "Full system access including user management and system settings",
      "manager": "Can create and manage projects, forms, and submissions",
      "viewer": "Read-only access to projects and data",
      "formfill": "Can submit data but cannot manage projects",
      "default": "System role: {role}"
    },
    "action": {
      "save": "Save Settings"
    },
    "alert": {
      "success": "TOTP mandatory roles have been updated successfully.",
      "loadError": "Failed to load roles. Please try again.",
      "noRoles": "No roles available.",
      "noRolesSelected": "Please select at least one role to require 2FA."
    }
  }
}
</i18n>
