import { NextResponse } from 'next/server';
import { Client } from '@elastic/elasticsearch';

export async function GET() {
  try {
    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      environment: {
        ELASTIC_SEARCH_API_URL: process.env.ELASTIC_SEARCH_API_URL ? 'Set' : 'Missing',
        ELASTIC_API_KEY: process.env.ELASTIC_API_KEY ? 'Set (hidden)' : 'Missing',
        ELASTIC_INDEX_NAME: process.env.ELASTIC_INDEX_NAME || 'Not set (using default)',
      },
    };

    // Try to connect to Elasticsearch
    const client = new Client({
      node: process.env.ELASTIC_SEARCH_API_URL!,
      auth: {
        apiKey: process.env.ELASTIC_API_KEY!,
      },
    });

    try {
      // Test connection
      const info = await client.info();
      diagnostics.elasticsearch = {
        connected: true,
        version: info.version?.number,
        cluster_name: info.cluster_name,
      };

      // Check index
      const indexName = process.env.ELASTIC_INDEX_NAME || 'research_papers';
      const exists = await client.indices.exists({ index: indexName });
      
      if (exists) {
        const count = await client.count({ index: indexName });
        diagnostics.index = {
          name: indexName,
          exists: true,
          document_count: count.count,
        };

        // Try a simple search
        if (count.count > 0) {
          const search = await client.search({
            index: indexName,
            size: 1,
            query: { match_all: {} },
          });
          
          if (search.hits.hits.length > 0) {
            const doc = search.hits.hits[0]._source as Record<string, unknown>;
            diagnostics.sample_document = {
              has_title: !!doc.title,
              has_abstract: !!doc.abstract,
              has_content: !!doc.content,
              has_authors: !!doc.authors,
            };
          }
        }
      } else {
        diagnostics.index = {
          name: indexName,
          exists: false,
          message: 'Index not found',
        };
      }

      await client.close();
    } catch (esError) {
      diagnostics.elasticsearch = {
        connected: false,
        error: esError instanceof Error ? esError.message : 'Unknown error',
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Diagnostic failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
