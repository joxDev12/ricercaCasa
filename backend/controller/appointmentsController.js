const listingManagementService = require("../services/listingManagementService");

async function create(req, res, next) {
  try {
    const appointment = await listingManagementService.createAppointment(
      req.params.id,
      req.body
    );
    res.status(201).json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const appointment = await listingManagementService.updateAppointment(
      req.params.id,
      req.params.appointmentId,
      req.body
    );
    res.json({ data: appointment });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await listingManagementService.deleteAppointment(
      req.params.id,
      req.params.appointmentId
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, destroy, update };
