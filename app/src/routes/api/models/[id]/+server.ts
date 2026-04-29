import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { DATA_DIR, safeFilePath, isValidModel } from '../utils';

export const GET: RequestHandler = async ({ params }) => {
	const filePath = safeFilePath(params.id);
	if (!filePath) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}
	if (!fs.existsSync(filePath)) {
		return json({ error: 'Not found' }, { status: 404 });
	}
	const raw = fs.readFileSync(filePath, 'utf-8');
	const parsed = JSON.parse(raw);
	// Normalise the model's id to the filename so subsequent saves go back to
	// the SAME file rather than creating a new one under the legacy internal id.
	return json({ ...parsed, id: params.id });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const filePath = safeFilePath(params.id);
	if (!filePath) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
	if (contentLength > 5 * 1024 * 1024) {
		return json({ error: 'Payload too large' }, { status: 413 });
	}

	const model = await request.json();
	if (!isValidModel(model)) {
		return json({ error: 'Invalid model data' }, { status: 400 });
	}

	fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const filePath = safeFilePath(params.id);
	if (!filePath) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}
	if (fs.existsSync(filePath)) {
		const archivePath = path.join(DATA_DIR, `.deleted-${Date.now()}-${params.id}.json`);
		fs.renameSync(filePath, archivePath);
	}
	return json({ ok: true });
};
