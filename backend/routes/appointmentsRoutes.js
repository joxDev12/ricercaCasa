const express = require("express");
const appointmentsController = require("../controller/appointmentsController");
const { validate } = require("../middleware/validate");
const {
  appointmentRouteValidators,
  createAppointmentValidators,
  updateAppointmentValidators,
} = require("../validators/appointmentValidators");

const router = express.Router({ mergeParams: true });

router.post("/", createAppointmentValidators, validate, appointmentsController.create);
router.patch(
  "/:appointmentId",
  updateAppointmentValidators,
  validate,
  appointmentsController.update
);
router.delete(
  "/:appointmentId",
  appointmentRouteValidators,
  validate,
  appointmentsController.destroy
);

module.exports = router;
