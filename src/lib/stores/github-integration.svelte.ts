export interface GitHubAccount {
	login: string;
	avatarUrl: string;
	name: string | null;
	type: 'user' | 'org';
}

export interface ConnectedRepo {
	id: string; // "owner/repo"
	fullName: string;
	private: boolean;
	addedAt: string;
}

export type ConnectionMethod = 'github_app' | 'pat';

export type ConnectStep = 'idle' | 'selecting_method' | 'oauth_pending' | 'select_repos' | 'pat_entry' | 'done';

// Mock repos shown during the select_repos step
export const MOCK_AVAILABLE_REPOS: ConnectedRepo[] = [
	{ id: 'acme/private-api', fullName: 'acme/private-api', private: true, addedAt: '' },
	{ id: 'acme/backend-core', fullName: 'acme/backend-core', private: true, addedAt: '' },
	{ id: 'acme/web-client', fullName: 'acme/web-client', private: true, addedAt: '' },
	{ id: 'acme/infra', fullName: 'acme/infra', private: true, addedAt: '' },
	{ id: 'arayavatsal/dotfiles', fullName: 'arayavatsal/dotfiles', private: true, addedAt: '' },
	{ id: 'arayavatsal/notes', fullName: 'arayavatsal/notes', private: true, addedAt: '' },
];

const STORAGE_KEY = 'runowl_gh_integration';

function loadPersisted(): { connected: boolean; account: GitHubAccount | null; method: ConnectionMethod | null; repos: ConnectedRepo[] } {
	const defaults = { connected: false, account: null, method: null, repos: [] };
	if (typeof localStorage === 'undefined') return defaults;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
	} catch {
		return defaults;
	}
}

function createGitHubIntegration() {
	const persisted = loadPersisted();

	let connected = $state(persisted.connected);
	let account = $state<GitHubAccount | null>(persisted.account);
	let method = $state<ConnectionMethod | null>(persisted.method);
	let repos = $state<ConnectedRepo[]>(persisted.repos);
	let orgInstallationStatus = $state<'none' | 'partial' | 'full'>('partial');
	let step = $state<ConnectStep>('idle');
	let patValue = $state('');
	let patError = $state('');

	function persist() {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected, account, method, repos }));
	}

	return {
		get connected() { return connected; },
		get account() { return account; },
		get method() { return method; },
		get repos() { return repos; },
		get orgInstallationStatus() { return orgInstallationStatus; },
		get step() { return step; },
		get patValue() { return patValue; },
		get patError() { return patError; },
		set patValue(v: string) { patValue = v; patError = ''; },

		startConnect() {
			step = 'selecting_method';
		},

		async selectMethod(m: ConnectionMethod) {
			method = m;
			if (m === 'github_app') {
				step = 'oauth_pending';
				await new Promise((r) => setTimeout(r, 1200));
				account = {
					login: 'arayavatsal',
					name: 'Araya Vatsal',
					avatarUrl: 'https://github.com/github.png',
					type: 'user',
				};
				step = 'select_repos';
			} else {
				step = 'pat_entry';
			}
		},

		async submitPAT(token: string) {
			if (!token.trim()) { patError = 'Token is required.'; return; }
			if (token.length < 10) { patError = 'Token looks too short. Check and try again.'; return; }
			patError = '';
			step = 'oauth_pending';
			await new Promise((r) => setTimeout(r, 800));
			account = {
				login: 'arayavatsal',
				name: 'Araya Vatsal',
				avatarUrl: 'https://github.com/github.png',
				type: 'user',
			};
			// PAT grants access to all repos — pre-populate a selection
			repos = MOCK_AVAILABLE_REPOS.map((r) => ({ ...r, addedAt: new Date().toISOString() }));
			connected = true;
			persist();
			step = 'done';
		},

		confirmRepoSelection(selected: string[]) {
			const now = new Date().toISOString();
			// Merge with existing, deduplicate
			const newRepos = MOCK_AVAILABLE_REPOS.filter((r) => selected.includes(r.id)).map((r) => ({ ...r, addedAt: now }));
			const merged = [...repos];
			for (const r of newRepos) {
				if (!merged.find((x) => x.id === r.id)) merged.push(r);
			}
			repos = merged;
			connected = true;
			persist();
			step = 'done';
		},

		addRepo(repo: ConnectedRepo) {
			if (!repos.find((r) => r.id === repo.id)) {
				repos = [...repos, { ...repo, addedAt: new Date().toISOString() }];
				persist();
			}
		},

		removeRepo(id: string) {
			repos = repos.filter((r) => r.id !== id);
			persist();
		},

		markRepoAccess(repoFullName: string) {
			if (!repos.find((r) => r.id === repoFullName)) {
				repos = [...repos, { id: repoFullName, fullName: repoFullName, private: true, addedAt: new Date().toISOString() }];
				persist();
			}
		},

		disconnect() {
			connected = false;
			account = null;
			method = null;
			repos = [];
			step = 'idle';
			patValue = '';
			patError = '';
			if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
		},

		reset() {
			step = 'idle';
			patValue = '';
			patError = '';
		},
	};
}

export const githubIntegration = createGitHubIntegration();
