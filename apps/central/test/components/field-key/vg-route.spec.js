import VgFieldKeyList from '../../../src/components/field-key/vg-list.vue';
import useProject from '../../../src/request-data/project';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';

const VgFieldKeyRouteHarness = {
  components: { VgFieldKeyList },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  emits: ['fetch-field-keys'],
  setup() {
    const { fieldKeys } = useProject();
    fieldKeys.data = testData.extendedFieldKeys.sorted();
    return {};
  },
  template: `
    <vg-field-key-list
      :project-id="projectId"
      @fetch-field-keys="$emit('fetch-field-keys', $event)"
    />
  `
};

const baseMountOptions = (options = undefined) => mergeMountOptions(options, {
  props: { projectId: '1' },
  container: {
    requestData: {
      project: testData.extendedProjects.last(),
      projectAppUserSettings: {
        vg_app_user_session_ttl_days: 3,
        vg_app_user_session_cap: 3,
        admin_pw: 'vg_custom'
      }
    },
    router: mockRouter('/projects/1/app-users')
  }
});

const createRouteComponent = (options = undefined) =>
  mount(VgFieldKeyRouteHarness, baseMountOptions(options));

const createAppUser = (overrides = undefined) => {
  testData.extendedFieldKeys.createPast(1, { displayName: 'My App User' });
  return testData.extendedFieldKeys.update(-1, {
    username: 'my-user',
    phone: '(+1) 555 123 4567',
    active: true,
    ...overrides
  });
};

