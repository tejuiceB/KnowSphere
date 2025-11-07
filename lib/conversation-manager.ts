/**
 * Conversation Manager - Handles conversation history and context
 * Enables follow-up questions and multi-turn conversations
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    searchResults?: number;
    responseTime?: number;
    modelUsed?: string;
  };
}

export interface Conversation {
  id: string;
  messages: Message[];
  context: {
    currentTopic?: string;
    entities: string[];
    lastSearchQuery?: string;
    searchResultsSummary?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();
  private readonly MAX_HISTORY = 10; // Keep last 10 messages for context

  /**
   * Create a new conversation
   */
  createConversation(conversationId: string): Conversation {
    const conversation: Conversation = {
      id: conversationId,
      messages: [],
      context: {
        entities: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  /**
   * Get or create a conversation
   */
  getConversation(conversationId: string): Conversation {
    let conversation = this.conversations.get(conversationId);
    if (!conversation) {
      conversation = this.createConversation(conversationId);
    }
    return conversation;
  }

  /**
   * Add a message to the conversation
   */
  addMessage(
    conversationId: string,
    role: Message['role'],
    content: string,
    metadata?: Message['metadata']
  ): Message {
    const conversation = this.getConversation(conversationId);
    
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      metadata,
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Keep only recent messages
    if (conversation.messages.length > this.MAX_HISTORY * 2) {
      conversation.messages = conversation.messages.slice(-this.MAX_HISTORY * 2);
    }

    // Extract entities and update context
    this.updateContext(conversation, content, role);

    return message;
  }

  /**
   * Get conversation history formatted for AI model
   */
  getContextForAI(conversationId: string, maxMessages: number = 5): string {
    const conversation = this.getConversation(conversationId);
    const recentMessages = conversation.messages.slice(-maxMessages);

    if (recentMessages.length === 0) {
      return '';
    }

    let contextText = '\n\nConversation History:\n';
    recentMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      contextText += `${role}: ${msg.content}\n`;
    });

    if (conversation.context.currentTopic) {
      contextText += `\nCurrent Topic: ${conversation.context.currentTopic}\n`;
    }

    if (conversation.context.entities.length > 0) {
      contextText += `Referenced Entities: ${conversation.context.entities.join(', ')}\n`;
    }

    return contextText;
  }

  /**
   * Update conversation context based on new message
   */
  private updateContext(conversation: Conversation, content: string, role: Message['role']): void {
    // Extract potential topics (simple keyword extraction)
    const keywords = this.extractKeywords(content);
    
    // Update entities (deduplicate)
    keywords.forEach(keyword => {
      if (!conversation.context.entities.includes(keyword)) {
        conversation.context.entities.push(keyword);
      }
    });

    // Keep only recent entities
    if (conversation.context.entities.length > 20) {
      conversation.context.entities = conversation.context.entities.slice(-20);
    }

    // Update current topic based on recent messages
    if (role === 'user') {
      conversation.context.currentTopic = this.identifyTopic(content);
    }
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'about', 'as', 'is', 'was', 'are', 'were',
      'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'what', 'where', 'when', 'how',
      'why', 'who', 'which', 'this', 'that', 'these', 'those', 'tell', 'me'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Return unique words
    return Array.from(new Set(words));
  }

  /**
   * Identify the main topic of the message
   */
  private identifyTopic(text: string): string | undefined {
    const keywords = this.extractKeywords(text);
    return keywords.length > 0 ? keywords[0] : undefined;
  }

  /**
   * Clear old conversations to manage memory
   */
  clearOldConversations(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date().getTime();
    const toDelete: string[] = [];

    this.conversations.forEach((conversation, id) => {
      const age = now - conversation.updatedAt.getTime();
      if (age > maxAge) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.conversations.delete(id));
  }

  /**
   * Check if a query is a follow-up question
   */
  isFollowUpQuestion(conversationId: string, query: string): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.messages.length < 2) {
      return false;
    }

    // Check for follow-up indicators
    const followUpIndicators = [
      'what about', 'how about', 'and', 'also', 'more', 'another',
      'it', 'its', 'their', 'them', 'this', 'that', 'these', 'those',
      'compared to', 'versus', 'vs', 'difference between'
    ];

    const lowerQuery = query.toLowerCase();
    return followUpIndicators.some(indicator => lowerQuery.includes(indicator));
  }

  /**
   * Enhance query with conversation context
   */
  enhanceQueryWithContext(conversationId: string, query: string): string {
    const conversation = this.getConversation(conversationId);
    
    if (!this.isFollowUpQuestion(conversationId, query)) {
      return query;
    }

    // Add context from previous messages
    let enhancedQuery = query;
    
    if (conversation.context.currentTopic) {
      enhancedQuery += ` ${conversation.context.currentTopic}`;
    }

    // Add entities from recent context
    const recentEntities = conversation.context.entities.slice(-5);
    if (recentEntities.length > 0) {
      enhancedQuery += ` ${recentEntities.join(' ')}`;
    }

    return enhancedQuery;
  }

  /**
   * Get all conversations (for debugging or analytics)
   */
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }
}

// Singleton instance
const conversationManager = new ConversationManager();

export default conversationManager;
