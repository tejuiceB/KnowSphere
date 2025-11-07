import { NextRequest, NextResponse } from 'next/server';
import { indexDocument, bulkIndexDocuments } from '@/lib/elasticsearch';

/**
 * API route to index documents into Elasticsearch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents, bulk = false, title, authors, abstract, keywords, year, url } = body;

    // Handle research paper submission
    if (title && authors && abstract) {
      const paperDocument = {
        title,
        authors,
        abstract,
        content: abstract, // Use abstract as content
        keywords: keywords || [],
        year: year || new Date().getFullYear(),
        url: url || '',
        source: 'user_submission',
        submittedAt: new Date().toISOString(),
      };

      const docId = await indexDocument({
        text: `${title} ${abstract}`,
        metadata: paperDocument,
      }, 'research_papers');

      return NextResponse.json({
        success: true,
        message: 'Research paper added successfully',
        id: docId,
        paper: paperDocument,
      });
    }

    if (!documents) {
      return NextResponse.json(
        { error: 'Documents are required' },
        { status: 400 }
      );
    }

    if (bulk) {
      // Bulk indexing
      if (!Array.isArray(documents)) {
        return NextResponse.json(
          { error: 'Documents must be an array for bulk indexing' },
          { status: 400 }
        );
      }

      await bulkIndexDocuments(documents);

      return NextResponse.json({
        success: true,
        message: `Successfully indexed ${documents.length} documents`,
        count: documents.length,
      });
    } else {
      // Single document indexing
      const document = Array.isArray(documents) ? documents[0] : documents;

      if (!document.text) {
        return NextResponse.json(
          { error: 'Document must have a text field' },
          { status: 400 }
        );
      }

      const docId = await indexDocument(document);

      return NextResponse.json({
        success: true,
        message: 'Document indexed successfully',
        id: docId,
      });
    }
  } catch (error) {
    console.error('Index API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to index documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Index API is running. Use POST method to index documents.',
    example: {
      single: {
        documents: {
          text: 'Your document text here',
          metadata: { source: 'example' },
        },
      },
      bulk: {
        bulk: true,
        documents: [
          { text: 'Document 1', metadata: {} },
          { text: 'Document 2', metadata: {} },
        ],
      },
    },
  });
}
