const { pool } = require("../config/db");
const duplicateCandidateRepository = require("../models/duplicateCandidateRepository");
const propertyGroupRepository = require("../models/propertyGroupRepository");
const savedListingRepository = require("../models/savedListingRepository");
const { NotFoundError } = require("../utils/errors");

async function mergePropertyGroups(client, sourceGroupId, targetGroupId) {
  if (sourceGroupId === targetGroupId) {
    return;
  }

  const destination = Math.min(sourceGroupId, targetGroupId);
  const source = Math.max(sourceGroupId, targetGroupId);

  await client.query(
    `SELECT id
     FROM property_groups
     WHERE id IN ($1, $2)
     ORDER BY id
     FOR UPDATE`,
    [destination, source]
  );
  await client.query(
    `UPDATE listing_notes
     SET property_group_id = $2, updated_at = now()
     WHERE property_group_id = $1`,
    [source, destination]
  );
  await client.query(
    `UPDATE listing_appointments
     SET property_group_id = $2, updated_at = now()
     WHERE property_group_id = $1`,
    [source, destination]
  );
  await savedListingRepository.moveGroupListings(client, source, destination);
  await propertyGroupRepository.deleteEmpty(client, source);
}

async function applyDecision(candidateId, decision) {
  const candidate = await duplicateCandidateRepository.findById(pool, candidateId);

  if (!candidate) {
    throw new NotFoundError("Candidato duplicato non trovato");
  }

  if (decision === "rejected") {
    return duplicateCandidateRepository.updateStatus(pool, candidateId, "rejected");
  }

  const firstListing = await savedListingRepository.getFavoriteById(pool, candidate.listingAId);
  const secondListing = await savedListingRepository.getFavoriteById(pool, candidate.listingBId);

  if (!firstListing || !secondListing) {
    throw new NotFoundError("Annuncio collegato non trovato");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await mergePropertyGroups(
      client,
      firstListing.propertyGroupId,
      secondListing.propertyGroupId
    );
    const updated = await duplicateCandidateRepository.updateStatus(
      client,
      candidateId,
      "confirmed"
    );
    await client.query("COMMIT");
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { applyDecision };
