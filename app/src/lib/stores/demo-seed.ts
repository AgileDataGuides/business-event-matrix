// Demo-mode seed for BEM's standalone GitHub Pages build.
//
// Imports the example matrix JSONs via the `$data` Vite alias (defined in
// `apps/business-event-matrix/app/vite.config.ts`). The version-aware
// overlay logic lives in `@context-plane/shared/demo-seed`.
//
// Bump SEED_VERSION when bundled JSONs change so returning visitors get
// the updated examples on next load.

import { applyDemoSeeds } from '@context-plane/shared/demo-seed';
import type { DomainModel } from '../types';

import iceCreamShop from '$data/ice-cream-shop.json';
import lawrenceCorr from '$data/lawrence-corr-beam-bem.json';
import saasRevenue from '$data/saas-revenue-events-matrix-2.json';

const LS_KEY = 'bdm-demo-models';
const SEED_VERSION_KEY = 'bdm-demo-seed-version';

/** Bump when bundled JSONs change. ISO date format. */
const SEED_VERSION = '2026-05-05';

const SEEDS: DomainModel[] = [
	iceCreamShop as unknown as DomainModel,
	lawrenceCorr as unknown as DomainModel,
	saasRevenue as unknown as DomainModel
];

/**
 * Apply demo seeds. Call from `+page.svelte` `onMount` BEFORE
 * `store.initStore()`, gated by `VITE_DEMO_MODE === 'true'`.
 */
export function applyBemDemoSeeds(): void {
	applyDemoSeeds<DomainModel>({
		lsKey: LS_KEY,
		seedVersionKey: SEED_VERSION_KEY,
		seedVersion: SEED_VERSION,
		seeds: SEEDS
		// No migrate: BEM's migrateModel is internal to the store factory;
		// the bundled JSONs are already in the latest shape.
	});
}
