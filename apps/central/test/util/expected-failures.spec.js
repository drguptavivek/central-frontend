import { expectedFailures, validateExpectedFailures, wrapTest } from './expected-failures';

const testContext = title => ({ test: { fullTitle: () => title } });

const createNativeIt = () => {
  const definitions = [];
  const nativeIt = (title, fn) => {
    definitions.push({ title, fn });
  };
  nativeIt.skip = nativeIt;
  nativeIt.only = nativeIt;
  return { definitions, nativeIt };
};

describe('expected failure handling', () => {
  it('requires every manifest entry to define an error signature', () => {
    for (const entry of expectedFailures.values()) {
      entry.error.should.be.a('string');
      entry.error.should.not.equal('');
    }
  });

  it('propagates a mismatched failure and restores console.error', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic mismatched expected failure';
    const manifest = new Map([[title, { reason: 'test', error: 'expected message' }]]);
    const wrappedIt = wrapTest(nativeIt, manifest, new Map());
    const originalConsoleError = console.error; // eslint-disable-line no-console
    wrappedIt(title, () => {
      console.error('diagnostic'); // eslint-disable-line no-console
      throw new Error('different message');
    });

    (() => definitions[0].fn.call(testContext(title))).should.throw('different message');
    console.error.should.equal(originalConsoleError); // eslint-disable-line no-console
  });

  it('does not accept an error that merely contains the declared signature', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic substring mismatch';
    const manifest = new Map([[title, { reason: 'test', error: 'expected message' }]]);
    const wrappedIt = wrapTest(nativeIt, manifest, new Map());
    wrappedIt(title, () => { throw new Error('prefix expected message suffix'); });

    (() => definitions[0].fn.call(testContext(title)))
      .should.throw('prefix expected message suffix');
  });

  it('normalizes only the randomized rendered-app suffix of lookup failures', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic rendered lookup';
    const manifest = new Map([[
      title,
      { reason: 'test', error: 'Unable to get .target' }
    ]]);
    const wrappedIt = wrapTest(nativeIt, manifest, new Map());
    wrappedIt(title, () => {
      throw new Error('Unable to get .target within: <div id="randomized">content</div>');
    });

    (() => definitions[0].fn.call(testContext(title))).should.not.throw();
  });

  it('propagates a failure for a test with no declaration', () => {
    const { definitions, nativeIt } = createNativeIt();
    const wrappedIt = wrapTest(nativeIt, new Map(), new Map());
    wrappedIt('synthetic undeclared failure', () => {
      throw new Error('unexpected failure');
    });

    (() => definitions[0].fn.call(testContext('synthetic undeclared failure')))
      .should.throw('unexpected failure');
  });

  it('fails when an expected failure unexpectedly passes', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic unexpected pass';
    const manifest = new Map([[title, { reason: 'test', error: 'expected message' }]]);
    const wrappedIt = wrapTest(nativeIt, manifest, new Map());
    const originalConsoleError = console.error; // eslint-disable-line no-console
    wrappedIt(title, () => undefined);

    (() => definitions[0].fn.call(testContext(title))).should.throw('Expected failure unexpectedly passed');
    console.error.should.equal(originalConsoleError); // eslint-disable-line no-console
  });

  it('fails when an expected failure is declared but not observed', () => {
    const manifest = new Map([
      ['synthetic stale declaration', { reason: 'test', error: 'expected message' }]
    ]);

    (() => validateExpectedFailures(manifest, new Map()))
      .should.throw('Expected failures not observed exactly once');
  });

  it('fails when an expected failure is observed more than once', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic duplicate expected failure';
    const manifest = new Map([[title, { reason: 'test', error: 'expected message' }]]);
    const observed = new Map();
    const wrappedIt = wrapTest(nativeIt, manifest, observed);
    wrappedIt(title, () => { throw new Error('expected message'); });
    wrappedIt(title, () => { throw new Error('expected message'); });

    (() => definitions[0].fn.call(testContext(title))).should.not.throw();
    (() => definitions[1].fn.call(testContext(title)))
      .should.throw('Expected failure observed more than once');
  });

  it('classifies an allowlisted promise timeout using its exact synthetic signature', () => {
    const { definitions, nativeIt } = createNativeIt();
    const title = 'synthetic promise timeout';
    const manifest = new Map([[title, {
      reason: 'test',
      error: 'Expected failure timeout after 5ms',
      timeout: 5
    }]]);
    const observed = new Map();
    const wrappedIt = wrapTest(nativeIt, manifest, observed);
    const originalConsoleError = console.error; // eslint-disable-line no-console
    wrappedIt(title, () => new Promise(() => {}));

    return definitions[0].fn.call(testContext(title)).then(() => {
      observed.has(title).should.equal(true);
      console.error.should.equal(originalConsoleError); // eslint-disable-line no-console
    });
  });
});
