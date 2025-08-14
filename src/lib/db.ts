
import { openDB, DBSchema } from 'idb';
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

const dbPromise = openDB<LexiConvertDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  },
});

export const addConversion = async (conversion: ConversionResult) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, conversion);
};

export const updateConversion = async (conversion: ConversionResult) => {
  const db = await dbPromise;
  await db.put(STORE_NAME, conversion);
}

export const getConversion = async (id: string): Promise<ConversionResult | undefined> => {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
};

export const getAllConversions = async (): Promise<ConversionResult[]> => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};

export const deleteConversion = async (id: string) => {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
};

export const clearAllConversions = async () => {
    const db = await dbPromise;
    await db.clear(STORE_NAME);
}
