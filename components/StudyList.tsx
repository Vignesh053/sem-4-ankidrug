import React, { useState, useMemo } from 'react';
import { Card, Deck } from '../types';

interface Props {
  deck: Deck;
  cards: Card[];
  onBack: () => void;
}

type ListMode = 'generic_visible' | 'brand_visible' | 'both_visible';

export const StudyList: React.FC<Props> = ({ deck, cards, onBack }) => {
  const [mode, setMode] = useState<ListMode>('generic_visible');
  const [search, setSearch] = useState('');
  const [sortByClass, setSortByClass] = useState(true);
  const [groupByClass, setGroupByClass] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const processedCards = useMemo(() => {
    let result = [...cards];
    const s = search.toLowerCase();
    
    // Search
    if (s) {
      result = result.filter(c => 
        c.generic.toLowerCase().includes(s) || 
        c.brand.toLowerCase().includes(s) || 
        c.classification.toLowerCase().includes(s)
      );
    }

    // Sort
    if (sortByClass) {
      result.sort((a, b) => {
        const classComp = (a.classification || '').localeCompare(b.classification || '');
        if (classComp !== 0) return classComp;
        return a.generic.localeCompare(b.generic);
      });
    } else {
      result.sort((a, b) => a.generic.localeCompare(b.generic));
    }

    return result;
  }, [cards, search, sortByClass]);

  // Grouping logic
  const groups = useMemo(() => {
    if (!groupByClass) return null;
    const map = new Map<string, Card[]>();
    processedCards.forEach(c => {
      const cls = c.classification || 'Unclassified';
      if (!map.has(cls)) map.set(cls, []);
      map.get(cls)!.push(c);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [processedCards, groupByClass]);

  const toggleReveal = (id: string) => {
    const newSet = new Set(revealedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedIds(newSet);
  };

  const isGenericHidden = mode === 'brand_visible';
  const isBrandHidden = mode === 'generic_visible';

  const renderRow = (card: Card, idx: number) => {
    const isRevealed = revealedIds.has(card.id);
    const showGeneric = !isGenericHidden || isRevealed;
    const showBrand = !isBrandHidden || isRevealed;

    return (
      <tr 
          key={card.id} 
          onClick={() => toggleReveal(card.id)}
          className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
      >
          <td className="p-4 relative">
              <span className={`${showGeneric ? 'opacity-100' : 'opacity-0'} transition-opacity text-gray-800 dark:text-gray-200 font-medium`}>
                  {card.generic}
              </span>
              {!showGeneric && <div className="absolute inset-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}
          </td>
          <td className="p-4 relative border-l border-gray-100 dark:border-gray-800">
              <span className={`${showBrand ? 'opacity-100' : 'opacity-0'} transition-opacity text-blue-600 dark:text-blue-400 font-bold`}>
                  {card.brand}
              </span>
              {!showBrand && <div className="absolute inset-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>}
          </td>
          <td className="p-4 text-xs font-semibold text-gray-400 dark:text-gray-500 border-l border-gray-100 dark:border-gray-800">
              {card.classification || 'N/A'}
          </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium flex items-center gap-1">
             ← Back
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-xs">{deck.name} List</h2>
          <div className="flex gap-2">
              <button 
                  onClick={() => setGroupByClass(!groupByClass)}
                  className={`text-xs px-2 py-1 rounded border ${groupByClass ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
              >
                  Group
              </button>
              <button 
                  onClick={() => setSortByClass(!sortByClass)}
                  className={`text-xs px-2 py-1 rounded border ${sortByClass ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
              >
                  Sort Class
              </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
                <button 
                    onClick={() => setMode('generic_visible')}
                    className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${mode === 'generic_visible' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Gen → ???
                </button>
                <button 
                    onClick={() => setMode('brand_visible')}
                    className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${mode === 'brand_visible' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    ??? ← Brand
                </button>
                <button 
                    onClick={() => setMode('both_visible')}
                    className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap ${mode === 'both_visible' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Both
                </button>
             </div>

             <input 
                type="text" 
                placeholder="Search name or class..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full md:w-64 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
             />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 shadow-sm z-10 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <tr>
                    <th className="p-4 w-[35%]">Generic Name</th>
                    <th className="p-4 w-[35%]">Brand Name</th>
                    <th className="p-4 w-[30%]">Classification</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {groupByClass && groups ? (
                  groups.map(([className, classCards]) => (
                    <React.Fragment key={className}>
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                        <td colSpan={3} className="px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest border-y dark:border-gray-700">
                          {className} ({classCards.length})
                        </td>
                      </tr>
                      {classCards.map((card, idx) => renderRow(card, idx))}
                    </React.Fragment>
                  ))
                ) : (
                  processedCards.map((card, idx) => renderRow(card, idx))
                )}
            </tbody>
        </table>
        {processedCards.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No cards match your criteria.
            </div>
        )}
      </div>
    </div>
  );
};