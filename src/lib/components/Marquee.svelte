<script lang="ts">
	import {
		siPython,
		siTypescript,
		siJavascript,
		siGo,
		siRust,
		siRuby,
		siPhp,
		siKotlin,
		siSwift,
		siReact,
		siDjango,
		siFastapi,
		siNextdotjs,
		siNodedotjs,
		siRubyonrails,
		siCplusplus,
	} from 'simple-icons';

	const items = [
		{ name: 'Python', icon: siPython, color: '#3776AB' },
		{ name: 'TypeScript', icon: siTypescript, color: '#3178C6' },
		{ name: 'JavaScript', icon: siJavascript, color: '#F7DF1E' },
		{ name: 'Go', icon: siGo, color: '#00ADD8' },
		{ name: 'Rust', icon: siRust, color: '#CE422B' },
		{ name: 'Ruby', icon: siRuby, color: '#CC342D' },
		{ name: 'PHP', icon: siPhp, color: '#777BB4' },
		{ name: 'Kotlin', icon: siKotlin, color: '#7F52FF' },
		{ name: 'Swift', icon: siSwift, color: '#F05138' },
		{ name: 'React', icon: siReact, color: '#61DAFB' },
		{ name: 'Django', icon: siDjango, color: '#0C4B33' },
		{ name: 'FastAPI', icon: siFastapi, color: '#009688' },
		{ name: 'Next.js', icon: siNextdotjs, color: 'var(--text)' },
		{ name: 'Node.js', icon: siNodedotjs, color: '#5FA04E' },
		{ name: 'Rails', icon: siRubyonrails, color: '#D30001' },
		{ name: 'C++', icon: siCplusplus, color: '#00599C' },
	];

	const doubled = [...items, ...items];
</script>

<div class="marquee-wrapper" aria-hidden="true">
	<div class="marquee-fade-left"></div>
	<div class="marquee-fade-right"></div>
	<div class="marquee-track">
		<div class="animate-marquee">
			{#each doubled as item}
				<div class="marquee-item">
					<svg
						viewBox="0 0 24 24"
						width="15"
						height="15"
						fill={item.color}
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d={item.icon.path} />
					</svg>
					<span class="item-name">{item.name}</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="marquee-label">Works with every language and framework your team uses</div>

<style>
	.marquee-wrapper {
		position: relative;
		overflow: hidden;
		padding: 1.5rem 0;
		border-top: 1px solid var(--border);
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.marquee-fade-left,
	.marquee-fade-right {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 120px;
		z-index: 2;
		pointer-events: none;
	}
	.marquee-fade-left {
		left: 0;
		background: linear-gradient(90deg, var(--surface), transparent);
	}
	.marquee-fade-right {
		right: 0;
		background: linear-gradient(-90deg, var(--surface), transparent);
	}

	.marquee-track {
		overflow: hidden;
	}

	.marquee-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 1.5rem;
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
		border-right: 1px solid var(--border);
		transition: color 0.2s;
	}
	.marquee-item:hover {
		color: var(--text);
	}

	.marquee-label {
		text-align: center;
		color: var(--muted);
		font-size: 0.82rem;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}
</style>
