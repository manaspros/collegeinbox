import webpush from "web-push";

// Initialize web push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@collegiateInbox.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Send push notification to a user
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    url?: string;
  }
) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn("VAPID keys not set. Push notifications are disabled.");
      return false;
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return true;
  } catch (error: any) {
    console.error("Error sending push notification:", error);

    // If subscription is no longer valid, you should remove it from database
    if (error.statusCode === 410) {
      console.log("Subscription has expired or is no longer valid");
    }

    return false;
  }
}

// Generate VAPID keys (run this once to generate keys)
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

// Client-side: Request notification permission and subscribe
export async function subscribeUserToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported");
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
      ),
    });

    return subscription.toJSON();
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeUserFromPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
