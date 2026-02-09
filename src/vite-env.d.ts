/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Authentification
  readonly VITE_APP_PASSWORD?: string;
  readonly VITE_ADMIN_PASSWORD?: string;

  // EmailJS
  readonly VITE_EMAILJS_SERVICE_ID?: string;
  readonly VITE_EMAILJS_TEMPLATE_ID?: string;
  readonly VITE_EMAILJS_PUBLIC_KEY?: string;

  // Google
  readonly VITE_GOOGLE_CLIENT_ID?: string;

  // APIs IA
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_WORKER_URL?: string;

  // Firebase
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;

  // Configuration projet
  readonly VITE_PROJECT_NAME?: string;
  readonly VITE_OPENING_DATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
