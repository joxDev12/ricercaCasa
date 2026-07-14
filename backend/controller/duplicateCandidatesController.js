const duplicateCandidateService = require("../services/duplicateCandidateService");

async function update(req, res, next) {
  try {
    const candidate = await duplicateCandidateService.applyDecision(
      req.params.id,
      req.body.decision
    );
    res.json({ data: candidate });
  } catch (error) {
    next(error);
  }
}

module.exports = { update };
