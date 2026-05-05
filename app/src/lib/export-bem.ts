/**
 * Pure BEM CSV / XLSX exporters — model-shaped input, no store / DOM access.
 *
 * Both the SA store and the CP frontend consume these. The SA passes its own
 * `model: DomainModel`; the CP computes a model-shaped object via
 * `exportBemJson(nodes, links)` (in the CP frontend's standalone-io.ts) and
 * passes that. Sharing this logic means a change to CSV format or XLSX
 * sheet structure only needs to land here once.
 *
 * Architecture context:
 * - The SA app owns this file (canvas-deduplication / Phase 8 of the integration).
 * - The CP frontend imports it via the `business-domain-models/exports` workspace
 *   path (registered in this app's package.json `exports` map).
 * - XLSX construction is delegated to `@context-plane/shared/xlsx` so every SA
 *   app shares one ExcelJS wrapper. `xlsx` (SheetJS) is BANNED in this monorepo;
 *   a CI guardrail blocks any reintroduction.
 */

import { buildXlsxBlob, downloadXlsx, type SheetSpec } from '$lib/cp-shared-xlsx';
import type { DomainModel } from './types';

/** Build the BEM matrix as a CSV string. Same column ordering as XLSX sheet 1. */
export function bemModelToCsv(model: DomainModel): string {
	const sortedDomains = [...(model.domains || [])].sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	const sortedConcepts = [...model.concepts].sort(
		(a, b) => a.order - b.order || a.name.localeCompare(b.name)
	);
	const sortedEvents = [...model.events].sort(
		(a, b) => a.order - b.order || a.name.localeCompare(b.name)
	);

	const headers = ['Event Name', 'Event Description'];
	for (const dom of sortedDomains) headers.push(`Domain: ${dom.name}`);
	for (const c of sortedConcepts) headers.push(`${c.w}: ${c.name}`);

	const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;

	const rows = sortedEvents.map((ev) => {
		const cells = [csvEscape(ev.name), csvEscape(ev.description || '')];
		for (const dom of sortedDomains) {
			const mark = ev.domains?.[dom.id] || '';
			cells.push(csvEscape(mark === 'star' ? '★' : mark === 'check' ? '✓' : ''));
		}
		for (const c of sortedConcepts) {
			const mark = ev.concepts[c.id] || '';
			cells.push(csvEscape(mark === 'star' ? '★' : mark === 'check' ? '✓' : ''));
		}
		return cells.join(',');
	});

	return [headers.map(csvEscape).join(','), ...rows].join('\n');
}

/**
 * Build the BEM matrix as an XLSX `Blob`. Three sheets: Matrix, Domains, Concepts.
 * Caller is responsible for triggering the download (`downloadBemBlob`).
 */
export async function bemModelToXlsxBlob(model: DomainModel): Promise<Blob> {
	const sortedDomains = [...(model.domains || [])].sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	const sortedConcepts = [...model.concepts].sort(
		(a, b) => a.order - b.order || a.name.localeCompare(b.name)
	);
	const sortedEvents = [...model.events].sort(
		(a, b) => a.order - b.order || a.name.localeCompare(b.name)
	);

	// Sheet 1: Event Matrix
	const matrixHeaders = ['Event Name', 'Event Description'];
	for (const dom of sortedDomains) matrixHeaders.push(`Domain: ${dom.name}`);
	for (const c of sortedConcepts) matrixHeaders.push(`${c.w}: ${c.name}`);

	const matrixRows = sortedEvents.map((ev) => {
		const row: string[] = [ev.name, ev.description || ''];
		for (const dom of sortedDomains) {
			const mark = ev.domains?.[dom.id] || '';
			row.push(mark === 'star' ? '★' : mark === 'check' ? '✓' : '');
		}
		for (const c of sortedConcepts) {
			const mark = ev.concepts[c.id] || '';
			row.push(mark === 'star' ? '★' : mark === 'check' ? '✓' : '');
		}
		return row;
	});

	const sheets: SheetSpec[] = [
		{ title: model.name || 'Matrix', rows: [matrixHeaders, ...matrixRows] }
	];

	// Sheet 2: Domains
	if (sortedDomains.length > 0) {
		sheets.push({
			title: 'Domains',
			rows: [
				['Domain Name', 'Description', 'Owner', 'Aliases'],
				...sortedDomains.map((d) => [
					d.name,
					d.description || '',
					d.owner || '',
					(d.aliases || []).join(', ')
				])
			]
		});
	}

	// Sheet 3: Concepts
	sheets.push({
		title: 'Concepts',
		rows: [
			['Concept Name', 'W Category', 'Description', 'Aliases'],
			...sortedConcepts.map((c) => [
				c.name,
				c.w,
				c.description || '',
				(c.aliases || []).join(', ')
			])
		]
	});

	return buildXlsxBlob(sheets);
}

/**
 * Trigger a download of an arbitrary Blob via a transient `<a download>` element.
 * Re-exported from the shared helper so existing call sites keep working.
 */
export const downloadBemBlob = downloadXlsx;

/** Build a slug + timestamp filename in the SA's existing format. */
export function bemExportFilename(modelName: string, ext: 'csv' | 'xlsx'): string {
	const slug =
		modelName
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '')
			.replace(/^-+|-+$/g, '') || 'export';
	const d = new Date();
	const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
	return `${slug}-bem-${ts}.${ext}`;
}
