import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { DATA_DIR, safeFilePath, isValidModel, readJsonBody } from './utils';

function ensureDataDir() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
}

export const GET: RequestHandler = async () => {
	ensureDataDir();
	const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.includes('.deleted-'));
	const models = files
		.map((f) => {
			try {
				const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
				const parsed = JSON.parse(raw);
				// The matrix switcher (and every consumer that calls
				// `/api/models/{id}`) looks up files by id-as-filename. Some legacy
				// files on disk have an internal `id` field that doesn't match the
				// filename (typos, missing `-bem` suffix, etc.) — surfacing the
				// internal id then 404s on switch. Normalise id → filename here so
				// list + get-by-id + switchTo all agree.
				const fileId = path.basename(f, '.json');
				return { ...parsed, id: fileId };
			} catch {
				console.error(`Skipping malformed file: ${f}`);
				return null;
			}
		})
		.filter(Boolean);
	return json(models);
};

export const POST: RequestHandler = async ({ request }) => {
	ensureDataDir();

	const body = await readJsonBody(request);
	if (!body.ok) return body.response;
	const model = body.value;
	if (!isValidModel(model)) {
		return json({ error: 'Invalid model data' }, { status: 400 });
	}

	const filePath = safeFilePath(model.id);
	if (!filePath) {
		return json({ error: 'Invalid model id' }, { status: 400 });
	}

	fs.writeFileSync(filePath, JSON.stringify(model, null, 2));
	return json({ ok: true, id: model.id });
};
