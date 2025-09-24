/* ========= Données lives (ajout manuel) =========
   Pour chaque live :
   - embedUrl : URL iframe Facebook (ex. https://www.facebook.com/plugins/video.php?... )
   - fbUrl    : URL publique du post (optionnelle, pour “Voir sur Facebook”)
   - thumb    : URL image d’aperçu (obligatoire si tu ne veux pas charger l’iframe tout de suite)
*/
const LIVES = [
	{
		id: 'l1',
		merchant: 'Bijouterie Les Temps Modernes',
		title: 'Nouvelles collections & idées cadeaux',
		city: 'Tarbes',
		categories: ['mode', 'accessoires'],
		date: '2025-05-11T18:00:00',
		embedUrl:
			'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fx%2Fvideos%2F123456789%2F&show_text=false&width=720',
		fbUrl: 'https://www.facebook.com/x/videos/123456789/',
		thumb: 'https://images.unsplash.com/photo-1520962918287-7448c2878f65?q=80&w=1200&auto=format&fit=crop',
		description:
			'Zoom sur les nouveautés de la semaine, idées cadeaux et offres du moment.',
	},
	{
		id: 'l2',
		merchant: 'Café du Marché',
		title: 'Brunch en musique – live en cuisine',
		city: 'Lourdes',
		categories: ['restauration'],
		date: '2025-04-02T11:00:00',
		embedUrl:
			'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fy%2Fvideos%2F987654321%2F&show_text=false&width=720',
		fbUrl: 'https://www.facebook.com/y/videos/987654321/',
		thumb: 'https://images.unsplash.com/photo-1555992336-03a23c33db13?q=80&w=1200&auto=format&fit=crop',
		description: 'Préparation des plats en direct, ambiance et coulisses.',
	},
	{
		id: 'l3',
		merchant: 'Maison des Délices',
		title: 'Atelier chocolat en direct',
		city: 'Tarbes',
		categories: ['gourmand'],
		date: '2025-03-14T16:30:00',
		embedUrl:
			'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fz%2Fvideos%2F555444333%2F&show_text=false&width=720',
		fbUrl: 'https://www.facebook.com/z/videos/555444333/',
		thumb: 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=1200&auto=format&fit=crop',
		description: 'Découverte des techniques maison, Q&A en live.',
	},
];

