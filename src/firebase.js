import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Realtime Database
export const db = getDatabase(app);
// Email and Password Auth
export const auth = getAuth(app);
// Cloud Storage
export const storage = getStorage(app);

// App Check (reCAPTCHA v3)
// Provide a site key via VITE_APPCHECK_SITE_KEY. Enable debug with VITE_APPCHECK_DEBUG_TOKEN=true or a specific token.
try {
    // Only attempt in browser contexts
    if (typeof window !== 'undefined') {
        const siteKey = import.meta.env.VITE_APPCHECK_SITE_KEY;

        // Optional: enable debug token locally
        const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
            if (debugToken) {
                // When set to true, a random token is generated and printed in the console
                // You can also set a fixed token string
                window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken === 'true' ? true : debugToken;
            }

        if (siteKey) {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(siteKey),
                isTokenAutoRefreshEnabled: true,
            });
        } else {
            // Helpful console hint during development
            console.warn('[AppCheck] VITE_APPCHECK_SITE_KEY not set. Skipping App Check initialization.');
        }
    }
} catch (err) {
    console.warn('[AppCheck] Initialization skipped due to error:', err);
}