/**
 * Composio Action Names Reference
 *
 * This file contains the correct action names for Composio integrations.
 * Use these constants instead of hardcoding action names to avoid typos.
 *
 * Action naming convention: APP_ACTION_NAME
 * Example: GMAIL_SEND_EMAIL, GOOGLECLASSROOM_LIST_COURSES
 */

// ==================== GMAIL ACTIONS ====================
// Updated to match official Composio Gmail docs
export const GMAIL_ACTIONS = {
  FETCH_EMAILS: "GMAIL_FETCH_EMAILS", // List/fetch emails with filters
  GET_EMAIL: "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID", // Get specific message by ID
  SEND_EMAIL: "GMAIL_SEND_EMAIL",
  GET_PROFILE: "GMAIL_GET_PROFILE",
  CREATE_DRAFT: "GMAIL_CREATE_EMAIL_DRAFT",
  ADD_LABEL: "GMAIL_ADD_LABEL_TO_EMAIL",
  DELETE_MESSAGE: "GMAIL_DELETE_MESSAGE",
  MOVE_TO_TRASH: "GMAIL_MOVE_TO_TRASH",
  LIST_DRAFTS: "GMAIL_LIST_DRAFTS",
  LIST_LABELS: "GMAIL_LIST_LABELS",
  FORWARD_MESSAGE: "GMAIL_FORWARD_MESSAGE",
  REPLY_TO_THREAD: "GMAIL_REPLY_TO_THREAD",
} as const;

// ==================== GOOGLE CLASSROOM ACTIONS ====================
// Updated to match official Composio docs: GOOGLE_CLASSROOM_* format
export const CLASSROOM_ACTIONS = {
  LIST_COURSES: "GOOGLE_CLASSROOM_COURSES_LIST",
  GET_COURSE: "GOOGLE_CLASSROOM_COURSES_GET",
  LIST_COURSEWORK: "GOOGLE_CLASSROOM_COURSES_COURSE_WORK_LIST",
  GET_COURSEWORK: "GOOGLE_CLASSROOM_COURSES_COURSE_WORK_GET",
  LIST_ANNOUNCEMENTS: "GOOGLE_CLASSROOM_COURSES_ANNOUNCEMENTS_LIST",
  LIST_COURSE_WORK_MATERIALS: "GOOGLE_CLASSROOM_CLASSROOMS_COURSE_WORK_MATERIALS_LIST",
} as const;

// ==================== GOOGLE CALENDAR ACTIONS ====================
export const CALENDAR_ACTIONS = {
  LIST_EVENTS: "GOOGLECALENDAR_LIST_EVENTS",
  GET_EVENT: "GOOGLECALENDAR_GET_EVENT",
  CREATE_EVENT: "GOOGLECALENDAR_CREATE_EVENT",
  UPDATE_EVENT: "GOOGLECALENDAR_UPDATE_EVENT",
  DELETE_EVENT: "GOOGLECALENDAR_DELETE_EVENT",
  LIST_CALENDARS: "GOOGLECALENDAR_LIST_CALENDARS",
} as const;

// ==================== GOOGLE DRIVE ACTIONS ====================
export const DRIVE_ACTIONS = {
  LIST_FILES: "GOOGLEDRIVE_LIST_FILES",
  GET_FILE: "GOOGLEDRIVE_GET_FILE",
  SEARCH_FILES: "GOOGLEDRIVE_SEARCH_FILES",
  DOWNLOAD_FILE: "GOOGLEDRIVE_DOWNLOAD_FILE",
  CREATE_FILE: "GOOGLEDRIVE_CREATE_FILE",
  UPDATE_FILE: "GOOGLEDRIVE_UPDATE_FILE",
  DELETE_FILE: "GOOGLEDRIVE_DELETE_FILE",
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Execute a Composio action with proper error handling
 */
export async function executeComposioAction(
  entity: any,
  actionName: string,
  params: any = {}
) {
  try {
    console.log(`Executing Composio action: ${actionName}`, params);
    const result = await entity.execute(actionName, params);
    console.log(`Action ${actionName} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`Error executing ${actionName}:`, error.message);

    // Log more details for debugging
    if (error.response) {
      console.error("Response error:", error.response.data);
    }

    throw new Error(`Failed to execute ${actionName}: ${error.message}`);
  }
}

/**
 * Get all available actions for debugging
 */
export function getAllComposioActions() {
  return {
    gmail: Object.values(GMAIL_ACTIONS),
    classroom: Object.values(CLASSROOM_ACTIONS),
    calendar: Object.values(CALENDAR_ACTIONS),
    drive: Object.values(DRIVE_ACTIONS),
  };
}
