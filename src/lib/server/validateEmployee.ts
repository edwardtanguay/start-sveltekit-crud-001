import type { CreateEmployeePayload } from '$lib/types/employee';

export function sanitizePayload(body: Partial<CreateEmployeePayload>): CreateEmployeePayload {
	const name = requireString(body.name, 'name');
	const title = requireString(body.title, 'title');
	const department = requireString(body.department, 'department');
	const location = requireString(body.location, 'location');
	const hireDateRaw = requireString(body.hireDate, 'hireDate');

	const salaryValue = Number(body.salary);
	if (!Number.isFinite(salaryValue)) {
		throw new Response('salary must be a number', { status: 400 });
	}

	if (Number.isNaN(Date.parse(hireDateRaw))) {
		throw new Response('hireDate must be a valid date', { status: 400 });
	}

	return {
		name,
		title,
		department,
		location,
		salary: Math.round(salaryValue),
		hireDate: new Date(hireDateRaw).toISOString().slice(0, 10)
	};
}

function requireString(value: unknown, field: string): string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new Response(`${field} is required`, { status: 400 });
	}
	return value.trim();
}
