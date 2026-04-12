const db = require("./config/db");
const data = require("../products.json")
// console.log(data);

data.categories.forEach((category) => {
  
  category.products.forEach((product) => {

    const query = `
      INSERT IGNORE INTO products 
      (id, name, description, price, discount, stock, rating, image, category, specifications, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      product.id,
      product.name,
      product.description,
      product.price,
      product.discount,
      product.stock,
      product.rating,
      product.images, // JSON had "images"
      category.id,    // from category
      JSON.stringify(product.specifications), // convert object → string
      JSON.stringify(product.tags)            // convert array → string
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        console.log("Error inserting:", product.id, err.message);
      } else {
        console.log("Inserted:", product.id);
      }
    });

  });
});