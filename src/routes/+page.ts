import type { Employee } from '$lib/types/employee';
import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
	const response = await fetch('/api/employees');
	if (!response.ok) {
		return { employees: [] as Employee[] };
	}
	const employees = (await response.json()) as Employee[];
	return { employees };
}) satisfies PageLoad<{ employees: Employee[] }>;
