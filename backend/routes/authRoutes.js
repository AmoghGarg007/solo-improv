const express = require("express");
const router = express.Router();
const User = require("../models/users");

// Validate SRN format: pes(1|2)ug(22-25)(cs|am|ec)(3 digits)
// Example: pes1ug22cs001
const validateSRN = (srn) => {
  const regex = /^pes[12]ug(2[2-5])(cs|am|ec)\d{3}$/i;
  return regex.test(srn);
};

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { srn, password } = req.body;

  if (!srn || !password) {
    return res.status(400).json({ message: "SRN and password are required" });
  }

  if (!validateSRN(srn)) {
    return res.status(400).json({
      message: "Invalid SRN format. Expected format: pes1ug22cs001"
    });
  }

  try {
    const existingUser = await User.findOne({ srn: srn.toLowerCase() });

    // ✅ User exists — check password
    if (existingUser) {
      if (existingUser.password !== password) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      return res.json({
        message: "Login successful",
        user: {
          id: existingUser._id,
          name: existingUser.name,
          srn: existingUser.srn,
          interests: existingUser.interests,
          joinedGroups: existingUser.joinedGroups
        }
      });
    }

    // ✅ User doesn't exist — create them with password as name
    const newUser = new User({
      srn: srn.toLowerCase(),
      name: password,
      password: password
    });

    const saved = await newUser.save();

    return res.status(201).json({
      message: "Account created and logged in",
      user: {
        id: saved._id,
        name: saved.name,
        srn: saved.srn,
        interests: saved.interests,
        joinedGroups: saved.joinedGroups
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
