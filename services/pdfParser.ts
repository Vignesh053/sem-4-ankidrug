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
    
    // Simple extraction: join items with space, but we might want to respect y-coords for tables
    // For now, let's try the simple line assembly provided by PDF.js text items
    // If textContent.items gives us fragments, we need to reconstruct lines based on 'transform[5]' (y-coord)
    
    let pageLines: { y: number; text: string }[] = [];
    
    for (const item of textContent.items) {
      // transform[5] is the y coordinate
      const y = Math.round(item.transform[5]); 
      const text = item.str;
      
      const existingLine = pageLines.find(l => Math.abs(l.y - y) < 5); // tolerance of 5 units
      if (existingLine) {
        existingLine.text += ' ' + text; // crude join
      } else {
        pageLines.push({ y, text });
      }
    }
    
    // Sort top to bottom (PDF y starts at bottom usually, but let's just reverse sort Y)
    pageLines.sort((a, b) => b.y - a.y);
    lines.push(...pageLines.map(pl => pl.text));
  }

  return lines;
};

export const parseLinesToPairs = (lines: string[]): ParseResult[] => {
  const pairs: ParseResult[] = [];
  
  // Regex heuristics
  // 1. Two or more spaces separating words: "Generic Name   Brand Name"
  const multiSpaceRegex = /^(.*?)\s{2,}(.*)$/;
  
  // 2. Dash separator: "Generic - Brand" (be careful of chemical names with dashes)
  // We'll prioritize multi-space first as it implies tabular data
  
  const headers = ['generic name', 'brand name', 'page', 'hamilton health'];

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    
    // Skip headers
    if (headers.some(h => cleanLine.toLowerCase().includes(h))) continue;
    if (/^\d+$/.test(cleanLine)) continue; // Skip page numbers

    let generic = '';
    let brand = '';

    // Strategy 1: Table-like spacing
    const spaceMatch = cleanLine.match(multiSpaceRegex);
    if (spaceMatch) {
      generic = spaceMatch[1].trim();
      brand = spaceMatch[2].trim();
    } else {
      // Strategy 2: Common delimiters if not table spacing
      // Look for "Generic (Brand)" or "Generic - Brand"
      // This is risky for chemical names, so we'll be conservative.
      // If the line is just one block, we skip it or mark as ambiguous.
      continue;
    }

    if (generic && brand && generic.length > 2 && brand.length > 2) {
      // De-dupe slightly (remove common filler words if any)
      pairs.push({ generic, brand });
    }
  }

  return pairs;
};