(function () {
    'use strict';

    const API = 'api/index.php';
    let SITE = null;

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
    function pageName() {
        const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
        return file === '' || file === 'index' ? 'home' : file;
    }
    function telHref(s) {
        const raw = String(s || '').replace(/[^\d+]/g, '');
        return 'tel:' + (raw.startsWith('+') ? raw : raw);
    }
    function waHref(s) {
        return 'https://wa.me/' + String(s || '').replace(/[^\d]/g, '');
    }
    function mailHref(s) { return 'mailto:' + s; }
    function stars(n) {
        return Array.from({ length: 5 }, (_, i) => `<i class="fas fa-star${i < n ? '' : ''}"></i>`).join('');
    }

    async function load() {
        try {
            const res = await fetch(API + '?r=public', { headers: { Accept: 'application/json' } });
            const json = await res.json();
            if (!json.ok) return;
            SITE = json.data;
            window.AtelierNovaCMS = SITE;
            applyGlobal();
            applyPage();
            document.dispatchEvent(new CustomEvent('cms:ready', { detail: SITE }));
        } catch (err) {
            console.warn('CMS data unavailable, using static content.', err);
        }
    }

    function applyGlobal() {
        const s = SITE.settings || {};
        qsa('.navbar-brand .brand-text, .footer-brand').forEach((el) => {
            if (el.classList.contains('footer-brand')) {
                el.innerHTML = `<span class="brand-accent"> ${s.brand_text || ''} ${s.brand_accent || ''}</span>`;
            } else {
                el.textContent = s.brand_text || el.textContent;
            }
        });
        qsa('.navbar-brand .brand-accent').forEach((el) => { el.textContent = s.brand_accent || el.textContent; });
        qsa('.footer-text').forEach((el) => { el.textContent = s.footer_text || el.textContent; });
        qsa('a[href^="tel:"]').forEach((a) => {
            a.setAttribute('href', telHref(s.phone));
            if (a.querySelector('span') && /call|01700/i.test(a.textContent)) {
                const span = a.querySelector('span');
                if (span && /01700|Call:/.test(span.textContent)) span.textContent = span.textContent.replace(/01700-000000|Call:.*/, 'Call: ' + s.phone_display);
                else if (span && span.textContent.trim() === 'Call Now') { /* keep */ }
            }
            if (a.closest('.footer, .contact-item') && a.childNodes.length === 1) a.textContent = s.phone_display;
        });
        qsa('a[href*="wa.me"]').forEach((a) => a.setAttribute('href', waHref(s.whatsapp)));
        qsa('a[href^="mailto:"]').forEach((a) => {
            a.setAttribute('href', mailHref(s.email));
            if (a.textContent.includes('@')) a.textContent = s.email;
        });
        qsa('.footer p, .contact-item p').forEach((p) => {
            if (p.textContent.includes('Demo Studio') || p.textContent.includes('Example Road')) p.innerHTML = p.innerHTML.replace(/Demo Studio, 12 Example Road, Dhaka|[\w\s,]+Dhaka/, s.address);
        });
        qsa('.footer-social a[title="Facebook"], a[title="Facebook"]').forEach((a) => a.setAttribute('href', s.facebook || '#'));
        qsa('a[title="LinkedIn"]').forEach((a) => a.setAttribute('href', s.linkedin || '#'));
        qsa('a[title="Instagram"]').forEach((a) => a.setAttribute('href', s.instagram || '#'));
        qsa('.footer-bottom p').forEach((p) => {
            p.innerHTML = `&copy; ${s.copyright_year || '2024'} ${s.site_name || 'Atelier Nova'}. All rights reserved. <span class="footer-separator">|</span> Developed by <a href="${s.developer_url}" target="_blank" rel="noopener noreferrer">${s.developer_name}</a>`;
        });
        if (s.site_name) {
            const page = SITE.pages[pageName()];
            if (page && page.title) document.title = page.title;
        }
        const metaDesc = document.querySelector('meta[name="description"]');
        const page = SITE.pages[pageName()];
        if (metaDesc && page) metaDesc.setAttribute('content', page.meta_description || '');
    }

    function applyHero(page) {
        if (!page) return;
        qsa('.hero-background, .page-hero .hero-background').forEach((el) => {
            if (page.hero_image) el.style.backgroundImage = `url('${page.hero_image}')`;
        });
        qsa('.hero-badge span, .page-hero .hero-badge span').forEach((el) => { el.textContent = page.hero_badge; });
        const homeTitle = qs('.hero-title');
        if (homeTitle && page.hero_title) {
            const parts = String(page.hero_title).split('\n');
            homeTitle.innerHTML = `<span class="title-line">${parts[0] || ''}</span><span class="title-line accent">${parts[1] || parts[0] || ''}</span>`;
        }
        qsa('.page-hero-title').forEach((el) => { el.textContent = page.hero_title; });
        qsa('.tagline, .page-hero-tagline').forEach((el) => { el.textContent = page.hero_tagline; });
        qsa('.hero-description, .page-hero-description').forEach((el) => { el.textContent = page.hero_description; });
    }

    function renderStats(containerSelector, extraClass) {
        const wrap = qs(containerSelector);
        if (!wrap || !SITE.stats) return;
        wrap.innerHTML = SITE.stats.map((st) => extraClass === 'page'
            ? `<div class="page-stat"><div class="page-stat-number">${st.stat_value}</div><div class="page-stat-label">${st.stat_label}</div></div>`
            : `<div class="stat-item"><div class="stat-number">${st.stat_value}</div><div class="stat-label">${st.stat_label}</div></div>`
        ).join('');
    }

    function applyPage() {
        const name = pageName();
        const page = SITE.pages[name];
        applyHero(page);
        if (name === 'home') applyHome(page);
        if (name === 'about') applyAbout(page);
        if (name === 'services') applyServices(page);
        if (name === 'projects') applyProjects();
        if (name === 'contact') applyContact(page);
        if (name === 'careers') applyCareers(page);
        applyCta(page);
    }

    function applyHome(page) {
        const extra = page.extra || {};
        const intro = qs('.intro-section');
        if (intro) {
            const label = qs('.intro-section .section-label');
            const heading = qs('.intro-section .section-heading');
            const lead = qs('.intro-section .lead-text');
            const text = qs('.intro-section .intro-text');
            if (label) label.textContent = extra.intro_label || '';
            if (heading) heading.textContent = extra.intro_heading || '';
            if (lead) lead.textContent = extra.intro_lead || '';
            if (text) text.textContent = extra.intro_text || '';
            const img = qs('.intro-image img');
            if (img && extra.intro_image) { img.src = extra.intro_image; img.alt = extra.intro_heading || ''; }
            const badgeN = qs('.intro-badge .badge-number');
            const badgeT = qs('.intro-badge .badge-text');
            if (badgeN) badgeN.textContent = extra.intro_badge_number || '';
            if (badgeT) badgeT.textContent = extra.intro_badge_text || '';
            const feats = qs('.intro-features');
            if (feats && Array.isArray(extra.intro_features)) {
                feats.innerHTML = extra.intro_features.map((f) => `<div class="feature-item"><i class="fas fa-check-circle"></i><span>${f}</span></div>`).join('');
            }
        }
        renderStats('.hero-stats');
        const svcHeader = qs('.services-section .section-header');
        if (svcHeader) {
            svcHeader.querySelector('.section-label').textContent = extra.services_label || '';
            svcHeader.querySelector('.section-title').textContent = extra.services_title || '';
            svcHeader.querySelector('.section-subtitle').textContent = extra.services_subtitle || '';
        }
        const svcRow = qs('.services-section .row.g-4');
        if (svcRow) {
            svcRow.innerHTML = SITE.services.filter((s) => Number(s.show_on_home) !== 0).map((s) => `
                <div class="col-md-6 col-lg-3">
                    <div class="service-card">
                        <div class="service-card-inner">
                            <div class="service-icon" style="color:${s.icon_color || '#d4af37'}"><i class="${s.icon}"></i></div>
                            <h4>${s.title}</h4>
                            <p>${s.short_text || ''}</p>
                            <div class="service-link"><a href="services.html">Learn More <i class="fas fa-arrow-right"></i></a></div>
                        </div>
                    </div>
                </div>`).join('');
        }
        const projHeader = qs('.projects-section .section-header');
        if (projHeader && extra.projects_title) {
            projHeader.querySelector('.section-label').textContent = extra.projects_label || '';
            projHeader.querySelector('.section-title').textContent = extra.projects_title || '';
            projHeader.querySelector('.section-subtitle').textContent = extra.projects_subtitle || '';
        }
        const projRow = qs('.projects-section .row.g-4');
        if (projRow) {
            const featured = SITE.projects.filter((p) => Number(p.featured)).slice(0, 3);
            const list = featured.length ? featured : SITE.projects.slice(0, 3);
            projRow.innerHTML = list.map((p) => `
                <div class="col-md-6 col-lg-4">
                    <div class="project-card">
                        <div class="project-image">
                            <img src="${p.image}" alt="${p.title}">
                            <div class="project-overlay"><a href="projects.html" class="project-link"><i class="fas fa-arrow-right"></i></a></div>
                        </div>
                        <div class="project-content">
                            <span class="project-category">${p.category}</span>
                            <h5 class="project-title">${p.title}</h5>
                            <p class="project-text">${p.description || ''}</p>
                            <a href="projects.html" class="project-btn">View Project <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>`).join('');
        }
        const rating = qs('.trust-badge .rating');
        if (rating) rating.textContent = SITE.settings.google_rating || rating.textContent;
        const tLabel = qs('.testimonials-section .section-label');
        const tTitle = qs('.testimonials-section .section-heading');
        if (tLabel) tLabel.textContent = extra.testimonials_label || '';
        if (tTitle) tTitle.textContent = extra.testimonials_title || '';
        const tGrid = qs('.testimonials-grid');
        if (tGrid) {
            tGrid.innerHTML = SITE.testimonials.map((t) => `
                <div class="testimonial-card">
                    <div class="testimonial-rating">${stars(Number(t.rating) || 5)}</div>
                    <p class="testimonial-text">"${t.quote}"</p>
                    <div class="testimonial-author"><div class="author-info"><strong>${t.name}</strong><span>${t.role || ''}</span></div></div>
                </div>`).join('');
        }
    }

    function applyAbout(page) {
        const extra = page.extra || {};
        renderStats('.page-hero-stats', 'page');
        const phil = qs('.section .col-lg-6 h2');
        if (phil && phil.textContent.includes('Philosophy')) {
            phil.textContent = extra.philosophy_title || phil.textContent;
            const lead = phil.parentElement.querySelector('.lead');
            const paras = phil.parentElement.querySelectorAll('p:not(.lead)');
            if (lead) lead.textContent = extra.philosophy_lead || '';
            if (paras[0] && extra.philosophy_text) {
                const parts = extra.philosophy_text.split('\n\n');
                paras[0].textContent = parts[0] || extra.philosophy_text;
                if (paras[1]) paras[1].textContent = parts[1] || '';
            }
        }
        const philImg = qs('.section .card-img-top');
        if (philImg && extra.philosophy_image) philImg.src = extra.philosophy_image;
        const cards = qsa('.section-light .service-card');
        if (cards[0]) {
            cards[0].querySelector('h3').textContent = extra.vision_title || 'Our Vision';
            cards[0].querySelectorAll('p').forEach((p, i) => {
                const parts = (extra.vision_text || '').split('\n\n');
                p.textContent = parts[i] || p.textContent;
            });
            const icon = cards[0].querySelector('.service-icon i');
            if (icon && extra.vision_icon) icon.className = extra.vision_icon;
        }
        if (cards[1]) {
            cards[1].querySelector('h3').textContent = extra.mission_title || 'Our Mission';
            const p = cards[1].querySelector('p');
            if (p) p.textContent = extra.mission_text || '';
            const ul = cards[1].querySelector('ul');
            if (ul && extra.mission_points) ul.innerHTML = extra.mission_points.map((x) => `<li>${x}</li>`).join('');
            const icon = cards[1].querySelector('.service-icon i');
            if (icon && extra.mission_icon) icon.className = extra.mission_icon;
        }
        const valuesTitle = qsa('.section-title').find((h) => /Core Values/i.test(h.textContent));
        if (valuesTitle) valuesTitle.textContent = extra.values_title || valuesTitle.textContent;
        const valueSection = valuesTitle ? valuesTitle.parentElement.querySelector('.row') : null;
        if (valueSection) {
            valueSection.innerHTML = SITE.values.map((v) => `
                <div class="col-md-6 col-lg-3"><div class="service-card">
                    <div class="service-icon" style="color:${v.icon_color || '#d4af37'}"><i class="${v.icon}"></i></div>
                    <h4>${v.title}</h4><p>${v.body_text || ''}</p>
                </div></div>`).join('');
        }
        const whyTitle = qs('.section-dark .section-title');
        if (whyTitle) whyTitle.textContent = extra.why_title || whyTitle.textContent;
        const whyRow = qs('.section-dark .row');
        if (whyRow) {
            whyRow.innerHTML = SITE.why_choose.map((w) => `
                <div class="col-md-6 col-lg-4"><div class="testimonial">
                    <div class="service-icon" style="font-size:2.5rem;margin-bottom:1rem;color:${w.icon_color || '#d4af37'}"><i class="${w.icon}"></i></div>
                    <h4>${w.title}</h4><p>${w.body_text || ''}</p>
                </div></div>`).join('');
        }
    }

    function applyServices(page) {
        const extra = page.extra || {};
        const feats = qs('.page-hero-features');
        if (feats && extra.hero_features) {
            feats.innerHTML = extra.hero_features.map((f) => `<div class="page-feature-item"><i class="fas fa-check-circle"></i><span>${f}</span></div>`).join('');
        }
        const container = qs('.section .container');
        if (container && SITE.services.length) {
            const processSection = document.querySelectorAll('.section')[1];
            const html = SITE.services.map((s, i) => `
                <div class="row align-items-center mb-5 ${i % 2 ? 'flex-row-reverse' : ''}">
                    <div class="col-lg-6"><div class="service-card text-start">
                        <div class="service-icon" style="text-align:left;color:${s.icon_color || '#d4af37'}"><i class="${s.icon}"></i></div>
                        <h2>${s.title}</h2>
                        <p class="lead">${s.lead_text || ''}</p>
                        <p>${s.body_text || ''}</p>
                        <h5>What We Offer:</h5>
                        <ul style="list-style:disc;padding-left:1.5rem;color:var(--text-light);">${(s.offerings || []).map((o) => `<li>${o}</li>`).join('')}</ul>
                    </div></div>
                    <div class="col-lg-6"><div class="card"><img src="${s.image}" alt="${s.title}" class="card-img-top" style="height:400px;object-fit:cover;"></div></div>
                </div>`).join('');
            const firstSection = document.querySelectorAll('section.section')[0];
            if (firstSection) firstSection.querySelector('.container').innerHTML = html;
        }
        const processTitle = qsa('.section-title').find((h) => /Design Process/i.test(h.textContent));
        if (processTitle) processTitle.textContent = extra.process_title || processTitle.textContent;
        const processRow = processTitle ? processTitle.parentElement.querySelector('.row') : null;
        if (processRow) {
            processRow.innerHTML = SITE.process.map((p) => `
                <div class="col-md-6 col-lg-3"><div class="service-card">
                    <div class="service-icon" style="color:${p.icon_color || '#d4af37'}"><i class="${p.icon}"></i></div>
                    <h4>${p.title}</h4><p>${p.body_text || ''}</p>
                </div></div>`).join('');
        }
    }

    function applyProjects() {
        const grid = qs('#portfolioGrid');
        if (!grid) return;
        grid.innerHTML = SITE.projects.map((p) => `
            <div class="portfolio-item" data-category="${p.category}" data-id="${p.id}">
                <img src="${p.image}" alt="${p.title}">
                <div class="portfolio-overlay"><div><h4>${p.title}</h4><p>${p.location || ''}</p></div></div>
            </div>`).join('');
        if (window.AtelierNova) {
            /* filter rebind happens in main.js after cms:ready */
        }
    }

    function applyContact(page) {
        const extra = page.extra || {};
        const h2 = qs('.section h2');
        if (h2) h2.textContent = extra.form_title || h2.textContent;
        const intro = qs('.section .text-light.mb-4');
        if (intro) intro.textContent = extra.form_intro || intro.textContent;
        const s = SITE.settings;
        qsa('.contact-item').forEach((item) => {
            const h5 = item.querySelector('h5');
            const p = item.querySelector('p');
            if (!h5 || !p) return;
            if (h5.textContent === 'Address') p.textContent = s.address;
            if (h5.textContent === 'Phone') p.innerHTML = `<a href="${telHref(s.phone)}">${s.phone_display}</a>`;
            if (h5.textContent === 'Email') p.innerHTML = `<a href="${mailHref(s.email)}">${s.email}</a>`;
            if (h5.textContent === 'Business Hours') p.innerHTML = (s.hours_detail || '').replace(/\n/g, '<br>');
        });
        const mapLink = qs('a[href*="google.com/maps"]');
        if (mapLink && s.map_url) mapLink.href = s.map_url;
    }

    function applyCareers(page) {
        const extra = page.extra || {};
        const header = qs('.section .section-header');
        if (header && extra.openings_title) {
            header.querySelector('.section-label').textContent = extra.openings_label || '';
            header.querySelector('.section-title').textContent = extra.openings_title || '';
            header.querySelector('.section-subtitle').textContent = extra.openings_subtitle || '';
        }
        const section = qs('section.section .container');
        if (section) {
            const jobsHtml = SITE.jobs.map((job) => `
                <div class="job-card">
                    <div class="job-card-header"><div class="job-badge">${job.badge || 'Hiring'}</div><div class="job-type">${job.job_type || 'Full Time'}</div></div>
                    <div class="job-card-body">
                        <h3 class="job-title">${job.title}</h3>
                        <div class="job-meta">
                            <span class="job-meta-item"><i class="fas fa-briefcase"></i><span>${job.department || ''}</span></span>
                            <span class="job-meta-item"><i class="fas fa-map-marker-alt"></i><span>${job.location || ''}</span></span>
                            <span class="job-meta-item"><i class="fas fa-dollar-sign"></i><span>${job.salary || ''}</span></span>
                        </div>
                        <div class="job-description">
                            <h5>Job Description</h5>
                            <p>${job.description || ''}</p>
                            <h5>Requirements</h5>
                            <div class="requirements-list">
                                ${(job.requirements || []).map((r) => `<div class="requirement-item"><i class="fas fa-check-circle"></i><span>${r}</span></div>`).join('')}
                                ${(job.software || []).length ? `<ul class="software-list">${job.software.map((sw) => `<li><i class="fas fa-check"></i> ${sw}</li>`).join('')}</ul>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="job-card-footer">
                        <button class="btn btn-primary apply-btn" data-job="${job.title}"><i class="fas fa-paper-plane"></i><span>Apply Now</span></button>
                    </div>
                </div>`).join('');
            const headerEl = section.querySelector('.section-header');
            const cards = qsa('.job-card');
            cards.forEach((c) => c.remove());
            if (headerEl) headerEl.insertAdjacentHTML('afterend', jobsHtml);
        }
        const benefitTitle = qsa('.section-title').find((h) => /Why Join/i.test(h.textContent));
        if (benefitTitle) {
            benefitTitle.textContent = extra.benefits_title || benefitTitle.textContent;
            const row = benefitTitle.parentElement.parentElement.querySelector('.row');
            if (row) {
                row.innerHTML = SITE.benefits.map((b) => `
                    <div class="col-md-6 col-lg-4"><div class="service-card">
                        <div class="service-icon" style="color:${b.icon_color || '#d4af37'}"><i class="${b.icon}"></i></div>
                        <h4>${b.title}</h4><p>${b.body_text || ''}</p>
                    </div></div>`).join('');
            }
        }
    }

    function applyCta(page) {
        if (!page || !page.extra) return;
        const cta = qs('.cta-section');
        if (!cta) return;
        const h = cta.querySelector('h1, .cta-title');
        const p = cta.querySelector('p, .cta-text');
        if (h && page.extra.cta_title) h.textContent = page.extra.cta_title;
        if (p && page.extra.cta_text) p.textContent = page.extra.cta_text;
    }

    document.addEventListener('DOMContentLoaded', load);
})();
