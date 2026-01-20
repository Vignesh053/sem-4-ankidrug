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
    indexes: { 'by-deck': string };
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
        } else {
           // Version 2->3 upgrade logic if needed, but for now simple structure is fine
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
    await this.syncPreloadedDecks(db);
    return db.getAll('decks');
  },

  async addDeck(deck: Deck): Promise<void> {
    const db = await initDB();
    await db.put('decks', deck);
  },

  async syncPreloadedDecks(db: IDBPDatabase<AppDB>) {
     const preloaded = [
       { id: HAMILTON_DECK_ID, name: "Hamilton Health Sciences", data: HAMILTON_DATA },
       { id: CARDIO_DECK_ID, name: "Cardiovascular Drugs (Canada)", data: CARDIO_DATA }
     ];

     const tx = db.transaction(['decks', 'cards'], 'readwrite');
     const deckStore = tx.objectStore('decks');
     const cardStore = tx.objectStore('cards');

     // Sync Preloaded Definitions
     for (const p of preloaded) {
        // Ensure Deck Exists
        const existingDeck = await deckStore.get(p.id);
        if (!existingDeck) {
            await deckStore.put({ id: p.id, name: p.name, createdAt: Date.now() });
        }

        // Sync Cards
        for (let i = 0; i < p.data.length; i++) {
           const pair = p.data[i];
           const stableId = `card_${p.id}_${i}`; // Deterministic ID
           
           const existingCard = await cardStore.get(stableId);
           
           if (existingCard) {
             // Update text content only
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
                easeFactor: 2.5,
                repetitions: 0,
                lapses: 0,
                state: 'new',
                difficultyScore: 0, // NEW field
                createdAt: Date.now(),
                updatedAt: Date.now(),
             });
           }
        }
     }
     
     await tx.done;
  },

  async getCardsForDeck(deckId: string): Promise<Card[]> {
    const db = await initDB();
    return db.getAllFromIndex('cards', 'by-deck', deckId);
  },

  async addCards(cards: Card[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction('cards', 'readwrite');
    await Promise.all(cards.map(card => tx.store.put(card)));
    await tx.done;
  },

  async updateCardDifficulty(cardId: string, increment: number): Promise<void> {
    const db = await initDB();
    const card = await db.get('cards', cardId);
    if (card) {
        card.difficultyScore = (card.difficultyScore || 0) + increment;
        await db.put('cards', card);
    }
  },
  
  async logReview(log: ReviewLog): Promise<void> {
    const db = await initDB();
    await db.add('logs', log);
  }
};