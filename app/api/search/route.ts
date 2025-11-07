import { NextRequest, NextResponse } from 'next/server';
import { searchResearchPapers } from '@/lib/elasticsearch';
import { generateResponse } from '@/lib/vertexai';
import conversationManager from '@/lib/conversation-manager';
import { logSearchQuery } from '@/app/api/analytics/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      conversationHistory = [],
      conversationId = `conv_${Date.now()}`,
      useConversationContext = true,
      maxResults = 5
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Add user message to conversation
    conversationManager.addMessage(conversationId, 'user', query);

    // Enhance query with conversation context if enabled
    const enhancedQuery = useConversationContext 
      ? conversationManager.enhanceQueryWithContext(conversationId, query)
      : query;

    // Step 1: Perform semantic search in research papers
    console.log('Searching research papers for query:', query);
    if (enhancedQuery !== query) {
      console.log('Enhanced with context:', enhancedQuery);
    }
    
    const searchResults = await searchResearchPapers(enhancedQuery, undefined, maxResults);

    if (searchResults.length === 0) {
      const noResultsMessage = "I couldn't find any relevant research papers to answer your question. Try asking about AI, machine learning, transformers, or LSTM networks.";
      conversationManager.addMessage(conversationId, 'assistant', noResultsMessage);
      
      return NextResponse.json({
        answer: noResultsMessage,
        sources: [],
        searchResults: [],
        conversationId,
      });
    }

    // Step 2: Extract context from search results (paper abstracts and content)
    const context = searchResults.map((result) => {
      const paper = result.metadata as {
        title?: string;
        authors?: string[];
        abstract?: string;
        publicationDate?: string;
        citations?: number;
      };
      
      // Format paper context for AI
      return `
**Paper:** ${paper.title || 'Unknown Title'}
**Authors:** ${paper.authors?.join(', ') || 'Unknown'}
**Published:** ${paper.abstract || result.text.substring(0, 500)}
${paper.citations ? `**Citations:** ${paper.citations}` : ''}
`.trim();
    });

    // Get conversation context for AI
    const conversationContext = useConversationContext 
      ? conversationManager.getContextForAI(conversationId, 3)
      : '';

    // Step 3: Generate conversational response using Vertex AI Gemini
    console.log('Generating response with AI...');
    const answer = await generateResponse({
      query,
      context,
      conversationHistory: conversationContext ? [
        { role: 'system', content: conversationContext },
        ...conversationHistory
      ] : conversationHistory,
    });

    const responseTime = Date.now() - startTime;

    // Add assistant message to conversation
    conversationManager.addMessage(
      conversationId,
      'assistant',
      answer,
      {
        searchResults: searchResults.length,
        responseTime,
      }
    );

    // Log analytics (fire and forget)
    logSearchQuery(query, searchResults.length, responseTime, conversationId).catch(console.error);

    // Step 4: Return response with research paper sources
    return NextResponse.json({
      answer,
      sources: searchResults.map((result) => {
        const paper = result.metadata as {
          title?: string;
          authors?: string[];
          url?: string;
          citations?: number;
          publicationDate?: string;
          journal?: string;
        };
        
        return {
          id: result.id,
          title: paper.title || 'Unknown Title',
          authors: paper.authors || [],
          text: result.text.substring(0, 300) + '...',
          score: result.score,
          url: paper.url,
          citations: paper.citations || 0,
          publicationDate: paper.publicationDate,
          journal: paper.journal,
        };
      }),
      searchResults,
      conversationId,
      enhancedQuery: enhancedQuery !== query ? enhancedQuery : undefined,
      metadata: {
        searchResultsCount: searchResults.length,
        responseTime,
        hasConversationContext: conversationContext.length > 0,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process search request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Search API is running. Use POST method with { query: "your question" }',
  });
}
