/**
 * Verify Composio Integration Setup
 * Run this script to check if all required integrations are configured
 */

import { composio } from "../lib/composio";

async function verifyComposioSetup() {
  console.log("🔍 Verifying Composio Integration Setup...\n");

  const requiredApps = [
    "gmail",
    "googleclassroom",
    "googlecalendar",
    "googledrive",
  ];

  try {
    // Check if Composio API key is set
    if (!process.env.COMPOSIO_API_KEY) {
      console.error("❌ COMPOSIO_API_KEY not found in environment variables");
      console.log("   Add it to .env.local file\n");
      process.exit(1);
    }

    console.log("✅ Composio API Key found\n");

    // Get available integrations
    console.log("📋 Checking available integrations...\n");

    const toolset = composio.getToolSet();

    for (const app of requiredApps) {
      try {
        const tools = await toolset.getTools({
          apps: [app],
        });

        if (tools && tools.length > 0) {
          console.log(`✅ ${app.padEnd(20)} - ${tools.length} tools available`);
        } else {
          console.log(`⚠️  ${app.padEnd(20)} - No tools found (may need manual setup)`);
        }
      } catch (error: any) {
        console.log(`❌ ${app.padEnd(20)} - Error: ${error.message}`);
      }
    }

    console.log("\n📝 Next Steps:\n");
    console.log("1. If you see ❌ or ⚠️  for any app:");
    console.log("   → Go to https://app.composio.dev/integrations");
    console.log("   → Enable the missing integration");
    console.log("   → Choose 'Use Composio Auth' for quick setup\n");

    console.log("2. For Google Classroom specifically:");
    console.log("   → Search 'Google Classroom' in Composio dashboard");
    console.log("   → Click 'Enable' or 'Add Integration'");
    console.log("   → Select 'Use Composio Auth'\n");

    console.log("3. Test in your app:");
    console.log("   → Go to http://localhost:3000/integrations");
    console.log("   → Try connecting each service");
    console.log("   → Should redirect to Google OAuth\n");

    console.log("✅ Verification complete!\n");
  } catch (error: any) {
    console.error("❌ Error during verification:", error.message);
    console.log("\nPossible issues:");
    console.log("1. Invalid COMPOSIO_API_KEY");
    console.log("2. Network connection issues");
    console.log("3. Composio service temporarily unavailable");
    console.log("\nCheck: https://status.composio.dev\n");
    process.exit(1);
  }
}

// Run verification
verifyComposioSetup().catch(console.error);
