-- Create the schema first
CREATE SCHEMA IF NOT EXISTS ecommerce AUTHORIZATION your_db_user;

-- USERS TABLE
CREATE TABLE ecommerce.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS TABLE
CREATE TABLE ecommerce.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES TABLE
CREATE TABLE ecommerce.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- PRODUCT_CATEGORIES TABLE (M:N)
CREATE TABLE ecommerce.product_categories (
    product_id INT NOT NULL REFERENCES ecommerce.products(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES ecommerce.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- CART_ITEMS TABLE
CREATE TABLE ecommerce.cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES ecommerce.users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES ecommerce.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ORDERS TABLE
CREATE TABLE ecommerce.orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES ecommerce.users(id),
    total NUMERIC(10,2) NOT NULL,
    status TEXT CHECK(status IN ('pending','completed')) DEFAULT 'pending',
    stripe_session_id VARCHAR(255),
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER_ITEMS TABLE
CREATE TABLE ecommerce.order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES ecommerce.orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES ecommerce.products(id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- TRIGGERS TO AUTOMATICALLY UPDATE updated_at
-- Function to update updated_at
CREATE OR REPLACE FUNCTION ecommerce.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Add trigger for users
CREATE TRIGGER trigger_users_updated
BEFORE UPDATE ON ecommerce.users
FOR EACH ROW EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- Add trigger for products
CREATE TRIGGER trigger_products_updated
BEFORE UPDATE ON ecommerce.products
FOR EACH ROW EXECUTE FUNCTION ecommerce.update_updated_at_column();

-- Add trigger for orders
CREATE TRIGGER trigger_orders_updated
BEFORE UPDATE ON ecommerce.orders
FOR EACH ROW EXECUTE FUNCTION ecommerce.update_updated_at_column();
