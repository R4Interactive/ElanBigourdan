/* ========= Données de démonstration ========= */
const EVENTS = [
	{
		id: 'e1',
		title: 'Foire des Expositions',
		start: '2025-09-21T10:00:00',
		end: '2025-09-21T18:00:00',
		city: 'Tarbes',
		venue: 'Parc des expositions',
		categories: ['foire', 'salon'],
		organizer: 'Ville de Tarbes',
		advantage: true,
		price: 'Gratuit',
		image: 'https://images.unsplash.com/photo-1556909190-ef9103a9a383?q=80&w=1200&auto=format&fit=crop',
		description:
			'Grand rendez-vous annuel : stands, innovations, artisanat local et animations pour toute la famille.',
		links: { site: '#', fb: '#', ig: '#', map: 'https://goo.gl/maps/' },
	},
	{
		id: 'e2',
		title: 'Concert Place Marcadieu',
		start: '2025-09-23T20:00:00',
		end: '2025-09-23T23:00:00',
		city: 'Tarbes',
		venue: 'Place Marcadieu',
		categories: ['concert'],
		organizer: 'Office de tourisme',
		advantage: false,
		price: '10€',
		image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1200&auto=format&fit=crop',
		description:
			'Live en plein air avec artistes locaux, restauration sur place.',
		links: { site: '#', fb: '#', map: 'https://goo.gl/maps/' },
	},
	{
		id: 'e3',
		title: 'Feu d’artifice – Fête de la Ville',
		start: '2025-07-14T22:30:00',
		end: '2025-07-14T23:10:00',
		city: 'Lourdes',
		venue: 'Berges du gave',
		categories: ['feu', 'animation'],
		organizer: 'Ville de Lourdes',
		advantage: false,
		price: 'Gratuit',
		image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?q=80&w=1200&auto=format&fit=crop',
		description:
			'Spectacle pyrotechnique – venez en avance pour profiter des animations.',
		links: { site: '#', map: 'https://goo.gl/maps/' },
	},
	{
		id: 'e4',
		title: 'Brunch musical au Café du Marché',
		start: '2025-09-28T11:30:00',
		end: '2025-09-28T14:30:00',
		city: 'Lourdes',
		venue: 'Café du Marché',
		categories: ['commercant', 'concert', 'animation'],
		organizer: 'Café du Marché',
		advantage: true,
		price: 'Formule 18€',
		image: 'https://images.unsplash.com/photo-1516685304081-de7947d419d7?q=80&w=1200&auto=format&fit=crop',
		description: 'Brunch maison, musique live, terrasse ensoleillée.',
		links: { site: '#', ig: '#', map: 'https://goo.gl/maps/' },
	},
];

/* ========= WhatsApp ========= */
// Numéro WhatsApp (format international, sans +)
const WHATSAPP_NUMBER = '33600000000';

