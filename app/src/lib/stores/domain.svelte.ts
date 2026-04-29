import type { DomainModel, BusinessEvent, Concept, Domain, W, EventDimensionMark } from '$lib/types';
import { bemModelToCsv, bemModelToXlsxBlob, downloadBemBlob, bemExportFilename } from '$lib/export-bem';

// Demo mode (GitHub Pages static build via VITE_DEMO_MODE=true). All persistence
// flips to localStorage and the matrix list is seeded with the three example
// JSONs that ship with the standalone repo. Normal dev / standalone install
// keeps using the SvelteKit API routes against ../data/.
const DEMO_MODE =
	typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEMO_MODE === 'true';
const LS_KEY = 'bdm-demo-models';

function lsGetAll(): Record<string, DomainModel> {
	try {
		const raw = localStorage.getItem(LS_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function lsSaveAll(models: Record<string, DomainModel>): void {
	localStorage.setItem(LS_KEY, JSON.stringify(models));
}

// Seed JSONs imported at build time so the demo starts populated.
import iceCreamShop from '$data/ice-cream-shop.json';
import lawrenceCorr from '$data/lawrence-corr-beam-bem.json';
import saasRevenue from '$data/saas-revenue-events-matrix-2.json';
const DEMO_SEED_MODELS: DomainModel[] = [
	iceCreamShop as unknown as DomainModel,
	lawrenceCorr as unknown as DomainModel,
	saasRevenue as unknown as DomainModel
];

function stripDateTimeSuffix(name: string): string {
	return name.replace(/-\d{4}-\d{2}-\d{2}-\d{6}$/, '');
}

function createId(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'domain';
}

function uniqueId(name: string, existing: string[]): string {
	let base = createId(name);
	if (!existing.includes(base)) return base;
	let i = 2;
	while (existing.includes(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}

/** Ensure a model has all required fields (backwards compat) */
function migrateModel(m: DomainModel): DomainModel {
	// Backwards compat: migrate dimensions[] → concepts[]
	if ((m as any).dimensions && !m.concepts) {
		m.concepts = (m as any).dimensions;
		delete (m as any).dimensions;
	}
	if (!m.concepts) m.concepts = [];
	if (!m.domains) m.domains = [];
	for (const dom of m.domains) {
		if (dom.description === undefined) dom.description = '';
		if (!dom.aliases) (dom as any).aliases = [];
		if (dom.owner === undefined) dom.owner = '';
	}
	for (const dim of m.concepts) {
		if (dim.description === undefined) (dim as any).description = '';
		if (!dim.aliases) (dim as any).aliases = [];
		// Migrate wType → w (renamed in v2)
		if (!(dim as any).w && (dim as any).wType) {
			(dim as any).w = (dim as any).wType;
			delete (dim as any).wType;
		}
	}
	for (const ev of m.events) {
		if (!ev.domains) ev.domains = {};
		// Backwards compat: migrate ev.dimensions → ev.concepts
		if ((ev as any).dimensions && !ev.concepts) {
			ev.concepts = (ev as any).dimensions;
			delete (ev as any).dimensions;
		}
		if (!ev.concepts) ev.concepts = {};
	}
	return m;
}

function makeExampleModel(): DomainModel {
	return {
		version: '1.0',
		id: 'ice-cream-example',
		name: 'Ice Cream Shop',
		description: 'Example business domain model based on BEAM exercises',
		domains: [
			{ id: 'sales', name: 'Sales', description: 'Revenue-generating activities including orders and customer transactions', aliases: [], owner: 'Sales Manager', order: 1 },
			{ id: 'operations', name: 'Operations', description: 'Day-to-day store operations, staffing, and inventory management', aliases: [], owner: 'Operations Manager', order: 2 }
		],
		concepts: [
			{ id: 'customer', name: 'Customer', description: '', aliases: [], w: 'who', order: 1 },
			{ id: 'employee', name: 'Employee', description: '', aliases: [], w: 'who', order: 2 },
			{ id: 'product', name: 'Product', description: '', aliases: [], w: 'what', order: 3 },
			{ id: 'store', name: 'Store', description: '', aliases: [], w: 'where', order: 4 }
		],
		events: [
			{
				id: 'customer-orders-product',
				name: 'Customer Orders Product',
				description: '',
				order: 1,
				importance: 0,
				estimate: 0,
				concepts: {
					customer: 'star',
					employee: 'check',
					product: 'check',
					store: 'check'
				},
				domains: {
					sales: 'star',
					operations: 'check'
				}
			}
		]
	};
}

export interface BemStoreOptions {
	/** Called to list models on init. Defaults to fetching from /api/models. */
	listModels?: () => Promise<DomainModel[]>;
	/** Called to save a model. Defaults to PUT /api/models/{id}. */
	saveModel?: (m: DomainModel) => Promise<void>;
	/** Called to create a model. Defaults to POST /api/models. */
	createModel?: (m: DomainModel) => Promise<void>;
	/** Called to delete a model. Defaults to DELETE /api/models/{id}. */
	deleteModel?: (id: string) => Promise<void>;
	/** Called to load a single model by id. Defaults to GET /api/models/{id}. */
	loadModel?: (id: string) => Promise<DomainModel>;
}

export function createBemStore(options: BemStoreOptions = {}) {
	// --- API helpers (defaults to SvelteKit API routes) ---

	const apiListModels = options.listModels ?? (async (): Promise<DomainModel[]> => {
		if (DEMO_MODE) return Object.values(lsGetAll());
		const res = await fetch('/api/models');
		return res.json();
	});

	const apiSaveModel = options.saveModel ?? (async (m: DomainModel): Promise<void> => {
		if (DEMO_MODE) {
			const all = lsGetAll();
			all[m.id] = m;
			lsSaveAll(all);
			return;
		}
		await fetch(`/api/models/${m.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(m)
		});
	});

	const apiCreateModel = options.createModel ?? (async (m: DomainModel): Promise<void> => {
		if (DEMO_MODE) {
			const all = lsGetAll();
			all[m.id] = m;
			lsSaveAll(all);
			return;
		}
		await fetch('/api/models', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(m)
		});
	});

	const apiDeleteModel = options.deleteModel ?? (async (id: string): Promise<void> => {
		if (DEMO_MODE) {
			const all = lsGetAll();
			delete all[id];
			lsSaveAll(all);
			return;
		}
		await fetch(`/api/models/${id}`, { method: 'DELETE' });
	});

	const apiLoadModel = options.loadModel ?? (async (id: string): Promise<DomainModel> => {
		if (DEMO_MODE) {
			const found = lsGetAll()[id];
			if (!found) throw new Error(`Model not found: ${id}`);
			return found;
		}
		const res = await fetch(`/api/models/${id}`);
		return res.json();
	});

	// --- Single reactive store object ---

	let savedList = $state<{ id: string; name: string }[]>([]);
	let model = $state<DomainModel>({
		version: '1.0',
		id: 'empty',
		name: 'Loading...',
		description: '',
		domains: [],
		concepts: [],
		events: []
	});
	let dirty = $state(false);
	let loaded = $state(false);

	function markDirty() {
		dirty = true;
	}

	// --- Init ---

	async function initStore() {
		if (loaded) return;
		const models = await apiListModels();
		if (models.length === 0) {
			// In demo mode, seed all three example matrices that ship with the
			// standalone repo so visitors see a populated app instead of a
			// single ice-cream-shop seed.
			if (DEMO_MODE) {
				for (const m of DEMO_SEED_MODELS) {
					const migrated = migrateModel(JSON.parse(JSON.stringify(m)));
					await apiCreateModel(migrated);
				}
				const all = (await apiListModels()).map(migrateModel);
				savedList = all.map((m) => ({ id: m.id, name: m.name }));
				model = all[0];
			} else {
				const example = makeExampleModel();
				await apiCreateModel(example);
				savedList = [{ id: example.id, name: example.name }];
				model = example;
			}
		} else {
			const migrated = models.map(migrateModel);
			savedList = migrated.map((m) => ({ id: m.id, name: m.name }));
			const lastId = typeof window !== 'undefined' ? localStorage.getItem('bdm-current-id') : null;
			const found = migrated.find((m) => m.id === lastId);
			model = found || migrated[0];
		}
		dirty = false;
		loaded = true;
	}

	// --- Public API ---

	function getModel(): DomainModel {
		return model;
	}

	function getSavedList(): { id: string; name: string }[] {
		return savedList;
	}

	function isDirty(): boolean {
		return dirty;
	}

	function isLoaded(): boolean {
		return loaded;
	}

	async function switchTo(id: string) {
		if (dirty) {
			try { await doSave(); } catch {}
		}
		const m = await apiLoadModel(id);
		model = migrateModel(m);
		dirty = false;
		if (typeof window !== 'undefined') {
			localStorage.setItem('bdm-current-id', id);
		}
	}

	async function doSave() {
		const snapshot = JSON.parse(JSON.stringify(model));
		await apiSaveModel(snapshot);
		const idx = savedList.findIndex((s) => s.id === model.id);
		if (idx >= 0) {
			savedList[idx] = { id: model.id, name: model.name };
		}
		dirty = false;
	}

	async function newModel(name: string) {
		const existingIds = savedList.map((s) => s.id);
		const id = uniqueId(name, existingIds);
		const newM: DomainModel = {
			version: '1.0',
			id,
			name,
			description: '',
			domains: [],
			concepts: [],
			events: []
		};
		await apiCreateModel(newM);
		savedList = [...savedList, { id, name }];
		model = newM;
		dirty = false;
		if (typeof window !== 'undefined') {
			localStorage.setItem('bdm-current-id', id);
		}
	}

	async function doDeleteModel(id: string) {
		await apiDeleteModel(id);
		savedList = savedList.filter((s) => s.id !== id);
		if (savedList.length > 0) {
			model = migrateModel(await apiLoadModel(savedList[0].id));
		} else {
			const example = makeExampleModel();
			await apiCreateModel(example);
			savedList = [{ id: example.id, name: example.name }];
			model = example;
		}
		dirty = false;
		if (typeof window !== 'undefined') {
			localStorage.setItem('bdm-current-id', model.id);
		}
	}

	function renameModel(name: string) {
		model.name = name;
		markDirty();
	}

	function updateDescription(desc: string) {
		model.description = desc;
		markDirty();
	}

	// --- Domains ---

	function addDomain(name: string) {
		if (!model.domains) model.domains = [];
		const id = uniqueId(name, model.domains.map((d) => d.id));
		model.domains = [...model.domains, { id, name, description: '', aliases: [], owner: '', order: 0 }];
		// Re-sort alphabetically and re-assign order values
		model.domains.sort((a, b) => a.name.localeCompare(b.name));
		model.domains.forEach((d, i) => d.order = i);
		markDirty();
	}

	function removeDomain(id: string) {
		model.domains = (model.domains || []).filter((d) => d.id !== id);
		for (const ev of model.events) {
			if (ev.domains) delete ev.domains[id];
		}
		markDirty();
	}

	function updateDomain(id: string, updates: Partial<Pick<Domain, 'name' | 'description' | 'aliases' | 'owner' | 'notes' | 'order'>>) {
		const dom = (model.domains || []).find((d) => d.id === id);
		if (!dom) return;
		if (updates.name !== undefined) dom.name = updates.name;
		if (updates.description !== undefined) dom.description = updates.description;
		if (updates.aliases !== undefined) dom.aliases = updates.aliases;
		if (updates.owner !== undefined) dom.owner = updates.owner;
		if (updates.notes !== undefined) (dom as any).notes = updates.notes;
		if (updates.order !== undefined) dom.order = updates.order;
		markDirty();
	}

	function toggleDomainMark(eventId: string, domainId: string) {
		const ev = model.events.find((e) => e.id === eventId);
		if (!ev) return;
		if (!ev.domains) ev.domains = {};
		const current = ev.domains[domainId] || '';
		if (current === '') {
			ev.domains[domainId] = 'check';
		} else if (current === 'check') {
			ev.domains[domainId] = 'star';
		} else {
			delete ev.domains[domainId];
		}
		// Force Svelte 5 reactivity by reassigning the array
		model.events = [...model.events];
		markDirty();
	}

	function getSortedDomains(): Domain[] {
		return [...(model.domains || [])].sort((a, b) => a.name.localeCompare(b.name));
	}

	// --- Concepts ---

	function addConcept(name: string, w: W) {
		const id = uniqueId(name, model.concepts.map((d) => d.id));
		const maxOrder = model.concepts.reduce((max, d) => Math.max(max, d.order), 0);
		model.concepts = [...model.concepts, { id, name, description: '', aliases: [], w, order: maxOrder + 1 }];
		markDirty();
	}

	function removeConcept(id: string) {
		model.concepts = model.concepts.filter((d) => d.id !== id);
		for (const ev of model.events) {
			delete ev.concepts[id];
		}
		markDirty();
	}

	function updateConcept(id: string, updates: Partial<Pick<Concept, 'name' | 'w' | 'description' | 'aliases' | 'notes' | 'order' | 'definitionCategory' | 'definitionDifferentiator'>>) {
		const dim = model.concepts.find((d) => d.id === id);
		if (!dim) return;
		if (updates.name !== undefined) dim.name = updates.name;
		if (updates.w !== undefined) dim.w = updates.w;
		if (updates.description !== undefined) dim.description = updates.description;
		if (updates.aliases !== undefined) dim.aliases = updates.aliases;
		if (updates.notes !== undefined) dim.notes = updates.notes;
		if (updates.order !== undefined) dim.order = updates.order;
		if (updates.definitionCategory !== undefined) dim.definitionCategory = updates.definitionCategory;
		if (updates.definitionDifferentiator !== undefined) dim.definitionDifferentiator = updates.definitionDifferentiator;
		markDirty();
	}

	// --- Events ---

	function addEvent(name: string) {
		const id = uniqueId(name, model.events.map((e) => e.id));
		const maxOrder = model.events.reduce((max, e) => Math.max(max, e.order), 0);
		model.events = [...model.events, {
			id,
			name,
			description: '',
			order: maxOrder + 1,
			importance: 0,
			estimate: 0,
			concepts: {},
			domains: {}
		}];
		markDirty();
	}

	function removeEvent(id: string) {
		model.events = model.events.filter((e) => e.id !== id);
		markDirty();
	}

	function updateEvent(id: string, updates: Partial<Pick<BusinessEvent, 'name' | 'description' | 'importance' | 'estimate' | 'order'>>) {
		const ev = model.events.find((e) => e.id === id);
		if (!ev) return;
		if (updates.name !== undefined) ev.name = updates.name;
		if (updates.description !== undefined) ev.description = updates.description;
		if (updates.importance !== undefined) ev.importance = updates.importance;
		if (updates.estimate !== undefined) ev.estimate = updates.estimate;
		if (updates.order !== undefined) ev.order = updates.order;
		markDirty();
	}

	function toggleMark(eventId: string, conceptId: string) {
		const ev = model.events.find((e) => e.id === eventId);
		if (!ev) return;
		const current = ev.concepts[conceptId] || '';
		if (current === '') {
			ev.concepts[conceptId] = 'check';
		} else if (current === 'check') {
			ev.concepts[conceptId] = 'star';
		} else {
			delete ev.concepts[conceptId];
		}
		// Force Svelte 5 reactivity by reassigning the array
		model.events = [...model.events];
		markDirty();
	}

	function setMark(eventId: string, conceptId: string, mark: EventDimensionMark) {
		const ev = model.events.find((e) => e.id === eventId);
		if (!ev) return;
		ev.concepts[conceptId] = mark;
		markDirty();
	}

	// --- Import/Export ---

	function exportJSON(): string {
		return JSON.stringify(model, null, 2);
	}

	// CSV + XLSX exports are pure functions in $lib/export-bem so the CP frontend
	// can reuse them via the workspace `business-domain-models/export-bem`
	// import. The store methods stay as thin wrappers so existing call sites
	// (Toolbar.svelte) keep working unchanged.
	function exportAsCsv(): string {
		return bemModelToCsv(model);
	}

	function exportAsXlsx() {
		const blob = bemModelToXlsxBlob(model);
		downloadBemBlob(blob, bemExportFilename(model.name, 'xlsx'));
	}

	async function importJSON(json: string) {
		const parsed = JSON.parse(json);
		if (!parsed.id || (!parsed.concepts && !parsed.dimensions) || !parsed.events) {
			throw new Error('Invalid domain model JSON');
		}
		parsed.name = stripDateTimeSuffix(parsed.name || 'imported');
		const existingIds = savedList.map((s) => s.id);
		const id = uniqueId(parsed.name, existingIds);
		parsed.id = id;
		migrateModel(parsed);
		await apiCreateModel(parsed);
		savedList = [...savedList, { id, name: parsed.name }];
		model = parsed;
		dirty = false;
		if (typeof window !== 'undefined') {
			localStorage.setItem('bdm-current-id', id);
		}
	}

	// --- Sorted accessors ---

	function getConceptsByW(): Map<string, Concept[]> {
		const grouped = new Map<string, Concept[]>();
		for (const dim of model.concepts) {
			const group = grouped.get(dim.w) || [];
			group.push(dim);
			grouped.set(dim.w, group);
		}
		for (const [, group] of grouped) {
			group.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
		}
		return grouped;
	}

	function getSortedEvents(): BusinessEvent[] {
		return [...model.events].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
	}

	function getConceptCount(eventId: string): number {
		const ev = model.events.find((e) => e.id === eventId);
		if (!ev) return 0;
		return Object.values(ev.concepts).filter((m) => m === 'check' || m === 'star').length;
	}

	return {
		initStore,
		getModel,
		getSavedList,
		isDirty,
		isLoaded,
		switchTo,
		saveModel: doSave,
		newModel,
		deleteModel: doDeleteModel,
		renameModel,
		updateDescription,
		addDomain,
		removeDomain,
		updateDomain,
		toggleDomainMark,
		getSortedDomains,
		addConcept,
		removeConcept,
		updateConcept,
		addEvent,
		removeEvent,
		updateEvent,
		toggleMark,
		setMark,
		exportJSON,
		exportAsCsv,
		exportAsXlsx,
		importJSON,
		getConceptsByW,
		getSortedEvents,
		getConceptCount
	};
}

export type BemStore = ReturnType<typeof createBemStore>;
