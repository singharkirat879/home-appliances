const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Admin Credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";

// Admin Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ message: "Admin logged in successfully" });
  } else {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }
});

// Admin Logout
router.post("/logout", (req, res) => {
  req.session.isAdmin = false;
  return res.json({ message: "Admin logged out" });
});

// Middleware to check if admin
const verifyAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized access" });
  }
};

// --- Product Management (Protected Routes) ---

// Get all products
router.get("/products", verifyAdmin, (req, res) => {
  const query = "SELECT * FROM products ORDER BY id DESC";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// Add a new product
router.post("/products", verifyAdmin, (req, res) => {
  const { name, description, price, discount, stock, rating, image, category, specifications, tags } = req.body;
  
  // Create a unique ID for the product (e.g., prod_ + timestamp)
  const id = "prod_" + Date.now();

  const query = `
    INSERT INTO products 
    (id, name, description, price, discount, stock, rating, image, category, specifications, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id,
    name,
    description,
    price || 0,
    discount || 0,
    stock || 0,
    rating || 0,
    image || '[]',
    category,
    specifications || '{}',
    tags || '[]'
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error adding product:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ message: "Product added successfully", id });
  });
});

// Edit a product
router.put("/products/:id", verifyAdmin, (req, res) => {
  const productId = req.params.id;
  const { name, description, price, discount, stock, rating, image, category, specifications, tags } = req.body;

  const query = `
    UPDATE products 
    SET name=?, description=?, price=?, discount=?, stock=?, rating=?, image=?, category=?, specifications=?, tags=?
    WHERE id=?
  `;

  const values = [
    name,
    description,
    price,
    discount,
    stock,
    rating,
    image,
    category,
    specifications,
    tags,
    productId
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating product:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Product updated successfully" });
  });
});

// Delete a product
router.delete("/products/:id", verifyAdmin, (req, res) => {
  const productId = req.params.id;
  const query = "DELETE FROM products WHERE id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Product deleted successfully" });
  });
});

// Check auth status
router.get("/status", (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

module.exports = router;
