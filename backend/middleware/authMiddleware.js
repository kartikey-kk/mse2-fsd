const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.id).select("-password");
    if (!student) {
      return res.status(401).json({ message: "Unauthorized: invalid user" });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

module.exports = authMiddleware;
