<script lang="ts">
	import Nav from '$lib/components/Nav.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Marquee from '$lib/components/Marquee.svelte';
	import Features from '$lib/components/Features.svelte';
	import HowItWorks from '$lib/components/HowItWorks.svelte';
	import QADemo from '$lib/components/QADemo.svelte';
	import GitHubIntegration from '$lib/components/GitHubIntegration.svelte';
	import Feedback from '$lib/components/Feedback.svelte';
	import CTA from '$lib/components/CTA.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<Nav />
<main>
	<Hero />
	<Marquee />
	<Features />
	<HowItWorks />
	<QADemo />
	<GitHubIntegration />
	<Feedback />
	<CTA />
</main>
<Footer />
