/**
 * Global PR-load modal state.
 * Import `prModal` anywhere in the app to open/close or pre-fill the modal.
 */

function createPRModal() {
	let open = $state(false);
	let prefill = $state('');

	return {
		get open() {
			return open;
		},
		get prefill() {
			return prefill;
		},
		show(url = '') {
			prefill = url;
			open = true;
		},
		hide() {
			open = false;
			prefill = '';
		},
	};
}

export const prModal = createPRModal();
