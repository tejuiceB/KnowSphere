import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { bulkIndexDocuments, ensureResearchIndexExists } from '../lib/elasticsearch';
import { getCuratedResearchPapers, searchArxiv, convertArxivToResearchPaper } from '../lib/arxiv-client';
import { ResearchPaper } from '../lib/pdf-processor';

const INDEX_NAME = 'research_papers';

/**
 * Ingest research papers from multiple sources
 */
async function ingestResearchPapers() {
  try {
    console.log('🚀 Starting Research Paper Ingestion...\n');

    // Step 1: Ensure index exists with proper schema
    console.log('📋 Setting up Elasticsearch index...');
    await ensureResearchIndexExists(INDEX_NAME);

    // Step 2: Get sample curated papers (always available)
    console.log('\n📚 Loading curated research papers...');
    const curatedPapers = await getCuratedResearchPapers();
    console.log(`✅ Loaded ${curatedPapers.length} curated papers\n`);

    // Step 3: Try to fetch from arXiv (50+ papers per topic)
    const arxivPapers: ResearchPaper[] = [];
    try {
      console.log('🔍 Fetching comprehensive papers from arXiv...');
      console.log('📊 Target: 50+ papers per major topic\n');
      
      const topics = [
        // Foundational AI/ML/DL (50+ papers each)
        { query: 'artificial intelligence machine learning', count: 50, category: 'AI Fundamentals' },
        { query: 'deep learning neural networks', count: 50, category: 'Deep Learning' },
        { query: 'supervised learning classification regression', count: 50, category: 'Supervised Learning' },
        { query: 'unsupervised learning clustering', count: 50, category: 'Unsupervised Learning' },
        { query: 'reinforcement learning', count: 50, category: 'Reinforcement Learning' },
        
        // Neural Network Architectures (50+ papers each)
        { query: 'convolutional neural networks CNN', count: 50, category: 'CNNs' },
        { query: 'recurrent neural networks RNN LSTM', count: 50, category: 'RNNs & LSTMs' },
        { query: 'transformer architecture attention mechanism', count: 50, category: 'Transformers' },
        { query: 'graph neural networks GNN', count: 50, category: 'Graph Networks' },
        
        // Generative AI (50+ papers each)
        { query: 'large language models GPT BERT', count: 50, category: 'LLMs' },
        { query: 'generative adversarial networks GAN', count: 50, category: 'GANs' },
        { query: 'diffusion models stable diffusion', count: 50, category: 'Diffusion Models' },
        { query: 'variational autoencoders VAE', count: 50, category: 'VAEs' },
        { query: 'prompt engineering in-context learning', count: 50, category: 'Prompt Engineering' },
        
        // RAG & Retrieval (50+ papers each)
        { query: 'retrieval augmented generation RAG', count: 50, category: 'RAG Systems' },
        { query: 'semantic search embeddings', count: 50, category: 'Semantic Search' },
        { query: 'vector databases similarity search', count: 50, category: 'Vector Databases' },
        { query: 'information retrieval neural', count: 50, category: 'Information Retrieval' },
        
        // NLP & Computer Vision (50+ papers each)
        { query: 'natural language processing NLP', count: 50, category: 'NLP' },
        { query: 'machine translation neural', count: 50, category: 'Machine Translation' },
        { query: 'question answering systems', count: 50, category: 'Question Answering' },
        { query: 'text summarization', count: 50, category: 'Text Summarization' },
        { query: 'sentiment analysis', count: 50, category: 'Sentiment Analysis' },
        { query: 'computer vision object detection', count: 50, category: 'Computer Vision' },
        { query: 'image segmentation', count: 50, category: 'Image Segmentation' },
        
        // Advanced Topics (50+ papers each)
        { query: 'transfer learning domain adaptation', count: 50, category: 'Transfer Learning' },
        { query: 'few-shot learning meta-learning', count: 50, category: 'Few-Shot Learning' },
        { query: 'neural architecture search AutoML', count: 50, category: 'AutoML' },
        { query: 'explainable AI interpretability', count: 50, category: 'Explainable AI' },
        { query: 'adversarial robustness', count: 50, category: 'Adversarial ML' },
        
        // Optimization & Training (50+ papers each)
        { query: 'optimization algorithms deep learning', count: 50, category: 'Optimization' },
        { query: 'regularization techniques overfitting', count: 50, category: 'Regularization' },
        { query: 'batch normalization layer normalization', count: 50, category: 'Normalization' },
        { query: 'learning rate scheduling', count: 50, category: 'Training Techniques' },
        
        // Applications (50+ papers each)
        { query: 'speech recognition audio processing', count: 50, category: 'Speech Recognition' },
        { query: 'recommender systems collaborative filtering', count: 50, category: 'Recommender Systems' },
        { query: 'time series forecasting', count: 50, category: 'Time Series' },
        { query: 'drug discovery machine learning', count: 50, category: 'Healthcare AI' },
        
        // Spacecraft & Anomaly Detection (50+ papers each)
        { query: 'spacecraft anomaly detection', count: 50, category: 'Spacecraft Anomaly' },
        { query: 'satellite telemetry monitoring', count: 50, category: 'Satellite Systems' },
        { query: 'time series anomaly detection LSTM', count: 50, category: 'Anomaly Detection' },
        { query: 'predictive maintenance aerospace', count: 50, category: 'Predictive Maintenance' },
        { query: 'fault detection diagnosis systems', count: 50, category: 'Fault Detection' },
      ];

      let totalFetched = 0;
      const papersByCategory = new Map<string, number>();

      for (const topic of topics) {
        console.log(`  📖 [${topic.category}] Fetching: "${topic.query}" (${topic.count} papers)`);
        const papers = await searchArxiv(topic.query, topic.count);
        
        for (const paper of papers) {
          arxivPapers.push(convertArxivToResearchPaper(paper));
        }
        
        const currentCount = papersByCategory.get(topic.category) || 0;
        papersByCategory.set(topic.category, currentCount + papers.length);
        totalFetched += papers.length;
        
        console.log(`     ✅ Got ${papers.length} papers (Total: ${totalFetched})`);
        
        // Be nice to arXiv - delay between requests (reduced to 2s for efficiency)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`\n✅ Fetched ${arxivPapers.length} papers from arXiv\n`);
      console.log('📊 Papers by Category:');
      Array.from(papersByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   • ${category}: ${count} papers`);
        });
      console.log('');
    } catch (error) {
      console.warn('⚠️  Could not fetch from arXiv:', error);
      console.log('Continuing with curated papers only...\n');
    }

    // Step 4: Combine all papers
    const allPapers = [...curatedPapers, ...arxivPapers];
    console.log(`📊 Total papers to ingest: ${allPapers.length}\n`);

    // Step 5: Format for Elasticsearch
    console.log('💾 Indexing papers into Elasticsearch...');
    const documents = allPapers.map((paper) => ({
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      content: paper.content,
      publicationDate: paper.publicationDate,
      journal: paper.journal,
      citations: paper.citations || 0,
      keywords: paper.keywords || [],
      doi: paper.doi,
      url: paper.url,
      pageCount: paper.pageCount,
      metadata: paper.metadata,
    }));

    // Index in batches of 10
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await bulkIndexDocuments(batch, INDEX_NAME);
      console.log(`  ✅ Indexed ${Math.min(i + batchSize, documents.length)}/${documents.length} papers`);
    }

    console.log('\n🎉 SUCCESS! Research paper ingestion complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Total papers indexed: ${allPapers.length}`);
    console.log(`   • Educational content papers: ${curatedPapers.length}`);
    console.log(`   • arXiv research papers: ${arxivPapers.length}`);
    console.log(`   • Index name: ${INDEX_NAME}\n`);

    console.log('🔍 Try searching for:');
    console.log('   AI/ML Fundamentals:');
    console.log('   • "What is artificial intelligence?"');
    console.log('   • "Explain machine learning fundamentals"');
    console.log('   • "What is deep learning?"');
    console.log('   • "Difference between supervised and unsupervised learning"\n');
    
    console.log('   Neural Networks:');
    console.log('   • "What is LSTM?"');
    console.log('   • "Explain convolutional neural networks"');
    console.log('   • "How do transformers work?"');
    console.log('   • "Compare RNN and LSTM"\n');
    
    console.log('   Generative AI:');
    console.log('   • "What is retrieval augmented generation?"');
    console.log('   • "Explain large language models"');
    console.log('   • "How do GANs work?"');
    console.log('   • "What are diffusion models?"\n');
    
    console.log('   Applications:');
    console.log('   • "Spacecraft anomaly detection using LSTM"');
    console.log('   • "Time series forecasting with deep learning"');
    console.log('   • "Computer vision object detection"');
    console.log('   • "Natural language processing techniques"\n');

    console.log('💡 Start the app: npm run dev');
    console.log('🌐 Open: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
ingestResearchPapers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
