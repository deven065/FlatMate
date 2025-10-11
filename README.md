# FlatMate — Society Maintenance Management (Admin)

FlatMate is a modern React + Tailwind CSS web app that helps housing societies manage members, maintenance charges, payments, receipts, and monthly dues. It uses Firebase (Auth + Realtime Database) for authentication and data storage and runs on Vite for a fast developer experience.

---

## ✨ Key Features

- Admin authentication and member onboarding (email/password)
- Member Management
  - Add members (writes under users/{uid})
  - Edit profile fields and status
  - Receive Payment flow with printable receipt (no payment gateway needed)
  - Pending summary (count + total), Only Pending toggle, and CSV export
- Payments & Receipts
  - Record payments with method (UPI/Cash/Card/Bank/Manual Edit)
  - Instant printable receipt window and simple PDF download
  - Recent Payments page with search, method filter, date range, totals, and CSV export
- Configuration
  - Maintenance configuration form that can adjust member dues in bulk
- UX & UI
  - Responsive, light/dark mode via Tailwind v4
  - Toaster notifications, focus-visible styles, and subtle motion for buttons

---

## 🧱 Tech Stack

- React 19, React Router 7, Vite 7
- Tailwind CSS v4 with @tailwindcss/vite and @tailwindcss/postcss
- Firebase Auth + Realtime Database
- Framer Motion (micro-interactions)
- jsPDF (simple PDF receipts) + in-browser print window receipts

---

## 📦 Requirements

- Node.js 18+ (recommended 20+)
- npm 9+
- A Firebase project (Web App) with Realtime Database enabled

---

## 🚀 Local Setup

1) Clone and install

```bash
git clone https://github.com/deven065/FlatMate.git
cd FlatMate
npm install
```

2) Configure environment variables

- Create a .env or .env.local file at the project root using .env.example as a guide:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

3) Run the dev server

```bash
npm run dev
```

- Vite will print the local URL (for example, [http://localhost:5173](http://localhost:5173); the port may vary).

4) Build and preview (optional)

```bash
npm run build
npm run preview
```

---

## 🔧 Configuration Details

Tailwind v4

- vite.config.js adds the Tailwind Vite plugin:

```js
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
```

- postcss.config.js uses the Tailwind PostCSS plugin:

```js
export default { plugins: { '@tailwindcss/postcss': {}, autoprefixer: {} } }
```

- src/index.css imports Tailwind:

```css
@import "tailwindcss";
```

Firebase

- Firebase config is read from Vite env variables in src/firebase.js
- Realtime DB must have the correct databaseURL (region-specific)
- Auth uses email/password for admin/member accounts

Data model (Realtime Database)

- users/{uid}
  - fullName, flatNumber, email, role: "member" | "admin", dues, paid, status, createdAt
- members/{id} (legacy; still readable)
- recentPayments/{id}
  - member, flat, email, amount, method, date (YYYY-MM-DD), receipt, createdAt
- config/maintenance
  - maintenanceCharge, waterCharge, sinkingFund, lateFee, dueDate

---

## 🗂️ App Structure (high-level)

- src/Components/Admin
  - MemberTable: manage members, receive payments, pending summary/export
  - RecentPayments: searchable/filterable list of payments with export
  - MaintenanceConfigForm: configure charges and bulk update dues
  - Other dashboard UI parts (Header, Footer, Stats, etc.)
- src/Components/Member
  - MemberDashboard + PayModal (member view)
- src/Components/Toast
  - ToastProvider + useToast (global toasts)
- src/utils/receipt.js
  - openReceiptPrintWindow(payment, profile)

---

## � Usage Guide (Admin)

Member Management

- Add Member: creates a Firebase Auth user and a users/{uid} profile
- Edit: change name, flat, email, status; adjust Pending (dues) manually if needed
- Receive Payment: simple modal to take amount and method
  - Auto-updates Paid and Pending, logs a record in recentPayments, and opens a printable receipt
- Top summary: Total Members, Members with Pending, Total Pending
- Only Pending toggle: quickly focus on defaulters
- Export: downloads a CSV of the current view (applies search and filters)

Recent Payments

- Live list ordered by createdAt/date
- Search by name/flat/email/receipt
- Filter by method and date range
- Summary tiles (count + total)
- Export filtered CSV
- View: opens printable receipt window; Download: quick PDF via jsPDF

Maintenance Config

- Save charges under config/maintenance
- Optionally adds the total charge to member dues in both legacy and unified nodes

---

## 🔒 Security & Secrets

- Never commit .env files or API keys
- Restrict Realtime Database rules for production (dev rules can be permissive; tighten for prod)
- Consider role-based checks (admin vs member) in the UI and rules

---

## 🧪 Scripts

- npm run dev — start the dev server
- npm run build — build for production
- npm run preview — preview the production build
- npm run lint — run ESLint

---

## 🩺 Troubleshooting

White screen or analytics error

- Ensure VITE_FIREBASE_MEASUREMENT_ID is set if using analytics
- If problems persist, temporarily disable analytics in src/firebase.js by commenting out getAnalytics(app)

Tailwind PostCSS plugin error

- Ensure @tailwindcss/postcss is installed and present in postcss.config.js
- Reinstall deps and restart Vite:

```bash
npm install
npm run dev
```

Realtime Database URL

- Use the region-specific URL (for example, [https://PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app](https://PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app))

Permissions / Rules

- In development, you can use relaxed rules. For production, lock down read/write access.

---

## 📄 License

This project is licensed under the MIT License. See LICENSE for details.
