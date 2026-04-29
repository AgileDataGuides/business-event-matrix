<div class="instructions">
	<h2>Business Event Matrix</h2>
	<p>Map your core business events across domains and concepts to understand the business landscape of your organisation.</p>

	<div class="options">
		<section class="option-card">
			<h3>Quick Start: Explore the Examples</h3>
			<p>The app ships with <strong>three example matrices</strong> to learn from. Switch between them via the matrix dropdown in the dark app header.</p>
			<ul>
				<li><strong>Ice Cream Shop</strong> — a small example covering the basics of orders, payments, returns, and store operations. Good first stop.</li>
				<li><strong>Lawrence Corr BEAM</strong> — Lawrence Corr's reference BEAM matrix. Broader domain set (Finance, Manufacturing, Marketing, Product Development, Sales) for seeing how a business spans the full process, following the BEAM patterns.</li>
				<li><strong>SaaS Revenue Events Matrix</strong> —  SaaS customer funnel from ad-click through renewal / cancellation, mapped across all seven W-types including, following the Agile Data Guides patterns.</li>
			</ul>
			<ol>
				<li>Browse the matrix — events are rows, domains + concepts are columns. Domains sit on the left, then concepts grouped by W-type (Who / What / When / Where / Why / How / How Many).</li>
				<li>Hover any event, domain, or concept name for a tooltip with its description + Aristotelian definition. Click <strong>Edit details</strong> in the tooltip to open the full editor.</li>
				<li>Cells cycle through three states on click — empty → ✓ (event involves the concept) → ✭ (the <em>driving</em> concept for the event) → empty. Each event should have exactly one ✭ — events that don't get an amber warning indicator (!) in their concept count.</li>
				<li>Use the <strong>Event search</strong> /<strong>Domain search</strong> / <strong>Concept search</strong> inputs to narrow the matrix, and flip the <strong>Hide unmarked</strong> toggle to drop empty rows / columns from view.</li>
				<li>Open <strong>Claude Code</strong> in this project directory and ask questions like:</li>
			</ol>
			<ul class="examples">
				<li>"What business events does my matrix capture?"</li>
				<li>"Which domains have the most events?"</li>
				<li>"Are there any concepts that aren't linked to any events?"</li>
				<li>"Suggest additional events I might be missing"</li>
				<li>"How would this matrix change if we added a new domain?"</li>
				<li>"Compare the Ice Cream Shop matrix to the SaaS Revenue one — what patterns are common?"</li>
			</ul>
		</section>

		<section class="option-card">
			<h3>Build Your Own Business Event Matrix</h3>
			<p>Create a new matrix, add events, domains, and concepts, then use Claude to review and improve it.</p>
			<ol>
				<li>Click <strong>New Matrix</strong> in the dark header to create a blank model.</li>
				<li>Use the inline <strong>+ Event</strong>, <strong>+ Domain</strong>, and <strong>+ Concept</strong> toolbar buttons. Each one opens a create input — start typing and hit Enter to create a new one. </li>
				<li>Single-click any event, domain, or concept name to <strong>select</strong> it. Double-click to <strong>rename inline</strong>. Hover for the detail tooltip, then click <strong>Edit details</strong> to open the full edit modal (description, aliases, Aristotelian definition, notes, W-type, domain owner).</li>
				<li>Click intersection cells to mark events ↔ concepts. Click again to toggle ✓ → ✭ → empty.</li>
				<li>Drag the ⠿ handles to reorder events, domains, and concepts. Click a domain header (◂) or W-type header (◂) to collapse / expand its column group.</li>
				<li>Delete a domain, concept, or event by opening it in the edit modal and clicking <strong>Delete</strong> (red, on the left of the modal footer). Confirms before removing.</li>
				<li>Click <strong>Save</strong> in the toolbar to persist your matrix. Use the export buttons to download. Then ask Claude:</li>
			</ol>
			<ul class="examples">
				<li>"Walk me through my matrix — does it cover the full business process?"</li>
				<li>"Are there any gaps in my event coverage?"</li>
				<li>"Suggest concepts I might be missing based on my events"</li>
				<li>"Which events should trigger data quality checks?"</li>
				<li>"Help me define the concepts — what's a good Aristotelian definition for each?"</li>
				<li>"Can you identify the core business processes from my events?"</li>
				<li>"Draft an Information Product Canvas based on this matrix"</li>
				<li>"Suggest a data dictionary structure for the concepts in my matrix"</li>
				<li>"What domain boundaries does this matrix suggest?"</li>
				<li>"Which events are missing a driving Concept (the ✭ marker)?"</li>
			</ul>
		</section>

		<section class="option-card chat-card">
			<h3>No Claude Code? Use Claude Chat Instead</h3>
			<p>Export your matrix as JSON and upload it directly to <a href="https://claude.ai" target="_blank" rel="noopener">claude.ai</a>.</p>
			<ol>
				<li>Build your matrix and click <strong>Export JSON</strong> to download.</li>
				<li>Open <a href="https://claude.ai" target="_blank" rel="noopener">claude.ai</a> and start a new conversation.</li>
				<li>Attach the JSON file using the paperclip icon, then ask your questions.</li>
			</ol>
			<ul class="examples">
				<li>"Here's my Business Event Matrix — does it cover the key processes?"</li>
				<li>"Which concepts appear most frequently and what does that tell us?"</li>
				<li>"Suggest how I could refine the domain boundaries"</li>
				<li>"What data products could I build from this matrix?"</li>
				<li>"Help me spot any gaps or overlaps in my event coverage"</li>
			</ul>
		</section>

		<section class="option-card">
			<h3>Managing the Matrix</h3>
			<p>Switch between models, import / export, and generate reports.</p>

			<h4>Switching Matrix</h4>
			<ul>
				<li>Click the matrix name in the dark header to open the dropdown of all saved matrices, then pick one. The selection is remembered across reloads via local storage.</li>
				<li><strong>New Matrix</strong> creates a blank model alongside the existing ones.</li>
				<li><strong>Import</strong> loads a JSON file as a NEW matrix (never overwrites the current one). Auto-detects native BEM JSON and Context Plane graph format (<code>&#123; nodes, links &#125;</code>).</li>
				<li><strong>Delete</strong> (red, in the dark header) removes the current matrix. The next saved matrix loads automatically.</li>
			</ul>

			<h4>Saving &amp; Exporting</h4>
			<ul>
				<li><strong>Save</strong> — writes the matrix JSON to <code>data/</code> so Claude can access it directly. The button shows <em>Saved</em> when nothing is dirty, <em>Save</em> when there are unsaved changes.</li>
				<li><strong>Export JSON</strong> — downloads the matrix to share or re-import. Field shape uses <code>concepts</code> (with legacy <code>dimensions</code> still accepted on import).</li>
				<li><strong>Export PDF</strong> — generates a PDF report of the matrix with domain-grouped columns.</li>
				<li><strong>Export CSV</strong> — flat CSV of events and their domain / concept mappings.</li>
				<li><strong>Export Excel</strong> — XLSX workbook of the matrix.</li>
			</ul>

			<h4>Matrix Sections</h4>
			<ul>
				<li><strong>Events</strong> — the Core Business Events that create, update, or transform data.</li>
				<li><strong>Domains</strong> — the Business Domains that Events belong to. Each Domain has a name, description, aliases, owner, and notes. Domains sort alphabetically by default and can be collapsed via the <strong>DOMAINS ◂</strong> header.</li>
				<li><strong>Concepts</strong> — the Core Business Concepts involved in Events, grouped by W-type: <strong>Who · What · When · Where · Why · How · How Many</strong>. Each Concept has a name, description, aliases, optional Aristotelian definition, notes, and a W-type. Each W-group can be collapsed via its header.</li>
			</ul>

			<h4>Matrix Interactions</h4>
			<ul>
				<li><strong>Cell click</strong> cycles three states: empty → ✓ (Event involves the Concept) → ✭ (the driving Concept) → empty. Each Event should declare exactly one ✭; Events without a driving Concept show an amber warning (!).</li>
				<li><strong>Single-click</strong> a row or column header name to select it (visual highlight). <strong>Double-click</strong> to rename inline.</li>
				<li><strong>Hover</strong> any Event, Domain, or Concept name to see its tooltip — definition, aliases, owner (domains), notes — with an <strong>Edit details</strong> link to open the full editor modal.</li>
				<li><strong>Drag</strong> the ⠿ handles to reorder Events / Domains / Concepts.</li>
				<li><strong>Collapse</strong> a domain group or W-type group by clicking its header (◂).</li>
				<li><strong>Domain search</strong> and <strong>Concept search</strong> inputs above the matrix narrow visible columns by name. Search any combination — they filter independently.</li>
				<li><strong>Hide unmarked</strong> pill toggle (right of the search inputs) hides any row or column with no ✓/✭ in the currently visible matrix. Uses <strong>AND-semantics</strong> across active filters: searching for a concept and toggling Hide unmarked drops events that don't tick that concept <em>and</em> domains that aren't ticked by any of those events. Toggle off to see the full universe again.</li>
				<li><strong>Delete</strong> a Domain / Concept / Event from the edit modal's Delete button (with confirmation).</li>
			</ul>
		</section>

		<section class="option-card security-card">
			<h3>Security Notice</h3>
			<p><strong>This app is designed to run locally on your own machine.</strong> Do not expose it to the internet or deploy it on a public server. The Save feature writes files directly to your filesystem. There is no user authentication, so anyone who can reach the server can read and overwrite your data.</p>
			<p>If you need to share your work, use the <strong>Export</strong> buttons to download files and share them manually.</p>
		</section>

		<section class="option-card data-storage-card">
			<h3>Data Storage</h3>
			<p><strong>Save</strong> writes files to the <code>data/</code> folder as JSON. This only works in dev mode (<code>npm run dev</code>) where the server can write to disk. Claude can then read these files directly.</p>
			<p><strong>Export</strong> downloads files to your browser's downloads folder for sharing or backup.</p>
		</section>
	</div>

	<section class="footer-section">
		<p>Code: <strong>MIT</strong> · Docs: <strong>CC BY-SA 4.0</strong> by AgileDataGuides. Free to share and adapt for any purpose with attribution.</p>
	</section>
</div>

<style>
	.instructions {
		max-width: 900px;
		line-height: 1.6;
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.instructions > p {
		font-size: 0.875rem;
		color: var(--color-text-muted, #64748b);
		margin-bottom: 1.25rem;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.option-card {
		padding: 1rem 1.25rem;
		background: var(--color-surface, #ffffff);
		border-radius: 8px;
		border: 1px solid var(--color-border, #e2e8f0);
	}

	.option-card h3 {
		font-size: 1rem;
		margin: 0 0 0.375rem 0;
		padding: 0;
		border: none;
	}

	.option-card > p {
		font-size: 0.8125rem;
		color: var(--color-text-muted, #64748b);
		margin-bottom: 0.625rem;
	}

	.chat-card {
		background: #f8f6ff;
		border-color: #d4c8f0;
	}

	.chat-card a {
		color: var(--color-primary, #2563eb);
		text-decoration: underline;
	}

	.security-card {
		background: #fff8f0;
		border-color: #e8c090;
	}

	.data-storage-card {
		background: #f5f5f5;
		border-color: #ddd;
	}

	h4 {
		font-size: 0.875rem;
		margin-top: 0.875rem;
		margin-bottom: 0.375rem;
	}

	ol, ul {
		font-size: 0.8125rem;
		margin: 0 0 0.5rem 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	.examples {
		list-style: none;
		padding-left: 0.5rem;
		margin-top: 0.375rem;
	}

	.examples li {
		font-size: 0.8125rem;
		color: var(--color-text-muted, #64748b);
	}

	.examples li::before {
		content: '\203A  ';
		color: var(--color-primary, #2563eb);
		font-weight: 600;
	}

	code {
		background: white;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.8125rem;
		border: 1px solid var(--color-border, #e2e8f0);
	}

	.footer-section {
		margin-top: 1.25rem;
	}

	.footer-section p {
		font-size: 0.75rem;
		color: var(--color-text-muted, #64748b);
	}
</style>
