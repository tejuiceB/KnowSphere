import { Client } from '@elastic/elasticsearch';

// Lazy initialization of Elasticsearch client
let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({
      node: process.env.ELASTIC_SEARCH_API_URL!,
      auth: {
        apiKey: process.env.ELASTIC_API_KEY!,
      },
    });
  }
  return client;
}

// Export the client getter for external use
export const elasticClient = getClient;

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Perform hybrid search combining semantic and keyword search
 */
export async function hybridSearch(
  query: string,
  indexName: string = process.env.ELASTIC_INDEX_NAME || 'documents',
  size: number = 5
): Promise<SearchResult[]> {
  try {
    // For semantic_text fields, we simply use match query
    // Elasticsearch automatically uses ELSER embeddings for semantic search
    const response = await getClient().search({
      index: indexName,
      size,
      query: {
        match: {
          text: query
        }
      },
    });

    const hits = response.hits.hits;
    return hits.map((hit) => ({
      id: hit._id || '',
      text: (hit._source as { text: string; metadata?: Record<string, unknown> }).text,
      score: hit._score || 0,
      metadata: (hit._source as { text: string; metadata?: Record<string, unknown> }).metadata || {},
    }));
  } catch (error) {
    console.error('Elasticsearch hybrid search error:', error);
    throw new Error('Failed to perform search');
  }
}

/**
 * Index a document into Elasticsearch
 */
export async function indexDocument(
  document: { text: string; metadata?: Record<string, unknown> },
  indexName: string = process.env.ELASTIC_INDEX_NAME || 'documents'
): Promise<string> {
  try {
    const response = await getClient().index({
      index: indexName,
      document,
      refresh: 'wait_for', // Wait for the document to be searchable
    });

    return response._id;
  } catch (error) {
    console.error('Elasticsearch indexing error:', error);
    throw new Error('Failed to index document');
  }
}

/**
 * Bulk index multiple documents (flexible for any document structure)
 */
export async function bulkIndexDocuments(
  documents: Array<Record<string, unknown>>,
  indexName: string = process.env.ELASTIC_INDEX_NAME || 'documents'
): Promise<void> {
  try {
    const operations = documents.flatMap((doc) => [
      { index: { _index: indexName } },
      doc,
    ]);

    await getClient().bulk({
      refresh: 'wait_for',
      operations,
    });
  } catch (error) {
    console.error('Elasticsearch bulk indexing error:', error);
    throw new Error('Failed to bulk index documents');
  }
}

/**
 * Check if index exists, create if it doesn't
 */
export async function ensureIndexExists(
  indexName: string = process.env.ELASTIC_INDEX_NAME || 'documents'
): Promise<void> {
  try {
    const exists = await getClient().indices.exists({ index: indexName });

    if (!exists) {
      await getClient().indices.create({
        index: indexName,
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
      console.log(`Index '${indexName}' created successfully`);
    }
  } catch (error) {
    console.error('Error ensuring index exists:', error);
    throw error;
  }
}

/**
 * Create research papers index with enhanced schema
 */
export async function ensureResearchIndexExists(
  indexName: string = 'research_papers'
): Promise<void> {
  try {
    // Delete if exists to ensure clean schema
    const exists = await getClient().indices.exists({ index: indexName });
    if (exists) {
      await getClient().indices.delete({ index: indexName });
      console.log(`Deleted existing index: ${indexName}`);
    }

    // Create with research paper schema
    await getClient().indices.create({
      index: indexName,
      mappings: {
        properties: {
          title: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          authors: {
            type: 'keyword'
          },
          abstract: {
            type: 'semantic_text', // Use ELSER for abstract
          },
          content: {
            type: 'semantic_text', // Use ELSER for full content
          },
          publicationDate: {
            type: 'date'
          },
          journal: {
            type: 'keyword'
          },
          citations: {
            type: 'integer'
          },
          keywords: {
            type: 'keyword'
          },
          doi: {
            type: 'keyword'
          },
          url: {
            type: 'keyword'
          },
          pageCount: {
            type: 'integer'
          },
          metadata: {
            type: 'object',
            enabled: true
          }
        }
      }
      // Note: Serverless mode doesn't support custom shards/replicas settings
    });
    
    console.log(`✅ Created research papers index: ${indexName}`);
  } catch (error) {
    console.error('Error creating research index:', error);
    throw error;
  }
}

/**
 * Search research papers with filters
 */
export async function searchResearchPapers(
  query: string,
  filters?: {
    authors?: string[];
    dateRange?: { from?: string; to?: string };
    journals?: string[];
    keywords?: string[];
  },
  size: number = 10
): Promise<SearchResult[]> {
  try {
    const should: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    // Semantic search on abstract and content (semantic_text fields)
    // Note: semantic_text fields only support simple match queries, not multi_match
    if (query) {
      // Search in abstract (semantic_text - uses ELSER)
      should.push({
        match: {
          abstract: query
        }
      });
      
      // Search in content (semantic_text - uses ELSER)
      should.push({
        match: {
          content: query
        }
      });
      
      // Search in title (text field with boost)
      should.push({
        match: {
          title: {
            query,
            boost: 2 // Boost title matches
          }
        }
      });
    }

    // Apply filters
    if (filters?.authors && filters.authors.length > 0) {
      filter.push({ terms: { authors: filters.authors } });
    }

    if (filters?.journals && filters.journals.length > 0) {
      filter.push({ terms: { journal: filters.journals } });
    }

    if (filters?.keywords && filters.keywords.length > 0) {
      filter.push({ terms: { keywords: filters.keywords } });
    }

    if (filters?.dateRange) {
      const range: Record<string, unknown> = {};
      if (filters.dateRange.from) range.gte = filters.dateRange.from;
      if (filters.dateRange.to) range.lte = filters.dateRange.to;
      filter.push({ range: { publicationDate: range } });
    }

    const response = await getClient().search({
      index: 'research_papers',
      size,
      query: {
        bool: {
          should: should.length > 0 ? should : undefined,
          filter: filter.length > 0 ? filter : undefined,
          minimum_should_match: 1 // At least one should clause must match
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { citations: { order: 'desc' } } // Secondary sort by citations
      ]
    });

    return response.hits.hits.map((hit) => ({
      id: hit._id || '',
      text: (hit._source as { content: string }).content || '',
      score: hit._score || 0,
      metadata: hit._source as Record<string, unknown>,
    }));
  } catch (error) {
    console.error('Research paper search error:', error);
    throw error;
  }
}

export default getClient;
