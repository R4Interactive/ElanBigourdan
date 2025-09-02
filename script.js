// ============== script.js (couleurs d’origine + a11y) ==============

/* 1) Menu mobile (hamburger) + a11y + Escape */
(function initMobileMenu() {
	const toggle = document.querySelector('.nav-toggle');
	const menu = document.querySelector('.nav-menu');
	if (!toggle || !menu) return;

	const openMenu = () => {
		menu.style.display = 'flex';
		toggle.setAttribute('aria-expanded', 'true');
		// Bloque le scroll derrière le menu sur mobile
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';
	};
	const closeMenu = () => {
		menu.style.display = 'none';
		toggle.setAttribute('aria-expanded', 'false');
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
	};

	toggle.addEventListener('click', () => {
		const open = toggle.getAttribute('aria-expanded') === 'true';
		open ? closeMenu() : openMenu();
	});

	// Ferme au clic sur un lien (mobile)
	menu.querySelectorAll('a').forEach((a) => {
		a.addEventListener('click', () => {
			if (window.innerWidth <= 680) closeMenu();
		});
	});

	// Ferme au resize si on repasse desktop
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

	// Escape pour fermer
	document.addEventListener('keydown', (e) => {
		if (
			e.key === 'Escape' &&
			toggle.getAttribute('aria-expanded') === 'true'
		) {
			closeMenu();
			toggle.focus();
		}
	});
})();

/* 2) Compteurs "Nos chiffres clés"
   - lis la cible depuis le contenu initial
   - animation à l'apparition (IntersectionObserver)
   - formatage fr-FR
*/
(function initCounters() {
	const prefersReduced =
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const els = document.querySelectorAll('.section-chiffres .stat strong');
	if (!els.length) return;

	function parseNumber(text) {
		const raw = (text || '').toString().trim();
		const cleaned = raw.replace(/[^\d.,-]/g, '');
		const lastComma = cleaned.lastIndexOf(',');
		const lastDot = cleaned.lastIndexOf('.');
		let normalized;
		if (lastComma > -1 || lastDot > -1) {
			const decimalSep = lastComma > lastDot ? ',' : '.';
			normalized =
				decimalSep === ','
					? cleaned.replace(/\./g, '').replace(',', '.')
					: cleaned.replace(/,/g, '');
		} else {
			normalized = cleaned.replace(/[,\.\s]/g, '');
		}
		const n = Number(normalized);
		return isNaN(n) ? 0 : n;
	}

	const formatFR = (n, decimals = 0) => {
		try {
			return new Intl.NumberFormat('fr-FR', {
				maximumFractionDigits: decimals,
				minimumFractionDigits: decimals,
			}).format(n);
		} catch {
			const parts = n.toFixed(decimals).split('.');
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
			return parts.join(decimals ? ',' : '');
		}
	};

	const animateCounter = (
		el,
		target,
		{ duration = 1800, decimals = 0 } = {}
	) => {
		if (prefersReduced || duration <= 0) {
			el.textContent = formatFR(target, decimals);
			return;
		}
		const start = performance.now();
		const ease = (t) => 1 - Math.pow(1 - t, 3);
		const from = 0;

		function frame(now) {
			const t = Math.min(1, (now - start) / duration);
			const value = from + (target - from) * ease(t);
			el.textContent = formatFR(value, decimals);
			if (t < 1) requestAnimationFrame(frame);
		}
		requestAnimationFrame(frame);
	};

	// Prépare chaque compteur : mémorise la valeur initiale comme cible
	els.forEach((el) => {
		const initial = el.textContent.trim();
		el.dataset.target = initial;
		el.dataset.counted = '0';
		el.textContent = '0';
	});

	const run = (el) => {
		if (el.dataset.counted === '1') return;
		el.dataset.counted = '1';
		const target = parseNumber(el.dataset.target);
		const decimals = Number(el.dataset.decimals || 0);
		const duration = Number(el.dataset.duration || 1800);
		animateCounter(el, target, { duration, decimals });
	};

	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) run(entry.target);
				});
			},
			{ threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
		);
		els.forEach((el) => io.observe(el));
	} else {
		els.forEach(run);
	}
})();

/* 3) Révélations au scroll (IO) */
(function revealOnScroll() {
	const targets = [
		...document.querySelectorAll('.mission-item'),
		...document.querySelectorAll('.section-chiffres .stat'),
		...document.querySelectorAll('.news'),
		...document.querySelectorAll('.logo-item'),
		...document.querySelectorAll('.live'),
		...document.querySelectorAll('.testimonial'),
	];
	if (!targets.length) return;

	targets.forEach((el) => el.classList.add('reveal'));

	if ('IntersectionObserver' in window) {
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						io.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
		);
		targets.forEach((el) => io.observe(el));
	} else {
		targets.forEach((el) => el.classList.add('is-visible'));
	}
})();

/* 4) Navbar "shrink" quand on scroll */
(function shrinkNavOnScroll() {
	const nav = document.querySelector('.navbar');
	if (!nav) return;
	const toggleShrink = () => {
		if (window.scrollY > 40) nav.classList.add('shrink');
		else nav.classList.remove('shrink');
	};
	toggleShrink();
	window.addEventListener('scroll', toggleShrink, { passive: true });
})();