/* ========= State ========= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const state = {
	q: '',
	city: '',
	category: '',
	page: 1,
	perPage: 6,
};

/* ========= Helpers ========= */
function unique(arr) {
	return [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'fr'));
}
function norm(s) {
	return (s || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}
function fmtDate(iso) {
	const d = new Date(iso);
	return d.toLocaleString('fr-FR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/* ========= Init UI ========= */
document.addEventListener('DOMContentLoaded', () => {
	initFilters();
	apply();
	bindModal();
});

function initFilters() {
	// villes & catégories dynamiques
	const cities = unique(LIVES.map((l) => l.city).filter(Boolean));
	const cats = unique(
		LIVES.flatMap((l) => l.categories || []).filter(Boolean)
	);

	const citySel = $('#city');
	cities.forEach((c) => {
		const o = document.createElement('option');
		o.value = c;
		o.textContent = c;
		citySel.appendChild(o);
	});

	const catSel = $('#category');
	cats.forEach((c) => {
		const o = document.createElement('option');
		o.value = c;
		o.textContent = capitalize(c);
		catSel.appendChild(o);
	});

	// bindings
	$('#q').addEventListener(
		'input',
		debounce(() => {
			state.q = $('#q').value;
			resetPaging();
			apply();
		}, 200)
	);
	$('#city').addEventListener('change', () => {
		state.city = $('#city').value;
		resetPaging();
		apply();
	});
	$('#category').addEventListener('change', () => {
		state.category = $('#category').value;
		resetPaging();
		apply();
	});
	$('#btn-reset').addEventListener('click', () => {
		state.q = '';
		state.city = '';
		state.category = '';
		resetPaging();
		$('#q').value = '';
		$('#city').value = '';
		$('#category').value = '';
		apply();
	});

	$('#btn-more').addEventListener('click', () => {
		state.page += 1;
		apply(true);
	});
}

function debounce(fn, delay = 200) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), delay);
	};
}
function resetPaging() {
	state.page = 1;
}
function capitalize(s) {
	return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* ========= Apply filters & render ========= */
function apply(append = false) {
	const q = norm(state.q);
	const out = LIVES.filter((l) => {
		const hay = norm(
			[
				l.merchant,
				l.title,
				l.description,
				(l.categories || []).join(' '),
				l.city,
			].join(' ')
		);
		const okQ = !q || hay.includes(q);
		const okCity = !state.city || l.city === state.city;
		const okCat =
			!state.category || (l.categories || []).includes(state.category);
		return okQ && okCity && okCat;
	}).sort((a, b) => new Date(b.date) - new Date(a.date)); // récents d'abord

	$('#count').textContent = out.length;

	const start = 0;
	const end = state.page * state.perPage;
	const pageItems = out.slice(start, end);

	renderLives(pageItems, append);

	const more = out.length > end;
	$('#btn-more').hidden = !more;
}

function renderLives(items, append = false) {
	const grid = $('#live-grid');
	if (!append) {
		grid.innerHTML = '';
	}

	if (!items.length) {
		if (!append)
			grid.innerHTML = '<p>Aucun live trouvé avec ces critères.</p>';
		return;
	}

	for (const l of items) {
		const card = document.createElement('article');
		card.className = 'live-card';
		card.setAttribute('aria-labelledby', `t-${l.id}`);
		card.innerHTML = `
      <div class="live-media" data-live="${l.id}">
        <div class="cover" role="button" tabindex="0" aria-label="Lire le live ${escapeHtml(
			l.title
		)}">
          <img src="${l.thumb || ''}" alt="">
          <span class="play">▶︎ Lire le live</span>
          <div class="consent">Ce contenu est hébergé par Facebook. En cliquant, vous chargez le lecteur.</div>
        </div>
      </div>
      <div class="live-body">
        <h3 id="t-${l.id}" class="live-title">${l.title}</h3>
        <div class="live-meta">
          <span class="badge">${l.merchant}</span>
          <span class="badge">${l.city}</span>
          ${(l.categories || [])
				.map((c) => `<span class="badge">${capitalize(c)}</span>`)
				.join('')}
          <span class="badge">${fmtDate(l.date)}</span>
        </div>
        <p class="live-desc">${l.description || ''}</p>
        <div class="live-cta">
          ${
				l.fbUrl
					? `<a class="btn btn-secondary" href="${l.fbUrl}" target="_blank" rel="noopener">Voir sur Facebook</a>`
					: ''
			}
          <button class="btn btn-primary" type="button" data-play="${
				l.id
			}">Lire ici</button>
          <button class="btn btn-secondary" type="button" data-share='${encodeURIComponent(
				l.fbUrl || l.embedUrl
			)}'>Partager</button>
        </div>
      </div>
    `;
		grid.appendChild(card);
	}

	// Interactions : play/consent + share
	$$('[data-play]').forEach((b) => {
		b.onclick = () => injectPlayer(b.dataset.play);
	});

	// Clic sur la cover
	$$('.live-media .cover').forEach((c) => {
		c.addEventListener('click', () => {
			const id = c.parentElement.dataset.live;
			injectPlayer(id);
		});
		c.addEventListener('keypress', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				const id = c.parentElement.dataset.live;
				injectPlayer(id);
			}
		});
	});

	// Partage
	$$('[data-share]').forEach((b) => {
		b.onclick = async () => {
			const url = decodeURIComponent(b.getAttribute('data-share'));
			if (navigator.share) {
				try {
					await navigator.share({
						title: 'Live — Élan Bigourdan',
						url,
					});
				} catch (_) {}
			} else {
				try {
					await navigator.clipboard.writeText(url);
					alert('Lien copié !');
				} catch {
					window.prompt('Copiez ce lien :', url);
				}
			}
		};
	});
}

function injectPlayer(id) {
	const live = LIVES.find((x) => x.id === id);
	if (!live) return;
	const box = document.querySelector(`.live-media[data-live="${id}"]`);
	if (!box) return;

	// Empêche double-injection
	if (box.dataset.loaded === '1') return;
	box.dataset.loaded = '1';

	// Iframe responsive (16/9 via aspect-ratio)
	box.innerHTML = `
    <iframe
      title="Lecteur Facebook"
      src="${live.embedUrl}"
      width="100%" height="100%"
      style="border:0; width:100%; height:100%;"
      scrolling="no" frameborder="0" allowfullscreen="true"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
    ></iframe>
  `;
}

/* ========= Modal (si besoin d’afficher + d’infos) ========= */
function bindModal() {
	$$('[data-close]').forEach((el) =>
		el.addEventListener('click', closeModal)
	);
}
function openModal(html) {
	$('#modal-content').innerHTML = html;
	$('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
	$('#modal').setAttribute('aria-hidden', 'true');
}

/* ========= Utils ========= */
function escapeHtml(s) {
	return (s || '').replace(
		/[&<>"']/g,
		(m) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			}[m])
	);
}
