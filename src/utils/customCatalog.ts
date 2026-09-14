import { JewelryItem } from '../types';

const DB = 'grt-tryon'; const STORE = 'custom-jewelry';
function open() { return new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(DB, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function saveCustomItem(item: JewelryItem) { const db = await open(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(item); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); db.close(); }
export async function loadCustomItems() { const db = await open(); const items = await new Promise<JewelryItem[]>((resolve, reject) => { const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); db.close(); return items; }
