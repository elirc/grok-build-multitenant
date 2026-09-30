# Version schedule lab

Run `node astraupskill/extended-course/labs/version-schedules.mjs` from the project root. Node's built-in assertion module is the only dependency. The lab writes no application data. It models sequential outcomes for two writers holding the same baseline, a foreign organization request, and an audit failure. Two deliberate mutants demonstrate what is lost when version or scope checks are omitted.

This is an in-memory teaching model, not an application test. Its rollback implementation copies a value back; PostgreSQL rollback must be verified separately. Its sequential schedules do not run concurrent database transactions. Compare the model's obligations with [projectRepository](../../../backend/src/repositories/projectRepository.ts), then design an integration test with independent connections and synchronization barriers.

Before running, predict every accepted writer, final version, and audit count. After running, change a model expectation only if you can explain the business invariant. Do not interpret a green result as evidence that the actual HTTP middleware or database schema was executed.

[Course index](../README.md) · [Lab source](version-schedules.mjs)
