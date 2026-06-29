
-- 1. Tables Setup
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu CASCADE;
DROP TABLE IF EXISTS public.student CASCADE;
DROP TABLE IF EXISTS public.vendor CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;

CREATE TABLE public.student (
    studentid text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    balance numeric DEFAULT 0,
    password text NOT NULL
);

CREATE TABLE public.vendor (
    vendorid text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    open boolean DEFAULT true,
    password text NOT NULL
);

CREATE TABLE public.items (
    itemid SERIAL NOT NULL PRIMARY KEY,
    name text NOT NULL,
    price numeric NOT NULL CHECK (price > 0),
    category text,
    type text
);

CREATE TABLE public.menu (
    vendorid text NOT NULL REFERENCES public.vendor(vendorid),
    itemid integer NOT NULL REFERENCES public.items(itemid),
    status text,
    PRIMARY KEY (vendorid, itemid)
);

CREATE TABLE public.orders (
    orderid SERIAL NOT NULL PRIMARY KEY,
    quantity integer NOT NULL,
    total numeric NOT NULL,
    time timestamp without time zone DEFAULT now(),
    status text,
    studentid text REFERENCES public.student(studentid),
    itemid integer REFERENCES public.items(itemid),
    vendorid text REFERENCES public.vendor(vendorid)
);

-- 2. RPC Functions
-- Login Student
CREATE OR REPLACE FUNCTION login_student(p_studentid text, p_password text)
RETURNS TABLE(studentid text, name text, balance numeric) LANGUAGE sql AS $$
  SELECT studentid, name, balance FROM public.student WHERE studentid = p_studentid AND password = p_password;
$$;

-- Get Student Details
CREATE OR REPLACE FUNCTION get_student_details(p_studentid text)
RETURNS TABLE(studentid text, name text, balance numeric) LANGUAGE sql AS $$
  SELECT studentid, name, balance FROM public.student WHERE studentid = p_studentid;
$$;

-- Login Vendor
CREATE OR REPLACE FUNCTION login_vendor(p_vendorid text, p_password text)
RETURNS TABLE(vendorid text, name text, open boolean) LANGUAGE sql AS $$
  SELECT vendorid, name, open FROM public.vendor WHERE vendorid = p_vendorid AND password = p_password;
$$;

-- Get Vendors
CREATE OR REPLACE FUNCTION get_vendors()
RETURNS TABLE(vendorid text, name text, open boolean) LANGUAGE sql AS $$
  SELECT vendorid, name, open FROM public.vendor WHERE open = true;
$$;

-- Get Vendor Details
CREATE OR REPLACE FUNCTION get_vendor_details(p_vendorid text)
RETURNS TABLE(vendorid text, name text, open boolean) LANGUAGE sql AS $$
  SELECT vendorid, name, open FROM public.vendor WHERE vendorid = p_vendorid;
$$;

-- Update Vendor Status
CREATE OR REPLACE FUNCTION update_vendor_status(p_vendorid text, p_status boolean)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.vendor SET open = p_status WHERE vendorid = p_vendorid;
$$;

-- Get Menu
CREATE OR REPLACE FUNCTION get_menu(p_vendorid text)
RETURNS TABLE(itemid integer, name text, price numeric, category text, type text, status text) LANGUAGE sql AS $$
  SELECT i.itemid, i.name, i.price, i.category, i.type, m.status 
  FROM public.items i
  JOIN public.menu m ON i.itemid = m.itemid
  WHERE m.vendorid = p_vendorid;
$$;

-- Get Available Menu (For Students)
CREATE OR REPLACE FUNCTION get_available_menu(p_vendorid text)
RETURNS TABLE(itemid integer, name text, price numeric, category text, type text, status text) LANGUAGE sql AS $$
  SELECT i.itemid, i.name, i.price, i.category, i.type, m.status 
  FROM public.items i
  JOIN public.menu m ON i.itemid = m.itemid
  WHERE m.vendorid = p_vendorid AND m.status = 'available';
$$;

-- Update Menu Status
CREATE OR REPLACE FUNCTION update_menu_status(p_vendorid text, p_itemid integer, p_status text)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.menu 
  SET status = p_status 
  WHERE vendorid = p_vendorid AND itemid = p_itemid;
$$;

