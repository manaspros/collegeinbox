/**
 * Test script to validate Gmail actions with Composio
 * Run: npx tsx scripts/test-gmail-actions.ts
 */

import { Composio } from '@composio/core';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

async function testGmailActions() {
  console.log('🔍 Testing Gmail Actions with Composio v3...\n');

  try {
    // Step 1: List all available actions for Gmail
    console.log('1️⃣ Fetching all Gmail actions...');
    const actions = await composio.actions.list({
      apps: 'gmail',
    });

    console.log(`✅ Found ${actions.items?.length || 0} Gmail actions\n`);

    // Show first 10 action names
    console.log('📋 Sample Gmail action names:');
    actions.items?.slice(0, 15).forEach((action: any, idx: number) => {
      console.log(`   ${idx + 1}. ${action.name || action.actionName}`);
    });

    console.log('\n');

    // Step 2: Search for email-related actions
    console.log('2️⃣ Searching for email list/fetch actions...');
    const emailActions = actions.items?.filter((action: any) => {
      const name = (action.name || action.actionName || '').toLowerCase();
      return name.includes('list') || name.includes('fetch') || name.includes('get');
    });

    console.log(`✅ Found ${emailActions?.length || 0} email-related actions:\n`);
    emailActions?.slice(0, 10).forEach((action: any) => {
      console.log(`   ✓ ${action.name || action.actionName}`);
    });

    console.log('\n');

    // Step 3: Try to get specific action details
    const possibleNames = [
      'GMAIL_LIST_EMAILS',
      'GMAIL_FETCH_EMAILS',
      'GMAIL_GET_EMAILS',
      'GMAIL_MESSAGES_LIST',
      'GMAIL_LIST_MESSAGES',
    ];

    console.log('3️⃣ Testing possible action names:');
    for (const name of possibleNames) {
      const found = actions.items?.find(
        (a: any) => (a.name || a.actionName) === name
      );
      console.log(`   ${found ? '✅' : '❌'} ${name}`);
    }

    console.log('\n');

    // Step 4: Show the CORRECT action name for listing emails
    const listAction = actions.items?.find((a: any) => {
      const name = (a.name || a.actionName || '').toLowerCase();
      return (
        name.includes('list') &&
        (name.includes('message') || name.includes('email'))
      );
    });

    if (listAction) {
      console.log('4️⃣ ✅ CORRECT ACTION NAME FOR LISTING EMAILS:');
      console.log(`   📌 ${listAction.name || listAction.actionName}`);
      console.log(`\nUse this in your code:\n`);
      console.log(`const result = await composio.tools.execute('${listAction.name || listAction.actionName}', {...});`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGmailActions().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
