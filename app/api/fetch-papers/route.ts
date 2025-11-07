import { NextRequest, NextResponse } from 'next/server';
import { indexDocument } from '@/lib/elasticsearch';

/**
 * API Route: Fetch Papers
 * Automatically fetches papers from academic sources and indexes them
 */

interface ArXivPaper {
  id: string;
  title: string;
  summary: string;
  authors: { name: string }[];
  published: string;
  pdf_url: string;
  categories: string[];
}

interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string;
  authors: { name: string }[];
  year: number;
  url: string;
  fieldsOfStudy: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { query, authors } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const papersAdded: string[] = [];
    const paperTitles: string[] = [];
    
    // Try to fetch from arXiv first
    try {
      const arxivPapers = await fetchFromArXiv(query, authors);
      for (const paper of arxivPapers) {
        const docId = await indexDocument({
          text: `${paper.title} ${paper.summary}`,
          metadata: {
            title: paper.title,
            authors: paper.authors.map(a => a.name),
            abstract: paper.summary,
            content: paper.summary,
            year: new Date(paper.published).getFullYear(),
            url: paper.pdf_url,
            source: 'arXiv',
            categories: paper.categories,
            arxivId: paper.id,
            addedAt: new Date().toISOString(),
          },
        }, 'research_papers');
        papersAdded.push(docId);
        paperTitles.push(paper.title);
      }
    } catch (error) {
      console.error('arXiv fetch error:', error);
    }

    // Try Semantic Scholar API
    try {
      const semanticPapers = await fetchFromSemanticScholar(query, authors);
      for (const paper of semanticPapers) {
        if (!paper.abstract) continue; // Skip papers without abstracts
        
        const docId = await indexDocument({
          text: `${paper.title} ${paper.abstract}`,
          metadata: {
            title: paper.title,
            authors: paper.authors.map(a => a.name),
            abstract: paper.abstract,
            content: paper.abstract,
            year: paper.year,
            url: paper.url,
            source: 'Semantic Scholar',
            fieldsOfStudy: paper.fieldsOfStudy || [],
            semanticScholarId: paper.paperId,
            addedAt: new Date().toISOString(),
          },
        }, 'research_papers');
        papersAdded.push(docId);
        paperTitles.push(paper.title);
      }
    } catch (error) {
      console.warn('Semantic Scholar API unavailable, continuing with arXiv results only');
    }

    if (papersAdded.length === 0) {
      return NextResponse.json(
        { 
          error: 'No papers found for the given query. Try different keywords or topics.',
          message: 'Both arXiv and Semantic Scholar returned no results. Please refine your search.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      papersAdded: papersAdded.length,
      papers: paperTitles,
      message: `Successfully indexed ${papersAdded.length} paper(s)`,
    });

  } catch (error) {
    console.error('Error in fetch-papers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch papers from arXiv
 */
async function fetchFromArXiv(query: string, authors?: string[]): Promise<ArXivPaper[]> {
  const searchQuery = authors && authors.length > 0
    ? `all:${query} AND au:${authors.join(' OR au:')}`
    : `all:${query}`;
  
  const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=10&sortBy=relevance&sortOrder=descending`;
  
  const response = await fetch(url);
  const xmlText = await response.text();
  
  // Parse XML (basic parsing - in production use a proper XML parser)
  const papers: ArXivPaper[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];
    
    const idMatch = /<id>(.*?)<\/id>/.exec(entry);
    const titleMatch = /<title>(.*?)<\/title>/.exec(entry);
    const summaryMatch = /<summary>(.*?)<\/summary>/.exec(entry);
    const publishedMatch = /<published>(.*?)<\/published>/.exec(entry);
    
    // Extract authors
    const authorMatches = entry.match(/<name>(.*?)<\/name>/g);
    const authorsList = authorMatches ? authorMatches.map(a => ({
      name: a.replace(/<\/?name>/g, '').trim()
    })) : [];
    
    // Extract categories
    const categoryMatches = entry.match(/term="([^"]+)"/g);
    const categories = categoryMatches ? categoryMatches.map(c => 
      c.replace(/term="([^"]+)"/, '$1')
    ) : [];
    
    if (idMatch && titleMatch && summaryMatch) {
      papers.push({
        id: idMatch[1].split('/').pop() || '',
        title: titleMatch[1].replace(/\n/g, ' ').trim(),
        summary: summaryMatch[1].replace(/\n/g, ' ').trim(),
        authors: authorsList,
        published: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
        pdf_url: idMatch[1].replace('/abs/', '/pdf/'),
        categories,
      });
    }
  }
  
  return papers.slice(0, 5); // Limit to 5 papers
}

/**
 * Fetch papers from Semantic Scholar
 */
async function fetchFromSemanticScholar(query: string, authors?: string[]): Promise<SemanticScholarPaper[]> {
  const searchQuery = authors && authors.length > 0
    ? `${query} ${authors.join(' ')}`
    : query;
  
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchQuery)}&limit=5&fields=title,abstract,authors,year,url,fieldsOfStudy`;
  
  try {
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.status === 429) {
      console.warn('Semantic Scholar rate limit exceeded, skipping...');
      return [];
    }
    
    if (!response.ok) {
      console.error('Semantic Scholar API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return [];
    }
    
    interface RawPaper {
      paperId: string;
      title: string;
      abstract?: string;
      authors?: { name: string }[];
      year?: number;
      url?: string;
      fieldsOfStudy?: string[];
    }
    
    return data.data.filter((paper: RawPaper) => paper.abstract).map((paper: RawPaper) => ({
      paperId: paper.paperId,
      title: paper.title,
      abstract: paper.abstract || '',
      authors: paper.authors || [],
      year: paper.year || new Date().getFullYear(),
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      fieldsOfStudy: paper.fieldsOfStudy || [],
    }));
  } catch (error) {
    console.error('Semantic Scholar fetch error:', error);
    return [];
  }
}
