import { ParseResult } from '../types';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const extractTextFromPdf = async (file: File): Promise<string[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let lines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let pageLines: { y: number; text: string }[] = [];
    
    for (const item of textContent.items) {
      const y = Math.round(item.transform[5]); 
      const text = item.str;
      
      const existingLine = pageLines.find(l => Math.abs(l.y - y) < 5);
      if (existingLine) {
        existingLine.text += '   ' + text; // Use wider spacing to preserve column identity
      } else {
        pageLines.push({ y, text });
      }
    }
    
    pageLines.sort((a, b) => b.y - a.y);
    lines.push(...pageLines.map(pl => pl.text));
  }

  return lines;
};

export const parseLinesToPairs = (lines: string[]): ParseResult[] => {
  const pairs: ParseResult[] = [];
  
  // Heuristic for multi-column layout
  // Strategy: Split by 2+ spaces. 
  // 2 columns: [0]Generic, [1]Brand
  // 3 columns: [0]Generic, [1]Brand, [2]Classification
  
  const headers = ['generic', 'brand', 'classification', 'drug class', 'page', 'hamilton health'];

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    if (headers.some(h => cleanLine.toLowerCase().includes(h))) continue;
    if (/^\d+$/.test(cleanLine)) continue; 

    // Split by multiple spaces
    const parts = cleanLine.split(/\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      pairs.push({
        generic: parts[0],
        brand: parts[1],
        classification: parts[2] || 'Unclassified'
      });
    }
  }

  return pairs;
};