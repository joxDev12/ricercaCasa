const { body, param } = require("express-validator");

const appointmentBodyValidators = [
  body("scheduledAt").isISO8601(),
  body("status").optional().isIn(["scheduled", "completed", "cancelled"]),
  body("locationText").optional({ values: "null" }).trim().isLength({ max: 500 }),
  body("notes").optional({ values: "null" }).trim().isLength({ max: 5000 }),
];

const createAppointmentValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  ...appointmentBodyValidators,
];

const updateAppointmentValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  param("appointmentId").isInt({ min: 1 }).toInt(),
  ...appointmentBodyValidators,
];

const appointmentRouteValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  param("appointmentId").isInt({ min: 1 }).toInt(),
];

module.exports = {
  appointmentRouteValidators,
  createAppointmentValidators,
  updateAppointmentValidators,
};