describe('VgFieldKeyRoute', () => {
  beforeEach(mockLogin);

  it('renders VG-specific app user columns', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    createAppUser();

    const app = createRouteComponent();
    const headers = app.findAll('#field-key-list-table th').map((th) => th.text());
    headers.should.include('Username');
    headers.should.include('Phone');

    const cells = app.findAll('#field-key-list-table tbody tr').at(0).findAll('td');
    cells[0].text().should.equal('My App User');
    cells[1].text().should.equal('my-user');
    cells[2].text().should.equal('(+1) 555 123 4567');
    cells[5].text().should.equal('SHOW QR');
  });

  it('creates an app user with username and phone, then shows a QR success panel', () => {
    testData.extendedProjects.createPast(1, { appUsers: 0 });

    return mockHttp()
      .mount(VgFieldKeyRouteHarness, baseMountOptions({ attachTo: document.body }))
      .request(async (app) => {
        await app.get('#field-key-list-create-button').trigger('click');
        const inputs = app.get('#field-key-new').findAll('input');
        await inputs[0].setValue('My App User');
        await inputs[1].setValue('my-user');
        await inputs[2].setValue('(+1) 555 123 4567');
        return app.get('#field-key-new form').trigger('submit');
      })
      .beforeEachResponse((_, { data }) => {
        data.fullName.should.equal('My App User');
        data.username.should.equal('my-user');
        data.phone.should.equal('(+1) 555 123 4567');
      })
      .respondWithData(() => ({
        id: 1,
        displayName: 'My App User',
        username: 'my-user',
        phone: '(+1) 555 123 4567'
      }))
      .afterResponse((app) => {
        app.get('#field-key-new-success').should.be.visible();
        app.get('#field-key-new .field-key-qr-panel').should.be.visible();
        app.get('#field-key-new').text().should.include('My App User');
        app.get('#field-key-new').text().should.include('Username: my-user');
      });
  });

  it('emits a refresh request and shows a success alert after a created app user is completed', () => {
    testData.extendedProjects.createPast(1, { appUsers: 0 });

    return mockHttp()
      .mount(VgFieldKeyRouteHarness, baseMountOptions({ attachTo: document.body }))
      .request(async (app) => {
        await app.get('#field-key-list-create-button').trigger('click');
        const inputs = app.get('#field-key-new').findAll('input');
        await inputs[0].setValue('My App User');
        await inputs[1].setValue('my-user');
        await inputs[2].setValue('(+1) 555 123 4567');
        return app.get('#field-key-new form').trigger('submit');
      })
      .respondWithData(() => ({
        displayName: 'My App User',
        id: 101,
        username: 'my-user',
        phone: '(+1) 555 123 4567'
      }))
      .afterResponse(async (app) => {
        const emittedBefore = app.emitted('fetch-field-keys').length;
        await app.get('#field-key-new .btn-primary').trigger('click');
        await app.vm.$nextTick();

        const emitted = app.emitted('fetch-field-keys');
        emitted.length.should.equal(emittedBefore + 1);
        emitted[emitted.length - 1].should.eql([true]);
        app.find('#field-key-new').classes('in').should.be.false;
        app.should.alert('success');
      });
  });

  it('opens the revoke modal, then emits a refresh request and success alert after revoke', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    createAppUser();

    return mockHttp()
      .mount(VgFieldKeyRouteHarness, baseMountOptions({ attachTo: document.body }))
      .afterResponses(async (app) => {
        const revokeLink = app.findAll('.field-key-row .dropdown-menu a')
          .find((link) => link.text().includes('Revoke access'));
        await revokeLink.trigger('click');
        app.get('#field-key-revoke').should.be.visible();
      })
      .request((app) => app.get('#field-key-revoke .btn-danger').trigger('click'))
      .respondWithData(() => ({ success: true }))
      .afterResponse(async (app) => {
        await app.vm.$nextTick();
        const emitted = app.emitted('fetch-field-keys');
        emitted[emitted.length - 1].should.eql([true]);
        app.find('#field-key-revoke').classes('in').should.be.false;
        app.should.alert('success');
      });
  });

  it('shows the restore action for inactive app users, then emits a refresh request and success alert after restore', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    createAppUser({ active: false, token: null });

    return mockHttp()
      .mount(VgFieldKeyRouteHarness, baseMountOptions({ attachTo: document.body }))
      .afterResponses(async (app) => {
        app.get('.field-key-row').text().should.include('Access revoked');
        const restoreLink = app.findAll('.field-key-row .dropdown-menu a')
          .find((link) => link.text().includes('Restore access'));
        await restoreLink.trigger('click');
        app.get('#field-key-restore').should.be.visible();
      })
      .request((app) => app.get('#field-key-restore .btn-primary').trigger('click'))
      .beforeEachResponse((_, { data }) => {
        data.active.should.be.true;
      })
      .respondWithData(() => ({ success: true }))
      .afterResponse(async (app) => {
        await app.vm.$nextTick();
        const emitted = app.emitted('fetch-field-keys');
        emitted[emitted.length - 1].should.eql([true]);
        app.find('#field-key-restore').classes('in').should.be.false;
        app.should.alert('success');
      });
  });

  it('resets password, shows the QR success panel, then emits a refresh request and success alert after completion', () => {
    testData.extendedProjects.createPast(1, { appUsers: 1 });
    createAppUser();

    return mockHttp()
      .mount(VgFieldKeyRouteHarness, baseMountOptions({ attachTo: document.body }))
      .afterResponses(async (app) => {
        const resetLink = app.findAll('.field-key-row .dropdown-menu a')
          .find((link) => link.text().includes('Reset Password'));
        await resetLink.trigger('click');
        app.get('#field-key-reset-password').should.be.visible();
      })
      .request((app) => app.get('#field-key-reset-password .btn-primary').trigger('click'))
      .beforeEachResponse((_, { data }) => {
        should.exist(data.newPassword);
        data.newPassword.should.be.a('string');
      })
      .respondWithData(() => ({ success: true }))
      .afterResponse(async (app) => {
        app.get('#field-key-reset-password .field-key-qr-panel').should.be.visible();
        await app.get('#field-key-reset-password .btn-primary').trigger('click');
        await app.vm.$nextTick();
        const emitted = app.emitted('fetch-field-keys');
        emitted[emitted.length - 1].should.eql([true]);
        app.find('#field-key-reset-password').classes('in').should.be.false;
        app.should.alert('success');
      });
  });
});
