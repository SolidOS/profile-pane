// This script runs axe-core on a static ProfileCard-like HTML snippet and prints the violations for debugging.
import { JSDOM } from 'jsdom'
import axe from 'axe-core';

(async () => {
	const dom = new JSDOM(`
		<article class="profileCard" role="main" aria-labelledby="profile-name">
			<h2 id="profile-name" class="sr-only">Jane Doe</h2>
			<header class="header" aria-label="Profile information">
				<img class="image" src="https://janedoe.example/profile/me.jpg" alt="Profile photo of Jane Doe" width="160" height="160" loading="eager" />
			</header>
			<section class="intro" aria-label="About">
				<div class="details" role="text" aria-label="About: Test Double at Solid Community">Test Double at Solid Community</div>
				<div class="details" role="text" aria-label="Location: Hamburg, Germany">🌐 Hamburg, Germany</div>
				<div class="details" role="text" aria-label="Pronouns: their/they/them">their/they/them</div>
			</section>
			<section class="buttonSection" aria-label="Actions" role="complementary">
				<div class="center"><section class="buttonSubSection" aria-labelledby="add-me-to-your-friends-button-section" role="region" data-testid="button"><button class="actionButton">ADD ME TO YOUR FRIENDS</button></section></div>
			</section>
			<aside class="qrCodeSection" aria-label="Contact QR Code" role="complementary">
				<div>QR code here</div>
			</aside>
		</article>
	`, { runScripts: 'dangerously', resources: 'usable' });

	(global as any).window = dom.window;
	(global as any).document = dom.window.document

	const script = dom.window.document.createElement('script')
	script.textContent = axe.source
	dom.window.document.body.appendChild(script)

	await new Promise(resolve => setTimeout(resolve, 100))

	const results = await axe.run(dom.window.document.body)
	 
	console.log(JSON.stringify(results.violations, null, 2))
})()