/* 5) Ancrages lissés avec offset (sticky header friendly) */
(function smoothAnchorsWithOffset() {
	const header = document.querySelector('.navbar');
	const headerH = () => (header ? header.offsetHeight : 0);

	document.querySelectorAll('a[href^="#"]').forEach((link) => {
		link.addEventListener('click', (e) => {
			const id = link.getAttribute('href');
			if (!id || id === '#') return;
			const target = document.querySelector(id);
			if (!target) return;

			e.preventDefault();
			const y =
				target.getBoundingClientRect().top +
				window.scrollY -
				(headerH() + 10);
			window.scrollTo({ top: y, behavior: 'smooth' });
			history.pushState(null, '', id);
		});
	});
})();

/* 6) Bouton retour haut de page */
(function backToTop() {
	let btn = document.querySelector('.back-to-top');
	if (!btn) {
		btn = document.createElement('button');
		btn.className = 'back-to-top';
		btn.setAttribute('aria-label', 'Revenir en haut de page');
		btn.type = 'button';
		btn.textContent = '↑';
		document.body.appendChild(btn);
	}
	const onScroll = () => {
		if (window.scrollY > 500) btn.classList.add('show');
		else btn.classList.remove('show');
	};
	onScroll();
	window.addEventListener('scroll', onScroll, { passive: true });
	btn.addEventListener('click', () =>
		window.scrollTo({ top: 0, behavior: 'smooth' })
	);
})();

/* 7) Lightbox pour les Lives (overlay) + Escape */
(function livesLightbox() {
	const thumbs = document.querySelectorAll('.section-lives .live .thumb');
	if (!thumbs.length) return;

	const lb = document.createElement('div');
	lb.className = 'lightbox';
	lb.innerHTML = `
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Lecture du live">
      <button class="lightbox-close" aria-label="Fermer">✕</button>
      <iframe src="" title="Live vidéo" frameborder="0" allowfullscreen allow="autoplay"></iframe>
    </div>`;
	document.body.appendChild(lb);

	const iframe = lb.querySelector('iframe');
	const closeBtn = lb.querySelector('.lightbox-close');

	const close = () => {
		lb.classList.remove('open');
		iframe.src = '';
		document.documentElement.style.overflow = '';
		document.body.style.overflow = '';
	};
	closeBtn.addEventListener('click', close);
	lb.addEventListener('click', (e) => {
		if (e.target === lb) close();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') close();
	});

	const videoURLs = [
		'https://www.youtube.com/embed/dQw4w9WgXcQ',
		'https://www.youtube.com/embed/oHg5SJYRHA0',
		'https://www.youtube.com/embed/3GwjfUFyY6M',
	];

	thumbs.forEach((thumb, i) => {
		thumb.style.cursor = 'pointer';
		thumb.addEventListener('click', () => {
			iframe.src = videoURLs[i % videoURLs.length] + '?autoplay=1';
			lb.classList.add('open');
			// Empêche le scroll quand la lightbox est ouverte
			document.documentElement.style.overflow = 'hidden';
			document.body.style.overflow = 'hidden';
		});
	});
	// ============ Partenaires aléatoires en home (JSON) ============
	(function homePartnersRandom() {
		const grid = document.querySelector('#partenaires .logos-grid');
		if (!grid) return;

		const JSON_URL = 'assets/partners.json';

		// Shuffle Fisher-Yates (stable et performant)
		function shuffle(arr) {
			const a = arr.slice();
			for (let i = a.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[a[i], a[j]] = [a[j], a[i]];
			}
			return a;
		}

		function render(partners) {
			// Vide la grille (si des placeholders existent)
			grid.innerHTML = '';
			// Crée chaque tuile logo
			partners.forEach((p) => {
				const a = document.createElement('a');
				a.className = 'logo-item';
				a.href = p.link || 'nos_partenaires.html';
				a.target = a.href.startsWith('http') ? '_blank' : '';
				a.rel = a.target === '_blank' ? 'noopener' : '';
				a.setAttribute('aria-label', p.name || 'Partenaire');

				const img = document.createElement('img');
				img.src = p.logo;
				img.alt = p.name || 'Logo partenaire';
				img.loading = 'lazy';
				img.decoding = 'async';
				img.style.maxHeight = '70%';
				img.style.maxWidth = '80%';
				img.style.margin = '0 auto';
				img.style.display = 'block';

				a.appendChild(img);
				grid.appendChild(a);
			});
		}

		async function init() {
			try {
				const res = await fetch(JSON_URL, { cache: 'no-store' });
				if (!res.ok) throw new Error('HTTP ' + res.status);
				const data = await res.json();
				if (!Array.isArray(data) || data.length === 0) return;
				render(shuffle(data));
			} catch (err) {
				console.warn(
					'[homePartnersRandom] Échec du chargement JSON :',
					err
				);
				// Fallback : on conserve les placeholders existants (aucune erreur bloquante)
			}
		}

		// Lance au DOM ready (si ton script est en defer, c’est déjà OK)
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			init();
		}
	})();
})();