-- Delete Vendor Item
CREATE OR REPLACE FUNCTION delete_vendor_item(p_vendorid text, p_itemid integer)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM public.menu 
  WHERE vendorid = p_vendorid AND itemid = p_itemid;
$$;

-- Add Vendor Item
CREATE OR REPLACE FUNCTION add_vendor_item(p_vendorid text, p_name text, p_price numeric, p_category text, p_type text)
RETURNS void LANGUAGE sql AS $$
  WITH new_item AS (
    INSERT INTO public.items (name, price, category, type)
    VALUES (p_name, p_price, p_category, p_type)
    RETURNING itemid
  )
  INSERT INTO public.menu (vendorid, itemid, status)
  SELECT p_vendorid, itemid, 'available'
  FROM new_item;
$$;

-- Place Order
CREATE OR REPLACE FUNCTION place_order(p_studentid text, p_vendorid text, p_itemid integer, p_quantity integer)
RETURNS void LANGUAGE sql AS $$
  WITH item_price AS (
    SELECT price FROM public.items WHERE itemid = p_itemid
  ),
  new_order AS (
    INSERT INTO public.orders (studentid, vendorid, itemid, quantity, total, status, time)
    SELECT p_studentid, p_vendorid, p_itemid, p_quantity, (price * p_quantity), 'pending', timezone('Asia/Kolkata', now())
    FROM item_price
    RETURNING total
  )
  UPDATE public.student
  SET balance = COALESCE(balance, 0) + (SELECT total FROM new_order)
  WHERE studentid = p_studentid;
$$;

-- Get Student Orders
CREATE OR REPLACE FUNCTION get_student_orders(p_studentid text)
RETURNS TABLE(orderid integer, item_name text, vendor_name text, quantity integer, total numeric, status text, order_time timestamp) LANGUAGE sql AS $$
  SELECT o.orderid, i.name, v.name, o.quantity, o.total, o.status, o.time
  FROM public.orders o
  JOIN public.items i ON o.itemid = i.itemid
  JOIN public.vendor v ON o.vendorid = v.vendorid
  WHERE o.studentid = p_studentid
  ORDER BY o.time DESC;
$$;

-- Get Vendor Orders
CREATE OR REPLACE FUNCTION get_vendor_orders(p_vendorid text)
RETURNS TABLE(orderid integer, item_name text, student_name text, quantity integer, total numeric, status text, order_time timestamp) LANGUAGE sql AS $$
  SELECT o.orderid, i.name, s.name, o.quantity, o.total, o.status, o.time
  FROM public.orders o
  JOIN public.items i ON o.itemid = i.itemid
  JOIN public.student s ON o.studentid = s.studentid
  WHERE o.vendorid = p_vendorid
  ORDER BY o.time DESC;
$$;

-- Update Order Status
CREATE OR REPLACE FUNCTION update_order_status(p_orderid integer, p_status text)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.orders SET status = p_status WHERE orderid = p_orderid;
$$;

-- Cancel Order (Pure SQL)
CREATE OR REPLACE FUNCTION cancel_order(p_orderid integer)
RETURNS void LANGUAGE sql AS $$
  WITH updated_order AS (
    UPDATE public.orders
    SET status = 'cancelled'
    WHERE orderid = p_orderid
    RETURNING total, studentid
  )
  UPDATE public.student
  SET balance = balance - (SELECT total FROM updated_order)
  WHERE studentid = (SELECT studentid FROM updated_order);
$$;

-- 3. Seed Data (Optional)
INSERT INTO public.student (studentid, name, balance, password) VALUES
('s1', 'Arnav', 0, 'pass123');

INSERT INTO public.vendor (vendorid, name, open, password) VALUES
('v1', 'Pizza Place', true, 'vendor1'),
('v2', 'Burger Joint', false, 'vendor2');

INSERT INTO public.items (name, price, category, type) VALUES
('Margherita Pizza', 12.5, 'Main', 'Veg'),
('Pepperoni Pizza', 15.0, 'Main', 'Non-Veg'),
('Coke', 2.0, 'Drink', 'Veg'),
('Cheeseburger', 8.0, 'Main', 'Non-Veg');

INSERT INTO public.menu (vendorid, itemid, status) VALUES
('v1', 1, 'available'),
('v1', 2, 'available'),
('v1', 3, 'available'),
('v2', 4, 'available'),
('v2', 3, 'available');
