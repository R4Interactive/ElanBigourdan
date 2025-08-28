// ============== script.js ==============
// Menu mobile (hamburger)
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');
if (toggle && menu) {
	toggle.addEventListener('click', () => {
		const open = menu.style.display === 'flex';
		menu.style.display = open ? 'none' : 'flex';
		toggle.setAttribute('aria-expanded', (!open).toString());
	});
}

// (Option) Close menu when clicking a link (mobile)
menu?.querySelectorAll('a').forEach((a) =>
	a.addEventListener('click', () => {
		if (window.innerWidth <= 680) menu.style.display = 'none';
	})
);

// Compteurs "Nos chiffres clés" — version corrigée
// Lit la cible depuis data-target (si présent) sinon depuis la valeur initiale,
// puis remplace visuellement par 0 et anime à l'apparition.

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

	function formatFR(n, decimals = 0) {
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
	}

	const easings = {
		easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
		linear: (t) => t,
	};

	function animateCounter(
		el,
		target,
		{ duration = 1500, decimals = 0, easing = 'easeOutCubic' } = {}
	) {
		if (prefersReduced || duration <= 0) {
			el.textContent = formatFR(target, decimals);
			return;
		}
		const ease = easings[easing] || easings.easeOutCubic;
		const start = performance.now();
		const from = 0;

		function frame(now) {
			const t = Math.min(1, (now - start) / duration);
			const value = from + (target - from) * ease(t);
			el.textContent = formatFR(value, decimals);
			if (t < 1) requestAnimationFrame(frame);
		}
		requestAnimationFrame(frame);
	}

	// Prépare chaque compteur : on mémorise la valeur initiale comme cible
	els.forEach((el) => {
		const initial =
			(el.dataset.target && el.dataset.target.trim()) ||
			el.textContent.trim();
		el.dataset.target = initial; // cible fiable
		el.dataset.counted = '0';
		el.textContent = '0'; // affichage temporaire avant anim
	});

	const run = (el) => {
		if (el.dataset.counted === '1') return;
		el.dataset.counted = '1';
		const target = parseNumber(el.dataset.target); // <-- on lit la vraie cible
		const decimals = Number(el.dataset.decimals || 0);
		const duration = Number(el.dataset.duration || 1800);
		animateCounter(el, target, {
			duration,
			decimals,
			easing: 'easeOutCubic',
		});
	};

	// Déclenchement à l'apparition
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
		// Fallback simple
		els.forEach((el) => run(el));
	}
})();
/* ===============================
   1) Révélations au scroll (IO)
   =============================== */
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

	// Pose la classe "reveal" par défaut (sans toucher le HTML)
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
		// Fallback
		targets.forEach((el) => el.classList.add('is-visible'));
	}
})();

/* ======================================
   2) Navbar "shrink" quand on scroll
   ====================================== */
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

/* ==========================================================
   3) Ancrages lissés avec offset (sticky header friendly)
   ========================================================== */
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

/* ======================================
   4) Bouton retour haut de page
   ====================================== */
(function backToTop() {
	// Injection du bouton si absent
	let btn = document.querySelector('.back-to-top');
	if (!btn) {
		btn = document.createElement('button');
		btn.className = 'back-to-top';
		btn.setAttribute('aria-label', 'Revenir en haut de page');
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

/* ======================================
   5) Lightbox pour les Lives (overlay)
   ====================================== */
(function livesLightbox() {
	const lives = document.querySelectorAll('.section-lives .live .thumb');
	if (!lives.length) return;

	// Injecte le markup de la lightbox
	const lb = document.createElement('div');
	lb.className = 'lightbox';
	lb.innerHTML = `
    <div class="lightbox-dialog">
      <button class="lightbox-close" aria-label="Fermer">✕</button>
      <iframe src="" title="Live vidéo" frameborder="0" allowfullscreen allow="autoplay"></iframe>
    </div>`;
	document.body.appendChild(lb);

	const iframe = lb.querySelector('iframe');
	const closeBtn = lb.querySelector('.lightbox-close');
	const close = () => {
		lb.classList.remove('open');
		iframe.src = '';
	};
	closeBtn.addEventListener('click', close);
	lb.addEventListener('click', (e) => {
		if (e.target === lb) close();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') close();
	});

	// Associe un lien vidéo (placeholder) à chaque vignette
	const videoURLs = [
		'https://www.youtube.com/embed/dQw4w9WgXcQ',
		'https://www.youtube.com/embed/oHg5SJYRHA0',
		'https://www.youtube.com/embed/3GwjfUFyY6M',
	];
	lives.forEach((thumb, i) => {
		thumb.style.cursor = 'pointer';
		thumb.addEventListener('click', () => {
			iframe.src = videoURLs[i % videoURLs.length] + '?autoplay=1';
			lb.classList.add('open');
		});
	});
})();
