import React, { useState, useEffect } from 'react';
import { Card, Deck, Grade, StudyMode, AppSettings } from '../types';
import { dbService } from '../services/db';
import { calculateNextReview, getSchedulingDescription } from '../services/srs';
import { COLORS } from '../constants';

interface Props {
  deck: Deck;
  mode: StudyMode;
  settings: AppSettings;
  onExit: () => void;
}

export const StudySession: React.FC<Props> = ({ deck, mode, settings, onExit }) => {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ new: 0, learning: 0, review: 0 });
  const [mixedReverse, setMixedReverse] = useState(false);

  // Load cards on mount
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      const allDueCards = await dbService.getDueCards(deck.id);
      
      let newCards = allDueCards.filter(c => c.state === 'new');
      let lrnCards = allDueCards.filter(c => c.state === 'learning');
      let revCards = allDueCards.filter(c => c.state === 'review');

      // Apply Limits from settings (Simplified: just slice arrays)
      // Note: Real Anki logic is more complex with "studied today" tracking.
      // For this MVP, we limit the *active queue* size based on settings.
      if (newCards.length > settings.newCardsPerDay) {
        newCards = newCards.slice(0, settings.newCardsPerDay);
      }
      if (revCards.length > settings.reviewsPerDay) {
        revCards = revCards.slice(0, settings.reviewsPerDay);
      }
      
      setStats({
        new: newCards.length,
        learning: lrnCards.length,
        review: revCards.length
      });

      // Simple queue mix: Learning > Review > New
      const sortedQueue = [...lrnCards, ...revCards, ...newCards];
      setQueue(sortedQueue);
      
      if (sortedQueue.length > 0) {
        setCurrentCard(sortedQueue[0]);
      }
      setLoading(false);
    };
    loadCards();
  }, [deck.id, settings]);

  const handleGrade = async (grade: Grade) => {
    if (!currentCard) return;

    // Calculate updates
    const updates = calculateNextReview(currentCard, grade, settings);
    const updatedCard = { ...currentCard, ...updates, updatedAt: Date.now() };

    // Update DB
    await dbService.updateCard(updatedCard);
    
    // Log Review
    await dbService.logReview({
      cardId: updatedCard.id,
      grade,
      studiedAt: Date.now(),
      previousInterval: currentCard.intervalDays,
      newInterval: updatedCard.intervalDays
    });

    // Update Queue
    let newQueue = queue.slice(1); // Remove current
    
    // Update stats locally for UI feedback
    setStats(prev => {
        const s = { ...prev };
        if (currentCard.state === 'new') s.new = Math.max(0, s.new - 1);
        else if (currentCard.state === 'review') s.review = Math.max(0, s.review - 1);
        else s.learning = Math.max(0, s.learning - 1);
        return s;
    });

    // Re-insert if due soon (in-session learning step)
    const now = Date.now();
    const isDueSoon = updatedCard.dueDate <= now + (20 * 60 * 1000); // 20 min lookahead

    if (isDueSoon) {
       // Add to learning count if it wasn't there
       setStats(prev => ({ ...prev, learning: prev.learning + 1 }));
       
       // Randomize re-insertion index for variety
       const insertIndex = Math.min(newQueue.length, 3 + Math.floor(Math.random() * 3));
       newQueue.splice(insertIndex, 0, updatedCard);
    }

    setQueue(newQueue);
    setIsFlipped(false);
    
    if (newQueue.length > 0) {
      setCurrentCard(newQueue[0]);
    } else {
      setCurrentCard(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!currentCard) return;
      if (!isFlipped) {
        if (e.code === 'Space' || e.code === 'Enter') {
          setIsFlipped(true);
        }
      } else {
        if (e.key === '1') handleGrade(Grade.Again);
        if (e.key === '2') handleGrade(Grade.Hard);
        if (e.key === '3') handleGrade(Grade.Good);
        if (e.key === '4') handleGrade(Grade.Easy);
        if (e.code === 'Space') handleGrade(Grade.Good); 
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentCard, isFlipped, queue]);

  // Determine Front/Back based on Mode
  const getFaces = (c: Card) => {
    let showGenericFront = true;
    if (mode === 'brand_to_generic') showGenericFront = false;
    // Mixed logic handled by effect below
    return {
      front: showGenericFront ? c.generic : c.brand,
      back: showGenericFront ? c.brand : c.generic,
      labelFront: showGenericFront ? 'Generic Name' : 'Brand Name',
      labelBack: showGenericFront ? 'Brand Name' : 'Generic Name'
    };
  };

  useEffect(() => {
    if (mode === 'mixed') {
      setMixedReverse(Math.random() > 0.5);
    }
  }, [currentCard, mode]);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 dark:text-gray-400">Loading Session...</div>;

  if (!currentCard) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl max-w-md w-full">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Session Complete! 🎉</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">You have no more cards due right now.</p>
            <button onClick={onExit} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 font-bold transition">
            Back to Deck
            </button>
        </div>
      </div>
    );
  }

  const faces = mode === 'mixed' 
    ? (mixedReverse ? { front: currentCard.brand, back: currentCard.generic, labelFront: 'Brand Name', labelBack: 'Generic Name' } 
                    : { front: currentCard.generic, back: currentCard.brand, labelFront: 'Generic Name', labelBack: 'Brand Name' })
    : getFaces(currentCard);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm z-10">
        <button onClick={onExit} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          End
        </button>
        <div className="flex gap-4 text-xs font-mono font-bold tracking-wider">
          <span className="text-blue-600 dark:text-blue-400">{stats.new} NEW</span>
          <span className="text-red-500 dark:text-red-400">{stats.learning} LRN</span>
          <span className="text-green-600 dark:text-green-400">{stats.review} REV</span>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        <div 
          className="relative w-full max-w-md aspect-[3/4] max-h-[60vh] md:aspect-video md:max-h-[400px]"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <div className={`w-full h-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-black/50 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 ${!isFlipped ? 'cursor-pointer hover:scale-[1.02] hover:shadow-3xl' : ''}`}>
             
            <div className="absolute top-8 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">
               {isFlipped ? faces.labelBack : faces.labelFront}
            </div>
            
            <div className="text-3xl md:text-5xl font-extrabold text-gray-800 dark:text-white break-words w-full leading-tight">
              {isFlipped ? faces.back : faces.front}
            </div>

            {isFlipped && (
               <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 font-bold">
                   Question was:
                 </div>
                 <div className="text-xl text-gray-600 dark:text-gray-300 font-medium">
                   {faces.front}
                 </div>
               </div>
            )}

            {!isFlipped && (
                <div className="absolute bottom-8 text-gray-400 dark:text-gray-500 text-sm animate-pulse font-medium">
                    Tap or Space to show answer
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 pb-8 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        {!isFlipped ? (
            <button 
                onClick={() => setIsFlipped(true)}
                className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-lg active:scale-[0.98] transition-all hover:bg-gray-800 dark:hover:bg-blue-500"
            >
                Show Answer
            </button>
        ) : (
            <div className="grid grid-cols-4 gap-3">
                {[
                    { l: 'Again', g: Grade.Again, c: COLORS.again, t: getSchedulingDescription(currentCard, Grade.Again, settings) },
                    { l: 'Hard', g: Grade.Hard, c: COLORS.hard, t: getSchedulingDescription(currentCard, Grade.Hard, settings) },
                    { l: 'Good', g: Grade.Good, c: COLORS.good, t: getSchedulingDescription(currentCard, Grade.Good, settings) },
                    { l: 'Easy', g: Grade.Easy, c: COLORS.easy, t: getSchedulingDescription(currentCard, Grade.Easy, settings) }
                ].map((btn) => (
                    <button
                        key={btn.l}
                        onClick={() => handleGrade(btn.g)}
                        className={`flex flex-col items-center justify-center py-3 rounded-2xl text-white shadow-md active:scale-95 transition-all ${btn.c}`}
                    >
                        <span className="font-bold text-lg">{btn.l}</span>
                        <span className="text-xs opacity-90 font-mono mt-0.5 bg-black/20 px-2 py-0.5 rounded-full">{btn.t}</span>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
