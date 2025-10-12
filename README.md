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

## 🔒 Security & App Check

- Never commit .env files or API keys
- Restrict Realtime Database rules for production (dev rules can be permissive; tighten for prod)
- Consider role-based checks (admin vs member) in the UI and rules

### Firebase App Check (reCAPTCHA v3)

App Check protects Firebase APIs (Storage, Realtime DB, etc.) by verifying requests come from your app.

1) In Firebase Console → Build → App Check → Register app
  - Choose your Web App
  - Provider: reCAPTCHA v3
  - Copy the Site Key
  - Add these to `.env.local`:

```env
VITE_APPCHECK_SITE_KEY=your_recaptcha_v3_site_key
# Optional for local dev; set to 'true' to generate a random debug token printed in the console
VITE_APPCHECK_DEBUG_TOKEN=true
```

2) Domains
  - Add your local and deployed domains in App Check: e.g. `http://localhost:5173` and your production domain

3) Enforcement
  - Start in Monitoring mode. After you see verified traffic for Storage/Database, enable Enforcement

4) Code
  - `src/firebase.js` initializes App Check with `ReCaptchaV3Provider` and auto-refresh. It reads the env vars above.

5) Verify
  - App Check → APIs table should show some % of Verified requests for Storage/Realtime DB when you use the app
  - Network tab → look for `x-firebase-appcheck` header in requests

### Storage rules (notices)

For file uploads used by the Admin “Notices” feature, use Storage rules that allow authenticated writes to `notices/` and public reads if required by your use case. Example:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
   function isSignedIn() { return request.auth != null; }
   function isNotice() { return request.resource.name.matches('notices/.*'); }

   // Public read of notices; adjust to your needs
   match /notices/{fileName} {
    allow read: if true; // or isSignedIn();
    allow write: if isSignedIn() &&
      request.resource.size < 5 * 1024 * 1024 &&
      request.resource.contentType.matches('application/.*|image/.*|text/plain|application/pdf');
   }

   // Default deny
   match /{allPaths=**} {
    allow read, write: if false;
   }
  }
}
```

If you need admin-only writes, add a custom claim to admin users (e.g., `admin: true`) and change `allow write` to `isSignedIn() && request.auth.token.admin == true && ...`.

Tip: If uploads stall at 0%, validate that App Check is registered and Storage rules permit the path and content-type. Our upload UI will auto-retry once and then surface errors.

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
