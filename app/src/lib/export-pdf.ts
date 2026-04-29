/**
 * Export a Business Event Matrix model to PDF.
 * Uses jsPDF + jspdf-autotable for table rendering.
 *
 * Layout:
 *   - Landscape A4
 *   - Title + description header
 *   - Matrix table: rows = events, column groups = domains → concepts
 *   - Cells show check (✓) or star (★) marks
 *   - Auto-pagination for tall matrices
 *   - Footer: date + branding
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DomainModel, W } from './types';

// W category colors (matching the UI)
const W_COLORS: Record<W, string> = {
	'who': '#16a34a',
	'what': '#2563eb',
	'when': '#d97706',
	'where': '#0891b2',
	'why': '#a855f7',
	'how': '#6b7280',
	'how many': '#f97316'
};

const W_BG: Record<W, string> = {
	'who': '#f0fdf4',
	'what': '#eff6ff',
	'when': '#fffbeb',
	'where': '#ecfeff',
	'why': '#faf5ff',
	'how': '#f9fafb',
	'how many': '#fff7ed'
};

const DOMAIN_COLOR = '#7c3aed';
const DOMAIN_BG = '#f5f3ff';

interface BemPdfData {
	name: string;
	description?: string;
	events: Array<{
		id: string;
		name: string;
		order: number;
		concepts: Record<string, string>;
		domains: Record<string, string>;
	}>;
	domains: Array<{ id: string; name: string; order: number }>;
	concepts: Array<{ id: string; name: string; w: W; order: number; domainId?: string }>;
}

function exportTimestamp(): string {
	const d = new Date();
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function formatDate(): string {
	return new Date().toLocaleDateString('en-NZ', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Export a BEM DomainModel to PDF and trigger download.
 */
