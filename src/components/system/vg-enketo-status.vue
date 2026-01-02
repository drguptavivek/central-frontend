<template>
  <div id="vg-enketo-status">
    <div class="page-body-heading">
      <p>{{ $t('vgEnketoStatus.heading') }}</p>
    </div>
    <loading :state="initiallyLoading"/>

    <!-- Summary Cards -->
    <div v-if="dataExists" class="summary-section">
      <div class="summary-card healthy">
        <div class="summary-count">{{ summary.healthy ?? 0 }}</div>
        <div class="summary-label">{{ $t('vgEnketoStatus.summary.healthy') }}</div>
      </div>
      <div class="summary-card never_pushed">
        <div class="summary-count">{{ summary.never_pushed ?? 0 }}</div>
        <div class="summary-label">{{ $t('vgEnketoStatus.summary.neverPushed') }}</div>
      </div>
      <div class="summary-card draft_only">
        <div class="summary-count">{{ summary.draft_only ?? 0 }}</div>
        <div class="summary-label">{{ $t('vgEnketoStatus.summary.draftOnly') }}</div>
      </div>
      <div class="summary-card closed">
        <div class="summary-count">{{ summary.closed ?? 0 }}</div>
        <div class="summary-label">{{ $t('vgEnketoStatus.summary.closed') }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="dataExists" class="filter-section">
      <input
        v-model="projectIdFilter"
        type="text"
        :placeholder="$t('vgEnketoStatus.filter.projectId')"
        class="form-control"
        style="width: 200px; margin-right: 10px;"
      />
      <input
        v-model="xmlFormIdFilter"
        type="text"
        :placeholder="$t('vgEnketoStatus.filter.xmlFormId')"
        class="form-control"
        style="width: 200px;"
      />
      <button
        @click="applyFilters"
        class="btn btn-primary"
        style="margin-left: 10px;"
      >
        {{ $t('vgEnketoStatus.filter.apply') }}
      </button>
      <button
        @click="clearFilters"
        class="btn btn-default"
      >
        {{ $t('vgEnketoStatus.filter.clear') }}
      </button>
    </div>

    <!-- Data Table -->
    <div v-if="dataExists && enketoStatus.dataExists" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>{{ $t('vgEnketoStatus.header.project') }}</th>
            <th>{{ $t('vgEnketoStatus.header.form') }}</th>
            <th>{{ $t('vgEnketoStatus.header.status') }}</th>
            <th>{{ $t('vgEnketoStatus.header.enketoId') }}</th>
            <th>{{ $t('vgEnketoStatus.header.reason') }}</th>
            <th>{{ $t('vgEnketoStatus.header.lastUpdated') }}</th>
            <th v-if="canRegenerate">{{ $t('vgEnketoStatus.header.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in enketoStatus" :key="index" :class="`status-row status-${item.status}`">
            <td>{{ item.projectName }}</td>
            <td>{{ item.formName }}</td>
            <td>
              <span :class="`status-badge status-${item.status}`">
                {{ $t(`vgEnketoStatus.status.${item.status}`) }}
              </span>
            </td>
            <td><code>{{ item.enketoId || '-' }}</code></td>
            <td>{{ item.reason }}</td>
            <td>{{ formatDate(item.lastUpdatedAt) }}</td>
            <td v-if="canRegenerate">
              <button
                v-if="canRegenerateForm(item)"
                @click="regenerateEnketoId(item)"
                class="btn btn-sm btn-primary"
                :aria-disabled="regenerating[item.formId]"
              >
                {{ regenerating[item.formId] ? $t('vgEnketoStatus.action.regenerating') : $t('vgEnketoStatus.action.regenerate') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bulk Regenerate Button for Admins -->
    <div v-if="dataExists && canRegenerate && hasNeverPushedForms" class="bulk-action-section">
      <button
        @click="bulkRegenerate"
        class="btn btn-warning"
        :aria-disabled="bulkRegenerating"
      >
        {{ bulkRegenerating ? $t('vgEnketoStatus.action.bulkRegenerating') : $t('vgEnketoStatus.action.bulkRegenerate') }}
      </button>
    </div>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

export default {
  name: 'VgEnketoStatus',
  components: { Loading },
  inject: ['alert'],
  setup() {
    const { enketoStatus } = useRequestData();
    const { awaitingResponse, initiallyLoading, dataExists, canRegenerate } = enketoStatus.toRefs();
    return { enketoStatus, awaitingResponse, initiallyLoading, dataExists, canRegenerate };
  },
  data() {
    return {
      projectIdFilter: '',
      xmlFormIdFilter: '',
      regenerating: {},
      bulkRegenerating: false
    };
  },
  computed: {
    summary() {
      return this.enketoStatus.meta ?? {};
    },
    hasNeverPushedForms() {
      return (this.summary.never_pushed ?? 0) > 0;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const params = {};
      if (this.projectIdFilter) params.projectId = parseInt(this.projectIdFilter);
      if (this.xmlFormIdFilter) params.xmlFormId = this.xmlFormIdFilter;

      this.enketoStatus.request({
        url: '/v1/system/enketo-status',
        params
      }).catch(noop);
    },
    applyFilters() {
      this.fetchData();
    },
    clearFilters() {
      this.projectIdFilter = '';
      this.xmlFormIdFilter = '';
      this.fetchData();
    },
    canRegenerateForm(item) {
      return item.status === 'never_pushed' || item.status === 'push_failed';
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleString();
    },
    async regenerateEnketoId(item) {
      this.regenerating[item.formId] = true;
      this.$forceUpdate();

      this.enketoStatus.request({
        method: 'POST',
        url: '/v1/system/enketo-status/regenerate',
        data: {
          forms: [{ formId: item.formId, projectId: item.projectId }]
        }
      })
      .then(() => {
        this.alert.success(this.$t('vgEnketoStatus.alert.regenerateSuccess', { form: item.formName }));
        this.fetchData();
      })
      .catch(() => {
        this.alert.danger(this.$t('vgEnketoStatus.alert.regenerateFailed', { form: item.formName }));
      })
      .finally(() => {
        this.regenerating[item.formId] = false;
        this.$forceUpdate();
      });
    },
    async bulkRegenerate() {
      if (!confirm(this.$t('vgEnketoStatus.confirm.bulkRegenerate'))) return;

      this.bulkRegenerating = true;

      const neverPushedForms = this.enketoStatus.filter(item => item.status === 'never_pushed');

      this.enketoStatus.request({
        method: 'POST',
        url: '/v1/system/enketo-status/regenerate',
        data: {
          forms: neverPushedForms.map(item => ({ formId: item.formId, projectId: item.projectId }))
        }
      })
      .then((response) => {
        const successCount = response.data.results?.length ?? 0;
        const errorCount = response.data.errors?.length ?? 0;
        this.alert.success(this.$t('vgEnketoStatus.alert.bulkRegenerateComplete', {
          success: successCount,
          errors: errorCount
        }));
        this.fetchData();
      })
      .catch(() => {
        this.alert.danger(this.$t('vgEnketoStatus.alert.bulkRegenerateFailed'));
      })
      .finally(() => {
        this.bulkRegenerating = false;
      });
    }
  }
};
</script>

<style lang="scss">
#vg-enketo-status {
  .summary-section {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }

  .summary-card {
    flex: 1;
    min-width: 150px;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #ddd;

    &.healthy {
      background-color: #d4edda;
      border-color: #c3e6cb;
    }

    &.never_pushed {
      background-color: #fff3cd;
      border-color: #ffeeba;
    }

    &.draft_only {
      background-color: #e2e3e5;
      border-color: #d6d8db;
    }

    &.closed {
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }
  }

  .summary-count {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .summary-label {
    font-size: 14px;
    color: #666;
  }

  .filter-section {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .table-container {
    overflow-x: auto;
  }

  .status-row {
    &.status-healthy td {
      background-color: rgba(40, 167, 69, 0.1);
    }

    &.status-never_pushed td {
      background-color: rgba(255, 193, 7, 0.1);
    }

    &.status-draft_only td {
      background-color: rgba(108, 117, 125, 0.1);
    }

    &.status-closed td {
      background-color: rgba(220, 53, 69, 0.1);
    }

    &.status-push_failed td {
      background-color: rgba(253, 126, 20, 0.1);
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    &.status-healthy {
      background-color: #28a745;
      color: white;
    }

    &.status-never_pushed {
      background-color: #ffc107;
      color: #000;
    }

    &.status-draft_only {
      background-color: #6c757d;
      color: white;
    }

    &.status-closed {
      background-color: #dc3545;
      color: white;
    }

    &.status-push_failed {
      background-color: #fd7e14;
      color: white;
    }
  }

  .bulk-action-section {
    margin-top: 20px;
    padding: 15px;
    background-color: #fff3cd;
    border-radius: 4px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "vgEnketoStatus": {
      "heading": "Enketo Status",
      "summary": {
        "healthy": "Healthy",
        "neverPushed": "Never Pushed",
        "draftOnly": "Draft Only",
        "closed": "Closed"
      },
      "filter": {
        "projectId": "Filter by Project ID",
        "xmlFormId": "Filter by Form ID",
        "apply": "Apply Filters",
        "clear": "Clear Filters"
      },
      "header": {
        "project": "Project",
        "form": "Form",
        "status": "Status",
        "enketoId": "Enketo ID",
        "reason": "Reason",
        "lastUpdated": "Last Updated",
        "actions": "Actions"
      },
      "status": {
        "healthy": "Healthy",
        "never_pushed": "Never Pushed",
        "draft_only": "Draft Only",
        "closed": "Closed",
        "push_failed": "Push Failed"
      },
      "action": {
        "regenerate": "Regenerate",
        "regenerating": "Regenerating...",
        "bulkRegenerate": "Regenerate All Never Pushed",
        "bulkRegenerating": "Regenerating..."
      },
      "alert": {
        "regenerateSuccess": "Successfully regenerated Enketo ID for {form}",
        "regenerateFailed": "Failed to regenerate Enketo ID for {form}",
        "bulkRegenerateComplete": "Regenerated {success} forms ({errors} failed)",
        "bulkRegenerateFailed": "Bulk regenerate failed"
      },
      "confirm": {
        "bulkRegenerate": "This will regenerate Enketo IDs for all forms that have never been pushed. Continue?"
      }
    }
  }
}
</i18n>
