# Campus_Canteen
A dual-portal web app for campus food courts: students browse menus, place orders, and manage wallets; vendors update menus, track availability, and process orders in real time. It streamlines dining, reduces queues, and provides analytics for smarter, faster, and more efficient service.



# ✨ Key Features
## 🎓 For Students (Customers)
- Centralized Vendor Directory: Browse a marketplace of all available on-campus eateries (e.g., Burger Joint, Fruits N Shakes, Ice Parlor).

- Digital Wallet Integration: View real-time account balances directly from the dashboard to track spending.

- Seamless Ordering: Add items to a cart and place orders securely.

- Order Tracking: View a comprehensive order history with real-time status updates (e.g., Pending, Accepted).

## 🏪 For Vendors (Store Owners)
- Live Order Queue: Monitor incoming orders in real-time with customer details, item summaries, and total order values.

- Quick Order Processing: One-click "Accept" or "Cancel" actions for pending orders.

- Dynamic Menu Management: * Add, edit, or delete menu items.

- Categorize food items (e.g., Main, Sides, Drinks).

- Instantly toggle item availability (Available/Unavailable) to prevent orders for out-of-stock items.

- Store Status Toggle: Easily open or close the store to control when students can place new orders.


## 🛠️ Built With

- Frontend Framework: React.js

- Build Tool: Vite

- Styling: Tailwind CSS

- Backend & Database: Supabase (PostgreSQL & Authentication)


# Getting Started 

## Prereq
- Node.js
- npm
- Supabase account with necessary tables

## Steps
- run npm install
- Create .env file at root of your project and fill your api keys
    - VITE_SUPABASE_URL=your_supabase_project_url
    - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
 - Run npm run dev

