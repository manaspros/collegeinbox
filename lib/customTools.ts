import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * Custom tools that query Firestore cache instead of directly calling APIs
 * This is more efficient and faster for the AI agent
 */

export const customTools = {
  // Query deadlines from cache
  query_deadlines: {
    description: "Get upcoming deadlines and assignments from the cache. Faster than fetching from Gmail.",
    parameters: {
      type: "object" as const,
      properties: {
        course: {
          type: "string",
          description: "Filter by course name (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of deadlines to return (default: 10)",
        },
      },
    },
    execute: async (params: { course?: string; limit?: number }, userId: string) => {
      try {
        const db = getAdminDb();
        let q = db.collection("cache_deadlines").doc(userId).collection("items")
          .orderBy("dueAt", "asc");

        if (params.limit) {
          q = q.limit(params.limit);
        } else {
          q = q.limit(10);
        }

        const snapshot = await q.get();
        let deadlines = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Client-side filtering for course if specified
        if (params.course) {
          deadlines = deadlines.filter((d: any) =>
            d.course?.toLowerCase().includes(params.course!.toLowerCase())
          );
        }

        return {
          successful: true,
          data: { deadlines, count: deadlines.length },
        };
      } catch (error: any) {
        return {
          successful: false,
          error: error.message,
        };
      }
    },
  },

  // Query documents from cache
  query_documents: {
    description: "Search for documents (PDFs, DOCX, etc.) from the cache. Faster than searching Gmail.",
    parameters: {
      type: "object" as const,
      properties: {
        course: {
          type: "string",
          description: "Filter by course name (optional)",
        },
        search: {
          type: "string",
          description: "Search in document names (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of documents to return (default: 10)",
        },
      },
    },
    execute: async (params: { course?: string; search?: string; limit?: number }, userId: string) => {
      try {
        const db = getAdminDb();
        let q = db.collection("cache_documents").doc(userId).collection("files")
          .orderBy("createdAt", "desc");

        if (params.limit) {
          q = q.limit(params.limit);
        } else {
          q = q.limit(10);
        }

        const snapshot = await q.get();
        let documents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Client-side filtering for course and search
        if (params.course) {
          documents = documents.filter((doc: any) =>
            doc.course?.toLowerCase().includes(params.course!.toLowerCase())
          );
        }

        if (params.search) {
          documents = documents.filter((doc: any) =>
            doc.name?.toLowerCase().includes(params.search!.toLowerCase())
          );
        }

        return {
          successful: true,
          data: { documents, count: documents.length },
        };
      } catch (error: any) {
        return {
          successful: false,
          error: error.message,
        };
      }
    },
  },

  // Query alerts from cache
  query_alerts: {
    description: "Get schedule alerts (cancelled classes, room changes, etc.) from the cache.",
    parameters: {
      type: "object" as const,
      properties: {
        kind: {
          type: "string",
          description: "Filter by alert type: cancelled, rescheduled, urgent, room_change (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of alerts to return (default: 10)",
        },
      },
    },
    execute: async (params: { kind?: string; limit?: number }, userId: string) => {
      try {
        const db = getAdminDb();
        let q = db.collection("cache_alerts").doc(userId).collection("items")
          .orderBy("createdAt", "desc");

        if (params.limit) {
          q = q.limit(params.limit);
        } else {
          q = q.limit(10);
        }

        const snapshot = await q.get();
        let alerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Client-side filtering for kind
        if (params.kind) {
          alerts = alerts.filter((alert: any) =>
            alert.kind?.toLowerCase() === params.kind!.toLowerCase()
          );
        }

        return {
          successful: true,
          data: { alerts, count: alerts.length },
        };
      } catch (error: any) {
        return {
          successful: false,
          error: error.message,
        };
      }
    },
  },

  // Check sync status
  check_sync_status: {
    description: "Check when the last sync happened and how many items were synced.",
    parameters: {
      type: "object" as const,
      properties: {},
    },
    execute: async (params: {}, userId: string) => {
      try {
        const db = getAdminDb();
        const statusDoc = await db.collection("sync_status").doc(userId).get();

        if (!statusDoc.exists) {
          return {
            successful: true,
            data: {
              synced: false,
              message: "No sync has been performed yet. User should sync their data first.",
            },
          };
        }

        const data = statusDoc.data();
        return {
          successful: true,
          data: {
            synced: true,
            lastSync: data?.lastSync,
            emailsSynced: data?.emailsSynced,
            deadlinesFound: data?.deadlinesFound,
            alertsFound: data?.alertsFound,
            documentsFound: data?.documentsFound,
          },
        };
      } catch (error: any) {
        return {
          successful: false,
          error: error.message,
        };
      }
    },
  },
};

export type CustomToolName = keyof typeof customTools;
