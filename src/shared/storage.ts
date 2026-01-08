import { TermConfig, StorageSchema } from './types.js';
import { STORAGE_KEY, LOG_PREFIX } from './constants.js';

/**
 * Save terms to chrome.storage.sync
 * @param terms Array of term configurations to save
 * @returns true if saved successfully, false otherwise
 */
export async function saveTerms(terms: TermConfig[]): Promise<boolean> {
  try {
    const data: StorageSchema = { terms };
    await chrome.storage.sync.set({ [STORAGE_KEY]: data.terms });
    console.log(`${LOG_PREFIX} Terms saved successfully`);
    return true;
  } catch (error) {
    console.error(`${LOG_PREFIX} Storage error:`, error);
    return false;
  }
}

/**
 * Load terms from chrome.storage.sync
 * @returns Array of term configurations, empty array if none exist or on error
 */
export async function loadTerms(): Promise<TermConfig[]> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const terms = result[STORAGE_KEY] as StorageSchema['terms'] | undefined;
    console.log(`${LOG_PREFIX} Terms loaded:`, terms?.length ?? 0, 'items');
    return terms ?? [];
  } catch (error) {
    console.error(`${LOG_PREFIX} Storage error:`, error);
    return [];
  }
}
