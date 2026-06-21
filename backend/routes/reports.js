const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  reportCreateValidation,
} = require("../validations/reportValidation");
const {
  listReports,
  createReport,
  getReport,
  deleteReport,
} = require("../controllers/reportController");

const router = express.Router();

router.get("/", authMiddleware, listReports);
router.post("/", authMiddleware, reportCreateValidation, validate, createReport);
router.get("/:id", authMiddleware, getReport);
router.delete("/:id", authMiddleware, deleteReport);

module.exports = router;
