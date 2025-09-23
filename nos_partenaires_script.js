// ============== nos_partenaires_script.js (logos inline, pas d’injection) ==============

/* Menu mobile (a11y) */
(function mobileMenu() {
	const toggle = document.querySelector('.nav-toggle');
	const menu = document.querySelector('.nav-menu');
	if (!toggle || !menu) return;

	const open = () => {
		menu.style.display = 'flex';
		toggle.setAttribute('aria-expanded', 'true');
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
	};
	const close = () => {
		menu.style.display = 'none';
		toggle.setAttribute('aria-expanded', 'false');
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
	};

	toggle.addEventListener('click', () =>
		toggle.getAttribute('aria-expanded') === 'true' ? close() : open()
	);
	menu.querySelectorAll('a').forEach((a) =>
		a.addEventListener('click', () => {
			if (window.innerWidth <= 680) close();
		})
	);
	window.addEventListener(
		'resize',
		() => {
			if (window.innerWidth > 680) {
				menu.style.display = '';
				toggle.setAttribute('aria-expanded', 'false');
				document.documentElement.style.overflow = '';
				document.body.style.overflow = '';
			}
		},
		{ passive: true }
	);
	document.addEventListener('keydown', (e) => {
		if (
			e.key === 'Escape' &&
			toggle.getAttribute('aria-expanded') === 'true'
		) {
			close();
			toggle.focus();
		}
	});
})();

/* Uniformisation légère (ne touche PAS aux logos/titres) */
(function normalizeCards() {
	const grid = document.querySelector('#partners-grid');
	if (!grid) return;

	const cards = Array.from(grid.querySelectorAll('.pc-card'));

	cards.forEach((card) => {
		// Meta : s’assurer que la 2e info s’étire si présente
		const meta = card.querySelector('.pc-meta');
		if (meta) {
			const items = meta.querySelectorAll('.pc-meta-item');
			if (items.length >= 2) items[1].classList.add('pc-meta-item--grow');
		}

		// Badges : marquer les avantages %
		meta?.classList.add('pc-meta');
		card.querySelectorAll('.pc-badge').forEach((b) => {
			const t = (b.textContent || '').trim();
			if (/(-|\+)?\d{1,2}%/.test(t) || /carte/i.test(t))
				b.classList.add('pc-badge--deal');
		});
	});
})();

/* Filtres */
(function partnersFilters() {
	const grid = document.getElementById('partners-grid');
	const cards = () => Array.from(grid?.querySelectorAll('.pc-card') || []);
	const q = document.getElementById('search-partners');
	const selCat = document.getElementById('select-category');
	const selCity = document.getElementById('select-city');
	const chkAdv = document.getElementById('filter-advantage');
	const btnRes = document.getElementById('btn-reset');
	const counter = document.getElementById('partners-count');
	if (!grid) return;

	const norm = (s) =>
		(s || '')
			.toString()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();

	function match(card) {
		const text = norm(
			[
				card.querySelector('.pc-title')?.textContent,
				card.querySelector('.pc-desc')?.textContent,
				card.querySelector('.pc-meta')?.textContent,
			].join(' ')
		);
		const city = card.getAttribute('data-city') || '';
		const cats = card.getAttribute('data-categories') || '';
		const adv =
			(card.getAttribute('data-advantage') || '').toLowerCase() ===
			'true';

		const qOk = !q.value || text.includes(norm(q.value));
		const cityOk = !selCity.value || norm(city) === norm(selCity.value);
		const catOk = !selCat.value || norm(cats).includes(norm(selCat.value));
		const advOk = !chkAdv.checked || adv;
		return qOk && cityOk && catOk && advOk;
	}

	function apply() {
		grid.setAttribute('aria-busy', 'true');
		let visible = 0;
		cards().forEach((c) => {
			const ok = match(c);
			c.hidden = !ok;
			if (ok) visible++;
		});
		if (counter) {
			counter.innerHTML = `<strong>${visible}</strong> ${
				visible > 1 ? 'partenaires' : 'partenaire'
			}`;
		}
		grid.setAttribute('aria-busy', 'false');
	}

	function reset() {
		q.value = '';
		selCat.value = '';
		selCity.value = '';
		chkAdv.checked = false;
		apply();
	}

	['input', 'change'].forEach((evt) => {
		q?.addEventListener(evt, apply);
		selCat?.addEventListener(evt, apply);
		selCity?.addEventListener(evt, apply);
		chkAdv?.addEventListener(evt, apply);
	});
	btnRes?.addEventListener('click', reset);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', apply);
	} else {
		apply();
	}
})();
