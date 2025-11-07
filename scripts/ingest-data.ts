/**
 * Script to ingest sample documents into Elasticsearch
 * Run with: npm run ingest-data
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from '@elastic/elasticsearch';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

// Verify environment variables are loaded
if (!process.env.ELASTIC_SEARCH_API_URL || !process.env.ELASTIC_API_KEY) {
  console.error('❌ Error: Missing Elasticsearch configuration in .env.local');
  console.error('Please ensure ELASTIC_SEARCH_API_URL and ELASTIC_API_KEY are set.');
  process.exit(1);
}

// Create Elasticsearch client directly in this script
const client = new Client({
  node: process.env.ELASTIC_SEARCH_API_URL!,
  auth: {
    apiKey: process.env.ELASTIC_API_KEY!,
  },
});

const INDEX_NAME = process.env.ELASTIC_INDEX_NAME || 'documents';

/**
 * Ensure index exists with proper mappings
 */
async function ensureIndexExists(): Promise<void> {
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });

    if (exists) {
      console.log(`Index '${INDEX_NAME}' already exists. Deleting to recreate with proper mappings...`);
      await client.indices.delete({ index: INDEX_NAME });
    }

    console.log('Creating index with semantic_text field...');
    await client.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          text: {
            type: 'semantic_text',
          },
          metadata: {
            type: 'object',
          },
        },
      },
    });
    console.log(`✅ Index '${INDEX_NAME}' created successfully with semantic_text mapping`);
  } catch (error) {
    console.error('Error ensuring index exists:', error);
    throw error;
  }
}

/**
 * Bulk index documents
 */
async function bulkIndexDocuments(
  documents: Array<{ text: string; metadata?: Record<string, unknown> }>
): Promise<void> {
  try {
    const operations = documents.flatMap((doc) => [
      { index: { _index: INDEX_NAME } },
      doc,
    ]);

    await client.bulk({
      refresh: 'wait_for',
      operations,
    });
  } catch (error) {
    console.error('Elasticsearch bulk indexing error:', error);
    throw new Error('Failed to bulk index documents');
  }
}

const sampleDocuments = [
  {
    text: "Yellowstone National Park is one of the largest national parks in the United States. It ranges from Wyoming to Montana and Idaho, and contains an area of 2,219,791 acres across three different states. It's most famous for hosting the geyser Old Faithful and is centered on the Yellowstone Caldera, the largest super volcano on the American continent. Yellowstone is host to hundreds of species of animal, many of which are endangered or threatened. Most notably, it contains free-ranging herds of bison and elk, alongside bears, cougars and wolves. The national park receives over 4.5 million visitors annually and is a UNESCO World Heritage Site.",
    metadata: {
      source: 'national_parks',
      park_name: 'Yellowstone',
      location: 'Wyoming, Montana, Idaho',
      type: 'unesco_site',
    },
  },
  {
    text: "Yosemite National Park is a United States National Park, covering over 750,000 acres of land in California. A UNESCO World Heritage Site, the park is best known for its granite cliffs, waterfalls and giant sequoia trees. Yosemite hosts over four million visitors in most years, with a peak of five million visitors in 2016. The park is home to a diverse range of wildlife, including mule deer, black bears, and the endangered Sierra Nevada bighorn sheep. The park has 1,200 square miles of wilderness, and is a popular destination for rock climbers, with over 3,000 feet of vertical granite to climb. Its most famous cliff is the El Capitan, a 3,000 feet monolith along its tallest face.",
    metadata: {
      source: 'national_parks',
      park_name: 'Yosemite',
      location: 'California',
      type: 'unesco_site',
    },
  },
  {
    text: "Rocky Mountain National Park is one of the most popular national parks in the United States. It receives over 4.5 million visitors annually, and is known for its mountainous terrain, including Longs Peak, which is the highest peak in the park. The park is home to a variety of wildlife, including elk, mule deer, moose, and bighorn sheep. The park is also home to a variety of ecosystems, including montane, subalpine, and alpine tundra. The park is a popular destination for hiking, camping, and wildlife viewing, and is a UNESCO World Heritage Site.",
    metadata: {
      source: 'national_parks',
      park_name: 'Rocky Mountain',
      location: 'Colorado',
      type: 'unesco_site',
    },
  },
  {
    text: "Grand Canyon National Park is one of the most iconic natural landmarks in the United States. Located in Arizona, the park encompasses 277 miles of the Colorado River and adjacent uplands. The Grand Canyon is up to 18 miles wide and a mile deep, revealing nearly two billion years of Earth's geological history. The park receives approximately six million visitors annually, making it one of the most visited national parks. Activities include hiking, rafting, and helicopter tours. The South Rim is the most accessible and popular area, open year-round.",
    metadata: {
      source: 'national_parks',
      park_name: 'Grand Canyon',
      location: 'Arizona',
      type: 'unesco_site',
    },
  },
  {
    text: "Zion National Park is located in southwestern Utah and is known for its dramatic red cliffs and unique sandstone formations. The park covers 229 square miles and features diverse ecosystems ranging from desert to riparian zones. Popular attractions include Angels Landing, The Narrows, and the Emerald Pools. Zion receives over 4 million visitors annually and offers excellent opportunities for hiking, canyoneering, and rock climbing. The park's iconic Zion Canyon was carved by the Virgin River over millions of years.",
    metadata: {
      source: 'national_parks',
      park_name: 'Zion',
      location: 'Utah',
      type: 'national_park',
    },
  },
  {
    text: "Glacier National Park, located in Montana, is known as the 'Crown of the Continent' and encompasses over one million acres of pristine wilderness. The park features 26 glaciers, over 700 lakes, and hundreds of miles of hiking trails. Wildlife includes grizzly bears, mountain goats, and wolverines. The Going-to-the-Sun Road is a spectacular 50-mile scenic drive through the heart of the park. Due to climate change, the park's glaciers have been retreating, and scientists predict they may disappear entirely by 2030.",
    metadata: {
      source: 'national_parks',
      park_name: 'Glacier',
      location: 'Montana',
      type: 'national_park',
    },
  },
];

async function ingestData() {
  try {
    console.log('🔍 Checking Elasticsearch connection...');
    
    // Ensure index exists with proper mappings
    console.log('📋 Creating index with semantic_text mappings...');
    await ensureIndexExists();
    
    console.log('📥 Ingesting sample documents...');
    await bulkIndexDocuments(sampleDocuments);
    
    console.log(`✅ Successfully ingested ${sampleDocuments.length} documents!`);
    console.log('\n📊 Documents indexed:');
    sampleDocuments.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. ${doc.metadata.park_name} National Park`);
    });
    
    console.log('\n✨ Ready to search! Start the dev server with: npm run dev');
  } catch (error) {
    console.error('❌ Error ingesting data:', error);
    process.exit(1);
  }
}

ingestData();
