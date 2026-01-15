

import axe from 'axe-core';

describe('StuffCard accessibility', () => {
  it('has no accessibility violations (static table)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = `
      <section class="stuffCard" aria-labelledby="stuff-card-title" role="region" data-testid="stuff">
        <header>
          <h3 id="stuff-card-title" class="sr-only">Shared Resources</h3>
        </header>
        <div>
          <table class="stuffTable" data-testid="stuffTable">
            <caption class="sr-only">Files and resources shared by Alice</caption>
            <tbody>
              <tr><td><img src="icon.svg" alt="File icon"></td><td>File.txt</td><td><a href="#">Download</a></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    `;
    const results = await axe.run(container);
    expect(results.violations.length).toBe(0);
  });
});
