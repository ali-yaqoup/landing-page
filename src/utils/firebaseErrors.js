export function getFirebaseErrorMessage(error) {
  if (!error) return "An unexpected error occurred.";

  const code = error.code || "";
  const messages = {
    "permission-denied": "You do not have permission to complete this action.",
    "unavailable": "Network unavailable. Please check your connection and try again.",
    "deadline-exceeded": "The request timed out. Please try again.",
    "auth/network-request-failed": "Unable to reach authentication servers. Check your network.",
    "auth/too-many-requests": "Too many requests. Please wait and try again later.",
    "auth/email-already-in-use": "This email address is already registered.",
    "auth/weak-password": "Please choose a stronger password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found for that email.",
    "auth/wrong-password": "The password is incorrect. Please try again.",
    "auth/requires-recent-login": "Please sign in again to complete this action.",
  };

  return messages[code] || error.message || "Something went wrong. Please try again.";
}
