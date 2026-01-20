import { openDB, IDBPDatabase } from 'idb';
import { Card, Deck, ReviewLog, AppSettings } from '../types';
import { 
  DB_NAME, 
  DB_VERSION, 
  DEFAULT_SETTINGS, 
  HAMILTON_DATA, 
  CARDIO_DATA,
  HAMILTON_DECK_ID,
  CARDIO_DECK_ID
} from '../constants';

interface AppDB {
  decks: {
    key: string;
    value: Deck;
  };
  cards: {
    key: string;
    value: Card;
    indexes: { 'by-deck': string; 'by-due': number };
  };
  logs: {
    key: number;
    value: ReviewLog;
    indexes: { 'by-card': string; 'by-date': number };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Decks Store
        if (!db.objectStoreNames.contains('decks')) {
          db.createObjectStore('decks', { keyPath: 'id' });
        }
        // Cards Store
        if (!db.objectStoreNames.contains('cards')) {
          const cardStore = db.createObjectStore('cards', { keyPath: 'id' });
          cardStore.createIndex('by-deck', 'deckId');
          cardStore.createIndex('by-due', 'dueDate');
        }
        // Logs Store
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'studiedAt', autoIncrement: true });
          logStore.createIndex('by-card', 'cardId');
          logStore.createIndex('by-date', 'studiedAt');
        }
        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async getSettings(): Promise<AppSettings> {
    const db = await initDB();
    const settings = await db.get('settings', 'appSettings');
    return settings || DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await initDB();
    await db.put('settings', settings, 'appSettings');
  },

  async getDecks(): Promise<Deck[]> {
    const db = await initDB();
    
    // Sync centralized decks (Hamilton & Cardio) before returning
    await this.syncPreloadedDecks(db);

    return db.getAll('decks');
  },

  async syncPreloadedDecks(db: IDBPDatabase<AppDB>) {
     const preloaded = [
       { id: HAMILTON_DECK_ID, name: "Hamilton Health Sciences", data: HAMILTON_DATA },
       { id: CARDIO_DECK_ID, name: "Cardiovascular Drugs (Canada)", data: CARDIO_DATA }
     ];

     const tx = db.transaction(['decks', 'cards'], 'readwrite');
     const deckStore = tx.objectStore('decks');
     const cardStore = tx.objectStore('cards');

     // 1. Clean up duplicates (Legacy decks with same name but wrong ID)
     const allDecks = await deckStore.getAll();
     for (const d of allDecks) {
        const isPreloadedName = preloaded.some(p => p.name === d.name);
        const isCorrectId = preloaded.some(p => p.id === d.id);
        
        // If it looks like a preloaded deck (by name) but has a random ID, it's a duplicate.
        // We delete it to enforce the single source of truth.
        if (isPreloadedName && !isCorrectId) {
           await deckStore.delete(d.id);
           
           // Delete cards associated with the duplicate deck
           const index = cardStore.index('by-deck');
           let cursor = await index.openCursor(IDBKeyRange.only(d.id));
           while (cursor) {
             await cursor.delete();
             cursor = await cursor.continue();
           }
        }
     }

     // 2. Sync Preloaded Definitions
     for (const p of preloaded) {
        // Ensure Deck Exists
        const existingDeck = await deckStore.get(p.id);
        if (!existingDeck) {
            await deckStore.put({ id: p.id, name: p.name, createdAt: Date.now() });
        } else if (existingDeck.name !== p.name) {
            // Update name if changed in code
            await deckStore.put({ ...existingDeck, name: p.name });
        }

        // Sync Cards
        // We generate a stable ID for preloaded cards based on index to update text 
        // while preserving SRS history.
        for (let i = 0; i < p.data.length; i++) {
           const pair = p.data[i];
           const stableId = `card_${p.id}_${i}`; // Deterministic ID
           
           const existingCard = await cardStore.get(stableId);
           
           if (existingCard) {
             // Update text content (Generic/Brand) if code changed, but KEEP SRS fields
             if (existingCard.generic !== pair.generic || existingCard.brand !== pair.brand) {
                 await cardStore.put({
                   ...existingCard,
                   generic: pair.generic,
                   brand: pair.brand,
                   updatedAt: Date.now()
                 });
             }
           } else {
             // Create new card
             await cardStore.put({
                id: stableId,
                deckId: p.id,
                generic: pair.generic,
                brand: pair.brand,
                notes: '',
                tags: [],
                dueDate: Date.now(),
                intervalDays: 0,
                easeFactor: DEFAULT_SETTINGS.initialEaseFactor,
                repetitions: 0,
                lapses: 0,
                state: 'new',
                createdAt: Date.now(),
                updatedAt: Date.now(),
             });
           }
        }
     }
     
     await tx.done;
  },

  async addDeck(deck: Deck): Promise<void> {
    const db = await initDB();
    await db.put('decks', deck);
  },

  async deleteDeck(deckId: string): Promise<void> {
    const db = await initDB();
    const tx = db.transaction(['decks', 'cards'], 'readwrite');
    await tx.objectStore('decks').delete(deckId);
    
    // Delete all cards associated with deck
    const index = tx.objectStore('cards').index('by-deck');
    let cursor = await index.openCursor(IDBKeyRange.only(deckId));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  async addCards(cards: Card[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('cards', 'readwrite');
    await Promise.all(cards.map(card => tx.store.put(card)));
    await tx.done;
  },

  async updateCard(card: Card): Promise<void> {
    const db = await initDB();
    await db.put('cards', card);
  },

  async getCardsForDeck(deckId: string): Promise<Card[]> {
    const db = await initDB();
    return db.getAllFromIndex('cards', 'by-deck', deckId);
  },

  async getDueCards(deckId: string): Promise<Card[]> {
    const db = await initDB();
    const allDeckCards = await db.getAllFromIndex('cards', 'by-deck', deckId);
    const now = Date.now();
    return allDeckCards.filter(c => c.dueDate <= now);
  },
  
  async logReview(log: ReviewLog): Promise<void> {
    const db = await initDB();
    await db.add('logs', log);
  }
};