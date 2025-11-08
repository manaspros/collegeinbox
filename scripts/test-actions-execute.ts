/**
 * Test using actions.execute instead of tools.execute
 */

import { Composio } from '@composio/core';
import { readFileSync } from 'fs';
import { join } from 'path';

// Manually load .env file
const envPath = join(process.cwd(), '.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+?)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
} catch (error) {
  console.log('Could not load .env file');
}

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

const userId = 'mOeydGrEYhdA9LNftbNrVc8LuGI3';

async function testActionsExecute() {
  console.log('🧪 Testing composio.actions.execute()...\n');

  try {
    // Get connected account first
    const connections = await composio.connectedAccounts.list({
      userIds: [userId],
    });

    const gmailConnection = connections.items?.find((conn: any) => {
      const toolkit = conn.toolkitSlug || conn.toolkit?.slug;
      return toolkit?.toLowerCase() === 'gmail' && conn.status === 'ACTIVE';
    });

    if (!gmailConnection) {
      console.log('⚠️  No Gmail connection found');
      return;
    }

    console.log(`Found Gmail connection: ${gmailConnection.id}\n`);

    // Try actions.execute with connectedAccountId
    console.log('Pattern: actions.execute with connectedAccountId');
    const result = await (composio as any).actions.execute(
      'GMAIL_FETCH_EMAILS',
      {
        query: 'is:unread',
        max_results: 2,
      },
      gmailConnection.id
    );

    console.log('✅ SUCCESS:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.log('❌ FAILED:', error.message);
    console.log('Full error:', error);
  }
}

testActionsExecute()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
