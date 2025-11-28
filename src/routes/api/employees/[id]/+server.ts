import { json, type RequestHandler } from '@sveltejs/kit';
import { deleteEmployee, updateEmployee } from '$lib/server/employeeStore';
import { sanitizePayload } from '$lib/server/validateEmployee';

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = params.id;
	if (!id) {
		return new Response('Missing employee id', { status: 400 });
	}
	const body = await request.json();
	const payload = sanitizePayload(body);
	try {
		const updated = await updateEmployee(id, payload);
		return json(updated);
	} catch (error) {
		return new Response((error as Error).message, { status: 404 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = params.id;
	if (!id) {
		return new Response('Missing employee id', { status: 400 });
	}
	try {
		await deleteEmployee(id);
		return new Response(null, { status: 204 });
	} catch (error) {
		return new Response((error as Error).message, { status: 404 });
	}
};
