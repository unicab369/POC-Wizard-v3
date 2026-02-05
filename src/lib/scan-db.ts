export interface Scan {
	id: number;
	text: string;
	timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('scanner-db', 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains('scans')) {
				db.createObjectStore('scans', { keyPath: 'id', autoIncrement: true });
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
