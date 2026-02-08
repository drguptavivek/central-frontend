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
  <div id="user-edit-vg-ip-whitelist" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('title') }}</h1>
    </div>
    <div class="panel-body">
      <p>{{ $t('intro') }}</p>

      <loading :state="!dataExists"/>
      <div v-if="dataExists">
        <!-- Add new entry form -->
        <div class="vg-whitelist-form">
          <h3>{{ $t('form.addEntry') }}</h3>
          <div class="form-group">
            <label for="ip-cidr-input">{{ $t('field.ipCidr') }} *</label>
            <input id="ip-cidr-input" v-model.trim="newEntry.ipCidr" type="text"
              class="form-control" :placeholder="$t('field.ipCidrPlaceholder')"
              @blur="validateNewEntry">
            <p v-if="newEntry.cidrError" class="text-danger text-small">
              {{ newEntry.cidrError }}
            </p>
            <p v-if="newEntry.cidrWarning" class="text-warning text-small">
              <span class="glyphicon glyphicon-warning-sign"></span>
              {{ newEntry.cidrWarning }}
            </p>
          </div>
          <div class="form-group">
            <label for="description-input">{{ $t('field.description') }}</label>
            <input id="description-input" v-model.trim="newEntry.description" type="text"
              class="form-control" :placeholder="$t('field.descriptionPlaceholder')">
          </div>
          <button type="button" class="btn btn-primary"
            :aria-disabled="!isNewEntryValid || awaitingResponse" @click="addEntry">
            {{ $t('action.add') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>

        <!-- Whitelist entries -->
        <div class="vg-whitelist-entries">
          <h3>{{ $t('entries.title', { count: entries.length }) }}</h3>
          <p v-if="entries.length === 0" class="text-muted">
            {{ $t('entries.empty') }}
          </p>
          <div v-for="entry in entries" :key="entry.id" class="whitelist-entry">
            <div class="entry-header">
              <div class="entry-info">
                <div class="entry-cidr">
                  <code>{{ entry.ip_cidr }}</code>
                  <span v-if="!entry.enabled" class="label label-default">
                    {{ $t('status.disabled') }}
                  </span>
                </div>
                <p v-if="entry.description" class="entry-description">
                  {{ entry.description }}
                </p>
                <p class="entry-meta text-muted text-small">
                  {{ $t('entries.createdBy', { displayName: entry.createdByName, date: formatDate(entry.created_at) }) }}
                </p>
              </div>
              <div class="entry-actions">
                <button v-if="!entry.enabled" type="button" class="btn btn-xs btn-default"
                  :aria-disabled="awaitingResponse" @click="toggleEntry(entry, true)">
                  {{ $t('action.enable') }}
                </button>
                <button v-else type="button" class="btn btn-xs btn-default"
                  :aria-disabled="awaitingResponse" @click="toggleEntry(entry, false)">
                  {{ $t('action.disable') }}
                </button>
                <button type="button" class="btn btn-xs btn-danger"
                  :aria-disabled="awaitingResponse" @click="deleteEntry(entry)">
                  {{ $t('action.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../../loading.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { useRequestData } from '../../../request-data';

export default {
  name: 'UserEditVgIpWhitelist',
  components: { Loading, Spinner },
  inject: ['alert'],
  setup() {
    const { user } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    return { user, request, awaitingResponse };
  },
  data() {
    return {
      dataExists: false,
      entries: [],
      newEntry: {
        ipCidr: '',
        description: '',
        cidrError: '',
        cidrWarning: ''
      }
    };
  },
  computed: {
    isNewEntryValid() {
      return this.newEntry.ipCidr && !this.newEntry.cidrError;
    }
  },
  watch: {
    'user.id': {
      handler() {
        if (this.user.dataExists) this.fetchEntries();
      }
    }
  },
  created() {
    if (this.user.dataExists) this.fetchEntries();
  },
  methods: {
    fetchEntries() {
      this.request({
        method: 'GET',
        url: apiPaths.userIpWhitelist(this.user.id)
      })
        .then(({ data }) => {
          // Fetch creator information for each entry
          this.entries = Array.isArray(data) ? data : [];
          this.dataExists = true;
        })
        .catch(noop);
    },
    validateCidr(cidr) {
      if (!cidr) {
        return { error: this.$t('alert.cidrRequired'), warning: '' };
      }

      // IPv4 and IPv6 CIDR regex patterns
      const ipv4Cidr = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      const ipv6Cidr = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(\/\d{1,3})?$/i;

      if (!ipv4Cidr.test(cidr) && !ipv6Cidr.test(cidr)) {
        return { error: this.$t('alert.invalidCidr'), warning: '' };
      }

      // Check for warning: wide CIDR ranges
      const warning = this.getWideCidrWarning(cidr);

      return { error: '', warning };
    },
    getWideCidrWarning(cidr) {
      // Extract prefix from CIDR
      const parts = cidr.split('/');
      if (parts.length === 2) {
        const prefix = parseInt(parts[1], 10);
        if (prefix === 0) {
          return this.$t('alert.cidrWarning.allIps');
        }
        if (prefix <= 8) {
          return this.$t('alert.cidrWarning.veryWide', { prefix });
        }
        if (prefix <= 16) {
          return this.$t('alert.cidrWarning.wide', { prefix });
        }
      }
      return '';
    },
    validateNewEntry() {
      const { error, warning } = this.validateCidr(this.newEntry.ipCidr);
      this.newEntry.cidrError = error;
      this.newEntry.cidrWarning = warning;
    },
    addEntry() {
      this.validateNewEntry();
      if (!this.isNewEntryValid) return;

      this.request({
        method: 'POST',
        url: apiPaths.userIpWhitelist(this.user.id),
        data: {
          ipCidr: this.newEntry.ipCidr,
          description: this.newEntry.description || null
        }
      })
        .then(() => {
          this.alert.success(this.$t('alert.entryAdded'));
          this.newEntry = { ipCidr: '', description: '', cidrError: '', cidrWarning: '' };
          this.fetchEntries();
        })
        .catch(noop);
    },
    toggleEntry(entry, enabled) {
      this.request({
        method: 'PATCH',
        url: apiPaths.userIpWhitelistEntry(this.user.id, entry.id),
        data: { enabled }
      })
        .then(() => {
          // Update local copy
          const idx = this.entries.findIndex((e) => e.id === entry.id);
          if (idx >= 0) {
            this.entries[idx] = { ...this.entries[idx], enabled };
          }
          const action = enabled ? this.$t('alert.entryEnabled') : this.$t('alert.entryDisabled');
          this.alert.success(action);
        })
        .catch(noop);
    },
    deleteEntry(entry) {
      const message = this.$t('alert.confirmDelete', { cidr: entry.ip_cidr });
      // eslint-disable-next-line no-alert
      if (!window.confirm(message)) {
        return;
      }

      this.request({
        method: 'DELETE',
        url: apiPaths.userIpWhitelistEntry(this.user.id, entry.id)
      })
        .then(() => {
          this.alert.success(this.$t('alert.entryDeleted'));
          this.fetchEntries();
        })
        .catch(noop);
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString(this.$i18n.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style lang="scss" scoped>
#user-edit-vg-ip-whitelist {
  .vg-whitelist-form {
    margin-bottom: 30px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 3px;

    h3 {
      margin-top: 0;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        font-size: 13px;
      }

      .form-control {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 13px;

        &:focus {
          outline: none;
          border-color: #0275d8;
          box-shadow: 0 0 0 3px rgba(2, 117, 216, 0.25);
        }
      }

      .text-small {
        margin-top: 5px;
        margin-bottom: 0;
        font-size: 12px;
      }
    }

    .btn {
      margin-top: 10px;
    }
  }

  .vg-whitelist-entries {
    h3 {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 15px;
    }

    .whitelist-entry {
      margin-bottom: 15px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background-color: #fff;

      .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 15px;
      }

      .entry-info {
        flex: 1;

        .entry-cidr {
          margin-bottom: 8px;

          code {
            padding: 3px 6px;
            background-color: #f5f5f5;
            border-radius: 3px;
            font-family: monospace;
            font-size: 12px;
            margin-right: 8px;
          }

          .label {
            font-size: 11px;
            padding: 3px 6px;
          }
        }

        .entry-description {
          margin: 5px 0;
          font-size: 13px;
        }

        .entry-meta {
          margin: 5px 0 0 0;
        }
      }

      .entry-actions {
        display: flex;
        gap: 5px;
        flex-shrink: 0;

        .btn {
          margin: 0;
          padding: 4px 8px;
          font-size: 12px;
        }
      }
    }
  }

  .text-warning {
    color: #8a6d3b;

    .glyphicon {
      margin-right: 5px;
    }
  }

  .text-danger {
    color: #d9534f;
  }

  .text-muted {
    color: #999;
  }

  .text-small {
    font-size: 12px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "IP Whitelist",
    "intro": "Restrict access to your account to specific IP addresses or networks. When enabled, you can only log in from the IP addresses on this whitelist.",
    "form": {
      "addEntry": "Add IP or CIDR Range"
    },
    "field": {
      "ipCidr": "IP Address or CIDR Range",
      "ipCidrPlaceholder": "e.g., 192.168.1.0/24 or 2001:db8::/32",
      "description": "Description (Optional)",
      "descriptionPlaceholder": "e.g., Office network, Home network"
    },
    "entries": {
      "title": "Whitelisted IPs ({count})",
      "empty": "No IP addresses whitelisted. When you add entries, access will be restricted to these IPs.",
      "createdBy": "Added by {displayName} on {date}"
    },
    "status": {
      "disabled": "Disabled"
    },
    "action": {
      "add": "Add Entry",
      "enable": "Enable",
      "disable": "Disable",
      "delete": "Delete"
    },
    "alert": {
      "cidrRequired": "IP address or CIDR range is required.",
      "invalidCidr": "Invalid CIDR notation. Use format: 192.168.1.0/24 or single IP: 192.168.1.1",
      "cidrWarning": {
        "allIps": "⚠️ Warning: /0 allows all IP addresses. This disables IP whitelist protection.",
        "veryWide": "⚠️ Warning: /{prefix} is a very wide CIDR range. Consider using a narrower range.",
        "wide": "⚠️ Warning: /{prefix} is a wide CIDR range. Consider using a narrower range for better security."
      },
      "entryAdded": "IP whitelist entry added successfully.",
      "entryEnabled": "IP whitelist entry enabled.",
      "entryDisabled": "IP whitelist entry disabled.",
      "entryDeleted": "IP whitelist entry deleted.",
      "confirmDelete": "Are you sure you want to delete {cidr}? Make sure you have other whitelisted IPs available or you will be locked out."
    }
  }
}
</i18n>
