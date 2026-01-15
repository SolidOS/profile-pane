// This script runs axe-core on a static HTML snippet and prints the violations.
import { JSDOM } from 'jsdom'
import axe from 'axe-core';

(async () => {
  const dom = new JSDOM(`
    <section class="stuffCard" aria-labelledby="stuff-card-title" role="region" data-testid="stuff">
      <header>
        <h3 id="stuff-card-title" class="sr-only">Shared Resources</h3>
      </header>
      <div role="table" aria-label="List of shared files and resources">
        <table class="stuffTable" data-testid="stuffTable">
          <caption class="sr-only">Files and resources shared by Alice</caption>
          <tbody>
            <tr><td><img src="icon.svg" alt="File icon"></td><td>File.txt</td><td><a href="#">Download</a></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `, { runScripts: 'dangerously', resources: 'usable' });

  // Axe expects a global window and document
  (global as any).window = dom.window;
  (global as any).document = dom.window.document

  // Inject axe-core into the DOM
  const script = dom.window.document.createElement('script')
  script.textContent = axe.source
  dom.window.document.body.appendChild(script)

  // Wait for axe to be available
  await new Promise(resolve => setTimeout(resolve, 100))

  // Run axe
  const results = await axe.run(dom.window.document.body)
   
  console.log(JSON.stringify(results.violations, null, 2))
})()
