import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Vertex AI with credentials from environment
function getVertexAIClient() {
  const credentials = {
    type: process.env.GCP_SERVICE_ACCOUNT_TYPE,
    project_id: process.env.GCP_SERVICE_ACCOUNT_PROJECT_ID,
    private_key_id: process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    private_key: process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GCP_SERVICE_ACCOUNT_CLIENT_EMAIL,
    client_id: process.env.GCP_SERVICE_ACCOUNT_CLIENT_ID,
    auth_uri: process.env.GCP_SERVICE_ACCOUNT_AUTH_URI,
    token_uri: process.env.GCP_SERVICE_ACCOUNT_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GCP_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GCP_SERVICE_ACCOUNT_CLIENT_CERT_URL,
    universe_domain: process.env.GCP_SERVICE_ACCOUNT_UNIVERSE_DOMAIN,
  };

  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    googleAuthOptions: {
      credentials,
    },
  });

  return vertexAI;
}

export interface GenerateResponseOptions {
  query: string;
  context: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Generate a conversational response using Gemini with RAG
 */
export async function generateResponse(
  options: GenerateResponseOptions
): Promise<string> {
  try {
    const { query, context } = options;

    // Build the prompt with context from Elasticsearch
    const contextText = context.join('\n\n---\n\n');
    
    const prompt = `You are Smart Research Copilot — an intelligent research assistant that helps users explore scientific and technical knowledge.
You are connected to an Elastic hybrid search index containing thousands of research papers, reports, and datasets on AI, Machine Learning, Deep Learning, and related fields.

Your goals:
1. **Summarize** findings clearly from search results
2. **Compare** studies and methodologies (similarities, differences, performance)
3. **Explain** complex concepts in accessible language while maintaining scientific accuracy
4. **Cite sources** clearly with titles, authors, and DOIs when available
5. **Generate insights** such as trends, key findings, or research gaps
6. **Suggest next steps** for further exploration
7. **Visualizations** - When applicable, describe what charts/graphs would help (e.g., "A comparison table showing CNN vs LSTM accuracy...")

Retrieved Research Papers:
${contextText}

User Query: ${query}

Output Format (use markdown):

## 📊 Summary
[Main insights and key findings]

## 📚 Cited Evidence
[Reference specific papers with titles and authors]

## 🧠 Reasoning
[Explain how you derived your answer, connect findings across papers]

## 📈 Visualization Idea (if relevant)
[Describe helpful charts, tables, or comparisons]

## 🔬 Next Steps
[Suggest what the user could explore next]

Important Guidelines:
- Use academic rigor but accessible language
- Always cite papers: "According to [Title] by [Authors], ..."
- For comparisons, create structured tables or bullet points
- If data is insufficient, explain what additional research would help
- For technical terms (LSTM, RAG, transformers), explain briefly before discussing research
- Use emojis (📊🔬🧠📈) to make sections visually clear

Expert Research Answer:`;

    // Try Gemini API first (if API key is available)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Using Gemini API...');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try latest Gemini models in order of preference
        const apiModels = [
          'gemini-2.0-flash-exp',      // Latest experimental model
          'gemini-1.5-pro-latest',     // Latest stable Pro model
          'gemini-1.5-flash-latest',   // Latest stable Flash model
          'gemini-1.5-pro',            // Stable Pro
          'gemini-1.5-flash',          // Stable Flash
          'gemini-pro'                 // Fallback
        ];
        
        for (const modelName of apiModels) {
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
                topP: 0.95,
              }
            });
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            console.log(`✅ Gemini API response generated using ${modelName}`);
            return text;
          } catch (modelError: unknown) {
            const errorMsg = modelError instanceof Error ? modelError.message : 'Unknown error';
            console.log(`Model ${modelName} not available: ${errorMsg}`);
            continue;
          }
        }
        
        throw new Error('No Gemini API models available');
      } catch (geminiError: unknown) {
        const errorMessage = geminiError instanceof Error ? geminiError.message : 'Unknown error';
        console.warn('Gemini API failed:', errorMessage);
        // Continue to try Vertex AI
      }
    }

    // Try using Vertex AI with different model names
    try {
      console.log('Using Vertex AI...');
      const vertexAI = getVertexAIClient();
      
      // Try multiple model names in order of preference (Vertex AI)
      const modelNames = [
        'gemini-2.0-flash-exp',       // Latest experimental
        'gemini-1.5-pro-002',         // Latest stable Pro
        'gemini-1.5-flash-002',       // Latest stable Flash
        'gemini-1.5-pro-001',
        'gemini-1.5-flash-001', 
        'gemini-1.0-pro-002',
        'gemini-pro'
      ];
      
      let model;
      let lastError;
      
      for (const modelName of modelNames) {
        try {
          model = vertexAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
              topP: 0.95,
              topK: 40,
            },
          });
          
          // Try to generate content to verify the model works
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
          
          console.log(`✅ Successfully used Vertex AI model: ${modelName}`);
          return text;
        } catch (err) {
          lastError = err;
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          console.log(`Model ${modelName} failed: ${errorMsg}`);
        }
      }
      
      throw lastError || new Error('No Gemini models available');
    } catch (vertexError: unknown) {
      // If both Gemini API and Vertex AI fail, use fallback response
      const errorMessage = vertexError instanceof Error ? vertexError.message : 'Unknown error';
      console.warn('Vertex AI unavailable, using fallback response:', errorMessage);
      return generateFallbackResponse(query, context);
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackResponse(options.query, options.context);
  }
}

/**
 * Fallback response generator when Vertex AI is unavailable
 * This provides a basic summarization of search results
 */
function generateFallbackResponse(query: string, context: string[]): string {
  if (context.length === 0) {
    return `I couldn't find any information about "${query}" in the knowledge base. Please try a different search query.`;
  }

  // Extract key information from the first result
  const topResult = context[0];
  const sentences = topResult.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Create a basic summary
  let summary = `Based on the search results for "${query}":\n\n`;
  
  if (sentences.length > 0) {
    // Take first 2-3 sentences as summary
    const numSentences = Math.min(3, sentences.length);
    summary += sentences.slice(0, numSentences).map(s => s.trim()).join('. ') + '.';
  }
  
  if (context.length > 1) {
    summary += `\n\n📚 Found ${context.length} relevant results. The information above is from the most relevant match.`;
  }
  
  summary += '\n\n⚠️ Note: Using fallback response mode. For AI-powered conversational answers, please configure Vertex AI API permissions.';
  
  return summary;
}

/**
 * Generate embeddings for text (if needed for custom vector search)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const vertexAI = getVertexAIClient();
    const model = vertexAI.getGenerativeModel({
      model: 'textembedding-gecko@003',
    });

    const result = await model.generateContent(text);
    const embedding = result.response.candidates?.[0]?.content?.parts?.[0] as { values?: number[] } | undefined;
    
    return embedding?.values || [];
  } catch (error) {
    console.error('Vertex AI embedding error:', error);
    throw new Error('Failed to generate embedding');
  }
}

export default getVertexAIClient;
