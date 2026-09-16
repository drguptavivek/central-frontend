// These are compatibility expectations for upstream tests that cannot express
// the preserved VG client contract. Every entry is keyed by Mocha's complete
// test title. The wrapper fails if an expected failure starts passing, so this
// list cannot become a silent exclusion.
const expected = (reason, error, timeout = null) => ({ reason, error, timeout });

const expectedFailures = new Map([
  ['ProjectFormAccess after login saving changes sends the correct requests', expected('VG form-access updates use the dedicated endpoint while the upstream fixture asserts the project update request.', 'beforeEachResponse() callback threw an error')],
  ['ProjectUserList behavior of the component before any role change shows the correct options for the select', expected('VG preserves the Data Manager role in the roles fixture.', "expected [ 'Project Manager', …(4) ] to deeply equal [ 'Project Manager', …(3) ]")],
  ['FieldKeyEdit sends the correct request', expected('VG replaces the upstream FieldKey list and row components.', 'Unable to get .field-key-row .edit-button')],
  ['FieldKeyEdit shows a success message', expected('VG replaces the upstream FieldKey list and row components.', 'Unable to get .field-key-row .edit-button')],
  ['FieldKeyNew toggles the modal', expected('VG replaces the upstream FieldKey list and new component.', 'Unable to get component with name FieldKeyNew')],
  ['FieldKeyNew after a successful response shows the app user\'s display name', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response fetches app users after link to Form Access tab is clicked', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response QR code renders a FieldKeyQrPanel component for the app user', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response QR code defaults to a managed QR code', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response QR code shows a legacy QR code in modal after user switches in popover', expected('VG replaces the upstream FieldKey list and new component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyNew after a successful response QR code after user clicks link to switch to a legacy QR code shows a legacy QR code in the modal', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response QR code after user clicks link to switch to a legacy QR code shows a legacy QR code in the next popover', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response QR code after user clicks link to switch to a legacy QR code allows the user to switch back to a managed QR code', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the Done button is clicked hides the modal', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the Done button is clicked updates the number of rows in the table', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the Done button is clicked shows a success alert', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the "Create another" button is clicked does not hide the modal', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the "Create another" button is clicked shows a blank input', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after the "Create another" button is clicked focuses the input', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after "Create another" button, then Cancel button are clicked hides the modal', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after "Create another" button, then Cancel button are clicked updates the number of rows in the table', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyNew after a successful response after "Create another" button, then Cancel button are clicked shows a success alert', expected('VG replaces the upstream FieldKey list and new component.', 'request without response: no response specified for request')],
  ['FieldKeyRevoke revoke action toggles the modal', expected('VG replaces the upstream FieldKey list and revoke component.', 'Unable to get component with name FieldKeyRevoke')],
  ['FieldKeyRevoke revoke action does not show revoke button if access has been revoked', expected('VG replaces the upstream FieldKey list and row component.', 'Unable to get component with name FieldKeyRow')],
  ['FieldKeyRevoke after a successful response hides the modal', expected('VG replaces the upstream FieldKey list and row component.', 'Unable to get #field-key-list-table .revoke-button')],
  ['FieldKeyRevoke after a successful response shows a success alert', expected('VG replaces the upstream FieldKey list and row component.', 'Unable to get #field-key-list-table .revoke-button')],
  ['FieldKeyRevoke after a successful response updates the list', expected('VG replaces the upstream FieldKey list and row component.', 'Unable to get #field-key-list-table .revoke-button')],
  ['FieldKeyRow shows createdAt', expected('VG replaces the upstream FieldKey row component.', 'Unable to get component with name FieldKeyRow')],
  ['FieldKeyRow shows createdBy', expected('VG replaces the upstream FieldKey row component.', 'Unable to get component with name FieldKeyRow')],
  ['FieldKeyRow shows lastUsed', expected('VG replaces the upstream FieldKey row component.', 'Unable to get component with name FieldKeyRow')],
  ['FieldKeyRow indicates if access is revoked', expected('VG replaces the upstream FieldKey row component.', 'Unable to get component with name FieldKeyRow')],
  ['FieldKeyRow after the user clicks "See code" toggles the popover', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" hides the popover on close button', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" shows the app user\'s display name', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" defaults to a managed QR code', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" after user clicks link to switch to a legacy QR code shows a legacy QR code', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" after user clicks link to switch to a legacy QR code focuses the link to switch back to a managed QR code', expected('VG replaces the upstream FieldKey row component.', 'Unable to get .field-key-row-popover-link')],
  ['FieldKeyRow after the user clicks "See code" after user clicks link to switch to a legacy QR code shows a legacy QR code in the next popover', expected('VG replaces the upstream FieldKey row component.', "Cannot read properties of undefined (reading 'trigger')")],
  ['ProjectShow tabs shows all tabs to an administrator', expected('The preserved VG project navigation adds App User Settings, Login History, and Form Access tabs.', "expected [ 'Forms 1', 'Entity Lists 1', …(7) ] to deeply equal [ 'Forms 1', 'Entity Lists 1', …(5) ]")],
  ['SystemHome renders the tabs', expected('The preserved VG system navigation adds App User Settings and Enketo Status tabs.', "expected [ '/system/audits', …(4) ] to deeply equal [ '/system/audits', …(2) ]")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-12-31T23:59:00Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '60 sec ago' to equal '60 sec. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-12-31T23:58:59Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '1 min ago' to equal '1 min. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-12-31T22:00:00Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '120 min ago' to equal '120 min. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-12-31T21:59:59Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '2 hr ago' to equal '2 hr. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-12-30T00:00:00Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '48 hr ago' to equal '48 hr. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-11-16T23:59:59Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '6 wk ago' to equal '6 wk. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-11-06T00:00:00Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '8 wk ago' to equal '8 wk. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2017-11-05T23:59:59Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '1 mo ago' to equal '1 mo. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2015-01-01T00:00:00Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '36 mo ago' to equal '36 mo. ago'")],
  ['util/date-time formatDateTime() past date/time correctly formats 2014-12-31T23:59:59Z', expected('Chromium Intl.RelativeTimeFormat narrow English output omits the punctuation expected by the upstream assertion.', "expected '3 yr ago' to equal '3 yr. ago'")]
]);

const observedExpectedFailures = new Map();

const unexpectedPass = (title, reason) => {
  throw new Error(`Expected failure unexpectedly passed: ${title} (${reason})`);
};

const duplicateObservation = (title) => {
  throw new Error(`Expected failure observed more than once: ${title}`);
};

const errorMessage = (error) => {
  if (error != null && typeof error.message === 'string') return error.message;
  return String(error);
};

// Test-utils include the complete rendered application after selector lookup
// failures. That suffix contains randomized fixture data and generated IDs, so
// reduce only that known diagnostic form to its stable leading message. All
// other errors are compared byte-for-byte.
const normalizedErrorMessage = (error) => {
  const message = errorMessage(error);
  const renderedApp = message.indexOf(' within: <');
  return message.startsWith('Unable to get ') && renderedApp !== -1
    ? message.slice(0, renderedApp)
    : message;
};

const matchesExpectedFailure = (error, entry) =>
  normalizedErrorMessage(error) === entry.error;

const wrapTest = (nativeIt, manifest = expectedFailures, observed = observedExpectedFailures) => {
  const wrappedIt = (title, fn) => {
    // Preserve Mocha's pending-test API. A pending test has no function, so it
    // must never enter the expected-failure wrapper.
    if (fn == null) return nativeIt(title);
    return nativeIt(title, function expectedFailureWrapper(...args) {
      const entry = manifest.get(this.test.fullTitle());
      if (entry == null) return fn.apply(this, args);

      const fullTitle = this.test.fullTitle();
      const originalConsoleError = console.error; // eslint-disable-line no-console
      console.error = () => {}; // eslint-disable-line no-console
      const restoreConsoleError = () => {
        console.error = originalConsoleError; // eslint-disable-line no-console
      };
      const classifyFailure = (error) => {
        restoreConsoleError();
        if (!matchesExpectedFailure(error, entry)) return false;
        if (observed.has(fullTitle)) duplicateObservation(fullTitle);
        observed.set(fullTitle, entry);
        return true;
      };

      if (fn.length > 0) {
        return new Promise((resolve, reject) => {
          let settled = false;
          const done = (error) => {
            if (settled) return;
            settled = true;
            if (error == null) {
              restoreConsoleError();
              reject(new Error(`Expected failure unexpectedly passed: ${fullTitle} (${entry.reason})`));
            } else {
              try {
                if (classifyFailure(error)) resolve();
                else reject(error);
              } catch (classificationError) {
                reject(classificationError);
              }
            }
          };
          try {
            fn.call(this, done);
          } catch (error) {
            if (classifyFailure(error)) resolve();
            else reject(error);
          }
        });
      }

      let result;
      try {
        result = fn.apply(this, args);
      } catch (error) {
        if (classifyFailure(error)) return undefined;
        throw error;
      }

      if (result != null && typeof result.then === 'function') {
        let timer;
        const promise = entry.timeout == null
          ? Promise.resolve(result)
          : Promise.race([
            Promise.resolve(result),
            new Promise((resolve, reject) => {
              timer = setTimeout(() => reject(new Error(`Expected failure timeout after ${entry.timeout}ms`)), entry.timeout);
            })
          ]);
        return promise.then(
          (value) => {
            if (timer != null) clearTimeout(timer);
            return value;
          },
          (error) => {
            if (timer != null) clearTimeout(timer);
            throw error;
          }
        ).then(
          () => {
            restoreConsoleError();
            return unexpectedPass(fullTitle, entry.reason);
          },
          (error) => {
            if (classifyFailure(error)) return undefined;
            throw error;
          }
        );
      }
      restoreConsoleError();
      return unexpectedPass(fullTitle, entry.reason);
    });
  };
  return wrappedIt;
};

const validateExpectedFailures = (manifest, observed) => {
  const missing = Array.from(manifest.keys())
    .filter(title => !observed.has(title));
  if (missing.length !== 0) {
    throw new Error(`Expected failures not observed exactly once: ${missing.join('; ')}`);
  }
};

const isFocusedRun = () => {
  const grep = window.mocha?.options?.grep;
  return grep != null && grep.source !== '.';
};

const installExpectedFailureHandling = () => {
  const nativeIt = window.it;
  const observed = new Map();
  const wrappedIt = wrapTest(nativeIt, expectedFailures, observed);
  wrappedIt.skip = nativeIt.skip.bind(nativeIt);
  wrappedIt.only = nativeIt.only.bind(nativeIt);
  wrappedIt.retries = nativeIt.retries;
  window.it = wrappedIt;
  return {
    count: expectedFailures.size,
    report: () => {
      const entries = Array.from(observed.entries());
      console.info(`Expected failures (xfail): ${entries.length}`); // eslint-disable-line no-console
      for (const [title, { reason }] of entries)
        console.info(`  - ${title}: ${reason}`); // eslint-disable-line no-console
      const missing = Array.from(expectedFailures.keys())
        .filter(title => !observed.has(title));
      if (missing.length !== 0) {
        console.info(`Expected failures not observed in this run: ${missing.length}`); // eslint-disable-line no-console
        for (const title of missing)
          console.info(`  - ${title}`); // eslint-disable-line no-console
      }
      // A grep-filtered run intentionally omits tests. The full suite still
      // validates every declaration, while focused runs validate the entries
      // they execute and retain the report for visibility into omitted ones.
      if (!isFocusedRun()) validateExpectedFailures(expectedFailures, observed);
    }
  };
};

export { expectedFailures, matchesExpectedFailure, validateExpectedFailures, wrapTest };
export default installExpectedFailureHandling;
