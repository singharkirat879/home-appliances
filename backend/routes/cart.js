const express = require("express");
const router = express.Router();
const db = require("../config/db");

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// GET logged in user's cart
router.get("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const query = `
    SELECT c.id as cart_item_id, c.quantity, p.* 
    FROM cart_items c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// POST Add item to cart
router.post("/", requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { productId } = req.body;

  if (!productId) return res.status(400).json({ error: "Product ID required" });

  // 1. Check Product Stock
  db.query("SELECT stock FROM products WHERE id = ?", [productId], (err, pRes) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (pRes.length === 0) return res.status(404).json({ error: "Product not found" });
    if (pRes[0].stock < 1) return res.status(400).json({ error: "Out of stock!" });

    // 2. Reserve 1 stock
    db.query("UPDATE products SET stock = stock - 1 WHERE id = ?", [productId], (err) => {
      if (err) return res.status(500).json({ error: "Failed to reserve stock" });

      // 3. Add to Cart Items
      db.query("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?", [userId, productId], (err, results) => {
        if (results.length > 0) {
          const cartItemId = results[0].id;
          db.query("UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?", [cartItemId], (err) => {
            return res.json({ message: "Quantity increased" });
          });
        } else {
          db.query("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)", [userId, productId], (err) => {
            return res.status(201).json({ message: "Added to cart" });
          });
        }
      });
    });
  });
});

// PUT Update quantity
router.put("/:id", requireAuth, (req, res) => {
  const cartItemId = req.params.id;
  const { quantity } = req.body; // new target quantity
  const userId = req.session.userId;

  // 1. Get current cart quantity
  db.query("SELECT quantity, product_id FROM cart_items WHERE id = ? AND user_id = ?", [cartItemId, userId], (err, cRes) => {
    if (err || cRes.length === 0) return res.status(404).json({ error: "Cart item not found" });
    
    const currentQty = cRes[0].quantity;
    const productId = cRes[0].product_id;
    const diff = quantity - currentQty; // if increasing, diff > 0. if decreasing, diff < 0

    if (diff === 0) return res.json({ message: "No change" });

    // 2. If increasing, check stock
    if (diff > 0) {
      db.query("SELECT stock FROM products WHERE id = ?", [productId], (err, pRes) => {
        if (pRes[0].stock < diff) return res.status(400).json({ error: "Insufficient stock" });
        
        // Deduct from stock
        db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [diff, productId], () => {
          db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, cartItemId], () => {
            return res.json({ message: "Quantity updated" });
          });
        });
      });
    } else {
      // 3. If decreasing, restock the product! diff is negative, so we subtract negative (add).
      db.query("UPDATE products SET stock = stock - ? WHERE id = ?", [diff, productId], () => {
        if (quantity < 1) {
          db.query("DELETE FROM cart_items WHERE id = ?", [cartItemId], () => {
            return res.json({ message: "Item removed" });
          });
        } else {
          db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [quantity, cartItemId], () => {
            return res.json({ message: "Quantity decreased" });
          });
        }
      });
    }
  });
});

// DELETE remove item completely
router.delete("/:id", requireAuth, (req, res) => {
  const cartItemId = req.params.id;
  const userId = req.session.userId;

  // 1. Get current quantity to restock
  db.query("SELECT quantity, product_id FROM cart_items WHERE id = ? AND user_id = ?", [cartItemId, userId], (err, cRes) => {
    if (err || cRes.length === 0) return res.status(404).json({ error: "Not found in cart" });
    
    const qtyToRestore = cRes[0].quantity;
    const productId = cRes[0].product_id;

    // 2. Restock
    db.query("UPDATE products SET stock = stock + ? WHERE id = ?", [qtyToRestore, productId], () => {
      // 3. Delete
      db.query("DELETE FROM cart_items WHERE id = ?", [cartItemId], () => {
        return res.json({ message: "Item removed and stock restored" });
      });
    });
  });
});

module.exports = router;
