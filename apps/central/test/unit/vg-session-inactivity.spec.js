import sinon from 'sinon';

import { logIn, useSessions } from '../../src/util/session';
import {
  inactivityLogoutMillis,
  inactivityStorageKey
} from '../../src/util/vg-session-inactivity';

import createTestContainer from '../util/container';
import testData from '../data';
import { mockHttp } from '../util/http';
import { mockRouter } from '../util/router';
import { setRequestData } from '../util/request-data';
import { withSetup } from '../util/lifecycle';

describe('VG session inactivity policy', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('logs out after inactivity timeout is reached', () => {
    testData.extendedUsers.createPast(1, { role: 'none' });
    const container = createTestContainer({ router: mockRouter() });
    withSetup(useSessions, { container });
    const { session } = setRequestData(container.requestData, {
      session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
    });
    return mockHttp(container)
      .request(() => logIn(container, true))
      .respondWithData(() => testData.extendedUsers.first())
      .complete()
      .testNoRequest(() => {
        clock.tick(inactivityLogoutMillis - 15000);
      })
      .request(() => {
        clock.tick(15000);
      })
      .respondWithSuccess()
      .afterResponse(() => {
        session.dataExists.should.be.false;
      });
  });

  it('does not log out if there is activity before timeout', () => {
    testData.extendedUsers.createPast(1, { role: 'none' });
    const container = createTestContainer({ router: mockRouter() });
    withSetup(useSessions, { container });
    const { session } = setRequestData(container.requestData, {
      session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
    });
    return mockHttp(container)
      .request(() => logIn(container, true))
      .respondWithData(() => testData.extendedUsers.first())
      .afterResponse(() => {
        clock.tick(inactivityLogoutMillis - 60000);
        window.dispatchEvent(new Event('mousemove'));
      })
      .testNoRequest(() => {
        clock.tick(120000);
      })
      .afterResponse(() => {
        should.exist(localStorage.getItem(inactivityStorageKey));
        session.dataExists.should.be.true;
      });
  });

  it('shows warning 3 minutes before inactivity timeout', () => {
    testData.extendedUsers.createPast(1, { role: 'none' });
    const container = createTestContainer({ router: mockRouter() });
    withSetup(useSessions, { container });
    const alertSpy = sinon.spy(container.alert, 'info');
    const { session } = setRequestData(container.requestData, {
      session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
    });
    return mockHttp(container)
      .request(() => logIn(container, true))
      .respondWithData(() => testData.extendedUsers.first())
      .complete()
      .testNoRequest(() => {
        clock.tick(inactivityLogoutMillis - 180000);
      })
      .afterResponse(() => {
        alertSpy.called.should.be.false;
      })
      .testNoRequest(() => {
        clock.tick(15000);
      })
      .afterResponse(() => {
        alertSpy.callCount.should.equal(1);
        session.dataExists.should.be.true;
      });
  });

  it('resets warning after activity', () => {
    testData.extendedUsers.createPast(1, { role: 'none' });
    const container = createTestContainer({ router: mockRouter() });
    withSetup(useSessions, { container });
    const alertSpy = sinon.spy(container.alert, 'info');
    const { session } = setRequestData(container.requestData, {
      session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
    });
    return mockHttp(container)
      .request(() => logIn(container, true))
      .respondWithData(() => testData.extendedUsers.first())
      .complete()
      .testNoRequest(() => {
        clock.tick(inactivityLogoutMillis - 180000 + 15000);
      })
      .afterResponse(() => {
        alertSpy.callCount.should.equal(1);
        window.dispatchEvent(new Event('mousemove'));
        clock.tick(15000);
      })
      .testNoRequest(() => {
        clock.tick(inactivityLogoutMillis - 180000);
      })
      .afterResponse(() => {
        alertSpy.callCount.should.equal(2);
        session.dataExists.should.be.true;
      });
  });

  it('prevents logout when activity detected from other tabs', () => {
    testData.extendedUsers.createPast(1, { role: 'none' });
    const container = createTestContainer({ router: mockRouter() });
    withSetup(useSessions, { container });
    const { session } = setRequestData(container.requestData, {
      session: testData.sessions.createNew({ expiresAt: '1970-01-02T00:00:00Z' })
    });
    return mockHttp(container)
      .request(() => logIn(container, true))
      .respondWithData(() => testData.extendedUsers.first())
      .complete()
      .testNoRequest(() => {
        clock.tick(inactivityLogoutMillis - 30000);
        const now = Date.now();
        localStorage.setItem(inactivityStorageKey, now.toString());
        window.dispatchEvent(new StorageEvent('storage', {
          key: inactivityStorageKey,
          newValue: now.toString(),
          oldValue: (now - (inactivityLogoutMillis - 30000)).toString()
        }));
      })
      .testNoRequest(() => {
        clock.tick(60000);
      })
      .afterResponse(() => {
        session.dataExists.should.be.true;
      });
  });
});
