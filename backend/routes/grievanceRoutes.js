const express = require("express");
const Grievance = require("../models/Grievance");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All grievance routes are protected
router.use(authMiddleware);

// POST /api/grievances → Submit a grievance
router.post("/", async (req, res) => {
  try {
    const { title, description, category, date } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "Title, description, and category are required" });
    }

    const validCategories = ["Academic", "Hostel", "Transport", "Other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const grievance = await Grievance.create({
      student: req.student._id,
      title,
      description,
      category,
      date: date || Date.now(),
    });

    return res.status(201).json({ message: "Grievance submitted successfully", grievance });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit grievance", error: error.message });
  }
});

// GET /api/grievances/search?title=xyz → Search grievances by title (must be before /:id)
router.get("/search", async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({ message: "Search query 'title' is required" });
    }

    const grievances = await Grievance.find({
      student: req.student._id,
      title: { $regex: title, $options: "i" },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ grievances });
  } catch (error) {
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
});

// GET /api/grievances → View all grievances for logged-in student
router.get("/", async (req, res) => {
  try {
    const grievances = await Grievance.find({ student: req.student._id }).sort({ createdAt: -1 });
    return res.status(200).json({ grievances });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch grievances", error: error.message });
  }
});

// GET /api/grievances/:id → View single grievance by ID
router.get("/:id", async (req, res) => {
  try {
    const grievance = await Grievance.findOne({
      _id: req.params.id,
      student: req.student._id,
    });

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    return res.status(200).json({ grievance });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch grievance", error: error.message });
  }
});

// PUT /api/grievances/:id → Update grievance
router.put("/:id", async (req, res) => {
  try {
    const { title, description, category, status } = req.body;

    const validCategories = ["Academic", "Hostel", "Transport", "Other"];
    const validStatuses = ["Pending", "Resolved"];

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const update = {};
    if (title) update.title = title;
    if (description) update.description = description;
    if (category) update.category = category;
    if (status) update.status = status;

    const grievance = await Grievance.findOneAndUpdate(
      { _id: req.params.id, student: req.student._id },
      update,
      { new: true }
    );

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    return res.status(200).json({ message: "Grievance updated successfully", grievance });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update grievance", error: error.message });
  }
});

// DELETE /api/grievances/:id → Delete grievance
router.delete("/:id", async (req, res) => {
  try {
    const grievance = await Grievance.findOneAndDelete({
      _id: req.params.id,
      student: req.student._id,
    });

    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    return res.status(200).json({ message: "Grievance deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete grievance", error: error.message });
  }
});

module.exports = router;
