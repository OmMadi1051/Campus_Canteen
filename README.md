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
 - Run schema.sql in sql editor of your Supabase account to make required tables.
 - Run npm run dev

# Interface 
<img width="700" height="400" alt="Screenshot 2026-06-29 114743" src="https://github.com/user-attachments/assets/d9e85bcb-f4d7-4b8d-81bb-113de821b5b5" /> 
<img width="700" height="400" alt="Screenshot 2026-06-29 114808" src="https://github.com/user-attachments/assets/45d58751-9e2e-49f7-8af0-f048b632a08e" />
<img width="700" height="400" alt="Screenshot 2026-06-29 114833" src="https://github.com/user-attachments/assets/1632529c-0e71-4ba1-9b7b-0efa20a72f06" />
<img width="700" height="400" alt="Screenshot 2026-06-29 114903" src="https://github.com/user-attachments/assets/b2b517fc-0203-4958-9bce-d556a405f123" />
<img width="700" height="400" alt="Screenshot 2026-06-29 114934" src="https://github.com/user-attachments/assets/e5abd0b8-6c28-4aea-8213-d05561ac5ef3" />

## Schema
<img width="630" height="450" alt="Screenshot 2026-06-29 115934" src="https://github.com/user-attachments/assets/7dfb0138-4284-4609-8792-fe51104c16fb" />





