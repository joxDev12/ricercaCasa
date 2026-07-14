const { pool } = require("../config/db");
const appInstallationRepository = require("../models/appInstallationRepository");
const featureSetupTaskRepository = require("../models/featureSetupTaskRepository");
const userPreferencesRepository = require("../models/userPreferencesRepository");
const { AppError } = require("../utils/errors");
const { normalizeProfileInput } = require("./settingsService");

async function getStatus() {
  const [installation, preferences, pendingTasks] = await Promise.all([
    appInstallationRepository.getSingleton(pool),
    userPreferencesRepository.getSingleton(pool),
    featureSetupTaskRepository.listPending(pool),
  ]);

  return {
    installation,
    preferences,
    pendingTasks,
    completed: installation?.setupStatus === "completed",
  };
}

async function completeSetup(input, installedVersion) {
  const normalized = normalizeProfileInput(input);
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const installationBeforeUpdate = await appInstallationRepository.getSingleton(client, {
      forUpdate: true,
    });

    if (installationBeforeUpdate?.setupStatus === "completed") {
      throw new AppError("Setup gia completato", 409, "SETUP_ALREADY_COMPLETED");
    }

    const preferences = await userPreferencesRepository.updateSingleton(client, normalized);
    const installation = await appInstallationRepository.completeSetup(
      client,
      installedVersion
    );
    await client.query("COMMIT");

    return { installation, preferences };
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { completeSetup, getStatus };
