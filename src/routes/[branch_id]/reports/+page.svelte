<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import { branchStore, formatCurrency, purchasesStore } from '$lib/actions-store.svelte';
	import { getBranchInfo } from '$lib/test-data/branch-data';

	Chart.register(...registerables);

	interface PurchaseItem {
		id: number;
		name: string;
		qty: number;
		price: number;
	}

	interface Purchase {
		items: PurchaseItem[];
		total: number;
		date: string;
		status: string;
	}

	const purchases = $derived<Purchase[]>(purchasesStore.items as Purchase[]);
	const branchInfo = $derived(getBranchInfo(branchStore.id));

	// Date range selection
	type DateRange = '1d' | '7d' | '30d' | '3m' | '1y';
	let dateRange = $state<DateRange>('30d');

	const dateRangeOptions: { value: DateRange; label: string }[] = [
		{ value: '1d', label: '1 day' },
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '3m', label: '3 months' },
		{ value: '1y', label: '1 year' }
	];


	// Parse date string "2/7/2026, 12:30:00 PM" into Date object
	function parseDate(dateStr: string): Date {
		const [datePart, timePart] = dateStr.split(', ');
		const [month, day, year] = datePart.split('/').map(Number);

		let [time, period] = timePart.split(' ');
		let [hours, minutes, seconds] = time.split(':').map(Number);

		if (period === 'PM' && hours !== 12) hours += 12;
		if (period === 'AM' && hours === 12) hours = 0;

		return new Date(year, month - 1, day, hours, minutes, seconds);
	}

	// Get start date based on range
	function getStartDate(range: DateRange): Date {
		const now = new Date();
		switch (range) {
			case '1d':
				return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
			case '7d':
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case '30d':
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			case '3m':
				return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
			case '1y':
				return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
		}
	}

	// Filter purchases by date range (exclude cancelled)
	const filteredPurchases = $derived.by(() => {
		const startDate = getStartDate(dateRange);
		return purchases.filter(p => {
			if (p.status === 'cancelled') return false;
			const purchaseDate = parseDate(p.date);
			return purchaseDate >= startDate;
		});
	});

	// KPIs based on filtered data
	const totalRevenue = $derived(filteredPurchases.reduce((sum, p) => sum + p.total, 0));
	const orderCount = $derived(filteredPurchases.length);
	const avgOrderValue = $derived(orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0);

	// Completion rate uses all purchases in range (including cancelled)
	const allPurchasesInRange = $derived.by(() => {
		const startDate = getStartDate(dateRange);
		return purchases.filter(p => {
			const purchaseDate = parseDate(p.date);
			return purchaseDate >= startDate;
		});
	});
	const completionRate = $derived(
		allPurchasesInRange.length > 0
			? Math.round((filteredPurchases.length / allPurchasesInRange.length) * 100)
			: 0
	);

	// Aggregation functions
	function getHourlyData(): { labels: string[]; data: number[] } {
		const hourlyTotals: Record<number, number> = {};

		for (let i = 0; i < 24; i++) {
			hourlyTotals[i] = 0;
		}

		for (const purchase of filteredPurchases) {
			const date = parseDate(purchase.date);
			const hour = date.getHours();
			hourlyTotals[hour] += purchase.total;
		}

		const labels = Object.keys(hourlyTotals).map(h => {
			const hour = parseInt(h);
			if (hour === 0) return '12 AM';
			if (hour === 12) return '12 PM';
			return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
		});

		return {
			labels,
			data: Object.values(hourlyTotals)
		};
	}

	function getDailyData(): { labels: string[]; data: number[] } {
		const dailyTotals: Record<string, number> = {};

		for (const purchase of filteredPurchases) {
			const datePart = purchase.date.split(',')[0];
			if (!dailyTotals[datePart]) {
				dailyTotals[datePart] = 0;
			}
			dailyTotals[datePart] += purchase.total;
		}

		// Sort by date
		const sortedDates = Object.keys(dailyTotals).sort((a, b) => {
			const [am, ad, ay] = a.split('/').map(Number);
			const [bm, bd, by] = b.split('/').map(Number);
			return new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime();
		});

		return {
			labels: sortedDates,
			data: sortedDates.map(d => dailyTotals[d])
		};
	}

	// Chart
	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const chartData = $derived(dateRange === '1d' ? getHourlyData() : getDailyData());

	$effect(() => {
		if (!canvas) return;

		// Destroy existing chart
		if (chart) {
			chart.destroy();
			chart = null;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const data = chartData;

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: data.labels,
				datasets: [{
					label: 'Revenue',
					data: data.data,
					backgroundColor: 'rgba(108, 99, 255, 0.1)',
					borderColor: '#6c63ff',
					borderWidth: 2,
					fill: true,
					tension: 0.3,
					pointBackgroundColor: '#6c63ff',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					pointRadius: 4
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								return formatCurrency(context.raw as number);
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => formatCurrency(value as number)
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					},
					x: {
						grid: {
							display: false
						}
					}
				}
			}
		});

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<h1>Reports</h1>
<p class="subtitle">Sales analytics for {branchInfo.name}</p>

<div class="controls">
	<select class="date-select" bind:value={dateRange}>
		{#each dateRangeOptions as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>

<div class="kpi-row">
	<div class="kpi-card">
		<span class="kpi-label">Total Revenue</span>
		<span class="kpi-value">{formatCurrency(totalRevenue)}</span>
	</div>
	<div class="kpi-card">
		<span class="kpi-label">Orders</span>
		<span class="kpi-value">{orderCount}</span>
	</div>
	<div class="kpi-card">
		<span class="kpi-label">Avg Order</span>
		<span class="kpi-value">{formatCurrency(avgOrderValue)}</span>
	</div>
	<div class="kpi-card">
		<span class="kpi-label">Completion</span>
		<span class="kpi-value">{completionRate}%</span>
	</div>
</div>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	h1 {
		margin: 1.25rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.subtitle {
		color: #888;
		font-size: 0.9rem;
		margin: 0.25rem 0 1rem;
	}

	.controls {
		margin-bottom: 1rem;
	}

	.date-select {
		width: 100%;
		padding: 0.6rem 0.75rem;
		font-family: inherit;
		font-size: 0.9rem;
		border: 1px solid #e8e8e8;
		border-radius: 8px;
		background: #fff;
		color: #333;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		padding-right: 2rem;
	}

	.date-select:focus {
		outline: none;
		border-color: #6c63ff;
	}

	.kpi-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.kpi-card {
		flex: 1;
		min-width: 70px;
		padding: 0.75rem;
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	@media (max-width: 480px) {
		.kpi-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
		}

		.kpi-card {
			min-width: unset;
		}
	}

	.kpi-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.kpi-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: #6c63ff;
	}

	.chart-container {
		background: #fff;
		border: 1px solid #e8e8e8;
		border-radius: 10px;
		padding: 1rem;
		height: 300px;
	}
</style>
