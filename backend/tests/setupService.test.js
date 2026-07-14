const assert = require("node:assert/strict");
const test = require("node:test");
const { pool } = require("../config/db");
const setupService = require("../services/setupService");

test("setup locks installation row and cannot complete twice", async () => {
  const originalConnect = pool.connect;
  let completed = false;
  const queries = [];
  const client = {
    async query(sql, params) {
      queries.push(sql);
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
      if (sql.includes("FROM app_installation")) {
        return { rows: [{ id: 1, setupStatus: completed ? "completed" : "pending" }] };
      }
      if (sql.includes("UPDATE user_preferences")) {
        return { rows: [{ id: 1, displayName: params[0] }] };
      }
      if (sql.includes("UPDATE app_installation")) {
        completed = true;
        return { rows: [{ id: 1, setupStatus: "completed" }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
    release() {},
  };
  pool.connect = async () => client;

  try {
    await setupService.completeSetup(
      { displayName: "Mario", contactEmail: "mario@example.com", locale: "it-IT", timezone: "Europe/Rome" },
      "3.0.0"
    );
    await assert.rejects(
      setupService.completeSetup(
        { displayName: "Luigi", contactEmail: "luigi@example.com", locale: "it-IT", timezone: "Europe/Rome" },
        "3.0.0"
      ),
      (error) => error.code === "SETUP_ALREADY_COMPLETED" && error.statusCode === 409
    );
    assert.match(queries[1], /FROM app_installation/);
    assert.match(queries[1], /FOR UPDATE/);
  } finally {
    pool.connect = originalConnect;
  }
});
