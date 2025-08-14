
"use client";

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ConversionResult } from '@/app/page';

const DB_NAME = 'LexiConvertDB';
const DB_VERSION = 1;
const STORE_NAME = 'conversions';

interface LexiConvertDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: ConversionResult;
  };
}

// Initialize promise to null. It will be created on the client side.
let dbPromise: Promise<IDBPDatabase<LexiConvertDB>> | null = null;

const getDb = () => {
  if (typeof window === 'undefined') {
    // Return a dummy promise on the server that will never resolve.
    // This prevents errors during SSR. Operations will effectively be no-ops.
    return new Promise<IDBPDatabase<LexiConvertDB>>(() => {});
  }
  if (!dbPromise) {
    dbPromise = openDB<LexiConvertDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};


export const addConversion = async (conversion: ConversionResult) => {
  const db = await getDb();
  if (db) await db.put(STORE_NAME, conversion);
};

export const updateConversion = async (conversion: ConversionResult) => {
  const db = await getDb();
  if (db) await db.put(STORE_NAME, conversion);
}

export const getConversion = async (id: string): Promise<ConversionResult | undefined> => {
  const db = await getDb();
  if (!db) return undefined;
  return db.get(STORE_NAME, id);
};

export const getAllConversions = async (): Promise<ConversionResult[]> => {
  const db = await getDb();
  if (!db) return [];
  return db.getAll(STORE_NAME);
};

export const deleteConversion = async (id: string) => {
  const db = await getDb();
  if (db) await db.delete(STORE_NAME, id);
};

export const clearAllConversions = async () => {
    const db = await getDb();
    if (db) await db.clear(STORE_NAME);
}
