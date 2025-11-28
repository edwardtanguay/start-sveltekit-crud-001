import { json, type RequestHandler } from '@sveltejs/kit';
import { createEmployee, getAllEmployees } from '$lib/server/employeeStore';
import { sanitizePayload } from '$lib/server/validateEmployee';

export const GET: RequestHandler = async () => {
	const employees = await getAllEmployees();
	return json(employees);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const payload = sanitizePayload(body);
	const created = await createEmployee(payload);
	return json(created, { status: 201 });
};
