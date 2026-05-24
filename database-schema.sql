-- Xongle Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'reseller', 'admin');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'pending_approval');
CREATE TYPE group_buy_status AS ENUM ('active', 'completed', 'expired', 'cancelled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  role user_role DEFAULT 'buyer' NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PRODUCTS TABLE
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  category VARCHAR(100) NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  status product_status DEFAULT 'pending_approval',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. GROUP BUYS TABLE
CREATE TABLE group_buys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status group_buy_status DEFAULT 'active',
  member_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. GROUP MEMBERS TABLE
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_buy_id, user_id)
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. REFERRALS TABLE
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_code VARCHAR(50) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. COUPONS TABLE
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_percent INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  used_on_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. FESTIVAL BOOSTS TABLE
CREATE TABLE festival_boosts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  extra_discount INTEGER NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Group buys indexes
CREATE INDEX idx_group_buys_product_id ON group_buys(product_id);
CREATE INDEX idx_group_buys_creator_id ON group_buys(creator_id);
CREATE INDEX idx_group_buys_status ON group_buys(status);
CREATE INDEX idx_group_buys_expires_at ON group_buys(expires_at);

-- Group members indexes
CREATE INDEX idx_group_members_group_buy_id ON group_members(group_buy_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_group_buy_id ON orders(group_buy_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Referrals indexes
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_used ON referrals(used);

-- Coupons indexes
CREATE INDEX idx_coupons_user_id ON coupons(user_id);
CREATE INDEX idx_coupons_expires_at ON coupons(expires_at);
CREATE INDEX idx_coupons_used ON coupons(used);

-- Festival boosts indexes
CREATE INDEX idx_festival_boosts_active ON festival_boosts(active);
CREATE INDEX idx_festival_boosts_dates ON festival_boosts(start_date, end_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_boosts ENABLE ROW LEVEL SECURITY;

-- USERS RLS
-- Users can see their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text OR TRUE); -- Allow public read for now (for searching sellers)

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- PRODUCTS RLS
-- Everyone can view active and approved products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (status = 'active');

-- Sellers can view their own products
CREATE POLICY "Sellers can view their own products"
  ON products FOR SELECT
  USING (auth.uid()::text = seller_id::text);

-- Sellers can insert products
CREATE POLICY "Sellers can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid()::text = seller_id::text AND (SELECT role FROM users WHERE id = auth.uid()::uuid) IN ('seller', 'reseller'));

-- Sellers can update their own products
CREATE POLICY "Sellers can update their own products"
  ON products FOR UPDATE
  USING (auth.uid()::text = seller_id::text);

-- GROUP BUYS RLS
-- Everyone can view active group buys
CREATE POLICY "Anyone can view active group buys"
  ON group_buys FOR SELECT
  USING (status IN ('active', 'completed'));

-- Authenticated users can create group buys
CREATE POLICY "Authenticated users can create group buys"
  ON group_buys FOR INSERT
  WITH CHECK (auth.uid()::text = creator_id::text);

-- GROUP MEMBERS RLS
-- Users can view members of groups they're part of
CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()::uuid OR
    group_buy_id IN (
      SELECT group_buy_id FROM group_members WHERE user_id = auth.uid()::uuid
    )
  );

-- Users can join group buys
CREATE POLICY "Users can join group buys"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- ORDERS RLS
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view orders for their products"
  ON orders FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()::uuid
    )
  );

-- Users can create orders
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- REFERRALS RLS
-- Users can view their referrals
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  USING (
    auth.uid()::text = referrer_id::text OR
    auth.uid()::text = referred_id::text
  );

-- COUPONS RLS
-- Users can view their own coupons
CREATE POLICY "Users can view their own coupons"
  ON coupons FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- FESTIVAL BOOSTS RLS
-- Everyone can view active festival boosts
CREATE POLICY "Anyone can view active festival boosts"
  ON festival_boosts FOR SELECT
  USING (active = TRUE);

-- Admins can manage festival boosts
CREATE POLICY "Admins can manage festival boosts"
  ON festival_boosts FOR ALL
  USING ((SELECT role FROM users WHERE id = auth.uid()::uuid) = 'admin');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to seed test data:
/*
-- Insert test users
INSERT INTO users (phone, name, role, referral_code) VALUES
('9876543210', 'Raj Kumar', 'buyer', 'RAJ123'),
('9876543211', 'Priya Sharma', 'seller', 'PRIYA456'),
('9876543212', 'Amit Patel', 'reseller', 'AMIT789'),
('9876543213', 'Admin User', 'admin', 'ADMIN000');

-- Insert test products
INSERT INTO products (seller_id, name, description, price, category, discount_percent, status) VALUES
((SELECT id FROM users WHERE phone = '9876543211'), 'Organic Rice 5kg', 'Premium basmati rice', 500, 'grocery', 15, 'active'),
((SELECT id FROM users WHERE phone = '9876543211'), 'Dal Mix 1kg', 'Mixed pulses pack', 200, 'grocery', 10, 'active');
*/

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Replace auth.uid() with actual user ID when not using Supabase Auth
-- 2. Adjust RLS policies based on your specific authentication setup
-- 3. Add more indexes if you identify performance bottlenecks
-- 4. Update festival_boosts table to link to specific categories if needed
-- 5. Consider adding a commission_history table for tracking seller payouts
