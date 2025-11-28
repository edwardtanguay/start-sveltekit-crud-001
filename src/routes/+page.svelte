<svelte:options runes={false} />

<script lang="ts">
	import type { Employee } from '$lib/types/employee';
	import Icon from '@iconify/svelte';

	type SortableColumn = keyof Pick<
		Employee,
		'name' | 'title' | 'department' | 'location' | 'salary' | 'hireDate'
	>;

	type FormState = {
		name: string;
		title: string;
		department: string;
		location: string;
		salary: string;
		hireDate: string;
	};

	const blankForm: FormState = {
		name: '',
		title: '',
		department: '',
		location: '',
		salary: '',
		hireDate: ''
	};

	const columns: Array<{ key: SortableColumn; label: string }> = [
		{ key: 'name', label: 'Name' },
		{ key: 'title', label: 'Title' },
		{ key: 'department', label: 'Department' },
		{ key: 'location', label: 'Location' },
		{ key: 'salary', label: 'Salary' },
		{ key: 'hireDate', label: 'Hire date' }
	];

	export let data: { employees: Employee[] };
	let employees: Employee[] = [...data.employees];
	let search = '';
	let sortBy: SortableColumn = 'name';
	let sortDir: 'asc' | 'desc' = 'asc';
	let drawerOpen = false;
	let editingId: string | null = null;
	let form: FormState = { ...blankForm };
	let submitting = false;
	let banner: { type: 'success' | 'error'; copy: string } | null = null;

	const currency = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const friendlyDate = new Intl.DateTimeFormat('en-US', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});

	$: normalizedSearch = search.trim().toLowerCase();
	$: filteredEmployees = employees
		.filter((employee) => {
			if (!normalizedSearch) return true;
			return (
				employee.name.toLowerCase().includes(normalizedSearch) ||
				employee.title.toLowerCase().includes(normalizedSearch) ||
				employee.department.toLowerCase().includes(normalizedSearch) ||
				employee.location.toLowerCase().includes(normalizedSearch)
			);
		})
		.sort((a, b) => compareEmployees(a, b, sortBy, sortDir));

	function compareEmployees(
		a: Employee,
		b: Employee,
		column: SortableColumn,
		direction: 'asc' | 'desc'
	) {
		const dir = direction === 'asc' ? 1 : -1;
		if (column === 'salary') {
			return (a.salary - b.salary) * dir;
		}
		const valA = a[column];
		const valB = b[column];
		if (valA < valB) return -1 * dir;
		if (valA > valB) return 1 * dir;
		return 0;
	}

	function handleSort(column: SortableColumn) {
		if (sortBy === column) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDir = 'asc';
		}
	}

	function openDrawer(employee?: Employee) {
		if (employee) {
			editingId = employee.id;
			form = {
				name: employee.name,
				title: employee.title,
				department: employee.department,
				location: employee.location,
				salary: employee.salary.toString(),
				hireDate: employee.hireDate
			};
		} else {
			editingId = null;
			form = { ...blankForm };
		}
		drawerOpen = true;
	}

	function closeDrawer() {
		drawerOpen = false;
		editingId = null;
		form = { ...blankForm };
	}

	async function handleSubmit() {
		if (
			!form.name ||
			!form.title ||
			!form.department ||
			!form.location ||
			!form.hireDate ||
			!form.salary
		) {
			banner = { type: 'error', copy: 'All fields are required.' };
			return;
		}

		const salaryValue = Number(form.salary);
		if (Number.isNaN(salaryValue)) {
			banner = { type: 'error', copy: 'Salary must be a number.' };
			return;
		}

		const payload = {
			name: form.name.trim(),
			title: form.title.trim(),
			department: form.department.trim(),
			location: form.location.trim(),
			salary: salaryValue,
			hireDate: form.hireDate
		};

		submitting = true;
		banner = null;

		try {
			const endpoint = editingId
				? `/api/employees/${editingId}`
				: '/api/employees';
			const method = editingId ? 'PUT' : 'POST';
			const response = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(await response.text());
			}

			const saved = (await response.json()) as Employee;
			if (editingId) {
				employees = employees.map((emp) =>
					emp.id === saved.id ? saved : emp
				);
				banner = { type: 'success', copy: 'Employee updated.' };
			} else {
				employees = [...employees, saved];
				banner = { type: 'success', copy: 'Employee added.' };
			}
			closeDrawer();
		} catch (error) {
			banner = {
				type: 'error',
				copy: (error as Error).message || 'Unable to save employee.'
			};
		} finally {
			submitting = false;
			setTimeout(() => (banner = null), 4000);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Remove this employee record?')) return;

		try {
			const response = await fetch(`/api/employees/${id}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				throw new Error(await response.text());
			}
			employees = employees.filter((employee) => employee.id !== id);
			banner = { type: 'success', copy: 'Employee removed.' };
			setTimeout(() => (banner = null), 4000);
		} catch (error) {
			banner = {
				type: 'error',
				copy: (error as Error).message || 'Unable to delete employee.'
			};
		}
	}
</script>

<div class="mx-auto max-w-6xl px-4 pb-20 pt-10 lg:px-0">
	<header
		class="mb-8 space-y-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
	>
		<div class="flex flex-wrap items-center gap-3">
			<div
				class="rounded-full bg-slate-100/80 px-4 py-1 text-sm font-medium text-slate-600"
			>
				People Ops Workspace
			</div>
			<h1 class="text-2xl font-semibold text-slate-900">
				Employee roster
			</h1>
		</div>
		<p class="text-sm text-slate-500">
			Manage your team from anywhere. Search, sort, and update records
			without leaving the page. The form slides in on mobile so you never
			have to fight horizontal scrolling.
		</p>
		<div
			class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
		>
			<label class="relative flex-1">
				<Icon
					icon="lucide:search"
					class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
				/>
				<input
					class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-800 outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
					type="search"
					placeholder="Search by name, title, department, or location"
					bind:value={search}
				/>
			</label>
			<button
				type="button"
				class="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
				on:click={() => openDrawer()}
			>
				<Icon icon="lucide:plus" class="size-4" />
				New employee
			</button>
		</div>
		{#if banner}
			<div
				class={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
					banner.type === 'success'
						? 'bg-emerald-50 text-emerald-700'
						: 'bg-rose-50 text-rose-600'
				}`}
			>
				<Icon
					icon={banner.type === 'success'
						? 'lucide:check-circle'
						: 'lucide:alert-circle'}
					class="size-5 shrink-0"
				/>
				<span>{banner.copy}</span>
			</div>
		{/if}
	</header>

	<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
		<section
			class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:p-6"
		>
			<div class="hidden md:block">
				<table
					class="min-w-full border-separate border-spacing-y-2 text-left text-sm text-slate-700"
				>
					<thead
						class="text-xs uppercase tracking-wide text-slate-400"
					>
						<tr>
							{#each columns as column}
								<th class="px-3 py-2">
									<button
										type="button"
										class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
										on:click={() => handleSort(column.key)}
									>
										<span>{column.label}</span>
										{#if sortBy === column.key}
											<Icon
												icon={sortDir === 'asc'
													? 'lucide:arrow-up-narrow-wide'
													: 'lucide:arrow-down-wide-narrow'}
												class="size-4 text-slate-400"
											/>
										{/if}
									</button>
								</th>
							{/each}
							<th class="px-3 py-2 text-right text-slate-400"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody>
						{#if filteredEmployees.length === 0}
							<tr>
								<td
									colspan="7"
									class="px-3 py-8 text-center text-slate-400"
								>
									No employees match that search.
								</td>
							</tr>
						{:else}
							{#each filteredEmployees as employee}
								<tr
									class="rounded-2xl bg-slate-50/60 align-middle text-sm text-slate-700 shadow-sm"
								>
									<td
										class="rounded-l-2xl px-3 py-3 font-semibold text-slate-900"
										>{employee.name}</td
									>
									<td class="px-3 py-3">{employee.title}</td>
									<td class="px-3 py-3"
										>{employee.department}</td
									>
									<td class="px-3 py-3"
										>{employee.location}</td
									>
									<td class="px-3 py-3 tabular-nums"
										>{currency.format(employee.salary)}</td
									>
									<td class="px-3 py-3"
										>{friendlyDate.format(
											new Date(employee.hireDate)
										)}</td
									>
									<td class="rounded-r-2xl px-3 py-3">
										<div class="flex justify-end gap-2">
											<button
												type="button"
												class="rounded-full bg-white/80 p-2 text-slate-500 shadow hover:text-slate-900"
												on:click={() =>
													openDrawer(employee)}
											>
												<Icon
													icon="lucide:pen-square"
													class="size-4"
												/>
											</button>
											<button
												type="button"
												class="rounded-full bg-white/80 p-2 text-rose-500 shadow hover:bg-rose-50 hover:text-rose-600"
												on:click={() =>
													handleDelete(employee.id)}
											>
												<Icon
													icon="lucide:trash-2"
													class="size-4"
												/>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			<div class="space-y-4 md:hidden">
				{#if filteredEmployees.length === 0}
					<div
						class="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500"
					>
						No employees match that search.
					</div>
				{:else}
					{#each filteredEmployees as employee}
						<article
							class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
						>
							<div class="flex items-start justify-between gap-4">
								<div>
									<p
										class="text-base font-semibold text-slate-900"
									>
										{employee.name}
									</p>
									<p class="text-sm text-slate-500">
										{employee.title}
									</p>
								</div>
								<div class="flex gap-2">
									<button
										type="button"
										class="rounded-full bg-slate-100 p-2 text-slate-600"
										on:click={() => openDrawer(employee)}
									>
										<Icon
											icon="lucide:pen-square"
											class="size-4"
										/>
									</button>
									<button
										type="button"
										class="rounded-full bg-rose-50 p-2 text-rose-600"
										on:click={() =>
											handleDelete(employee.id)}
									>
										<Icon
											icon="lucide:trash-2"
											class="size-4"
										/>
									</button>
								</div>
							</div>
							<div
								class="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm text-slate-600"
							>
								<span class="font-medium text-slate-400"
									>Department</span
								>
								<span>{employee.department}</span>
								<span class="font-medium text-slate-400"
									>Location</span
								>
								<span>{employee.location}</span>
								<span class="font-medium text-slate-400"
									>Salary</span
								>
								<span class="tabular-nums"
									>{currency.format(employee.salary)}</span
								>
								<span class="font-medium text-slate-400"
									>Hire date</span
								>
								<span
									>{friendlyDate.format(
										new Date(employee.hireDate)
									)}</span
								>
							</div>
						</article>
					{/each}
				{/if}
			</div>
		</section>

		<section
			class={`lg:sticky lg:top-6 ${drawerOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'} fixed bottom-0 left-0 right-0 z-10 rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 lg:relative lg:rounded-3xl lg:shadow-sm`}
		>
			<div class="mx-auto max-w-lg space-y-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-slate-400">
							{editingId ? 'Edit employee' : 'Add new employee'}
						</p>
						<h2 class="text-xl font-semibold text-slate-900">
							{editingId ? 'Update record' : 'Create record'}
						</h2>
					</div>
					<button
						type="button"
						class="rounded-full bg-slate-100 p-2 text-slate-500 lg:hidden"
						on:click={closeDrawer}
						aria-label="Close form"
					>
						<Icon icon="lucide:x" class="size-5" />
					</button>
				</div>
				<form class="space-y-4" on:submit|preventDefault={handleSubmit}>
					<div class="grid gap-3">
						<label
							class="space-y-2 text-sm font-medium text-slate-600"
						>
							<span>Full name</span>
							<input
								class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
								type="text"
								placeholder="Jordan Lee"
								bind:value={form.name}
								required
							/>
						</label>
						<label
							class="space-y-2 text-sm font-medium text-slate-600"
						>
							<span>Title</span>
							<input
								class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
								type="text"
								placeholder="Product Manager"
								bind:value={form.title}
								required
							/>
						</label>
						<label
							class="space-y-2 text-sm font-medium text-slate-600"
						>
							<span>Department</span>
							<input
								class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
								type="text"
								placeholder="Operations"
								bind:value={form.department}
								required
							/>
						</label>
						<label
							class="space-y-2 text-sm font-medium text-slate-600"
						>
							<span>Location</span>
							<input
								class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
								type="text"
								placeholder="Remote - Berlin"
								bind:value={form.location}
								required
							/>
						</label>
						<div class="grid gap-3 sm:grid-cols-2">
							<label
								class="space-y-2 text-sm font-medium text-slate-600"
							>
								<span>Salary (USD)</span>
								<input
									class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
									type="number"
									min="0"
									step="1000"
									placeholder="120000"
									bind:value={form.salary}
									required
								/>
							</label>
							<label
								class="space-y-2 text-sm font-medium text-slate-600"
							>
								<span>Hire date</span>
								<input
									class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-hidden ring-slate-400 transition focus:bg-white focus:ring"
									type="date"
									bind:value={form.hireDate}
									required
								/>
							</label>
						</div>
					</div>
					<div class="flex flex-col gap-3 sm:flex-row">
						<button
							type="submit"
							class="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60"
							disabled={submitting}
						>
							<Icon
								icon={editingId ? 'lucide:save' : 'lucide:plus'}
								class="size-4"
							/>
							{editingId ? 'Save changes' : 'Add employee'}
						</button>
						<button
							type="button"
							class="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
							on:click={closeDrawer}
						>
							<Icon icon="lucide:rotate-ccw" class="size-4" />
							Clear
						</button>
					</div>
				</form>
			</div>
		</section>
	</div>
</div>
