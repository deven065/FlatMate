# 🏢 FlatMate - Society Maintenance Management App (Admin Panel)

**FlatMate** is a modern web application designed to streamline the management of housing society maintenance tasks. This project is built with **React** and **Tailwind CSS**, offering a clean, responsive UI and focused admin registration functionality.

---

## ✨ Features

- 🧑‍💼 Admin Sign-Up with validations
- 🏠 Society flat/house number registration
- 📧 Email authentication fields
- 🔐 Secure password and confirmation input
- 🎨 Dark-themed UI using TailwindCSS
- 🔁 Member vs Admin toggle tabs

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. 📁 Clone the Repository

```bash
git clone https://github.com/deven065/FlatMate.git
cd FlatMate
```
### 2. 📦 Install Dependencies
```bash
npm install
```
This will install the required packages listed in package.json.
### 3. 💡 Install Tailwind CSS
```bash
npm install tailwindcss @tailwindcss/vite
```
Then, configure tailwind.config.js
### 4. Configure TailwindCSS
```bash
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```
Configure the Vite plugin
Add the @tailwindcss/vite plugin to your Vite configuration.
vite.config.ts

### 5. Import Tailwind CSS
```bash
@import "tailwindcss";
```
Add an @import to your CSS file that imports Tailwind CSS. Like in our case it's index.css
### 6. 🎨 Install React Icons
```bash
npm install react-icons
```
### 7. 🧪 Run the App
```bash
npm run dev
```
The app will run at: http://localhost:3000/
### 8.Install Framer motion
```bash
npm install framer-motion
```
### 9. If any problem is related to Database or Authentication run :
```bash
npm install firebase
```
### 10. To enable "Download receipt as PDF" I am using jspdf and jspdf-autotable libraries to generate and download a simple receipt
```bash
npm install jspdf jspdf-autotable
```

## Other Informations Coming Soon...