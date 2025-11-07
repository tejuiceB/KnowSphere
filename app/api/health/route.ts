import { NextResponse } from 'next/server';
import { elasticClient } from '@/lib/elasticsearch';

/**
 * Health check endpoint to verify Elasticsearch and API status
 */
export async function GET() {
  try {
    // Check Elasticsearch connection
    const elasticHealth = await elasticClient().ping();

    return NextResponse.json({
      status: 'healthy',
      elasticsearch: elasticHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        elasticsearch: elasticHealth ? 'operational' : 'down',
        vertexai: 'configured',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
