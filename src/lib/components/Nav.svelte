<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
	import { Sun, Moon, Github, ArrowRight, ChevronDown, BookOpen, Shield, Lock, FileText } from 'lucide-svelte';

	let scrolled = $state(false);
	let docsOpen = $state(false);

	if (typeof window !== 'undefined') {
		window.addEventListener('scroll', () => {
			scrolled = window.scrollY > 20;
		});
	}

	const docsItems = [
		{ label: 'Developer Docs', href: '/docs/getting-started', Icon: BookOpen, desc: 'Guides, CLI reference, and API docs' },
		{ label: 'Security',       href: '/security',             Icon: Shield,   desc: 'Architecture, sandbox, and disclosure' },
		{ label: 'Privacy',        href: '/privacy',              Icon: Lock,     desc: 'What we collect and how we use it' },
		{ label: 'Terms',          href: '/terms',                Icon: FileText, desc: 'Terms of Service' },
	];
</script>

<nav class:scrolled>
	<div class="nav-inner">

		<!-- Logo -->
		<a href="/" class="logo-mark">
			<span class="logo-icon">
				<svg width="28" height="28" viewBox="0 0 28 28" fill="none">
					<circle cx="14" cy="14" r="13" stroke="var(--accent)" stroke-width="1.5"/>
					<circle cx="14" cy="14" r="5" fill="var(--accent)" opacity="0.9"/>
					<circle cx="14" cy="14" r="9" stroke="var(--accent)" stroke-width="0.75" stroke-dasharray="2 3"/>
				</svg>
			</span>
			<span class="logo-text">Run<span class="logo-accent">Owl</span></span>
		</a>

		<!-- Desktop links -->
		<div class="nav-links">
			<a href="#features" class="nav-link">Features</a>
			<a href="#how-it-works" class="nav-link">How it works</a>
			<a href="#pricing" class="nav-link">Pricing</a>

			<!-- Docs dropdown -->
			<div
				class="docs-trigger"
				role="navigation"
				onmouseenter={() => docsOpen = true}
				onmouseleave={() => docsOpen = false}
			>
				<button class="nav-link docs-btn" aria-haspopup="true" aria-expanded={docsOpen}>
					Docs
					<ChevronDown size={13} class={docsOpen ? 'chevron open' : 'chevron'} />
				</button>

				{#if docsOpen}
					<div class="dropdown" role="menu">
						{#each docsItems as item}
							<a href={item.href} class="dropdown-item" role="menuitem">
								<span class="dropdown-icon">
									<item.Icon size={15} />
								</span>
								<span class="dropdown-text">
									<span class="dropdown-label">{item.label}</span>
									<span class="dropdown-desc">{item.desc}</span>
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Actions -->
		<div class="nav-actions">
			<button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
				{#if $theme === 'dark'}
					<Sun size={15} />
				{:else}
					<Moon size={15} />
				{/if}
			</button>

			<a href="https://github.com/the-ai-project-co/RunOwl" class="btn-ghost" target="_blank">
				<Github size={15} />
				GitHub
			</a>

			<a href="#pricing" class="btn-primary">
				Get started
				<ArrowRight size={13} />
			</a>
		</div>
	</div>
</nav>

<style>
	nav {
		position: fixed; top: 0; left: 0; right: 0; z-index: 50;
		border-bottom: 1px solid transparent;
		transition: background 0.3s, border-color 0.3s;
	}
	nav.scrolled {
		background: rgba(10, 10, 15, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom-color: var(--border);
	}
	:global([data-theme='light']) nav.scrolled {
		background: rgba(250, 250, 250, 0.85);
	}

	.nav-inner {
		width: 100%; max-width: 80rem;
		margin-left: auto; margin-right: auto;
		padding: 0 1.5rem;
		height: 4rem;
		display: flex; align-items: center; justify-content: space-between;
	}

	.logo-mark {
		display: flex; align-items: center; gap: 0.5rem;
		text-decoration: none;
	}
	.logo-text {
		font-weight: 700; letter-spacing: -0.02em;
		font-size: 1.1rem; color: var(--text);
	}
	.logo-accent { color: var(--accent); }

	.nav-links {
		display: flex; align-items: center; gap: 2rem;
		font-size: 0.875rem;
	}
	@media (max-width: 768px) { .nav-links { display: none; } }

	.nav-link {
		color: var(--muted); text-decoration: none;
		transition: color 0.2s;
	}
	.nav-link:hover { color: var(--text); }

	/* Docs dropdown trigger */
	.docs-trigger {
		position: relative;
	}

	.docs-btn {
		display: inline-flex; align-items: center; gap: 0.3rem;
		background: none; border: none; padding: 0;
		font-size: 0.875rem; cursor: pointer;
	}

	:global(.chevron) {
		color: var(--muted);
		transition: transform 0.2s;
	}
	:global(.chevron.open) {
		transform: rotate(180deg);
	}

	/* Dropdown panel */
	.dropdown {
		position: absolute; top: calc(100% + 0.75rem); left: 50%;
		transform: translateX(-50%);
		width: 16rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.4rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		z-index: 100;
	}

	/* Arrow pointer */
	.dropdown::before {
		content: '';
		position: absolute; top: -6px; left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 10px; height: 10px;
		background: var(--surface);
		border-left: 1px solid var(--border);
		border-top: 1px solid var(--border);
	}

	.dropdown-item {
		display: flex; align-items: flex-start; gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: 8px;
		text-decoration: none;
		transition: background 0.15s;
	}
	.dropdown-item:hover { background: var(--surface-2); }

	.dropdown-icon {
		flex-shrink: 0;
		width: 28px; height: 28px;
		border-radius: 7px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		display: flex; align-items: center; justify-content: center;
		color: var(--accent);
		margin-top: 1px;
	}

	.dropdown-text {
		display: flex; flex-direction: column; gap: 0.15rem;
	}

	.dropdown-label {
		font-size: 0.85rem; font-weight: 600; color: var(--text);
	}

	.dropdown-desc {
		font-size: 0.75rem; color: var(--muted); line-height: 1.4;
	}

	/* Actions */
	.nav-actions {
		display: flex; align-items: center; gap: 0.75rem;
	}

	.theme-toggle {
		display: flex; align-items: center; justify-content: center;
		width: 32px; height: 32px; border-radius: 8px;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted);
		cursor: pointer;
		transition: all 0.2s;
	}
	.theme-toggle:hover { color: var(--text); border-color: var(--accent); }

	.btn-ghost {
		display: flex; align-items: center; gap: 0.5rem;
		color: var(--muted); text-decoration: none;
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		border: 1px solid var(--border);
		transition: all 0.2s;
	}
	.btn-ghost:hover { color: var(--text); border-color: var(--muted); }
	@media (max-width: 768px) { .btn-ghost { display: none; } }

	.btn-primary {
		display: flex; align-items: center; gap: 0.375rem;
		background: var(--accent);
		color: #fff; text-decoration: none;
		padding: 0.45rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		transition: opacity 0.2s, transform 0.2s;
	}
	.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
