const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render requires SSL
});

async function testFullDB() {
  try {
    await pool.connect();

    console.log("--- TESTING USERS TABLE ---");
    // Create user
    const user = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      ["Test User", "testuser@example.com", "securepassword"]
    );
    const userId = user.rows[0].id;
    console.log("✅ User inserted:", userId);

    // Read user
    const readUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    console.log("✅ User read:", readUser.rows[0]);

    // Update user
    await pool.query("UPDATE users SET name = $1 WHERE id = $2", [
      "Updated User",
      userId,
    ]);
    console.log("✅ User updated");

    console.log("--- TESTING PRODUCTS TABLE ---");
    const product = await pool.query(
      "INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Test Product", "Test description", 9.99, 10]
    );
    const productId = product.rows[0].id;
    console.log("✅ Product inserted:", productId);

    const readProduct = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [productId]
    );
    console.log("✅ Product read:", readProduct.rows[0]);

    await pool.query("UPDATE products SET stock = $1 WHERE id = $2", [
      20,
      productId,
    ]);
    console.log("✅ Product updated");

    console.log("--- TESTING CATEGORIES TABLE ---");
    const category = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING id",
      ["Test Category"]
    );
    const categoryId = category.rows[0].id;
    console.log("✅ Category inserted:", categoryId);

    console.log("--- TESTING PRODUCT_CATEGORIES TABLE ---");
    await pool.query(
      "INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2)",
      [productId, categoryId]
    );
    console.log("✅ Product linked to category");

    console.log("--- TESTING CART_ITEMS TABLE ---");
    const cartItem = await pool.query(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id",
      [userId, productId, 2]
    );
    const cartItemId = cartItem.rows[0].id;
    console.log("✅ Cart item inserted:", cartItemId);

    console.log("--- TESTING ORDERS AND ORDER_ITEMS TABLE ---");
    const order = await pool.query(
      "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id",
      [userId, 19.98, "pending"]
    );
    const orderId = order.rows[0].id;
    console.log("✅ Order inserted:", orderId);

    const orderItem = await pool.query(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING id",
      [orderId, productId, 2, 9.99]
    );
    console.log("✅ Order item inserted:", orderItem.rows[0].id);

    console.log("--- TESTING READS ---");
    const ordersRead = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    console.log("✅ Order read:", ordersRead.rows[0]);

    const orderItemsRead = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [orderId]
    );
    console.log("✅ Order items read:", orderItemsRead.rows);

    console.log("--- CLEANING UP ---");
    await pool.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
    await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
    await pool.query("DELETE FROM cart_items WHERE id = $1", [cartItemId]);
    await pool.query(
      "DELETE FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, categoryId]
    );
    await pool.query("DELETE FROM categories WHERE id = $1", [categoryId]);
    await pool.query("DELETE FROM products WHERE id = $1", [productId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    console.log("✅ Cleanup complete. All tests passed!");
  } catch (err) {
    console.error("❌ Database test failed:", err);
  } finally {
    await pool.end();
  }
}

testFullDB();