/* ========= Helpers & State ========= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const state = {
	view: localStorage.getItem('agenda:view') || 'list',
	q: '',
	city: '',
	category: '',
	organizer: '',
	advantage: false,
	freeOnly: false,
	dateFrom: '',
	dateTo: '',
};

const fmtMonthYear = (d) =>
	d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
const fmtDate = (iso) => new Date(iso);
const inRange = (date, from, to) =>
	(!from || date >= from) && (!to || date <= to);
const weekendRange = () => {
	const now = new Date();
	const day = now.getDay();
	const diffToSat = (6 - day + 7) % 7;
	const sat = new Date(now);
	sat.setDate(now.getDate() + diffToSat);
	sat.setHours(0, 0, 0, 0);
	const sun = new Date(sat);
	sun.setDate(sat.getDate() + 1);
	sun.setHours(23, 59, 59, 999);
	return [sat, sun];
};
function unique(a) {
	return [...new Set(a)].sort((x, y) => x.localeCompare(y, 'fr'));
}
function debounce(fn, d = 200) {
	let t;
	return (...args) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...args), d);
	};
}
function labelCat(k) {
	const m = {
		salon: 'Salon',
		foire: 'Foire',
		concert: 'Concert',
		animation: 'Animation',
		feu: 'Feu d’artifice',
		commercant: 'Chez un commerçant',
	};
	return m[k] || k;
}
function escapeICS(s) {
	return (s || '').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}

/* ========= WhatsApp utils ========= */
function buildWhatsAppMessage(data) {
	const toLine = (v) => (v && String(v).trim() ? String(v).trim() : '—');
	const start = data.start ? new Date(data.start) : null;
	const end = data.end ? new Date(data.end) : null;
	const dateLine = start
		? start.toLocaleString('fr-FR', {
				weekday: 'long',
				day: '2-digit',
				month: 'long',
				hour: '2-digit',
				minute: '2-digit',
		  }) +
		  (end
				? ' — ' +
				  end.toLocaleTimeString('fr-FR', {
						hour: '2-digit',
						minute: '2-digit',
				  })
				: '')
		: '—';

	return [
		'📝 *Proposition d’actualité*',
		'',
		`• *Titre* : ${toLine(data.title)}`,
		`• *Organisateur* : ${toLine(data.organizer)}`,
		`• *Ville* : ${toLine(data.city)}`,
		`• *Lieu* : ${toLine(data.venue)}`,
		`• *Date/heure* : ${dateLine}`,
		`• *Catégorie* : ${toLine(labelCat(data.category))}`,
		`• *Avantage Carte* : ${data.advantage === 'true' ? 'Oui' : 'Non'}`,
		'',
		`• *Description* :`,
		`${toLine(data.description)}`,
		'',
		`🔗 *Liens*`,
		`Site/Billetterie : ${toLine(data.site)}`,
		`Facebook : ${toLine(data.fb)}`,
		`Instagram : ${toLine(data.ig)}`,
		`Carte : ${toLine(data.map)}`,
		`Visuel : ${toLine(data.image)}`,
	].join('\n');
}
function openWhatsAppWithMessage(msg) {
	const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
		msg
	)}`;
	window.open(url, '_blank', 'noopener');
}
function readForm() {
	return Object.fromEntries(
		new FormData(document.getElementById('form-submit')).entries()
	);
}

/* ========= UI init ========= */
function initFilters() {
	const cities = unique(EVENTS.map((e) => e.city).filter(Boolean));
	const orgs = unique(EVENTS.map((e) => e.organizer).filter(Boolean));

	const citySel = $('#city');
	cities.forEach((c) => {
		const o = document.createElement('option');
		o.value = c;
		o.textContent = c;
		citySel.appendChild(o);
	});
	const orgSel = $('#organizer');
	orgs.forEach((o) => {
		const opt = document.createElement('option');
		opt.value = o;
		opt.textContent = o;
		orgSel.appendChild(opt);
	});

	$('#q').addEventListener(
		'input',
		debounce(() => {
			state.q = $('#q').value;
			apply();
		}, 200)
	);
	$('#city').addEventListener('change', () => {
		state.city = $('#city').value;
		apply();
	});
	$('#category').addEventListener('change', () => {
		state.category = $('#category').value;
		apply();
	});
	$('#organizer').addEventListener('change', () => {
		state.organizer = $('#organizer').value;
		apply();
	});
	$('#advantage').addEventListener('change', () => {
		state.advantage = $('#advantage').checked;
		apply();
	});
	$('#date-from').addEventListener('change', () => {
		state.dateFrom = $('#date-from').value;
		apply();
	});
	$('#date-to').addEventListener('change', () => {
		state.dateTo = $('#date-to').value;
		apply();
	});

	$('#btn-free').addEventListener('click', () => {
		state.freeOnly = !state.freeOnly;
		toggleChip('#btn-free', state.freeOnly);
		apply();
	});
	$('#btn-weekend').addEventListener('click', () => {
		const [sat, sun] = weekendRange();
		$('#date-from').value = sat.toISOString().slice(0, 10);
		$('#date-to').value = sun.toISOString().slice(0, 10);
		state.dateFrom = $('#date-from').value;
		state.dateTo = $('#date-to').value;
		apply();
	});
	$('#btn-reset').addEventListener('click', resetFilters);

	$$('.view-btn').forEach((btn) =>
		btn.addEventListener('click', () => setView(btn.dataset.view))
	);

	readURLParams();
	reflectFilters();

	// WhatsApp
	$('#wa-preview')?.addEventListener('click', () => {
		const data = readForm();
		if (!data.title || !data.city || !data.start || !data.category) {
			alert(
				'Merci de renseigner au minimum : Titre, Ville, Début et Catégorie.'
			);
			return;
		}
		const msg = buildWhatsAppMessage(data);
		const box = $('#wa-preview-box');
		box.textContent = msg;
		box.classList.remove('is-hidden');
		box.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});
	$('#wa-send')?.addEventListener('click', () => {
		const data = readForm();
		if (!data.title || !data.city || !data.start || !data.category) {
			alert(
				'Merci de renseigner au minimum : Titre, Ville, Début et Catégorie.'
			);
			return;
		}
		openWhatsAppWithMessage(buildWhatsAppMessage(data));
	});
}
function toggleChip(sel, active) {
	const el = $(sel);
	el.style.background = active ? '#eaf6ef' : '';
	el.style.borderColor = active ? '#cfeedd' : '';
	el.style.color = active ? '#0f5f3a' : '';
}
function resetFilters() {
	state.q = '';
	state.city = '';
	state.category = '';
	state.organizer = '';
	state.advantage = false;
	state.freeOnly = false;
	state.dateFrom = '';
	state.dateTo = '';
	$('#q').value = '';
	$('#city').value = '';
	$('#category').value = '';
	$('#organizer').value = '';
	$('#advantage').checked = false;
	$('#btn-free').style = '';
	$('#date-from').value = '';
	$('#date-to').value = '';
	apply();
}

/* ========= Render LIST ========= */
function renderList(evts) {
	const wrap = $('#view-list');
	wrap.innerHTML = '';
	if (!evts.length) {
		wrap.innerHTML = '<p>Pas d’évènements trouvés avec ces filtres.</p>';
		return;
	}

	for (const e of evts) {
		const start = fmtDate(e.start);
		const dateBadge = start.toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
		const card = document.createElement('article');
		card.className = 'event-card';
		card.setAttribute('aria-labelledby', `t-${e.id}`);
		card.innerHTML = `
      <div class="event-media">${
			e.image ? `<img src="${e.image}" alt="">` : ''
		}</div>
      <h3 id="t-${e.id}" class="event-title">${e.title}</h3>
      <div class="event-meta"><span>${
			e.city
		}</span><span class="dot">•</span><span>${
			e.venue || 'Lieu à venir'
		}</span></div>
      <div class="event-badges">
        <span class="event-badge">${dateBadge}</span>
        ${e.categories
			.map((c) => `<span class="event-badge">${labelCat(c)}</span>`)
			.join('')}
        ${
			e.advantage
				? `<span class="event-badge event-badge--deal">Avantage Carte</span>`
				: ''
		}
        ${
			(e.price || '').toLowerCase().includes('gratuit')
				? `<span class="event-badge">Gratuit</span>`
				: ''
		}
      </div>
      <p class="event-desc">${e.description || ''}</p>
      <div class="event-cta">
        <button class="btn btn-primary" data-detail="${
			e.id
		}">Plus d’infos</button>
        <button class="btn btn-secondary" data-ics="${
			e.id
		}">Ajouter au calendrier</button>
        ${
			e.links?.map
				? `<a class="btn btn-secondary" href="${e.links.map}" target="_blank" rel="noopener">Itinéraire</a>`
				: ''
		}
        ${
			e.links?.site
				? `<a class="btn btn-secondary" href="${e.links.site}" target="_blank" rel="noopener">Site</a>`
				: ''
		}
      </div>`;
		wrap.appendChild(card);
	}
	$$('[data-detail]').forEach((b) =>
		b.addEventListener('click', () => openDetail(b.dataset.detail))
	);
	$$('[data-ics]').forEach((b) =>
		b.addEventListener('click', () => downloadICS(b.dataset.ics))
	);
}

/* ========= Render CALENDAR ========= */
let calCursor = new Date();
calCursor.setDate(1);
function renderCalendar(evts) {
	$('#view-calendar').classList.remove('is-hidden');
	$('#cal-label').textContent = fmtMonthYear(calCursor);

	const grid = $('#calendar-grid');
	grid.innerHTML = '';
	const firstDay = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
	const startWeekday = (firstDay.getDay() + 6) % 7;
	const daysInMonth = new Date(
		calCursor.getFullYear(),
		calCursor.getMonth() + 1,
		0
	).getDate();

	const headers = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
	headers.forEach((h) => {
		const c = document.createElement('div');
		c.className = 'calendar-cell';
		c.style.background = '#fafafa';
		c.style.fontWeight = '800';
		c.textContent = h;
		grid.appendChild(c);
	});

	for (let i = 0; i < startWeekday; i++) {
		const c = document.createElement('div');
		c.className = 'calendar-cell';
		grid.appendChild(c);
	}

	for (let d = 1; d <= daysInMonth; d++) {
		const date = new Date(calCursor.getFullYear(), calCursor.getMonth(), d);
		const cell = document.createElement('div');
		cell.className = 'calendar-cell';
		const head = document.createElement('div');
		head.className = 'cell-date';
		head.textContent = String(d).padStart(2, '0');
		cell.appendChild(head);
		const todays = evts.filter((e) => {
			const s = fmtDate(e.start);
			return (
				s.getFullYear() === date.getFullYear() &&
				s.getMonth() === date.getMonth() &&
				s.getDate() === date.getDate()
			);
		});
		todays.slice(0, 3).forEach((e) => {
			const pill = document.createElement('div');
			pill.className = 'calendar-pill';
			pill.title = e.title;
			pill.textContent = e.title;
			pill.addEventListener('click', () => openDetail(e.id));
			cell.appendChild(pill);
		});
		grid.appendChild(cell);
	}

	$('#cal-prev').onclick = () => {
		calCursor.setMonth(calCursor.getMonth() - 1);
		apply();
	};
	$('#cal-next').onclick = () => {
		calCursor.setMonth(calCursor.getMonth() + 1);
		apply();
	};
}

/* ========= Filters apply ========= */
function apply() {
	const norm = (s) =>
		(s || '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
	const q = norm(state.q);
	const from = state.dateFrom ? new Date(state.dateFrom + 'T00:00:00') : null;
	const to = state.dateTo ? new Date(state.dateTo + 'T23:59:59') : null;

	const out = EVENTS.filter((e) => {
		const text = norm(
			[
				e.title,
				e.city,
				e.venue,
				e.organizer,
				(e.categories || []).join(' '),
			].join(' ')
		);
		const okQ = !q || text.includes(q);
		const date = fmtDate(e.start);
		const okRange = inRange(date, from, to);
		const okCity = !state.city || e.city === state.city;
		const okCat =
			!state.category || (e.categories || []).includes(state.category);
		const okOrg = !state.organizer || e.organizer === state.organizer;
		const okAdv = !state.advantage || !!e.advantage;
		const okFree =
			!state.freeOnly ||
			(e.price || '').toLowerCase().includes('gratuit');
		return okQ && okRange && okCity && okCat && okOrg && okAdv && okFree;
	});

	$('#count').textContent = out.length;

	if (state.view === 'list') {
		showView('list');
		renderList(out);
	} else {
		showView('calendar');
		renderCalendar(out);
	}

	writeURLParams();
}

function showView(view) {
	['list', 'calendar'].forEach((v) => {
		const active = v === view;
		const el = document.getElementById(`view-${v}`);
		el.classList.toggle('is-hidden', !active);
		el.setAttribute('aria-hidden', String(!active));
		const btn = document.querySelector(`.view-btn[data-view="${v}"]`);
		if (btn) {
			btn.classList.toggle('is-active', active);
			btn.setAttribute('aria-selected', String(active));
		}
	});
	state.view = view;
	localStorage.setItem('agenda:view', view);
}
function setView(view) {
	showView(view);
	apply();
}

/* ========= Modal ========= */
function openDetail(id) {
	const e = EVENTS.find((x) => x.id === id);
	if (!e) return;
	const start = fmtDate(e.start);
	const end = e.end ? fmtDate(e.end) : null;
	const dateTxt =
		start.toLocaleString('fr-FR', {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			hour: '2-digit',
			minute: '2-digit',
		}) +
		(end
			? ' — ' +
			  end.toLocaleTimeString('fr-FR', {
					hour: '2-digit',
					minute: '2-digit',
			  })
			: '');

	$('#modal-content').innerHTML = `
    <div class="detail-media">${
		e.image ? `<img src="${e.image}" alt="">` : ''
	}</div>
    <h3 id="modal-title">${e.title}</h3>
    <div class="detail-meta">
      <span>${e.city}</span><span class="dot">•</span><span>${
		e.venue || 'Lieu à venir'
	}</span>
      <span class="dot">•</span><span>${dateTxt}</span>
    </div>
    <div class="event-badges">
      ${e.categories
			.map((c) => `<span class="event-badge">${labelCat(c)}</span>`)
			.join('')}
      ${
			e.advantage
				? `<span class="event-badge event-badge--deal">Avantage Carte</span>`
				: ''
		}
      ${e.price ? `<span class="event-badge">${e.price}</span>` : ''}
    </div>
    <p class="event-desc">${e.description || ''}</p>
    <div class="detail-actions">
      ${
			e.links?.site
				? `<a class="btn btn-secondary" href="${e.links.site}" target="_blank" rel="noopener">Site</a>`
				: ''
		}
      ${
			e.links?.fb
				? `<a class="btn btn-secondary" href="${e.links.fb}" target="_blank" rel="noopener">Facebook</a>`
				: ''
		}
      ${
			e.links?.ig
				? `<a class="btn btn-secondary" href="${e.links.ig}" target="_blank" rel="noopener">Instagram</a>`
				: ''
		}
      ${
			e.links?.map
				? `<a class="btn btn-secondary" href="${e.links.map}" target="_blank" rel="noopener">Itinéraire</a>`
				: ''
		}
      <button class="btn btn-primary" data-ics="${
			e.id
		}">Ajouter au calendrier</button>
    </div>`;
	$('#modal').setAttribute('aria-hidden', 'false');
	document
		.querySelector('#modal [data-ics]')
		?.addEventListener('click', () => downloadICS(e.id));
}
$$('[data-close]').forEach((el) =>
	el.addEventListener('click', () =>
		$('#modal').setAttribute('aria-hidden', 'true')
	)
);

/* ========= ICS ========= */
function downloadICS(id) {
	const e = EVENTS.find((x) => x.id === id);
	if (!e) return;
	const dt = (s) =>
		s ? s.replace(/[-:]/g, '').replace('.000', '').replace('Z', '') : '';
	const dtStart = new Date(e.start).toISOString();
	const dtEnd = new Date(e.end || e.start).toISOString();
	const ics = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Elan Bigourdan//Agenda//FR',
		'BEGIN:VEVENT',
		`UID:${e.id}@elanbigourdan.com`,
		`DTSTAMP:${dt(new Date().toISOString())}Z`,
		`DTSTART:${dt(dtStart)}Z`,
		`DTEND:${dt(dtEnd)}Z`,
		`SUMMARY:${escapeICS(e.title)}`,
		`DESCRIPTION:${escapeICS(e.description || '')}`,
		`LOCATION:${escapeICS([e.venue, e.city].filter(Boolean).join(', '))}`,
		'END:VEVENT',
		'END:VCALENDAR',
	].join('\r\n');
	const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = (e.title || 'evenement') + '.ics';
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ========= URL sync ========= */
function writeURLParams() {
	const p = new URLSearchParams();
	if (state.q) p.set('q', state.q);
	if (state.city) p.set('city', state.city);
	if (state.category) p.set('cat', state.category);
	if (state.organizer) p.set('org', state.organizer);
	if (state.advantage) p.set('adv', '1');
	if (state.freeOnly) p.set('free', '1');
	if (state.dateFrom) p.set('from', state.dateFrom);
	if (state.dateTo) p.set('to', state.dateTo);
	if (state.view !== 'list') p.set('view', state.view);
	history.replaceState(null, '', '?' + p.toString());
}
function readURLParams() {
	const p = new URLSearchParams(location.search);
	state.q = p.get('q') || '';
	state.city = p.get('city') || '';
	state.category = p.get('cat') || '';
	state.organizer = p.get('org') || '';
	state.advantage = p.get('adv') === '1';
	state.freeOnly = p.get('free') === '1';
	state.dateFrom = p.get('from') || '';
	state.dateTo = p.get('to') || '';
	state.view = p.get('view') || state.view;
}
function reflectFilters() {
	$('#q').value = state.q;
	$('#city').value = state.city;
	$('#category').value = state.category;
	$('#organizer').value = state.organizer;
	$('#advantage').checked = state.advantage;
	$('#date-from').value = state.dateFrom;
	$('#date-to').value = state.dateTo;
	toggleChip('#btn-free', state.freeOnly);
	setView(state.view);
}

/* ========= Boot ========= */
document.addEventListener('DOMContentLoaded', () => {
	initFilters();
	apply();
});
