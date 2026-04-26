const express = require("express");
const router = express.Router();
const db = require("../config/db");

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Checkout: Convert cart into an order
router.post("/checkout", requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  // 1. Fetch current cart with validated prices
  const cartQuery = `
    SELECT c.product_id, c.quantity, p.price 
    FROM cart_items c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;
  
  db.query(cartQuery, [userId], (err, cartItems) => {
    if (err) return res.status(500).json({ error: "Failed to read cart" });
    if (cartItems.length === 0) return res.status(400).json({ error: "Your cart is empty. Please add items to checkout." });
    
    // 2. Mathematically calculate Secure Total Amount
    let totalAmount = 0;
    cartItems.forEach(item => {
      totalAmount += item.quantity * parseFloat(item.price);
    });
    
    // 3. Create Record in Orders
    const insertOrder = "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'success')";
    db.query(insertOrder, [userId, totalAmount], (err, orderResult) => {
      if (err) return res.status(500).json({ error: "Failed to create final order receipt" });
      
      const orderId = orderResult.insertId;
      
      // 4. Record Snapshot of Order Items
      const itemValues = cartItems.map(item => [orderId, item.product_id, item.quantity, item.price]);
      const insertItemsQuery = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ?";
      
      db.query(insertItemsQuery, [itemValues], (err) => {
        if (err) return res.status(500).json({ error: "Failed to save individual order items" });
        
        // 5. Purge cart on success
        db.query("DELETE FROM cart_items WHERE user_id = ?", [userId], (err) => {
          if (err) console.error("Warning: Cart clear failed for user", userId);
          return res.status(201).json({ message: "Order placed successfully!", orderId: orderId, totalAmount: totalAmount });
        });
      });
    });
  });
});

// Buy Now: Instant purchase of a single item
router.post("/buy-now", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: "Product ID required" });

  // 1. Fetch product and check stock
  db.query("SELECT * FROM products WHERE id = ?", [productId], (err, pRes) => {
    if (err || pRes.length === 0) return res.status(404).json({ error: "Product not found" });
    const product = pRes[0];

    if (product.stock < 1) return res.status(400).json({ error: "Out of stock!" });

    // 2. Create Order Record
    const totalAmount = parseFloat(product.price);
    const insertOrder = "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, 'success')";
    
    db.query(insertOrder, [userId, totalAmount], (err, orderResult) => {
      if (err) return res.status(500).json({ error: "Failed to create order" });
      
      const orderId = orderResult.insertId;

      // 3. Create Order Item Snapshot
      const insertItem = "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, 1, ?)";
      db.query(insertItem, [orderId, productId, product.price], (err) => {
        if (err) return res.status(500).json({ error: "Failed to save order item" });

        // 4. Deduct Stock
        db.query("UPDATE products SET stock = stock - 1 WHERE id = ?", [productId], (err) => {
          if (err) console.error("Warning: Stock deduction failed for Buy Now", productId);
          return res.status(201).json({ message: "Order placed successfully!", orderId: orderId, totalAmount: totalAmount });
        });
      });
    });
  });
});

// GET Order History structured data
router.get("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  const q = `
    SELECT 
      o.id as order_id, o.total_amount, o.created_at, o.status,
      oi.quantity, oi.price_at_purchase,
      p.name, p.image
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  
  db.query(q, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch orders" });
    
    // Group flat SQL results into structured nested array for UI
    const ordersMap = new Map();
    
    results.forEach(row => {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          order_id: row.order_id,
          total_amount: row.total_amount,
          created_at: row.created_at,
          status: row.status,
          items: []
        });
      }
      
      // Push line-items securely
      if (row.name) {
        ordersMap.get(row.order_id).items.push({
          name: row.name,
          image: row.image,
          quantity: row.quantity,
          price: row.price_at_purchase
        });
      }
    });
    
    const structuredOrders = Array.from(ordersMap.values());
    res.json(structuredOrders);
  });
});

module.exports = router;
