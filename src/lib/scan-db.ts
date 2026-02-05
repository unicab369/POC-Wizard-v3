export interface Scan {
	id: number;
	text: string;
	timestamp: number;
}

export type CardType = 'url' | 'vcard' | 'wifi';

export interface Card {
	id: number;
	type: CardType;
	label: string;
	data: string;
	timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('scanner-db', 2);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains('scans')) {
				db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
			}
			if (!db.objectStoreNames.contains('cards')) {
				db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function addScan(text: string): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('scans', 'readwrite');
	tx.objectStore('scans').add({ text, timestamp: Date.now() });
	db.close();
}

export async function getScans(): Promise<Scan[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('scans', 'readonly');
		const req = tx.objectStore('scans').getAll();
		req.onsuccess = () => { db.close(); resolve(req.result); };
		req.onerror = () => { db.close(); reject(req.error); };
	});
}

export async function deleteScan(id: number): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('scans', 'readwrite');
	tx.objectStore('scans').delete(id);
	await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
	db.close();
}

export async function clearScans(): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('scans', 'readwrite');
	tx.objectStore('scans').clear();
	await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
	db.close();
}

// Cards

export async function addCard(type: CardType, label: string, data: string): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('cards', 'readwrite');
	tx.objectStore('cards').add({ type, label, data, timestamp: Date.now() });
	db.close();
}

export async function getCards(): Promise<Card[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction('cards', 'readonly');
		const req = tx.objectStore('cards').getAll();
		req.onsuccess = () => { db.close(); resolve(req.result); };
		req.onerror = () => { db.close(); reject(req.error); };
	});
}

export async function updateCard(id: number, fields: Partial<Pick<Card, 'label' | 'data'>>): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('cards', 'readwrite');
	const store = tx.objectStore('cards');
	const existing: Card = await new Promise((resolve, reject) => {
		const req = store.get(id);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	store.put({ ...existing, ...fields });
	await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
	db.close();
}

export async function deleteCard(id: number): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('cards', 'readwrite');
	tx.objectStore('cards').delete(id);
	await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
	db.close();
}

export async function clearCards(): Promise<void> {
	const db = await openDB();
	const tx = db.transaction('cards', 'readwrite');
	tx.objectStore('cards').clear();
	await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
	db.close();
}
