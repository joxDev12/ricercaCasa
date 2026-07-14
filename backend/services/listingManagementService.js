const { pool } = require("../config/db");
const listingAppointmentRepository = require("../models/listingAppointmentRepository");
const listingImageRepository = require("../models/listingImageRepository");
const listingNoteRepository = require("../models/listingNoteRepository");
const propertyGroupRepository = require("../models/propertyGroupRepository");
const savedListingRepository = require("../models/savedListingRepository");
const duplicateCandidateRepository = require("../models/duplicateCandidateRepository");
const { NotFoundError } = require("../utils/errors");
const listingEnrichmentService = require("./listingEnrichmentService");

async function getPropertyContext(listingId) {
  const listing = await savedListingRepository.getFavoriteById(pool, listingId);

  if (!listing) {
    throw new NotFoundError("Preferito non trovato");
  }

  return listing;
}

function withSimilarityLabel(candidate) {
  const label =
    candidate.score >= 0.85
      ? "alta"
      : candidate.score >= 0.7
        ? "media"
        : "bassa";

  return {
    ...candidate,
    similarityLabel: label,
  };
}

async function getFavoriteById(listingId) {
  const listing = await getPropertyContext(listingId);
  const representative =
    (await savedListingRepository.findRepresentativeByGroupId(
      pool,
      listing.propertyGroupId,
      listingId
    )) || listing;
  const [sources, images, notes, appointments, duplicateCandidates, enriched] =
    await Promise.all([
      savedListingRepository.listByPropertyGroupId(pool, listing.propertyGroupId),
      listingImageRepository.findByListingId(pool, representative.id),
      listingNoteRepository.listByGroupId(pool, listing.propertyGroupId),
      listingAppointmentRepository.listByGroupId(pool, listing.propertyGroupId),
      duplicateCandidateRepository.listPendingByGroupId(pool, listing.propertyGroupId),
      listingEnrichmentService.enrichListing(representative),
    ]);

  const enrichedSources = sources.map((source) =>
    source.id === representative.id ? enriched : source
  );
  const enrichedImages = enriched.images?.length ? enriched.images : images;

  return {
    id: enriched.id,
    propertyGroupId: listing.propertyGroupId,
    managementStatus: listing.managementStatus,
    representativeListing: enriched,
    sources: enrichedSources,
    images: enrichedImages,
    notes,
    appointments,
    duplicateCandidates: duplicateCandidates.map(withSimilarityLabel),
  };
}

async function updateStatus(listingId, status) {
  const listing = await getPropertyContext(listingId);
  const group = await propertyGroupRepository.updateStatus(
    pool,
    listing.propertyGroupId,
    status
  );

  if (!group) {
    throw new NotFoundError("Immobile non trovato");
  }

  return group;
}

async function createNote(listingId, body) {
  const listing = await getPropertyContext(listingId);
  return listingNoteRepository.create(pool, listing.propertyGroupId, body.trim());
}

async function updateNote(listingId, noteId, body) {
  const listing = await getPropertyContext(listingId);
  const note = await listingNoteRepository.update(
    pool,
    noteId,
    listing.propertyGroupId,
    body.trim()
  );

  if (!note) {
    throw new NotFoundError("Nota non trovata");
  }

  return note;
}

async function deleteNote(listingId, noteId) {
  const listing = await getPropertyContext(listingId);
  const deleted = await listingNoteRepository.remove(
    pool,
    noteId,
    listing.propertyGroupId
  );

  if (!deleted) {
    throw new NotFoundError("Nota non trovata");
  }

  return deleted;
}

async function createAppointment(listingId, input) {
  const listing = await getPropertyContext(listingId);
  return listingAppointmentRepository.create(pool, listing.propertyGroupId, input);
}

async function updateAppointment(listingId, appointmentId, input) {
  const listing = await getPropertyContext(listingId);
  const appointment = await listingAppointmentRepository.update(
    pool,
    appointmentId,
    listing.propertyGroupId,
    input
  );

  if (!appointment) {
    throw new NotFoundError("Appuntamento non trovato");
  }

  return appointment;
}

async function deleteAppointment(listingId, appointmentId) {
  const listing = await getPropertyContext(listingId);
  const deleted = await listingAppointmentRepository.remove(
    pool,
    appointmentId,
    listing.propertyGroupId
  );

  if (!deleted) {
    throw new NotFoundError("Appuntamento non trovato");
  }

  return deleted;
}

module.exports = {
  createAppointment,
  createNote,
  deleteAppointment,
  deleteNote,
  getFavoriteById,
  updateAppointment,
  updateNote,
  updateStatus,
};
