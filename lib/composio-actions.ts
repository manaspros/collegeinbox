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
export const GMAIL_ACTIONS = {
  LIST_EMAILS: "GMAIL_LIST_EMAILS",
  GET_EMAIL: "GMAIL_GET_EMAIL",
  SEND_EMAIL: "GMAIL_SEND_EMAIL",
  GET_PROFILE: "GMAIL_GET_PROFILE",
  CREATE_DRAFT: "GMAIL_CREATE_DRAFT",
  SEARCH_EMAILS: "GMAIL_SEARCH_EMAILS",
} as const;

// ==================== GOOGLE CLASSROOM ACTIONS ====================
export const CLASSROOM_ACTIONS = {
  LIST_COURSES: "GOOGLECLASSROOM_LIST_COURSES",
  GET_COURSE: "GOOGLECLASSROOM_GET_COURSE",
  LIST_COURSEWORK: "GOOGLECLASSROOM_LIST_COURSE_WORK",
  GET_COURSEWORK: "GOOGLECLASSROOM_GET_COURSE_WORK",
  LIST_STUDENTS: "GOOGLECLASSROOM_LIST_STUDENTS",
  LIST_SUBMISSIONS: "GOOGLECLASSROOM_LIST_STUDENT_SUBMISSIONS",
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
