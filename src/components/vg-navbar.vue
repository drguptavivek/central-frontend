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
  <div>
    <nav class="navbar navbar-default vg-navbar">
      <div class="container-fluid">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed"
            data-toggle="collapse" data-target=".navbar-collapse"
            aria-expanded="false">
            <span class="sr-only">{{ $t('action.toggle') }}</span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
          </button>
          <router-link to="/" class="navbar-brand">NDUS 2025 NDDTC AIIMS New Delhi</router-link>
        </div>
        <div class="collapse navbar-collapse">
          <navbar-links v-if="visiblyLoggedIn"/>
          <div class="navbar-right">
            <a v-show="showsAnalyticsNotice" id="navbar-analytics-notice"
              href="#" @click.prevent="analyticsIntroduction.show()">
              {{ $t('analyticsNotice') }}
            </a>
            <ul class="nav navbar-nav">
              <navbar-help-dropdown/>
              <navbar-locale-dropdown/>
              <navbar-actions/>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    <analytics-introduction v-if="config.loaded && config.showsAnalytics"
      v-bind="analyticsIntroduction" @hide="analyticsIntroduction.hide()"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import NavbarActions from './navbar/actions.vue';
import NavbarHelpDropdown from './navbar/help-dropdown.vue';
import NavbarLinks from './navbar/links.vue';
import NavbarLocaleDropdown from './navbar/locale-dropdown.vue';

import useRoutes from '../composables/routes';
import { loadAsync } from '../util/load-async';
import { modalData } from '../util/reactivity';
import { useRequestData } from '../request-data';

export default {
  name: 'VgNavbar',
  components: {
    AnalyticsIntroduction: defineAsyncComponent(loadAsync('AnalyticsIntroduction')),
    NavbarActions,
    NavbarHelpDropdown,
    NavbarLinks,
    NavbarLocaleDropdown
  },
  inject: ['config', 'visiblyLoggedIn'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { currentUser, analyticsConfig } = useRequestData();
    const { canRoute } = useRoutes();
    return { currentUser, analyticsConfig, canRoute };
  },
  data() {
    return {
      analyticsIntroduction: modalData('AnalyticsIntroduction')
    };
  },
  computed: {
    showsAnalyticsNotice() {
      return this.config.loaded && this.config.showsAnalytics && this.visiblyLoggedIn &&
        this.canRoute('/system/analytics') && this.analyticsConfig.dataExists &&
        this.analyticsConfig.isEmpty() &&
        Date.now() - Date.parse(this.currentUser.createdAt) >= /* 14 days */ 1209600000;
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

$border-height: 3px;
$vg-color-accent-primary: #2f049b;
$vg-color-accent-secondary: #531ed9;
$vg-color-nav-active: #6f4d60;

.vg-navbar.navbar-default {
  background-color: $vg-color-accent-primary;
  border: none;
  border-top: $border-height solid $vg-color-accent-secondary;
  box-shadow: 0 $border-height 0 #dedede;
  height: 30px + $border-height; // the way bootstrap is set up, the border eats the body.
  margin-bottom: 0;
  min-height: auto;

  .navbar-brand {
    float: left;
    font-size: $font-size-btn;
    font-weight: bold;
    height: auto;
    letter-spacing: -0.02em;
    line-height: 20px;
    padding: 5px 15px;

    &, &:hover, &:focus { color: #fff; }

    &:focus {
      background-color: transparent;
      text-decoration: none;
    }
  }

  .navbar-nav {
    font-size: $font-size-btn;

    > li > a {
      &, &:hover, &:focus { color: #fff; }
    }
  }
}

#navbar-analytics-notice {
  @include text-link;
  background-color: #ffed88;
  border: 1px solid #e39941;
  float: left;
  font-size: 10px;
  margin-top: 6px;
  margin-right: 30px;
  padding: 1px 3px;

  &:hover, &:focus {
    background-color: #ffdc1c;
    border-color: #ffed88;
  }
}

// Navbar is not collapsed.
@media (min-width: 768px) {
  .vg-navbar.navbar-default {
    border-radius: 0;

    .navbar-brand { margin-left: -15px; }

    .navbar-nav {
      margin-top: -1 * $border-height;

      > li > a {
        border-top: transparent solid $border-height;
        padding: 5px 10px;
        transition: 0.25s border-top-color;

        &:hover {
          border-top-color: transparentize(#fff, 0.3);
          transition-duration: 0s;
        }

        &:focus {
          border-top-color: transparentize(#fff, 0.15);
          box-shadow: 0 3px 0 transparentize(#000, 0.9);
          outline: none;
          transition-duration: 0s;
        }
      }

      .active > a, .open > a {
        box-shadow: 0 0 6px transparentize($vg-color-accent-secondary, 0.7) inset;

        &, &:hover, &:focus {
          background-color: $vg-color-nav-active;
          border-top-color: #fff;
          color: #fff;
        }
      }
    }
  }

  .navbar-right {
    // Counters the 15px padding of .navbar-collapse and the 15px padding of
    // .container-fluid. The Bootstrap default is -15px.
    margin-right: -25px;
  }

  #navbar-actions { margin-left: 10px; }
}

// Navbar is collapsed.
@media (max-width: 767px) {
  .vg-navbar.navbar-default {
    .navbar-toggle {
      border: none;
      margin: -2px 5px;

      &:hover, &:focus { background-color: inherit; }

      .navbar-icon-bar { background-color: #fff; }
    }

    .navbar-collapse {
      background-color: $vg-color-accent-secondary;
      border: none;
      position: relative;
      z-index: 99;
    }

    .navbar-nav {
      margin-top: 0;

      > li > a {
        padding: 10px 15px;

        &:hover, &:focus { background-color: transparentize(#000, 0.9); }
      }
    }
  }
}
</style>
