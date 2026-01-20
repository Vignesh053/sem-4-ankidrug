import React, { useState, useEffect } from 'react';
import { Deck, StudyMode, AppSettings } from './types';
import { dbService } from './services/db';
import { StudySession } from './components/StudySession';
import { SettingsModal } from './components/SettingsModal';
import { DEFAULT_SETTINGS } from './constants';

type View = 'home' | 'study';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>('mixed');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});

  // Initialize DB and Load Settings
  useEffect(() => {
    const init = async () => {
      // Syncs preloaded decks and settings
      await dbService.getDecks(); 
      const s = await dbService.getSettings();
      setSettings(s);
    };
    init();
  }, []);

  // Apply Dark Mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Load Decks & Counts
  useEffect(() => {
    const fetchDecks = async () => {
      const allDecks = await dbService.getDecks();
      allDecks.sort((a, b) => b.createdAt - a.createdAt);
      setDecks(allDecks);
      
      const counts: Record<string, number> = {};
      for (const d of allDecks) {
        const due = await dbService.getDueCards(d.id);
        // We show raw due count here, limits are applied in session
        counts[d.id] = due.length;
      }
      setDueCounts(counts);
    };
    fetchDecks();
  }, [view, refreshTrigger, settings]);

  const handleStartStudy = (deck: Deck) => {
    setActiveDeck(deck);
    setView('study');
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await dbService.saveSettings(newSettings);
    setShowSettings(false);
  };

  if (view === 'study' && activeDeck) {
    return (
      <StudySession 
        deck={activeDeck} 
        mode={studyMode} 
        settings={settings}
        onExit={() => setView('home')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-blue-700 dark:bg-blue-900 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <span className="text-2xl">💊</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">AnkiDrug Review</h1>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-full transition"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <span className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wide">Mode</span>
                <div className="relative">
                    <select 
                        value={studyMode}
                        onChange={(e) => setStudyMode(e.target.value as StudyMode)}
                        className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-4 py-2 text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8 cursor-pointer"
                    >
                        <option value="mixed">Mixed (Random)</option>
                        <option value="generic_to_brand">Generic → Brand</option>
                        <option value="brand_to_generic">Brand → Generic</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
        </div>

        {/* Deck List */}
        <div className="space-y-4">
            {decks.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                   <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                   <p>Loading database...</p>
                </div>
            ) : (
                decks.map(deck => (
                    <div 
                        key={deck.id} 
                        onClick={() => handleStartStudy(deck)}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-700 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-24 h-24 text-blue-500 transform rotate-12" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                        </div>

                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{deck.name}</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                    Official Deck
                                </div>
                            </div>
                            <div className="text-center bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl">
                                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                                    {dueCounts[deck.id] || 0}
                                </div>
                                <div className="text-xs text-blue-400 dark:text-blue-300 uppercase font-bold tracking-widest">Due</div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>
      
      {showSettings && (
        <SettingsModal 
            settings={settings} 
            onSave={handleSaveSettings} 
            onClose={() => setShowSettings(false)} 
        />
      )}
      
      <footer className="p-6 text-center text-gray-400 dark:text-gray-600 text-sm">
        <p>© AnkiDrug Review • Offline Capable • Dark Mode Enabled</p>
      </footer>
    </div>
  );
}