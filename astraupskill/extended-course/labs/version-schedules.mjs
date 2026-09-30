import assert from 'node:assert/strict';

// Teaching model only. It does not import Prisma, Express, or application code.
// Every schedule starts from a private in-memory value and writes no files.
let assertions = 0;
function check(actual, expected, name) {
  assert.deepEqual(actual, expected, name);
  assertions++;
}
function makeStore() {
  return { row: { id: 'p1', organizationId: 'north', version: 7, name: 'Launch' }, audit: [] };
}
function update(store, { organizationId, expected, name }, { omitScope = false, omitVersion = false, failAudit = false } = {}) {
  const original = structuredClone(store);
  if (!store.row || (!omitScope && store.row.organizationId !== organizationId)) return 'not-found';
  if (!omitVersion && store.row.version !== expected) return 'conflict';
  store.row.name = name;
  store.row.version++;
  if (failAudit) {
    store.row = original.row;
    store.audit = original.audit;
    return 'audit-failed';
  }
  store.audit.push({ organizationId: store.row.organizationId, version: store.row.version, action: 'UPDATE' });
  return 'accepted';
}

const a = { organizationId: 'north', expected: 7, name: 'Alice' };
const b = { organizationId: 'north', expected: 7, name: 'Bruno' };
for (const [first, second] of [[a, b], [b, a]]) {
  const store = makeStore();
  check(update(store, first), 'accepted', 'first matching revision accepts');
  check(update(store, second), 'conflict', 'second stale revision conflicts');
  check(store.row.name, first.name, 'rejected writer does not replace accepted name');
  check(store.row.version, 8, 'one accepted revision increment');
  check(store.audit.length, 1, 'one accepted evidence event');
}
const foreign = makeStore();
check(update(foreign, { ...a, organizationId: 'south' }), 'not-found', 'foreign scope concealed');
check(foreign.row.name, 'Launch', 'foreign request has no write');
check(foreign.audit.length, 0, 'foreign request has no acceptance event');
const rollback = makeStore();
check(update(rollback, a, { failAudit: true }), 'audit-failed', 'evidence failure rejected');
check(rollback, makeStore(), 'model restores all effects');

// Counterexamples make the missing invariant visible; these are deliberate mutants.
const lostUpdate = makeStore();
update(lostUpdate, a, { omitVersion: true });
update(lostUpdate, b, { omitVersion: true });
check(lostUpdate.row.name, 'Bruno', 'mutant loses first accepted value');
check(lostUpdate.row.version, 9, 'mutant accepted two stale-baseline writes');
const leakedScope = makeStore();
check(update(leakedScope, { ...a, organizationId: 'south' }, { omitScope: true }), 'accepted', 'mutant permits foreign write');
console.log(JSON.stringify({ lab: 'multitenant-version-schedules', kind: 'in-memory-teaching-model', assertions, passed: true, databaseExecuted: false }));
