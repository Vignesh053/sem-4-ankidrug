import React, { useState, useEffect, useRef } from 'react';
import { Card, Deck, Grade, StudyMode, SessionCard } from '../types';
import { dbService } from '../services/db';
import { COLORS, INTERVALS } from '../constants';

interface Props {
  deck: Deck;
  mode: StudyMode;
  onExit: () => void;
}

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export const StudySession: React.FC<Props> = ({ deck, mode, onExit }) => {
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState({ active: 0, confident: 0, unseen: 0 });
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const lastShownIdRef = useRef<string | null>(null);
  const cardsSinceReinforcementRef = useRef(0);
  const cardsMapRef = useRef<Map<string, SessionCard>>(new Map());

  useEffect(() => {
    initializeSession();
  }, [deck.id]);

  const initializeSession = async () => {
    setLoading(true);
    const dbCards = await dbService.getCardsForDeck(deck.id);
    
    const sessionCards: SessionCard[] = shuffle(dbCards).map(c => ({
      ...c,
      sessionState: 'unseen',
      sessionDueTime: 0,
      sessionConfident: false,
      sessionGoodStreak: 0,
      lastShownAt: 0
    }));

    cardsMapRef.current = new Map(sessionCards.map(c => [c.id, c]));
    fillActiveBatch(sessionCards);
    setCards(sessionCards);
    pickNextCard(sessionCards);
    setLoading(false);
    updateStats(sessionCards);
  };

  const fillActiveBatch = (allCards: SessionCard[]) => {
    const currentActiveCount = allCards.filter(c => c.sessionState === 'active').length;
    const needed = 10 - currentActiveCount;
    
    if (needed > 0) {
        const unseen = allCards.filter(c => c.sessionState === 'unseen');
        for (let i = 0; i < Math.min(needed, unseen.length); i++) {
            unseen[i].sessionState = 'active';
        }
    }
  };

  const updateStats = (allCards: SessionCard[]) => {
    setSessionStats({
        active: allCards.filter(c => c.sessionState === 'active').length,
        confident: allCards.filter(c => c.sessionState === 'easyPool').length,
        unseen: allCards.filter(c => c.sessionState === 'unseen').length
    });
  };

  const pickNextCard = (allCards: SessionCard[]) => {
    const now = Date.now();
    const active = allCards.filter(c => c.sessionState === 'active');
    const easyPool = allCards.filter(c => c.sessionState === 'easyPool');

    if (cardsSinceReinforcementRef.current >= 3 && easyPool.length > 0) {
        const totalWeight = easyPool.reduce((acc, c) => acc + (c.difficultyScore || 0) + 1, 0);
        let random = Math.random() * totalWeight;
        let selected = easyPool[0];
        for (const c of easyPool) {
            random -= ((c.difficultyScore || 0) + 1);
            if (random <= 0) {
                selected = c;
                break;
            }
        }
        setCurrentCardId(selected.id);
        cardsSinceReinforcementRef.current = 0;
        lastShownIdRef.current = selected.id;
        setIsFlipped(false);
        return;
    }

    const due = active.filter(c => c.sessionDueTime <= now);
    if (due.length > 0) {
        const candidate = shuffle(due)[0];
        setCurrentCardId(candidate.id);
        lastShownIdRef.current = candidate.id;
        setIsFlipped(false);
        return;
    }

    const candidates = active.filter(c => c.id !== lastShownIdRef.current);
    if (candidates.length > 0) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        setCurrentCardId(candidate.id);
        lastShownIdRef.current = candidate.id;
        setIsFlipped(false);
        return;
    }

    if (active.length > 0) {
        setCurrentCardId(active[0].id);
        setIsFlipped(false);
        return;
    }

    if (easyPool.length > 0) {
        const candidate = easyPool[Math.floor(Math.random() * easyPool.length)];
        setCurrentCardId(candidate.id);
        setIsFlipped(false);
        return;
    }

    setCurrentCardId(null);
  };

  const handleGrade = async (grade: Grade) => {
    if (!currentCardId) return;
    const card = cardsMapRef.current.get(currentCardId);
    if (!card) return;

    const now = Date.now();
    let interval = 0;
    let feedbackText = "";

    switch(grade) {
        case Grade.Again:
            interval = INTERVALS.AGAIN;
            card.sessionGoodStreak = 0;
            card.difficultyScore = (card.difficultyScore || 0) + 1;
            await dbService.updateCardDifficulty(card.id, 1);
            feedbackText = "Again • 1m";
            break;
        case Grade.Hard:
            interval = INTERVALS.HARD;
            card.sessionGoodStreak = 0;
            card.difficultyScore = (card.difficultyScore || 0) + 1;
            await dbService.updateCardDifficulty(card.id, 1);
            feedbackText = "Hard • 3m";
            break;
        case Grade.Good:
            interval = INTERVALS.GOOD;
            card.sessionGoodStreak += 1;
            feedbackText = "Good • 15m";
            break;
        case Grade.Easy:
            interval = INTERVALS.EASY;
            card.sessionConfident = true;
            feedbackText = "Easy • 1h";
            break;
    }

    card.sessionDueTime = now + interval;
    card.lastShownAt = now;

    if (card.sessionGoodStreak >= 2) card.sessionConfident = true;

    await dbService.logReview({ cardId: card.id, grade, studiedAt: now });

    if (card.sessionState === 'active' && card.sessionConfident) {
        const activeCards = cards.filter(c => c.sessionState === 'active');
        const confidentActive = activeCards.filter(c => c.sessionConfident).length;
        if (confidentActive > 5) {
             activeCards.forEach(c => { if (c.sessionConfident) c.sessionState = 'easyPool'; });
             fillActiveBatch(cards);
        }
    }

    setCards([...cards]);
    updateStats(cards);
    setFeedback({ text: feedbackText, color: grade === Grade.Again ? 'bg-red-500' : grade === Grade.Hard ? 'bg-orange-500' : grade === Grade.Good ? 'bg-green-500' : 'bg-blue-500' });
    setTimeout(() => setFeedback(null), 1500);
    cardsSinceReinforcementRef.current += 1;
    pickNextCard(cards);
  };

  const currentCard = cardsMapRef.current.get(currentCardId || '');
  const [mixedReverse, setMixedReverse] = useState(false);
  useEffect(() => {
    if (mode === 'mixed' && currentCardId) setMixedReverse(Math.random() > 0.5);
  }, [currentCardId, mode]);

  const getFace = () => {
    if (!currentCard) return { front: '', back: '', labelFront: '', labelBack: '', classification: '' };
    let showGenericFront = mode === 'brand_to_generic' ? false : mode === 'mixed' ? !mixedReverse : true;
    return {
        front: showGenericFront ? currentCard.generic : currentCard.brand,
        back: showGenericFront ? currentCard.brand : currentCard.generic,
        labelFront: showGenericFront ? 'Generic Name' : 'Brand Name',
        labelBack: showGenericFront ? 'Brand Name' : 'Generic Name',
        classification: currentCard.classification
    };
  };

  const faces = getFace();

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Preparing Session...</div>;
  if (!currentCard) return <div className="flex flex-col h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center"><h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Deck Complete! 🎉</h2><button onClick={onExit} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Back to Decks</button></div>;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0">
        <div className="flex gap-3 items-center">
            <button onClick={onExit} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white font-medium">←</button>
            <span className="font-bold text-gray-700 dark:text-gray-200 truncate max-w-[150px]">{deck.name}</span>
        </div>
        <button onClick={initializeSession} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">Restart</button>
      </div>

      <div className="bg-blue-50 dark:bg-gray-800/50 py-2 px-4 flex justify-around text-xs font-mono font-bold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700 shrink-0">
        <span className="text-blue-600 dark:text-blue-400">BATCH: {sessionStats.active}/10</span>
        <span className="text-green-600 dark:text-green-400">DONE: {sessionStats.confident}</span>
        <span>LEFT: {sessionStats.unseen}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative min-h-0">
        <div className="relative w-full max-w-md h-full max-h-[60vh] md:max-h-[500px] md:h-auto md:aspect-video" onClick={() => !isFlipped && setIsFlipped(true)}>
            <div className={`w-full h-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border border-gray-100 dark:border-gray-700 transition-all duration-500 transform-gpu ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-4">
                    {isFlipped ? faces.labelBack : faces.labelFront}
                </div>
                
                <div className="text-3xl md:text-5xl font-extrabold text-gray-800 dark:text-white leading-tight break-words">
                    {isFlipped ? (<span className="border-b-4 border-blue-200 dark:border-blue-800 pb-1">{faces.back}</span>) : faces.front}
                </div>

                {isFlipped && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 w-full animate-in fade-in slide-in-from-bottom-2">
                        <div className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 mb-1 tracking-wider">Classification</div>
                        <div className="text-sm md:text-md text-gray-600 dark:text-gray-300 font-medium italic">{faces.classification}</div>
                        
                        <div className="mt-4 text-[10px] uppercase text-gray-400 mb-1">Prompt</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{faces.front}</div>
                    </div>
                )}
                
                {!isFlipped && (<div className="absolute bottom-8 text-gray-400 text-sm animate-bounce">Tap to flip</div>)}
            </div>
        </div>

        {feedback && (<div className={`absolute top-10 px-6 py-2 rounded-full text-white font-bold shadow-lg transform transition-all animate-in slide-in-from-top-4 fade-in ${feedback.color}`}>{feedback.text}</div>)}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 pb-4 shrink-0">
        {!isFlipped ? (
             <button onClick={() => { setIsFlipped(true); }} className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-lg">Show Answer</button>
        ) : (
            <div className="grid grid-cols-4 gap-2">
                <GradeBtn label="Again" sub="1m" color={COLORS.again} onClick={() => handleGrade(Grade.Again)} />
                <GradeBtn label="Hard" sub="3m" color={COLORS.hard} onClick={() => handleGrade(Grade.Hard)} />
                <GradeBtn label="Good" sub="15m" color={COLORS.good} onClick={() => handleGrade(Grade.Good)} />
                <GradeBtn label="Easy" sub="1h" color={COLORS.easy} onClick={() => handleGrade(Grade.Easy)} />
            </div>
        )}
      </div>
    </div>
  );
};

const GradeBtn = ({ label, sub, color, onClick }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-3 rounded-xl text-white shadow active:scale-95 transition ${color}`}><span className="font-bold">{label}</span><span className="text-[10px] opacity-80">{sub}</span></button>
);