<script lang="ts">
	let {
		direction = 'horizontal',
		panel = '',
	}: { direction?: 'horizontal' | 'vertical'; panel?: string } = $props();

	let dragging = $state(false);
	let startPos = 0;
	let el = $state<HTMLDivElement | null>(null);

	function onMouseDown(e: MouseEvent) {
		e.preventDefault();
		dragging = true;
		startPos = direction === 'horizontal' ? e.clientX : e.clientY;

		const onMove = (ev: MouseEvent) => {
			const current = direction === 'horizontal' ? ev.clientX : ev.clientY;
			const delta = current - startPos;
			startPos = current;
			el?.dispatchEvent(new CustomEvent('panel-resize', {
				detail: { delta, direction, panel },
				bubbles: true,
			}));
		};

		const onUp = () => {
			dragging = false;
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={el}
	class="resizer {direction}"
	class:dragging
	role="separator"
	aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
	tabindex="0"
	onmousedown={onMouseDown}
></div>

<style>
	.resizer {
		flex-shrink: 0;
		background: var(--border);
		transition: background 0.15s;
		position: relative;
		z-index: 10;
	}
	.resizer:hover, .resizer.dragging { background: var(--accent); }

	.resizer.horizontal {
		width: 4px;
		cursor: col-resize;
	}
	.resizer.vertical {
		height: 4px;
		cursor: row-resize;
		width: 100%;
	}

	@media (max-width: 768px) {
		.resizer { display: none; }
	}
</style>
