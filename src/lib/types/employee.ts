export type Employee = {
	id: string;
	name: string;
	title: string;
	department: string;
	location: string;
	salary: number;
	hireDate: string; // ISO date string
};

export type CreateEmployeePayload = Omit<Employee, 'id'>;
