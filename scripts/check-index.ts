/**
 * Check Elasticsearch index status and document count
 */

import { Client } from '@elastic/elasticsearch';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkIndex() {
  const client = new Client({
    node: process.env.ELASTIC_SEARCH_API_URL!,
    auth: {
      apiKey: process.env.ELASTIC_API_KEY!,
    },
  });

  const indexName = process.env.ELASTIC_INDEX_NAME || 'research_papers';

  try {
    console.log('🔍 Checking Elasticsearch connection...');
    console.log('URL:', process.env.ELASTIC_SEARCH_API_URL);
    console.log('Index:', indexName);

    // Check if index exists
    const exists = await client.indices.exists({ index: indexName });
    
    if (!exists) {
      console.log(`❌ Index '${indexName}' does not exist!`);
      console.log('\n💡 Run: npm run seed-papers (to create and populate the index)');
      return;
    }

    console.log(`✅ Index '${indexName}' exists`);

    // Get document count
    const count = await client.count({ index: indexName });
    console.log(`📊 Total documents: ${count.count}`);

    if (count.count === 0) {
      console.log('\n❌ Index is empty! No papers indexed.');
      console.log('💡 Run: npm run seed-papers (to add sample papers)');
      return;
    }

    // Get sample document
    const search = await client.search({
      index: indexName,
      size: 1,
    });

    if (search.hits.hits.length > 0) {
      console.log('\n📄 Sample document:');
      const doc = search.hits.hits[0]._source as Record<string, unknown>;
      console.log('Title:', doc.title);
      console.log('Authors:', doc.authors);
      console.log('Has abstract:', !!doc.abstract);
      console.log('Has content:', !!doc.content);
    }

    // Test a simple search
    console.log('\n🔎 Testing search for "transformer"...');
    const testSearch = await client.search({
      index: indexName,
      size: 3,
      query: {
        bool: {
          should: [
            { match: { title: 'transformer' } },
            { match: { abstract: 'transformer' } },
          ],
          minimum_should_match: 1,
        },
      },
    });

    console.log(`Found ${testSearch.hits.hits.length} results`);
    testSearch.hits.hits.forEach((hit, i) => {
      const doc = hit._source as { title: string };
      console.log(`${i + 1}. ${doc.title}`);
    });

  } catch (error) {
    console.error('❌ Error checking index:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
  } finally {
    await client.close();
  }
}

checkIndex();
