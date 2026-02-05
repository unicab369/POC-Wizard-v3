<script lang="ts">
	import { actionsStore, pageStore, hoursStore } from '$lib/actions-store.svelte';
	import ActionGrid from '$lib/components/ActionGrid.svelte';

	let columns = $state(4);

	function formatTime(t: string): string {
		if (!t) return '';
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hr = h % 12 || 12;
		return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
	}
</script>

<h1>{pageStore.title}</h1>
<p>{pageStore.description}</p>

<div class="section-header">
	<span class="section-label">Quick Actions</span>
</div>

<ActionGrid items={actionsStore.items} {columns} />

<div class="section-header">
	<span class="section-label">Business Hours</span>
</div>

<ul class="hours-list">
	{#each hoursStore.items as day}
		<li class="hours-row">
			<span class="hours-day">{day.day}</span>
			<span class="hours-time" class:closed={day.closed}>
				{day.closed ? 'Closed' : `${formatTime(day.open)} – ${formatTime(day.close)}`}
			</span>
		</li>
	{/each}
</ul>

<style>
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}

	.section-label {
		font-weight: 600;
		font-size: 1rem;
	}

	.hours-list {
		list-style: none;
		padding: 0;
		margin: 0;
		max-width: 500px;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
		font-size: 0.9rem;
	}

	.hours-row:last-child { border-bottom: none; }

	.hours-day {
		font-weight: 500;
		color: #333;
	}

	.hours-time {
		color: #555;
	}

	.hours-time.closed {
		color: #e74c3c;
		font-weight: 500;
	}
</style>
