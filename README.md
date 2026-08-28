# Neighborhood Foodshare

A real-time logistics and menu coordination app built to streamline weekly dinner scheduling, customer manifests, and routes for a local meal-delivery operation.

## The Problem & Business Case
Managing local food distribution operations often creates a high administrative bottleneck. Relying on disorganized communication channels (like massive text threads and local chat groups) leads to order entry mistakes, missed deliveries, and manual tracking stress. 

This application replaces that manual workflow with a centralized database circuit:
- **Neighbors (Customers)** can log into a clean portal to view upcoming weekly menu dates and securely claim their delivery portions.
- **The Chef (Admin Dashboard)** gets a real-time, consolidated manifest showing exactly who ordered what, how many portions to cook, and where to deliver them.

---

## The Tech Stack
I intentionally chose a decoupled, serverless stack to optimize speed, data security, and multi-platform deployment without inflating infrastructure costs:

- **Frontend:** React Native / Expo (Configured universally to run natively on iOS, Android, and Desktop Web browsers from a single codebase).
- **Backend & Database:** serverless PostgreSQL via Supabase.
- **Security:** Native Supabase Authentication paired with database-level Row-Level Security (RLS) policies.

---

## Relational Database Schema Design

The application's data layer relies on a relational layout enforcing strict foreign-key integrity:

### 1. `profiles`
Tracks user information and shipping addresses linked to secure auth profiles.
- `id` (UUID, Primary Key, references `auth.users`)
- `full_name` (Varchar)
- `role` (Varchar, restricted to `'chef'` or `'neighbor'`)
- `address` (Text)
- `phone` (Varchar)

### 2. `meals`
Tracks scheduled food assets posted by the administrator.
- `id` (BigInt, Primary Key)
- `chef_id` (UUID, Foreign Key pointing to `profiles.id`)
- `dish_name` (Varchar)
- `description` (Text)
- `serving_date` (Date)

### 3. `orders`
The relationship junction table mapping allocations.
- `id` (BigInt, Primary Key)
- `meal_id` (BigInt, Foreign Key pointing to `meals.id`)
- `neighbor_id` (UUID, Foreign Key pointing to `profiles.id`)
- `portions_requested` (Int)
- `status` (Varchar, constrained to `['pending', 'confirmed', 'cancelled']`)

---

## Core Engineering Highlights

### 1. Automated Profile Triggers
To eliminate data redundancy and keep user data synchronized, I created a custom **PostgreSQL Database Trigger** (`handle_new_user()`). The exact millisecond a user registers an account through Supabase Auth, the database automatically maps their custom metadata arrays (full name, address, and phone number) and generates their profile entry inside the public schema. 

### 2. Data State Synchronization & Local Caching
To maintain a fast, high-performance runtime across mobile networks, active neighbor claims are cached inside a structured state lookup index dictionary (`{ [mealId]: { orderId, portions } }`) on initial load. This allows the application to read active selection states at an optimized **O(1) constant runtime complexity**, avoiding expensive nested database calls or heavy client-side array sorting.

### 3. Strict Row-Level Security (RLS) Boundaries
Because the order tables contain sensitive neighbor metadata like home addresses and phone numbers, data privacy was a major priority. I locked down all tables to prevent anonymous public reads, implementing data policies where neighbors can only view and mutate their individual orders, while the `'chef'` role holds comprehensive system access to compile delivery manifests.

---

## Local Development & Quick Start

Follow these steps to spin up the local development sandbox:

1. **Clone and Navigate:**
   ```bash
   git clone https://github.com
   cd neighborhood-foodshare
   ```

2. **Install Package Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Connection:**
   Create a `supabaseClient.js` file in your root folder and initialize your cloud project credentials:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient('YOUR_SUPABASE_PROJECT_URL', 'YOUR_SUPABASE_ANON_PUBLIC_KEY');
   ```

4. **Launch Dev Server Engine:**
   ```bash
   npx expo start
   ```
   - Press **`w`** inside your terminal window to run the app inside a responsive browser viewport.
   - Scan the terminal **QR Code** using your phone's camera to test it natively on iOS/Android inside **Expo Go**.
