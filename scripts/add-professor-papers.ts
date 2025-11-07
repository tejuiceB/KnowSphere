import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { bulkIndexDocuments } from '../lib/elasticsearch';
import { searchArxiv, convertArxivToResearchPaper } from '../lib/arxiv-client';
import { ResearchPaper } from '../lib/pdf-processor';

const INDEX_NAME = 'research_papers';

/**
 * Add papers from specific professors/researchers to existing index
 */
async function addProfessorPapers() {
  try {
    console.log('🚀 Adding Professor Papers to Existing Index...\n');

    // Search for Danilo Vasconcellos Vargas papers
    console.log('👨‍🏫 Fetching papers by: Danilo Vasconcellos Vargas');
    console.log('📍 Associate Professor at Kyushu University, Japan\n');

    // Try multiple search strategies to get all his papers
    const searchQueries = [
      'Danilo Vasconcellos Vargas',
      'Danilo Vargas Kyushu',
      'D Vargas evolutionary computation',
      'Danilo Vargas neuroevolution',
      'Danilo Vargas artificial intelligence',
    ];

    const uniquePapers = new Map<string, ResearchPaper>();

    for (const query of searchQueries) {
      console.log(`  🔍 Searching: "${query}"`);
      
      try {
        // Use searchArxiv function with higher limit
        const papers = await searchArxiv(query, 100);
        console.log(`     ✅ Found ${papers.length} papers`);

        for (const paper of papers) {
          const researchPaper = convertArxivToResearchPaper(paper);
          // Use arXiv ID as unique key to avoid duplicates
          const paperId = paper.arxivUrl || paper.title;
          if (!uniquePapers.has(paperId)) {
            uniquePapers.set(paperId, researchPaper);
            console.log(`        📄 ${researchPaper.title.substring(0, 80)}...`);
          }
        }

        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`     ⚠️  Error with query "${query}":`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    const professorPapers = Array.from(uniquePapers.values());
    console.log(`\n✅ Total unique papers found: ${professorPapers.length}\n`);

    if (professorPapers.length === 0) {
      console.log('⚠️  No papers found. This could mean:');
      console.log('   • Author name spelling might be different');
      console.log('   • Papers might be on other platforms (Google Scholar, ResearchGate)');
      console.log('   • Papers might not be on arXiv\n');
      console.log('💡 Tip: You can manually add papers by editing this script');
      return;
    }

    // Format for Elasticsearch
    console.log('💾 Indexing papers into Elasticsearch...');
    const documents = professorPapers.map((paper) => ({
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
      metadata: {
        ...paper.metadata,
        professor: 'Danilo Vasconcellos Vargas',
        affiliation: 'Kyushu University, Japan',
      },
    }));

    // Index in batches of 10
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await bulkIndexDocuments(batch, INDEX_NAME);
      console.log(`  ✅ Indexed ${Math.min(i + batchSize, documents.length)}/${documents.length} papers`);
    }

    console.log('\n🎉 SUCCESS! Professor papers added to existing index!\n');
    console.log('📊 Summary:');
    console.log(`   • Papers added: ${professorPapers.length}`);
    console.log(`   • Professor: Danilo Vasconcellos Vargas`);
    console.log(`   • Affiliation: Kyushu University, Japan`);
    console.log(`   • Index name: ${INDEX_NAME}\n`);

    console.log('🔍 Try searching for:');
    console.log('   • "Papers by Danilo Vargas"');
    console.log('   • "Research from Kyushu University"');
    console.log('   • "Danilo Vasconcellos Vargas latest work"');
    console.log('   • Look at paper authors and find his work\n');

    console.log('💡 Start the app: npm run dev');
    console.log('🌐 Open: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Error during ingestion:', error);
    process.exit(1);
  }
}

// Run the ingestion
addProfessorPapers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
