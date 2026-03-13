import { githubIntegration } from './github-integration.svelte';

function createPrivateRepoModal() {
	let open = $state(false);
	let repoFullName = $state('');
	let onConnectedCallback = $state<(() => void) | null>(null);

	return {
		get open() { return open; },
		get repoFullName() { return repoFullName; },

		show(repo: string, onConnected?: () => void) {
			repoFullName = repo;
			onConnectedCallback = onConnected ?? null;
			githubIntegration.startConnect();
			open = true;
		},

		hide() {
			open = false;
			repoFullName = '';
			onConnectedCallback = null;
			githubIntegration.reset();
		},

		fireConnected() {
			onConnectedCallback?.();
		},
	};
}

export const privateRepoModal = createPrivateRepoModal();
