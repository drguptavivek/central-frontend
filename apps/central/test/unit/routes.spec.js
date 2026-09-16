import createRoutes from '../../src/routes';
import { loadAsync } from '../../src/util/load-async';

import createTestContainer from '../util/container';

const flattenRoutes = (routes) => {
  const flattened = [];
  const stack = [...routes];
  while (stack.length !== 0) {
    const route = stack.pop();
    flattened.push(route);
    if (route.children != null) stack.push(...route.children);
  }
  return flattened;
};

describe('Central routes', () => {
  let routes;

  beforeEach(() => {
    routes = flattenRoutes(createRoutes(createTestContainer()));
  });

  it('retains the upstream project and entity-list routes', () => {
    const paths = routes.map(route => route.path);
    paths.should.include('new-form');
    paths.should.include('entity-lists');
    paths.should.include('custom-properties');
    paths.should.include('app-user-settings');
    paths.should.include('telemetry');
    paths.should.include('login-history');
    paths.should.include('form-access');
    paths.should.include('settings');
    paths.should.include('enketo-status');
  });

  it('does not register obsolete Central web-form routes', () => {
    const componentNames = routes
      .map(route => route.meta.asyncRoute?.componentName)
      .filter(componentName => componentName != null);
    componentNames.should.not.contain('FormPreview');
    componentNames.should.not.contain('FormSubmission');
    componentNames.should.not.contain('EnketoRedirector');
    componentNames.should.not.contain('WebFormDirectLink');
  });

  it('has a loader for every async route component', () => {
    for (const route of routes) {
      const { asyncRoute } = route.meta;
      if (asyncRoute != null)
        loadAsync(asyncRoute.componentName).should.be.a('function');
    }
  });
});
