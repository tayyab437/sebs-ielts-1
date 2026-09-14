import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Meet scopes
provider.addScope("https://www.googleapis.com/auth/meetings.space.created");
provider.addScope("https://www.googleapis.com/auth/meetings.space.readonly");
provider.addScope("https://www.googleapis.com/auth/meetings.space.settings");

// Force prompt so users can choose another account or refresh permissions easily
provider.setCustomParameters({
  prompt: "consent select_account",
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Google OAuth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign in via Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google OAuth access token from auth credential");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve cached token
export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Sign out from Google Auth
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Call Google Meet REST API to create a live meeting space
export interface GoogleMeetSpace {
  name: string; // e.g. "spaces/abc-defg-hij"
  meetingUri: string; // e.g. "https://meet.google.com/abc-defg-hij"
  meetingCode?: string; // e.g. "abc-defg-hij"
}

export const createGoogleMeetSpace = async (accessToken: string): Promise<GoogleMeetSpace> => {
  const response = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    const message = errorDetails?.error?.message || `Google API status ${response.status}`;
    throw new Error(`Failed to create Google Meet: ${message}`);
  }

  const space = (await response.json()) as GoogleMeetSpace;
  
  // Clean up and parse the meeting code
  if (space.meetingUri) {
    const parts = space.meetingUri.split("/");
    space.meetingCode = parts[parts.length - 1] || "";
  }
  
  return space;
};
