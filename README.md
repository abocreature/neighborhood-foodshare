# Neighborhood Foodshare

An autonomous, full-stack logistics and order-scheduling application designed to streamline weekly menu coordination, customer tracking, and fulfillment operations for a localized meal delivery enterprise.

## 🚀 The Real-World Business Problem

Traditional localized food operations face significant scheduling overhead, relying on disconnected communication channels (e.g., text threads, local messaging apps) to coordinate weekly manifests. This application replaces manual tracking bottlenecks with a single data circuit:
- **For Neighbors:** Provides a clean, responsive interface to review weekly menu rotations and securely lock in specific portion requests.
- **For the Chef (Admin):** Compiles an aggregated, real-time routing and cooking manifest, eliminating data redundancy and entry errors.

---

## 🛠️ Tech Stack & Systems Architecture

The platform is engineered using modern, decoupled full-stack architecture principles:

- **Frontend Framework:** React Native / Expo (Configured for universal cross-platform delivery across iOS, Android, and Desktop Web).
- **Backend Architecture:** Serverless Backend-as-a-Service (BaaS) via Supabase.
- **Database Engine:** PostgreSQL (Relational persistence layer enforcing absolute transactional integrity).
- **Security & Infrastructure:** Row-Level Security (RLS) policies coupled with native Supabase Auth endpoints.

---

## 🗄️ Relational Database Schema Design

The underlying PostgreSQL engine tracks entity states through three interconnected tables utilizing strict Foreign Key constraints:

### 1. `profiles`
Tracks user identity states and sensitive logistics metadata.
- `id` (UUID, Primary Key, references `auth.users`)
- `full_name` (Varchar, non-nullable)
- `role` (Varchar, e.g., `'chef'`, `'neighbor'`)
- `address` (Text, protected by RLS filters)

### 2. `meals`
Tracks scheduled food batch assets available for order allocation.
- `id` (BigInt, Primary Key)
- `chef_id` (UUID, Foreign Key pointing to `profiles.id`)
- `dish_name` (Varchar, non-nullable)
- `description` (Text)
- `serving_date` (Date, non-nullable)
- `total_portions` (Int)

### 3. `orders`
The core relationship table connecting users to meal allocations.
- `id` (BigInt, Primary Key)
- `meal_id` (BigInt, Foreign Key pointing to `meals.id`)
- `neighbor_id` (UUID, Foreign Key pointing to `profiles.id`)
- `portions_requested` (Int, default: 1)
- `status` (Varchar, validated by check constraint: `['pending', 'confirmed', 'cancelled']`)

---

## 💎 Advanced Engineering Proof Points

This project features high-utility patterns that demonstrate robust software design:

- **O(1) State Lookup Indexing:** Instead of wasting mobile device processor cycles running array-traversal mapping loops across rendering lists, active claims are indexed inside a unified component dictionary registry state block (`{ [mealId]: { orderId, portions } }`) for immediate constant-time lookups.
- **Automated Infrastructure Triggers:** Implements an internal **PostgreSQL Trigger** and automated function module (`handle_new_user()`) that listens to the `auth.users` schema, automatically generating a synchronized public record in the `profiles` table the exact microsecond a new user signs up.
- **Pessimistic UI State Sync:** On initial component mounting, the client environment queries active table sets against the authenticated user's credentials, dynamically matching existing record arrays to change layout components into active green control panels with sub-propagation locks.
- **Strict Data Validation:** Utilizes strict database-layer **Check Constraints** (`orders_status_check`) to reject unstructured string inputs, ensuring data normalization across both client and server environments.

---

## ⚙️ Local Development Setup

To initialize this project and connect it to your local environment sandbox, execute the following commands:

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   cd neighborhood-foodshare
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Keys:**
   Create a `supabaseClient.js` config utility file inside the root directory and pass your credentials:
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient('YOUR_SUPABASE_PROJECT_URL', 'YOUR_SUPABASE_ANON_PUBLIC_KEY');
   ```

4. **Launch the Development Server Engine:**
   ```bash
   npx expo start
   ```
   - Press **`w`** inside your terminal loop to launch the responsive web portal browser layout view.
   - Scan the terminal's **QR Code** using your physical device's camera to run the mobile binary bundle inside **Expo Go**.