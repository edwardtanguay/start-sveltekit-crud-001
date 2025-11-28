import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { CreateEmployeePayload, Employee } from '$lib/types/employee';

const DATA_PATH = fileURLToPath(new URL('./employees.json', import.meta.url));

export async function getAllEmployees(): Promise<Employee[]> {
	try {
		const json = await readFile(DATA_PATH, 'utf-8');
		return JSON.parse(json) as Employee[];
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			await persistEmployees([]);
			return [];
		}
		throw error;
	}
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
	const employees = await getAllEmployees();
	const employee: Employee = { ...payload, id: randomUUID() };
	employees.push(employee);
	await persistEmployees(employees);
	return employee;
}

export async function updateEmployee(id: string, payload: CreateEmployeePayload): Promise<Employee> {
	const employees = await getAllEmployees();
	const index = employees.findIndex((emp) => emp.id === id);
	if (index === -1) {
		throw new Error('Employee not found');
	}
	const updated: Employee = { ...payload, id };
	employees[index] = updated;
	await persistEmployees(employees);
	return updated;
}

export async function deleteEmployee(id: string): Promise<void> {
	const employees = await getAllEmployees();
	const filtered = employees.filter((emp) => emp.id !== id);
	if (filtered.length === employees.length) {
		throw new Error('Employee not found');
	}
	await persistEmployees(filtered);
}

async function persistEmployees(employees: Employee[]) {
	const dir = dirname(DATA_PATH);
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}
	await writeFile(DATA_PATH, JSON.stringify(employees, null, 2));
}
