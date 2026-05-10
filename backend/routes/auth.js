const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

// Register User
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Name Validation
  if (name.trim().length === 0) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }

  // Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address" });
  }

  // Password Validation
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Check if user already exists
    db.query("SELECT email FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password for security
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
      db.query(query, [name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("DB error:", err);
          return res.status(500).json({ error: "Database error" });
        }
        return res.status(201).json({ message: "User registered successfully" });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login User
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Both email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email format" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" }); // User not found
    }

    const user = results[0];

    try {
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Initialize session for user
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };

      return res.json({ message: "Logged in successfully", user: req.session.user });
    } catch (error) {
      console.error("Bcrypt compare error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
});

// Logout User
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ error: "Could not log out, please try again" });
    }

    // Clear the session cookie from the client
    res.clearCookie('session_cookie_name');
    return res.json({ message: "Logged out successfully" });
  });
});

// Get Current User (Me)
router.get("/me", (req, res) => {
  // If session object exists and it contains a user, return it
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  } else {
    return res.status(401).json({ error: "Not authenticated" });
  }
});

module.exports = router;
