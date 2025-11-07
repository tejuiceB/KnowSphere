import { NextRequest, NextResponse } from 'next/server';
import { elasticClient } from '@/lib/elasticsearch';

const INDEX_NAME = process.env.ELASTIC_INDEX_NAME || 'research_papers';
const ANALYTICS_INDEX = 'search_analytics';

/**
 * Log search query for analytics
 */
async function logSearchQuery(
  query: string,
  resultsCount: number,
  responseTime: number,
  conversationId: string
): Promise<void> {
  try {
    // elasticClient is now a function that returns the client
    await elasticClient().index({
      index: ANALYTICS_INDEX,
      document: {
        query,
        resultsCount,
        responseTime,
        conversationId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to log analytics:', error);
  }
}

/**
 * Get analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7 days default

    // Calculate time range
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get popular queries
    const popularQueries = await elasticClient().search({
      index: ANALYTICS_INDEX,
      size: 0,
      query: {
        range: {
          timestamp: {
            gte: startDate.toISOString(),
            lte: now.toISOString(),
          },
        },
      },
      aggs: {
        popular_queries: {
          terms: {
            field: 'query.keyword',
            size: 10,
          },
          aggs: {
            avg_response_time: {
              avg: {
                field: 'responseTime',
              },
            },
            avg_results: {
              avg: {
                field: 'resultsCount',
              },
            },
          },
        },
      },
    });

    // Get search volume over time
    const searchVolume = await elasticClient().search({
      index: ANALYTICS_INDEX,
      size: 0,
      query: {
        range: {
          timestamp: {
            gte: startDate.toISOString(),
            lte: now.toISOString(),
          },
        },
      },
      aggs: {
        searches_over_time: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: period === '1h' ? '1m' : period === '24h' ? '1h' : '1d',
          },
        },
      },
    });

    // Get overall statistics
    const stats = await elasticClient().search({
      index: ANALYTICS_INDEX,
      size: 0,
      query: {
        range: {
          timestamp: {
            gte: startDate.toISOString(),
            lte: now.toISOString(),
          },
        },
      },
      aggs: {
        total_searches: {
          value_count: {
            field: 'query.keyword',
          },
        },
        avg_response_time: {
          avg: {
            field: 'responseTime',
          },
        },
        avg_results: {
          avg: {
            field: 'resultsCount',
          },
        },
        unique_conversations: {
          cardinality: {
            field: 'conversationId.keyword',
          },
        },
      },
    });

    // Get document statistics
    const docStats = await elasticClient().count({
      index: INDEX_NAME,
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalSearches: (stats.aggregations?.total_searches as { value: number })?.value || 0,
          avgResponseTime: Math.round((stats.aggregations?.avg_response_time as { value: number })?.value || 0),
          avgResults: ((stats.aggregations?.avg_results as { value: number })?.value || 0).toFixed(1),
          uniqueConversations: (stats.aggregations?.unique_conversations as { value: number })?.value || 0,
          totalDocuments: docStats.count,
        },
        popularQueries: (popularQueries.aggregations?.popular_queries as {
          buckets: Array<{
            key: string;
            doc_count: number;
            avg_response_time: { value: number };
            avg_results: { value: number };
          }>;
        })?.buckets.map((bucket) => ({
          query: bucket.key,
          count: bucket.doc_count,
          avgResponseTime: Math.round(bucket.avg_response_time.value),
          avgResults: bucket.avg_results.value.toFixed(1),
        })) || [],
        searchVolume: (searchVolume.aggregations?.searches_over_time as {
          buckets: Array<{
            key_as_string: string;
            doc_count: number;
          }>;
        })?.buckets.map((bucket) => ({
          timestamp: bucket.key_as_string,
          count: bucket.doc_count,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    
    // Return empty analytics if index doesn't exist yet
    if (error instanceof Error && error.message.includes('index_not_found')) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalSearches: 0,
            avgResponseTime: 0,
            avgResults: 0,
            uniqueConversations: 0,
            totalDocuments: 0,
          },
          popularQueries: [],
          searchVolume: [],
        },
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Log a search query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, resultsCount, responseTime, conversationId } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    await logSearchQuery(query, resultsCount, responseTime, conversationId);

    return NextResponse.json({
      success: true,
      message: 'Analytics logged successfully',
    });
  } catch (error) {
    console.error('Log analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to log analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export { logSearchQuery };
