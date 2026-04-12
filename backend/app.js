const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());


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

// middleware
app.use(cors({
  origin: "http://localhost:3000", // Required if frontend is making requests on a different port and needs credentials
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