import { NextRequest, NextResponse } from "next/server";
import { composio } from "@/lib/composio";

/**
 * Setup endpoint to create necessary auth configs for the app
 * This should be run once during initial setup
 */
export async function POST(req: NextRequest) {
  try {
    const results = [];
    const errors = [];

    // List of toolkits we need
    const requiredToolkits = [
      { name: "gmail", label: "Gmail" },
      { name: "googleclassroom", label: "Google Classroom" },
      { name: "googlecalendar", label: "Google Calendar" },
      { name: "googledrive", label: "Google Drive" },
    ];

    // Check existing auth configs
    const existingConfigs = await composio.authConfigs.list({});
    console.log(`Found ${existingConfigs.items?.length || 0} existing auth configs`);

    for (const toolkit of requiredToolkits) {
      try {
        // Check if auth config already exists for this toolkit
        const existing = existingConfigs.items?.find(
          (config: any) => config.toolkitSlug?.toLowerCase() === toolkit.name.toLowerCase()
        );

        if (existing) {
          results.push({
            toolkit: toolkit.name,
            status: "exists",
            authConfigId: existing.id,
            message: `Auth config already exists for ${toolkit.label}`,
          });
          console.log(`✅ ${toolkit.label} auth config already exists: ${existing.id}`);
          continue;
        }

        // Create new auth config using Composio-managed (default OAuth)
        console.log(`Creating auth config for ${toolkit.label}...`);

        const newConfig = await composio.authConfigs.create(toolkit.name, {
          name: `${toolkit.label} (Auto-created)`,
          // Use Composio's default OAuth settings
        });

        results.push({
          toolkit: toolkit.name,
          status: "created",
          authConfigId: newConfig.id,
          message: `Successfully created auth config for ${toolkit.label}`,
        });
        console.log(`✅ Created ${toolkit.label} auth config: ${newConfig.id}`);

      } catch (error: any) {
        console.error(`❌ Failed to create ${toolkit.label} auth config:`, error);
        errors.push({
          toolkit: toolkit.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
      message: errors.length === 0
        ? "All auth configs are ready!"
        : "Some auth configs could not be created. Please create them manually in Composio dashboard.",
    });

  } catch (error: any) {
    console.error("Error in setup:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to setup auth configs",
        details: "Please create auth configs manually at https://app.composio.dev/settings/auth-configs"
      },
      { status: 500 }
    );
  }
}
