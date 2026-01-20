import React, { useState, useCallback } from 'react';
import { extractTextFromPdf, parseLinesToPairs } from '../services/pdfParser';
import { ParseResult, Deck, Card } from '../types';
import { dbService } from '../services/db';
import { v4 as uuidv4 } from 'uuid'; // We'll implement a simple uuid polyfill if needed, but lets assume simple math random for simplicity or valid UUID if package allowed. Since user said "no made up libraries", I will use simple random ID generator below.

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

export const ImportWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [parsedPairs, setParsedPairs] = useState<ParseResult[]>([]);
  const [deckName, setDeckName] = useState('New Drug Deck');
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setLoading(true);
    setError('');
    
    try {
      const lines = await extractTextFromPdf(file);
      const pairs = parseLinesToPairs(lines);
      if (pairs.length === 0) {
        setError('No pairs detected. Try a different PDF or check format.');
      } else {
        setParsedPairs(pairs);
        setStep('review');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse PDF. Please ensure it is a valid PDF file.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePair = (index: number, field: 'generic' | 'brand', value: string) => {
    const newPairs = [...parsedPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setParsedPairs(newPairs);
  };

  const handleDeletePair = (index: number) => {
    setParsedPairs(parsedPairs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!deckName.trim()) {
      setError('Please enter a deck name');
      return;
    }

    setLoading(true);
    try {
      const deckId = generateId();
      const newDeck: Deck = {
        id: deckId,
        name: deckName,
        createdAt: Date.now(),
      };

      await dbService.addDeck(newDeck);

      const cards: Card[] = parsedPairs.map(p => ({
        id: generateId(),
        deckId: deckId,
        generic: p.generic,
        brand: p.brand,
        notes: '',
        tags: [],
        dueDate: Date.now(), // Due immediately
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        state: 'new',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      await dbService.addCards(cards);
      onComplete();
    } catch (err) {
      setError('Failed to save deck.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'upload') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Import from PDF</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
            <label className="cursor-pointer">
                <span className="block text-gray-600 font-medium mb-2">Click to Upload PDF</span>
                <span className="text-sm text-gray-400">Supported format: "Generic Name [spaces] Brand Name"</span>
                <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    disabled={loading}
                />
            </label>
        </div>
        
        {loading && <div className="text-center text-blue-600 animate-pulse">Parsing PDF... please wait</div>}
        {error && <div className="text-center text-red-500 bg-red-50 p-3 rounded">{error}</div>}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-md flex flex-col h-[80vh]">
      <div className="flex justify-between items-center mb-4 border-b pb-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Review Flashcards</h2>
            <p className="text-sm text-gray-500">{parsedPairs.length} pairs detected</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setStep('upload')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Back</button>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                {loading ? 'Saving...' : 'Create Deck'}
            </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Deck Name</label>
        <input 
            type="text" 
            value={deckName} 
            onChange={e => setDeckName(e.target.value)} 
            className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="p-3 font-semibold text-gray-600 w-5/12">Generic Name</th>
                    <th className="p-3 font-semibold text-gray-600 w-5/12">Brand Name</th>
                    <th className="p-3 font-semibold text-gray-600 w-2/12 text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {parsedPairs.map((pair, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2">
                            <input 
                                className="w-full bg-transparent p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                                value={pair.generic}
                                onChange={(e) => handleUpdatePair(idx, 'generic', e.target.value)}
                            />
                        </td>
                        <td className="p-2">
                            <input 
                                className="w-full bg-transparent p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded"
                                value={pair.brand}
                                onChange={(e) => handleUpdatePair(idx, 'brand', e.target.value)}
                            />
                        </td>
                        <td className="p-2 text-center">
                            <button 
                                onClick={() => handleDeletePair(idx)}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Delete row"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};