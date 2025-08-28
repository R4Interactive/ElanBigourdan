/* nos_partenaires_script.js — Élan Bigourdan
   - Menu mobile
   - Filtres & tri (Nom / Ville / Catégorie, ordre A→Z / Z→A)
   - Tag "avantage" auto à partir de data-advantage / data-advantage-label
   - Affichage Liste ↔ Carte (Leaflet) avec synchro des résultats
*/
(function () {
	'use strict';

	/* ========== Helpers communs ========== */
	function norm(s) {
		if (s == null) return '';
		// Normalisation sans caractères diacritiques (compatible)
		return String(s)
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim();
	}

	/* ========== Menu mobile ========== */
	(function initMobileMenu() {
		const toggle = document.querySelector('.nav-toggle');
		const menu = document.querySelector('.nav-menu');
		if (!toggle || !menu) return;

		toggle.addEventListener('click', () => {
			const open = menu.style.display === 'flex';
			menu.style.display = open ? 'none' : 'flex';
			toggle.setAttribute('aria-expanded', String(!open));
		});

		// Ferme le menu mobile en cliquant sur un lien
		menu.querySelectorAll('a').forEach((a) => {
			a.addEventListener('click', () => {
				if (window.innerWidth <= 680) menu.style.display = 'none';
			});
		});
	})();

	/* ========== Page partenaires : DOM ========== */
	const grid = document.getElementById('partnersGrid');
	// Si la page n’est pas la page partenaires, on ne va pas plus loin
	if (!grid) return;

	const cards = Array.from(grid.querySelectorAll('.partner-card'));
	const countEl = document.getElementById('partnersCount');

	const fSearch = document.getElementById('fSearch');
	const fCategory = document.getElementById('fCategory');
	const fCity = document.getElementById('fCity');
	const fAdvantage = document.getElementById('fAdvantage');
	const fReset = document.getElementById('fReset');

	const sBy = document.getElementById('sBy'); // name | city | category
	const sOrder = document.getElementById('sOrder'); // asc | desc

	const viewToggle = document.querySelector('.view-toggle');
	const listBtn = viewToggle
		? viewToggle.querySelector('[data-view="list"]')
		: null;
	const mapBtn = viewToggle
		? viewToggle.querySelector('[data-view="map"]')
		: null;
	const mapEl = document.getElementById('partnersMap');

	/* ========== Avantages → tag automatique ========== */
	const TYPE_ICON = {
		reduction: '', // -10%, -15%...
		offert: '🎁', // apéro offert / produit offert
		cadeau: '🎁', // cadeau / bon d’achat
		livraison: '🚚', // livraison
		happyhour: '⏱', // happy hour
		special: '', // fallback
	};
	function detectType(label) {
		const l = norm(label || '');
		if (/%|reduc|reduct|réduc|remise/.test(l)) return 'reduction';
		if (/apero|apéritif|offert|offre/.test(l)) return 'offert';
		if (/cadeau|bon dachat|bon achat/.test(l)) return 'cadeau';
		if (/livraison|delivery/.test(l)) return 'livraison';
		if (/happy ?hour/.test(l)) return 'happyhour';
		return 'special';
	}
	function ensureAdvantageTags() {
		cards.forEach((card) => {
			const advLabel = (
				card.dataset.advantageLabel ||
				card.dataset.advantage ||
				''
			).trim();
			if (!advLabel) return;

			// Enlever tout ancien ruban
			const oldRibbon = card.querySelector('.ribbon');
			if (oldRibbon) oldRibbon.remove();

			const tagsWrap = card.querySelector('.partner-tags');
			if (!tagsWrap) return;

			// Éviter les doublons
			if (tagsWrap.querySelector('.advantage-tag')) return;

			const type = card.dataset.advantageType || detectType(advLabel);
			const icon = TYPE_ICON[type] || TYPE_ICON.special;

			const tag = document.createElement('span');
			tag.className = 'tag advantage-tag';
			tag.dataset.advType = type;
			tag.textContent = `${icon} ${advLabel}`;
			tagsWrap.prepend(tag);
		});
	}

	/* ========== Filtres + tri ========== */
	function applyFiltersAndSort() {
		const q = norm(fSearch && fSearch.value);
		const cat = norm(fCategory && fCategory.value);
		const city = norm(fCity && fCity.value);
		const adv = !!(fAdvantage && fAdvantage.checked);

		const sortKey = (sBy && sBy.value) || 'name'; // name | city | category
		const descending = (sOrder && sOrder.value) === 'desc';

		const visible = [];

		cards.forEach((card) => {
			const name = norm(card.dataset.name);
			const tags = norm(card.dataset.tags);
			const ccat = norm(card.dataset.category);
			const ccity = norm(card.dataset.city);
			const hasAdv = !!(
				card.dataset.advantage || card.dataset.advantageLabel
			);

			const okText =
				!q ||
				name.includes(q) ||
				tags.includes(q) ||
				ccat.includes(q) ||
				ccity.includes(q);
			const okCat = !cat || ccat === cat;
			const okCity = !city || ccity === city;
			const okAdv = !adv || hasAdv;

			const show = okText && okCat && okCity && okAdv;
			card.style.display = show ? '' : 'none';
			if (show) visible.push(card);
		});

		// Tri des éléments visibles (reordering DOM)
		visible.sort((a, b) => {
			const va = norm(a.dataset[sortKey]) || '';
			const vb = norm(b.dataset[sortKey]) || '';
			if (va < vb) return descending ? 1 : -1;
			if (va > vb) return descending ? -1 : 1;
			return 0;
		});
		visible.forEach((el) => grid.appendChild(el));

		// Compteur
		if (countEl) countEl.textContent = String(visible.length);

		// Synchro carte si visible
		if (mapEl && !mapEl.hasAttribute('hidden')) {
			refreshMapMarkers(visible);
		}
	}

	/* ========== Carte Leaflet ========== */
	let leafletMap = null;
	let leafletLayerGroup = null;

	function ensureMap() {
		if (leafletMap) return true;
		if (!window.L || !mapEl) {
			console.warn(
				'[Partenaires] Leaflet non chargé ou élément carte manquant.'
			);
			return false;
		}
		leafletMap = L.map(mapEl, { scrollWheelZoom: false });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; OpenStreetMap',
		}).addTo(leafletMap);
		leafletLayerGroup = L.layerGroup().addTo(leafletMap);
		return true;
	}

	function refreshMapMarkers(visibleCards) {
		if (!ensureMap()) return;

		leafletLayerGroup.clearLayers();
		const markers = [];

		visibleCards.forEach((card) => {
			const lat = parseFloat(card.dataset.lat);
			const lng = parseFloat(card.dataset.lng);
			if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

			const name = card.dataset.name || '';
			const city = card.dataset.city || '';
			const category = card.dataset.category || '';
			const adv =
				card.dataset.advantageLabel || card.dataset.advantage || '';

			const popup = `
        <strong>${name}</strong><br/>
        ${category} — ${city}${adv ? `<br/><em>Avantage : ${adv}</em>` : ''}
      `;
			const m = L.marker([lat, lng]).bindPopup(popup);
			markers.push(m);
			m.addTo(leafletLayerGroup);
		});

		if (!markers.length) {
			leafletMap.setView([43.1, -0.05], 9); // cadrage département
			return;
		}
		if (markers.length === 1) {
			leafletMap.setView(markers[0].getLatLng(), 13);
		} else {
			const group = L.featureGroup(markers);
			leafletMap.fitBounds(group.getBounds().pad(0.2));
		}
	}

	/* ========== Bascule Liste ↔ Carte ========== */
	function setView(mode) {
		if (!mapEl) return; // pas de carte sur la page : ignorer
		if (mode === 'map') {
			mapEl.removeAttribute('hidden');
			grid.style.display = 'none';
			if (listBtn) listBtn.classList.remove('is-active');
			if (mapBtn) mapBtn.classList.add('is-active');

			const visible = cards.filter((c) => c.style.display !== 'none');
			refreshMapMarkers(visible);

			// recalcul taille carte
			if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 120);
		} else {
			mapEl.setAttribute('hidden', '');
			grid.style.display = '';
			if (mapBtn) mapBtn.classList.remove('is-active');
			if (listBtn) listBtn.classList.add('is-active');
		}
	}

	/* ========== Bindings ========== */
	function bindUI() {
		const inputs = [
			fSearch,
			fCategory,
			fCity,
			fAdvantage,
			sBy,
			sOrder,
		].filter(Boolean);
		inputs.forEach((el) => {
			el.addEventListener('input', applyFiltersAndSort);
			el.addEventListener('change', applyFiltersAndSort);
		});

		if (fReset) {
			fReset.addEventListener('click', (e) => {
				e.preventDefault();
				if (fSearch) fSearch.value = '';
				if (fCategory) fCategory.value = '';
				if (fCity) fCity.value = '';
				if (fAdvantage) fAdvantage.checked = false;
				if (sBy) sBy.value = 'name';
				if (sOrder) sOrder.value = 'asc';
				applyFiltersAndSort();
			});
		}

		if (listBtn) listBtn.addEventListener('click', () => setView('list'));
		if (mapBtn) mapBtn.addEventListener('click', () => setView('map'));
	}

	/* ========== Init ========== */
	(function init() {
		if (countEl) countEl.textContent = String(cards.length);
		ensureAdvantageTags(); // crée les tags avantage si besoin
		bindUI(); // branche les événements
		applyFiltersAndSort(); // applique filtres + tri au chargement
		setView('list'); // vue par défaut
	})();
})();
