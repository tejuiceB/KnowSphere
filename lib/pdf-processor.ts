import fs from 'fs';

// Use require for pdf-parse to avoid ESM issues in production
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export interface ResearchPaper {
  title: string;
  authors: string[];
  abstract: string;
  content: string;
  publicationDate?: string;
  journal?: string;
  citations?: number;
  keywords?: string[];
  doi?: string;
  url?: string;
  pageCount?: number;
  metadata: Record<string, unknown>;
}

/**
 * Extract text and metadata from a PDF file
 */
export async function extractFromPDF(filePath: string): Promise<ResearchPaper> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    // Extract metadata
    const info = data.info as Record<string, unknown>;
    const title = (info?.Title as string) || extractTitleFromText(data.text);
    const authors = extractAuthors(data.text, info);
    const abstract = extractAbstract(data.text);
    const keywords = extractKeywords(data.text);

    return {
      title,
      authors,
      abstract,
      content: data.text,
      pageCount: data.numpages,
      keywords,
      metadata: {
        ...info,
        fileName: filePath.split(/[\\/]/).pop(),
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error processing PDF ${filePath}:`, error);
    throw error;
  }
}

/**
 * Extract title from PDF text (first meaningful line)
 */
function extractTitleFromText(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Find first substantial line (likely the title)
  for (const line of lines) {
    if (line.length > 20 && line.length < 200 && !line.startsWith('http')) {
      return line;
    }
  }
  
  return lines[0] || 'Untitled Document';
}

/**
 * Extract authors from text or metadata
 */
function extractAuthors(text: string, metadata: Record<string, unknown>): string[] {
  // Check metadata first
  if (metadata?.Author && typeof metadata.Author === 'string') {
    return [metadata.Author];
  }

  // Look for author patterns in first 500 characters
  const header = text.substring(0, 500);
  const authorPatterns = [
    /(?:by|author[s]?:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,\s*([A-Z][a-z]+\s+[A-Z][a-z]+))/g,
  ];

  for (const pattern of authorPatterns) {
    const matches = header.match(pattern);
    if (matches && matches.length > 0) {
      return matches.slice(0, 5).map(m => m.replace(/^(by|author[s]?:?)\s+/i, '').trim());
    }
  }

  return ['Unknown Author'];
}

/**
 * Extract abstract from document
 */
function extractAbstract(text: string): string {
  const abstractPatterns = [
    /abstract[:\s]+([\s\S]{100,1000}?)(?:\n\n|\n(?:1\.|introduction|keywords))/i,
    /summary[:\s]+([\s\S]{100,1000}?)(?:\n\n|\n(?:1\.|introduction))/i,
  ];

  for (const pattern of abstractPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: get first 500 characters after title
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  return lines.slice(1, 10).join(' ').substring(0, 500) + '...';
}

/**
 * Extract keywords from document
 */
function extractKeywords(text: string): string[] {
  const keywordPattern = /keywords?[:\s]+([\w\s,;-]+?)(?:\n\n|\n(?:1\.|introduction))/i;
  const match = text.match(keywordPattern);
  
  if (match && match[1]) {
    return match[1]
      .split(/[,;]/)
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 10);
  }

  return [];
}

/**
 * Process multiple PDF files
 */
export async function processPDFBatch(filePaths: string[]): Promise<ResearchPaper[]> {
  const results: ResearchPaper[] = [];
  
  for (const filePath of filePaths) {
    try {
      console.log(`Processing: ${filePath}`);
      const paper = await extractFromPDF(filePath);
      results.push(paper);
      console.log(`✅ Extracted: ${paper.title}`);
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }
  
  return results;
}
