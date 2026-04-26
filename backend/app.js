const express = require("express");
const cors = require("cors");
const app = express();



require("dotenv").config();
const db = require("./config/db");

// Import session related packages
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

// Setup session store
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000,       // How frequently expired sessions will be cleared (ms)
  expiration: 86400000,                  // The maximum age of a valid session (ms) - 1 day
  createDatabaseTable: true              // Automatically create "sessions" table
}, db); // Use the existing DB connection

app.get("/api/products", (req, res) => {
  const query = "SELECT * FROM products";

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(result);
  });
});

app.get("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const query = "SELECT * FROM products WHERE id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result[0]);
  });
});

// middleware
const allowedOrigins = ["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:3000"];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Session middleware
app.use(session({
  key: "session_cookie_name",
  secret: process.env.SESSION_SECRET || "fallback_secret_key_123",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Must be false if testing over HTTP. Change to true for HTTPS.
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    maxAge: 86400000, // Cookie expiration time (1 day in milliseconds)
  }
}));

// API Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const cartRoutes = require("./routes/cart");
app.use("/api/cart", cartRoutes);

const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);


const path = require("path");

// Frontend Static Assets
app.use("/CSS", express.static(path.join(__dirname, "../CSS")));
app.use("/JS", express.static(path.join(__dirname, "../JS")));
app.use("/images", express.static(path.join(__dirname, "../images")));

// Serve HTML pages on root
app.use("/", express.static(path.join(__dirname, "../HTML"), { extensions: ["html"] }));

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API working" });
});

// server start
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});