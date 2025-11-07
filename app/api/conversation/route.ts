import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch } from '@/lib/elasticsearch';
import { generateResponse } from '@/lib/vertexai';
import conversationManager from '@/lib/conversation-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      conversationId = 'default',
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

    // Enhance query with conversation context if it's a follow-up
    const enhancedQuery = useConversationContext 
      ? conversationManager.enhanceQueryWithContext(conversationId, query)
      : query;

    console.log(`Original query: ${query}`);
    if (enhancedQuery !== query) {
      console.log(`Enhanced query: ${enhancedQuery}`);
    }

    // Perform hybrid search
    console.log(`Performing hybrid search for query: ${query}`);
    const searchResults = await hybridSearch(enhancedQuery, undefined, maxResults);

    // Extract context from search results
    const context = searchResults.map(result => result.text);

    // Get conversation history for AI context
    const conversationContext = useConversationContext 
      ? conversationManager.getContextForAI(conversationId)
      : '';

    // Generate AI response
    console.log('Generating response with AI...');
    const aiResponse = await generateResponse({
      query: query, // Use original query for user-facing response
      context,
      conversationHistory: conversationContext ? [
        { role: 'system', content: conversationContext }
      ] : undefined,
    });

    const responseTime = Date.now() - startTime;

    // Add assistant message to conversation
    conversationManager.addMessage(
      conversationId,
      'assistant',
      aiResponse,
      {
        searchResults: searchResults.length,
        responseTime,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        query,
        enhancedQuery: enhancedQuery !== query ? enhancedQuery : undefined,
        response: aiResponse,
        searchResults,
        conversationId,
        metadata: {
          searchResultsCount: searchResults.length,
          responseTime,
          hasConversationContext: conversationContext.length > 0,
        },
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || 'default';

    const conversation = conversationManager.getConversation(conversationId);

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messageCount: conversation.messages.length,
        messages: conversation.messages,
        context: conversation.context,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
