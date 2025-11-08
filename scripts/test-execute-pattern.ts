/**
 * Test script to find the correct Composio v3 execute pattern
 * Run: COMPOSIO_API_KEY=your_key npx tsx scripts/test-execute-pattern.ts
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
  console.log('Could not load .env file, using existing environment variables');
}

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

console.log(`API Key loaded: ${process.env.COMPOSIO_API_KEY ? 'Yes' : 'No'}`);

const userId = 'mOeydGrEYhdA9LNftbNrVc8LuGI3';

async function testExecutePatterns() {
  console.log('🧪 Testing different Composio v3 execute patterns...\n');

  // Pattern 1: With input wrapper + toolkitVersion
  console.log('Pattern 1: With input wrapper + toolkitVersion');
  try {
    const result1 = await composio.tools.execute(
      'GMAIL_FETCH_EMAILS',
      {
        input: {
          query: 'is:unread',
          max_results: 2,
        },
        userId,
        toolkitVersion: 'latest', // Try toolkitVersion instead
      }
    );
    console.log('✅ Pattern 1 SUCCESS:', JSON.stringify(result1, null, 2));
  } catch (error: any) {
    console.log('❌ Pattern 1 FAILED:', error.message);
  }

  console.log('\n---\n');

  // Pattern 1b: Version as third argument
  console.log('Pattern 1b: Version as third argument');
  try {
    const result1b = await composio.tools.execute(
      'GMAIL_FETCH_EMAILS',
      {
        input: {
          query: 'is:unread',
          max_results: 2,
        },
        userId,
      },
      'latest' // Version as separate argument
    );
    console.log('✅ Pattern 1b SUCCESS:', JSON.stringify(result1b, null, 2));
  } catch (error: any) {
    console.log('❌ Pattern 1b FAILED:', error.message);
  }

  console.log('\n---\n');

  // Pattern 2: Without input wrapper (direct params) + version
  console.log('Pattern 2: Without input wrapper + version');
  try {
    const result2 = await composio.tools.execute(
      'GMAIL_FETCH_EMAILS',
      {
        query: 'is:unread',
        max_results: 2,
        userId,
        version: 'latest',
      }
    );
    console.log('✅ Pattern 2 SUCCESS:', JSON.stringify(result2, null, 2));
  } catch (error: any) {
    console.log('❌ Pattern 2 FAILED:', error.message);
  }

  console.log('\n---\n');

  // Pattern 3: Separate params and options + version
  console.log('Pattern 3: Separate params and options + version');
  try {
    const result3 = await composio.tools.execute(
      'GMAIL_FETCH_EMAILS',
      {
        query: 'is:unread',
        max_results: 2,
        version: 'latest',
      },
      {
        userId,
      }
    );
    console.log('✅ Pattern 3 SUCCESS:', JSON.stringify(result3, null, 2));
  } catch (error: any) {
    console.log('❌ Pattern 3 FAILED:', error.message);
  }

  console.log('\n---\n');

  // Pattern 4: With connectedAccountId
  console.log('Pattern 4: First get connected account ID, then execute');
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [userId],
    });

    const gmailConnection = connections.items?.find((conn: any) => {
      const toolkit = conn.toolkitSlug || conn.toolkit?.slug;
      return toolkit?.toLowerCase() === 'gmail' && conn.status === 'ACTIVE';
    });

    if (gmailConnection) {
      console.log(`Found connection: ${gmailConnection.id}`);

      const result4 = await composio.tools.execute(
        'GMAIL_FETCH_EMAILS',
        {
          input: {
            query: 'is:unread',
            max_results: 2,
          },
          connectedAccountId: gmailConnection.id,
          version: 'latest',
        }
      );
      console.log('✅ Pattern 4 SUCCESS:', JSON.stringify(result4, null, 2));
    } else {
      console.log('⚠️  No Gmail connection found for this user');
    }
  } catch (error: any) {
    console.log('❌ Pattern 4 FAILED:', error.message);
  }
}

testExecutePatterns()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
