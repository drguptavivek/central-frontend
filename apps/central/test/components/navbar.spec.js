import { START_LOCATION } from 'vue-router';

import Navbar from '../../src/components/navbar.vue';

import testData from '../data';
import { load } from '../util/http';

describe('Navbar', () => {
  describe('visibility', () => {
    it('does not show the navbar during the initial navigation', () => {
      testData.extendedUsers.createPast(1, { role: 'none' });
      let wasHidden = false;
      return load('/login', {}, false)
        .beforeAnyResponse(app => {
          app.vm.$router.currentRoute.value.should.equal(START_LOCATION);
          app.vm.$router.afterEach(() => {
            const { display } = app.getComponent(Navbar).element.style;
            wasHidden = display === 'none';
          });
        })
        .restoreSession()
        .respondFor('/', { users: false })
        .afterResponses(app => {
          wasHidden.should.be.true;
          const navbar = app.getComponent(Navbar);
          navbar.should.be.visible();
          // The navbar must use the Vue dropdown implementation. Bootstrap's
          // collapse markup has no runtime after the v2026.3 upgrade.
          navbar.get('#navbar nav').exists().should.be.true;
          navbar.find('.navbar-toggle').exists().should.be.false;
          navbar.find('[data-toggle="collapse"]').exists().should.be.false;
        });
    });

    it('shows the navbar for AccountClaim', async () => {
      const app = await load(`/account/claim?token=${'a'.repeat(64)}`);
      app.getComponent(Navbar).should.be.visible();
    });
  });
});
