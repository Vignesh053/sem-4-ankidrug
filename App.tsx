import React, { useState, useEffect } from 'react';
import { Deck, StudyMode, AppSettings, Card } from './types';
import { dbService } from './services/db';
import { StudySession } from './components/StudySession';
import { StudyList } from './components/StudyList';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_SETTINGS } from './constants';

type View = 'home' | 'study_session' | 'study_list';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [activeCards, setActiveCards] = useState<Card[]>([]); // For passing to list view
  const [studyMode, setStudyMode] = useState<StudyMode>('mixed');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const init = async () => {
      await dbService.getDecks(); 
      const s = await dbService.getSettings();
      setSettings(s);
      fetchDecks();
    };
    init();
  }, []);

  const fetchDecks = async () => {
    const allDecks = await dbService.getDecks();
    setDecks(allDecks);
  };

  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  const handleAction = async (deck: Deck, action: 'review' | 'list') => {
    setActiveDeck(deck);
    if (action === 'list') {
        const cards = await dbService.getCardsForDeck(deck.id);
        setActiveCards(cards);
        setView('study_list');
    } else {
        setView('study_session');
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await dbService.saveSettings(newSettings);
    setShowSettings(false);
  };

  if (view === 'study_session' && activeDeck) {
    return <StudySession deck={activeDeck} mode={studyMode} onExit={() => setView('home')} />;
  }

  if (view === 'study_list' && activeDeck) {
    return <StudyList deck={activeDeck} cards={activeCards} onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <span className="text-2xl">💊</span>
              <h1 className="text-xl font-bold tracking-tight">AnkiDrug</h1>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm mb-6 flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase">Flashcard Mode</span>
            <select 
                value={studyMode}
                onChange={(e) => setStudyMode(e.target.value as StudyMode)}
                className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-4 py-2 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="mixed">Mixed (Random)</option>
                <option value="generic_to_brand">Generic → Brand</option>
                <option value="brand_to_generic">Brand → Generic</option>
            </select>
        </div>

        <div className="space-y-4">
            {decks.length === 0 ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : (
                decks.map(deck => (
                    <div key={deck.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{deck.name}</h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Official</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleAction(deck, 'review')}
                                className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow transition transform hover:scale-[1.02]"
                            >
                                Review Cards
                            </button>
                            <button 
                                onClick={() => handleAction(deck, 'list')}
                                className="py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition"
                            >
                                Study List
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>
      
      {showSettings && <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