export async function exportBemToPdf(data: BemPdfData): Promise<void> {
	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const margin = 10;

	// ── Title ──
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text(data.name || 'Business Event Matrix', margin, 18);

	let startY = 22;

	if (data.description) {
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		const descLines = doc.splitTextToSize(data.description, pageWidth - margin * 2);
		doc.text(descLines, margin, startY + 4);
		startY += 4 + descLines.length * 4 + 2;
		doc.setTextColor(0, 0, 0);
	}

	// ── Build column structure ──
	// Sort events by order
	const sortedEvents = [...data.events].sort((a, b) => a.order - b.order);

	// Sort domains alphabetically
	const sortedDomains = [...data.domains].sort((a, b) => a.name.localeCompare(b.name));

	// Sort concepts by W group then order
	const wOrder: W[] = ['who', 'what', 'when', 'where', 'why', 'how', 'how many'];
	const sortedConcepts = [...data.concepts].sort((a, b) => {
		const wDiff = wOrder.indexOf(a.w) - wOrder.indexOf(b.w);
		if (wDiff !== 0) return wDiff;
		return a.order - b.order;
	});

	// Build column headers: first column is "Event", then domain columns, then concept columns grouped by W
	const columns: Array<{ header: string; key: string; type: 'domain' | 'concept'; w?: W }> = [];

	// Domain columns
	for (const dom of sortedDomains) {
		columns.push({ header: dom.name, key: dom.id, type: 'domain' });
	}

	// Concept columns grouped by W
	for (const dim of sortedConcepts) {
		columns.push({ header: dim.name, key: dim.id, type: 'concept', w: dim.w });
	}

	// ── Build table data ──
	const head: Array<Array<{ content: string; styles?: Record<string, unknown> }>> = [];

	// Header row 1: "Event" + domain group headers + W group headers
	const headerRow1: Array<{ content: string; styles?: Record<string, unknown> }> = [
		{ content: 'Event', styles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' } }
	];

	if (sortedDomains.length > 0) {
		headerRow1.push({
			content: 'Domains',
			styles: { fillColor: hexToRgb(DOMAIN_BG), textColor: hexToRgb(DOMAIN_COLOR), fontStyle: 'bold', halign: 'center' }
		});
	}

	// Group concepts by W for header spanning
	const wGroups: Array<{ w: W; count: number }> = [];
	let currentW: W | null = null;
	for (const dim of sortedConcepts) {
		if (dim.w !== currentW) {
			wGroups.push({ w: dim.w, count: 1 });
			currentW = dim.w;
		} else {
			wGroups[wGroups.length - 1].count++;
		}
	}

	for (const wg of wGroups) {
		const label = wg.w.charAt(0).toUpperCase() + wg.w.slice(1);
		headerRow1.push({
			content: label,
			styles: { fillColor: hexToRgb(W_BG[wg.w]), textColor: hexToRgb(W_COLORS[wg.w]), fontStyle: 'bold', halign: 'center' }
		});
	}

	head.push(headerRow1);

	// Header row 2: "Event" + individual domain names + individual concept names
	const headerRow2: Array<{ content: string; styles?: Record<string, unknown> }> = [
		{ content: '', styles: { fillColor: [241, 245, 249] } }
	];

	for (const dom of sortedDomains) {
		headerRow2.push({
			content: dom.name,
			styles: { fillColor: hexToRgb(DOMAIN_BG), textColor: hexToRgb(DOMAIN_COLOR), fontSize: 7, halign: 'center' }
		});
	}

	for (const dim of sortedConcepts) {
		headerRow2.push({
			content: dim.name,
			styles: { fillColor: hexToRgb(W_BG[dim.w]), textColor: hexToRgb(W_COLORS[dim.w]), fontSize: 7, halign: 'center' }
		});
	}

	head.push(headerRow2);

	// Data rows
	const body: Array<Array<{ content: string; styles?: Record<string, unknown> }>> = [];

	for (const event of sortedEvents) {
		const row: Array<{ content: string; styles?: Record<string, unknown> }> = [
			{ content: event.name, styles: { fontStyle: 'bold', fontSize: 8 } }
		];

		// Domain marks
		for (const dom of sortedDomains) {
			const mark = event.domains[dom.id] || '';
			row.push({
				content: mark === 'star' ? '\u2605' : mark === 'check' ? '\u2713' : '',
				styles: { halign: 'center', fontSize: mark === 'star' ? 10 : 9, textColor: mark === 'star' ? hexToRgb(DOMAIN_COLOR) : [100, 100, 100] }
			});
		}

		// Concept marks
		for (const dim of sortedConcepts) {
			const mark = event.concepts[dim.id] || '';
			row.push({
				content: mark === 'star' ? '\u2605' : mark === 'check' ? '\u2713' : '',
				styles: { halign: 'center', fontSize: mark === 'star' ? 10 : 9, textColor: mark === 'star' ? hexToRgb(W_COLORS[dim.w]) : [100, 100, 100] }
			});
		}

		body.push(row);
	}

	// ── Column span mapping for header row 1 ──
	// We need to use columnSpan in the header cells
	// jspdf-autotable supports colSpan via cell styles

	// Rebuild header row 1 with colSpan
	const headerRow1WithSpans: Array<{ content: string; colSpan?: number; styles?: Record<string, unknown> }> = [
		{ content: 'Event', styles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold' } }
	];

	if (sortedDomains.length > 0) {
		headerRow1WithSpans.push({
			content: 'Domains',
			colSpan: sortedDomains.length,
			styles: { fillColor: hexToRgb(DOMAIN_BG), textColor: hexToRgb(DOMAIN_COLOR), fontStyle: 'bold', halign: 'center' }
		});
	}

	for (const wg of wGroups) {
		const label = wg.w.charAt(0).toUpperCase() + wg.w.slice(1);
		headerRow1WithSpans.push({
			content: label,
			colSpan: wg.count,
			styles: { fillColor: hexToRgb(W_BG[wg.w]), textColor: hexToRgb(W_COLORS[wg.w]), fontStyle: 'bold', halign: 'center' }
		});
	}

	// ── Render table ──
	const totalDataCols = sortedDomains.length + sortedConcepts.length;

	// Calculate column widths
	const availableWidth = pageWidth - margin * 2;
	const eventColWidth = Math.min(50, availableWidth * 0.2);
	const dataColWidth = totalDataCols > 0
		? (availableWidth - eventColWidth) / totalDataCols
		: 20;

	const columnStyles: Record<number, Record<string, unknown>> = {
		0: { cellWidth: eventColWidth }
	};
	for (let i = 1; i <= totalDataCols; i++) {
		columnStyles[i] = { cellWidth: dataColWidth };
	}

	autoTable(doc, {
		startY: startY + 2,
		head: [headerRow1WithSpans, headerRow2],
		body,
		theme: 'grid',
		styles: {
			fontSize: 8,
			cellPadding: 2,
			lineColor: [200, 200, 200],
			lineWidth: 0.25,
			overflow: 'linebreak'
		},
		headStyles: {
			fontSize: 8,
			cellPadding: 2
		},
		columnStyles,
		margin: { left: margin, right: margin },
		didDrawPage: (hookData) => {
			// Footer on every page
			const pageNum = doc.getNumberOfPages();
			doc.setFontSize(7);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(150, 150, 150);
			doc.text(
				`Generated by Context Plane  |  ${formatDate()}  |  Page ${hookData.pageNumber}`,
				pageWidth / 2,
				pageHeight - 5,
				{ align: 'center' }
			);
		}
	});

	// ── Download ──
	const timestamp = exportTimestamp();
	const filename = `${slugify(data.name || 'bem')}-${timestamp}.pdf`;
	doc.save(filename);
}

/**
 * Export directly from a DomainModel (used by standalone BEM app).
 */
export async function exportDomainModelToPdf(model: DomainModel): Promise<void> {
	await exportBemToPdf({
		name: model.name,
		description: model.description,
		events: model.events.map((e) => ({
			id: e.id,
			name: e.name,
			order: e.order,
			concepts: e.concepts as Record<string, string>,
			domains: e.domains as Record<string, string>
		})),
		domains: model.domains,
		concepts: model.concepts
	});
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.substring(0, 2), 16),
		parseInt(h.substring(2, 4), 16),
		parseInt(h.substring(4, 6), 16)
	];
}

function slugify(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bem';
}
