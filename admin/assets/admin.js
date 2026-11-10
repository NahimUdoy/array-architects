const API = '../api/index.php';
const ICONS = [
    'fas fa-drafting-compass','fas fa-couch','fas fa-city','fas fa-handshake','fas fa-eye','fas fa-bullseye','fas fa-star','fas fa-lightbulb','fas fa-leaf','fas fa-award','fas fa-users','fas fa-comments','fas fa-tools','fas fa-dollar-sign','fas fa-clock','fas fa-heart','fas fa-graduation-cap','fas fa-hard-hat','fas fa-file-alt','fas fa-pencil-ruler','fas fa-building','fas fa-house','fas fa-map-marker-alt','fas fa-phone','fas fa-envelope','fas fa-check-circle','fas fa-compass','fas fa-layer-group','fas fa-ruler-combined','fas fa-tree','fas fa-gem','fas fa-briefcase'
];
const COLORS = ['#d4af37','#1a1a1a','#2c2c2c','#8b5a2b','#3d5a40','#4a6fa5','#b23a48','#6b4f9c','#c97b2a','#2e8b7a'];
const PAGE_FILES = { home: '../index.html', about: '../about.html', services: '../services.html', projects: '../projects.html', contact: '../contact.html', careers: '../careers.html' };

const app = document.getElementById('app');
const toastEl = document.getElementById('toast');
const modalBg = document.getElementById('modalBg');
let mediaCache = [];

function asset(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
    return '../' + String(url).replace(/^\.\.\//, '');
}

async function api(route, options = {}) {
    const res = await fetch(`${API}?r=${route}`, {
        credentials: 'same-origin',
        ...options,
        headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const json = await res.json().catch(() => ({ ok: false, error: 'Server error' }));
    if (res.status === 401) {
        location.href = 'login.html';
        throw new Error('Please sign in.');
    }
    if (!json.ok) throw new Error(json.error || 'Request failed');
    return json.data;
}

function toast(message) {
    toastEl.textContent = message;
    toastEl.style.display = 'block';
    setTimeout(() => { toastEl.style.display = 'none'; }, 2600);
}

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function field(label, name, value, type = 'text') {
    if (type === 'textarea') {
        return `<div><label>${esc(label)}</label><textarea name="${name}">${esc(value)}</textarea></div>`;
    }
    return `<div><label>${esc(label)}</label><input name="${name}" type="${type}" value="${esc(value)}"></div>`;
}

function imageField(name, url, label = 'Image') {
    return `<div>
        <label>${esc(label)}</label>
        <div class="dropzone" data-image-field="${name}">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif">
            <strong>Drop an image here or click to upload</strong>
            <div class="help">JPG, PNG, WEBP or GIF. Preview appears instantly.</div>
            <input type="hidden" name="${name}" value="${esc(url || '')}">
            <div class="image-preview">${url ? `<img src="${esc(asset(url))}" alt="Preview">` : '<span class="muted">No image yet</span>'}</div>
            <div style="margin-top:.7rem; display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-sm" data-library="${name}"><i class="fas fa-images"></i> Choose from library</button>
                <button type="button" class="btn btn-danger btn-sm" data-clear="${name}">Remove</button>
            </div>
        </div>
    </div>`;
}

function iconField(name, icon, color) {
    return `<div>
        <label>Icon & color</label>
        <div class="color-row" style="margin-bottom:.7rem;">
            <div class="icon-live" data-icon-live="${name}" style="color:${esc(color || '#d4af37')}"><i class="${esc(icon || 'fas fa-star')}"></i></div>
            <input type="hidden" name="${name}" value="${esc(icon || 'fas fa-star')}">
            <input type="hidden" name="${name}_color" value="${esc(color || '#d4af37')}">
            ${COLORS.map((c) => `<button type="button" class="swatch" data-color-for="${name}" data-color="${c}" style="background:${c}"></button>`).join('')}
            <input type="color" value="${esc(color || '#d4af37')}" data-color-input="${name}" title="Custom color">
        </div>
        <div class="icon-grid">
            ${ICONS.map((ic) => `<button type="button" class="icon-btn ${ic === icon ? 'active' : ''}" data-icon-for="${name}" data-icon="${ic}"><i class="${ic}"></i></button>`).join('')}
        </div>
    </div>`;
}

function previewBox(html) {
    return `<div class="preview-frame"><div class="preview-card">${html}</div></div>`;
}

function bindImageFields(root) {
    root.querySelectorAll('[data-image-field]').forEach((zone) => {
        const name = zone.dataset.imageField;
        const fileInput = zone.querySelector('input[type="file"]');
        const hidden = zone.querySelector(`input[name="${name}"]`);
        const preview = zone.querySelector('.image-preview');
        const setUrl = (url) => {
            hidden.value = url;
            preview.innerHTML = url ? `<img src="${esc(asset(url))}" alt="Preview">` : '<span class="muted">No image yet</span>';
            root.dispatchEvent(new Event('preview-change', { bubbles: true }));
        };
        zone.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            fileInput.click();
        });
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag');
            if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0], setUrl);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) uploadFile(fileInput.files[0], setUrl);
        });
        zone.querySelector(`[data-clear="${name}"]`)?.addEventListener('click', (e) => {
            e.stopPropagation();
            setUrl('');
        });
        zone.querySelector(`[data-library="${name}"]`)?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await openLibrary(setUrl);
        });
    });
}

function bindIconFields(root) {
    root.querySelectorAll('[data-icon-for]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.iconFor;
            root.querySelector(`input[name="${name}"]`).value = btn.dataset.icon;
            root.querySelectorAll(`[data-icon-for="${name}"]`).forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const live = root.querySelector(`[data-icon-live="${name}"]`);
            if (live) live.innerHTML = `<i class="${btn.dataset.icon}"></i>`;
            root.dispatchEvent(new Event('preview-change', { bubbles: true }));
        });
    });
    const applyColor = (name, color) => {
        const hidden = root.querySelector(`input[name="${name}_color"]`);
        const live = root.querySelector(`[data-icon-live="${name}"]`);
        if (hidden) hidden.value = color;
        if (live) live.style.color = color;
        const picker = root.querySelector(`[data-color-input="${name}"]`);
        if (picker) picker.value = color;
        root.dispatchEvent(new Event('preview-change', { bubbles: true }));
    };
    root.querySelectorAll('[data-color-for]').forEach((btn) => {
        btn.addEventListener('click', () => applyColor(btn.dataset.colorFor, btn.dataset.color));
    });
    root.querySelectorAll('[data-color-input]').forEach((input) => {
        input.addEventListener('input', () => applyColor(input.dataset.colorInput, input.value));
    });
}

async function uploadFile(file, onDone) {
    const body = new FormData();
    body.append('file', file);
    try {
        const data = await api('upload', { method: 'POST', body });
        mediaCache.unshift(data);
        onDone(data.url);
        toast('Image uploaded.');
    } catch (err) {
        toast(err.message);
    }
}

async function openLibrary(onPick) {
    const items = mediaCache.length ? mediaCache : await api('media');
    mediaCache = items;
    modalBg.classList.add('show');
    modalBg.innerHTML = `<div class="modal">
        <h3>Media library</h3>
        <p class="muted">Click an image to use it.</p>
        <div class="media-grid">${items.map((m) => `<div class="media-item" data-url="${esc(m.url)}"><img src="${esc(asset(m.url))}" alt=""></div>`).join('') || '<p>No images yet. Upload one first.</p>'}</div>
        <div style="margin-top:1rem;"><button class="btn btn-ghost" type="button" id="closeLib">Close</button></div>
    </div>`;
    modalBg.querySelectorAll('.media-item').forEach((el) => {
        el.addEventListener('click', () => {
            onPick(el.dataset.url);
            modalBg.classList.remove('show');
        });
    });
    modalBg.querySelector('#closeLib').addEventListener('click', () => modalBg.classList.remove('show'));
}

function formValues(form) {
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    return data;
}

const titles = {
    dashboard: 'Dashboard',
    settings: 'Studio settings',
    home: 'Home page',
    about: 'About page',
    services: 'Services',
    projects: 'Projects',
    testimonials: 'Testimonials',
    careers: 'Careers',
    inquiries: 'Project inquiries',
    applications: 'Job applications',
    media: 'Media library',
    preview: 'Website preview'
};

async function render() {
    const route = (location.hash.replace('#/', '') || 'dashboard').split('/')[0];
    document.getElementById('pageTitle').textContent = titles[route] || 'Admin';
    document.querySelectorAll('#sideNav a').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
    try {
        if (route === 'dashboard') return viewDashboard();
        if (route === 'settings') return viewSettings();
        if (route === 'home') return viewPage('home');
        if (route === 'about') return viewPage('about');
        if (route === 'services') return viewCollection('services');
        if (route === 'projects') return viewCollection('projects');
        if (route === 'testimonials') return viewCollection('testimonials');
        if (route === 'careers') return viewCareers();
        if (route === 'inquiries') return viewInbox('inquiries');
        if (route === 'applications') return viewInbox('applications');
        if (route === 'media') return viewMedia();
        if (route === 'preview') return viewPreview();
        app.innerHTML = '<div class="card">Page not found.</div>';
    } catch (err) {
        app.innerHTML = `<div class="card"><p>${esc(err.message)}</p></div>`;
    }
}

async function viewDashboard() {
    const data = await api('dashboard');
    app.innerHTML = `
        <div class="cards">
            ${[['Projects', data.counts.projects], ['Services', data.counts.services], ['Open jobs', data.counts.jobs], ['New inquiries', data.counts.inquiries], ['New applications', data.counts.applications], ['Images', data.counts.media]].map(([lbl, n]) => `<div class="card stat-card"><div class="num">${n}</div><div class="lbl">${lbl}</div></div>`).join('')}
        </div>
        <div class="grid grid-2" style="margin-top:1rem;">
            <div class="card">
                <h3>Latest inquiries</h3>
                ${data.recent_inquiries.map((r) => `<p><strong>${esc(r.name)}</strong> · ${esc(r.project_type)} <span class="badge">${esc(r.status)}</span></p>`).join('') || '<p>No inquiries yet.</p>'}
            </div>
            <div class="card">
                <h3>Latest applications</h3>
                ${data.recent_applications.map((r) => `<p><strong>${esc(r.name)}</strong> · ${esc(r.position)} <span class="badge">${esc(r.status)}</span></p>`).join('') || '<p>No applications yet.</p>'}
            </div>
        </div>
        <div class="card" style="margin-top:1rem;">
            <h3>Website preview</h3>
            <iframe class="site-preview" src="../index.html" title="Live website"></iframe>
        </div>`;
}

async function viewSettings() {
    const s = await api('settings');
    app.innerHTML = `<form class="grid grid-2" id="settingsForm">
        <div class="card form-grid">
            ${field('Studio name', 'site_name', s.site_name)}
            <div class="form-row">
                ${field('Brand first word', 'brand_text', s.brand_text)}
                ${field('Brand accent word', 'brand_accent', s.brand_accent)}
            </div>
            ${field('Tagline', 'tagline', s.tagline)}
            ${field('Footer text', 'footer_text', s.footer_text, 'textarea')}
            ${imageField('logo', s.logo, 'Logo (optional)')}
            <button class="btn btn-accent" type="submit">Save settings</button>
        </div>
        <div class="card form-grid">
            ${field('Phone display', 'phone_display', s.phone_display)}
            ${field('Phone tel link', 'phone', s.phone)}
            ${field('Email', 'email', s.email, 'email')}
            ${field('WhatsApp number', 'whatsapp', s.whatsapp)}
            ${field('Address', 'address', s.address)}
            ${field('Hours', 'hours', s.hours)}
            ${field('Hours note', 'hours_note', s.hours_note)}
            ${field('Hours detail', 'hours_detail', s.hours_detail, 'textarea')}
            ${field('Facebook URL', 'facebook', s.facebook, 'url')}
            ${field('LinkedIn URL', 'linkedin', s.linkedin, 'url')}
            ${field('Instagram URL', 'instagram', s.instagram, 'url')}
            ${field('Map URL', 'map_url', s.map_url, 'url')}
            ${field('Google rating', 'google_rating', s.google_rating)}
            ${field('Rating label', 'google_rating_label', s.google_rating_label)}
        </div>
    </form>
    <div class="card" style="margin-top:1rem;" id="settingsPreview"></div>`;
    bindImageFields(app);
    const preview = () => {
        const f = formValues(document.getElementById('settingsForm'));
        document.getElementById('settingsPreview').innerHTML = `
            <h3>How contact details look on the website</h3>
            <div class="navbar" style="position:relative;">
                <div class="navbar-brand"><span class="brand-text">${esc(f.brand_text)}</span> <span class="brand-accent">${esc(f.brand_accent)}</span></div>
            </div>
            <p><i class="fas fa-map-marker-alt"></i> ${esc(f.address)}</p>
            <p><i class="fas fa-phone"></i> ${esc(f.phone_display)}</p>
            <p><i class="fas fa-envelope"></i> ${esc(f.email)}</p>
            <p>${esc(f.footer_text)}</p>`;
    };
    preview();
    app.addEventListener('input', preview);
    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await api('settings', { method: 'PUT', body: JSON.stringify(formValues(e.target)) });
        toast('Settings saved. Open the website to see them live.');
    });
}

async function viewPage(slug) {
    const pages = await api('pages');
    const page = pages[slug];
    const extra = page.extra || {};
    const extraFields = Object.keys(extra).filter((k) => !['intro_features', 'mission_points', 'hero_features'].includes(k) && !k.endsWith('_image') && !k.endsWith('_icon'));
    app.innerHTML = `<form id="pageForm" class="grid grid-2">
        <div class="card form-grid">
            ${field('Browser title', 'title', page.title)}
            ${field('Meta description', 'meta_description', page.meta_description, 'textarea')}
            ${field('Hero badge', 'hero_badge', page.hero_badge)}
            ${field('Hero title', 'hero_title', page.hero_title, 'textarea')}
            ${field('Hero tagline', 'hero_tagline', page.hero_tagline)}
            ${field('Hero description', 'hero_description', page.hero_description, 'textarea')}
            ${imageField('hero_image', page.hero_image, 'Hero background image')}
            ${slug === 'home' ? imageField('intro_image', extra.intro_image, 'About / intro image') : ''}
            ${slug === 'about' ? imageField('philosophy_image', extra.philosophy_image, 'Philosophy image') : ''}
            ${extraFields.map((key) => field(key.replaceAll('_', ' '), 'extra_' + key, extra[key], String(extra[key] || '').length > 80 ? 'textarea' : 'text')).join('')}
            ${Array.isArray(extra.intro_features) ? field('Intro features (one per line)', 'extra_intro_features', extra.intro_features.join('\n'), 'textarea') : ''}
            ${Array.isArray(extra.mission_points) ? field('Mission points (one per line)', 'extra_mission_points', extra.mission_points.join('\n'), 'textarea') : ''}
            ${Array.isArray(extra.hero_features) ? field('Hero features (one per line)', 'extra_hero_features', extra.hero_features.join('\n'), 'textarea') : ''}
            <button class="btn btn-accent" type="submit">Save page</button>
            <a class="btn btn-ghost" href="${PAGE_FILES[slug]}" target="_blank">Open live page</a>
        </div>
        <div>
            <div class="card" id="pagePreview"></div>
            <div class="card" style="margin-top:1rem;">
                <h3>Live website</h3>
                <iframe class="site-preview" src="${PAGE_FILES[slug]}" title="Page preview"></iframe>
            </div>
        </div>
    </form>`;
    bindImageFields(app);
    const paint = () => {
        const f = formValues(document.getElementById('pageForm'));
        document.getElementById('pagePreview').innerHTML = `
            <h3>Hero preview</h3>
            <div class="preview-hero" style="background-image:url('${esc(asset(f.hero_image))}')">
                <div class="hero-badge"><span>${esc(f.hero_badge)}</span></div>
                <h1 style="white-space:pre-line; font-size:2.2rem;">${esc(f.hero_title)}</h1>
                <p class="page-hero-tagline">${esc(f.hero_tagline)}</p>
                <p>${esc(f.hero_description)}</p>
            </div>`;
    };
    paint();
    app.addEventListener('input', paint);
    app.addEventListener('preview-change', paint);
    document.getElementById('pageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = formValues(e.target);
        const nextExtra = { ...extra };
        Object.keys(f).forEach((key) => {
            if (key.startsWith('extra_')) {
                const real = key.slice(6);
                if (['intro_features', 'mission_points', 'hero_features'].includes(real)) {
                    nextExtra[real] = f[key].split('\n').map((x) => x.trim()).filter(Boolean);
                } else {
                    nextExtra[real] = f[key];
                }
            }
        });
        if (f.intro_image) nextExtra.intro_image = f.intro_image;
        if (f.philosophy_image) nextExtra.philosophy_image = f.philosophy_image;
        await api('pages/' + slug, {
            method: 'PUT',
            body: JSON.stringify({
                title: f.title,
                meta_description: f.meta_description,
                meta_keywords: page.meta_keywords,
                hero_badge: f.hero_badge,
                hero_title: f.hero_title,
                hero_tagline: f.hero_tagline,
                hero_description: f.hero_description,
                hero_image: f.hero_image,
                extra: nextExtra
            })
        });
        toast('Page saved. The live preview below shows the website.');
        const frame = app.querySelector('iframe');
        frame.src = PAGE_FILES[slug] + '?t=' + Date.now();
    });
}

function collectionConfig(name) {
    const map = {
        services: {
            route: 'services',
            title: 'Services',
            columns: ['image', 'title', 'icon'],
            fields: (row = {}) => `
                ${field('Title', 'title', row.title || '')}
                ${field('Short home text', 'short_text', row.short_text || '', 'textarea')}
                ${field('Lead text', 'lead_text', row.lead_text || '', 'textarea')}
                ${field('Details', 'body_text', row.body_text || '', 'textarea')}
                ${field('What we offer (one per line)', 'offerings', (decodeList(row.offerings) || []).join('\n'), 'textarea')}
                ${imageField('image', row.image || '', 'Service image')}
                ${iconField('icon', row.icon || 'fas fa-drafting-compass', row.icon_color || '#d4af37')}
                ${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}
                <label><input type="checkbox" name="show_on_home" ${String(row.show_on_home) !== '0' ? 'checked' : ''}> Show on home page</label>`,
            preview: (f) => `<div class="service-card"><div class="service-icon" style="color:${esc(f.icon_color)}"><i class="${esc(f.icon)}"></i></div><h4>${esc(f.title)}</h4><p>${esc(f.short_text)}</p>${f.image ? `<img src="${esc(asset(f.image))}" alt="" style="height:160px;width:100%;object-fit:cover;border-radius:12px;">` : ''}</div>`,
            payload: (f, row) => ({
                title: f.title,
                slug: (f.title || 'service').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                short_text: f.short_text,
                lead_text: f.lead_text,
                body_text: f.body_text,
                icon: f.icon,
                icon_color: f.icon_color,
                image: f.image,
                offerings: f.offerings.split('\n').map((x) => x.trim()).filter(Boolean),
                sort_order: Number(f.sort_order || 1),
                show_on_home: f.show_on_home ? 1 : 0
            })
        },
        projects: {
            route: 'projects',
            title: 'Projects',
            columns: ['image', 'title', 'category'],
            fields: (row = {}) => `
                ${field('Title', 'title', row.title || '')}
                <div><label>Category</label><select name="category">${['residential','commercial','institutional','interior'].map((c) => `<option ${row.category === c ? 'selected' : ''} value="${c}">${c}</option>`).join('')}</select></div>
                ${field('Location', 'location', row.location || '')}
                ${field('Description', 'description', row.description || '', 'textarea')}
                ${imageField('image', row.image || '', 'Project photo')}
                <div class="form-row">
                    ${field('Year', 'year', row.year || '2023')}
                    ${field('Area', 'area', row.area || '')}
                </div>
                <div class="form-row">
                    ${field('Status', 'status', row.status || 'Completed')}
                    ${field('Duration', 'duration', row.duration || '')}
                </div>
                ${field('Features (one per line)', 'features', (decodeList(row.features) || []).join('\n'), 'textarea')}
                ${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}
                <label><input type="checkbox" name="featured" ${Number(row.featured) ? 'checked' : ''}> Featured on home</label>`,
            preview: (f) => `<div class="project-card"><div class="project-image">${f.image ? `<img src="${esc(asset(f.image))}" alt="">` : ''}</div><div class="project-content"><span class="project-category">${esc(f.category)}</span><h5 class="project-title">${esc(f.title)}</h5><p class="project-text">${esc(f.description)}</p></div></div>`,
            payload: (f) => ({
                title: f.title, category: f.category, location: f.location, description: f.description, image: f.image,
                year: f.year, area: f.area, status: f.status, client: 'Confidential', duration: f.duration,
                features: f.features.split('\n').map((x) => x.trim()).filter(Boolean),
                featured: f.featured ? 1 : 0, sort_order: Number(f.sort_order || 1)
            })
        },
        testimonials: {
            route: 'testimonials',
            title: 'Testimonials',
            columns: ['name', 'role', 'rating'],
            fields: (row = {}) => `
                ${field('Name', 'name', row.name || '')}
                ${field('Role', 'role', row.role || '')}
                ${field('Quote', 'quote', row.quote || '', 'textarea')}
                ${field('Rating (1-5)', 'rating', row.rating || 5, 'number')}
                ${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}`,
            preview: (f) => `<div class="testimonial-card"><p class="testimonial-text">"${esc(f.quote)}"</p><strong>${esc(f.name)}</strong><div class="muted">${esc(f.role)}</div></div>`,
            payload: (f) => ({ name: f.name, role: f.role, quote: f.quote, rating: Number(f.rating || 5), sort_order: Number(f.sort_order || 1) })
        },
        values: {
            route: 'values', title: 'Core values', columns: ['title', 'icon'],
            fields: (row = {}) => `${field('Title', 'title', row.title || '')}${field('Text', 'body_text', row.body_text || '', 'textarea')}${iconField('icon', row.icon, row.icon_color)}${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}`,
            preview: (f) => `<div class="service-card"><div class="service-icon" style="color:${esc(f.icon_color)}"><i class="${esc(f.icon)}"></i></div><h4>${esc(f.title)}</h4><p>${esc(f.body_text)}</p></div>`,
            payload: (f) => ({ title: f.title, body_text: f.body_text, icon: f.icon, icon_color: f.icon_color, sort_order: Number(f.sort_order || 1) })
        },
        'why-choose': {
            route: 'why-choose', title: 'Why choose us', columns: ['title', 'icon'],
            fields: (row = {}) => `${field('Title', 'title', row.title || '')}${field('Text', 'body_text', row.body_text || '', 'textarea')}${iconField('icon', row.icon, row.icon_color)}${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}`,
            preview: (f) => `<div class="service-card"><div class="service-icon" style="color:${esc(f.icon_color)}"><i class="${esc(f.icon)}"></i></div><h4>${esc(f.title)}</h4><p>${esc(f.body_text)}</p></div>`,
            payload: (f) => ({ title: f.title, body_text: f.body_text, icon: f.icon, icon_color: f.icon_color, sort_order: Number(f.sort_order || 1) })
        },
        benefits: {
            route: 'benefits', title: 'Career benefits', columns: ['title', 'icon'],
            fields: (row = {}) => `${field('Title', 'title', row.title || '')}${field('Text', 'body_text', row.body_text || '', 'textarea')}${iconField('icon', row.icon, row.icon_color)}${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}`,
            preview: (f) => `<div class="service-card"><div class="service-icon" style="color:${esc(f.icon_color)}"><i class="${esc(f.icon)}"></i></div><h4>${esc(f.title)}</h4><p>${esc(f.body_text)}</p></div>`,
            payload: (f) => ({ title: f.title, body_text: f.body_text, icon: f.icon, icon_color: f.icon_color, sort_order: Number(f.sort_order || 1) })
        },
        jobs: {
            route: 'jobs', title: 'Job openings', columns: ['title', 'badge', 'job_type'],
            fields: (row = {}) => `
                ${field('Job title', 'title', row.title || '')}
                <div class="form-row">${field('Badge', 'badge', row.badge || 'Hiring')}${field('Type', 'job_type', row.job_type || 'Full Time')}</div>
                ${field('Department', 'department', row.department || '')}
                ${field('Location', 'location', row.location || '')}
                ${field('Salary', 'salary', row.salary || '')}
                ${field('Description', 'description', row.description || '', 'textarea')}
                ${field('Requirements (one per line)', 'requirements', (decodeList(row.requirements) || []).join('\n'), 'textarea')}
                ${field('Software (one per line)', 'software', (decodeList(row.software) || []).join('\n'), 'textarea')}
                ${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}
                <label><input type="checkbox" name="is_open" ${String(row.is_open) !== '0' ? 'checked' : ''}> Published on careers page</label>`,
            preview: (f) => `<div class="job-card"><div class="job-card-header"><div class="job-badge">${esc(f.badge)}</div><div class="job-type">${esc(f.job_type)}</div></div><h3 class="job-title">${esc(f.title)}</h3><p>${esc(f.description)}</p></div>`,
            payload: (f) => ({
                title: f.title, badge: f.badge, job_type: f.job_type, department: f.department, location: f.location, salary: f.salary, description: f.description,
                requirements: f.requirements.split('\n').map((x) => x.trim()).filter(Boolean),
                software: f.software.split('\n').map((x) => x.trim()).filter(Boolean),
                facebook_url: '', is_open: f.is_open ? 1 : 0, sort_order: Number(f.sort_order || 1)
            })
        },
        process: {
            route: 'process', title: 'Design process', columns: ['title', 'icon'],
            fields: (row = {}) => `${field('Title', 'title', row.title || '')}${field('Text', 'body_text', row.body_text || '', 'textarea')}${iconField('icon', row.icon, row.icon_color)}${field('Sort order', 'sort_order', row.sort_order || 1, 'number')}`,
            preview: (f) => `<div class="service-card"><div class="service-icon" style="color:${esc(f.icon_color)}"><i class="${esc(f.icon)}"></i></div><h4>${esc(f.title)}</h4><p>${esc(f.body_text)}</p></div>`,
            payload: (f) => ({ title: f.title, body_text: f.body_text, icon: f.icon, icon_color: f.icon_color, sort_order: Number(f.sort_order || 1) })
        }
    };
    return map[name];
}

function decodeList(value) {
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value || '[]'); } catch { return []; }
}

async function viewCollection(name) {
    const cfg = collectionConfig(name);
    const rows = await api(cfg.route);
    app.innerHTML = `<div class="card" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
        <h3>${cfg.title}</h3>
        <button class="btn btn-accent" id="addItem"><i class="fas fa-plus"></i> Add new</button>
    </div>
    <div class="card">
        <table class="table">
            <thead><tr>${cfg.columns.map((c) => `<th>${c}</th>`).join('')}<th></th></tr></thead>
            <tbody>
                ${rows.map((row) => `<tr>
                    ${cfg.columns.map((c) => `<td>${c === 'image' ? (row.image ? `<img class="thumb" src="${esc(asset(row.image))}" alt="">` : '—') : c === 'icon' ? `<i class="${esc(row.icon)}" style="color:${esc(row.icon_color || '#d4af37')}"></i>` : esc(row[c])}</td>`).join('')}
                    <td><button class="btn btn-ghost btn-sm" data-edit="${row.id}">Edit</button> <button class="btn btn-danger btn-sm" data-del="${row.id}">Delete</button></td>
                </tr>`).join('')}
            </tbody>
        </table>
    </div>
    <div id="editor"></div>`;
    app.querySelector('#addItem').addEventListener('click', () => openEditor(cfg, {}));
    app.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditor(cfg, rows.find((r) => String(r.id) === btn.dataset.edit))));
    app.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
        if (!confirm('Delete this item?')) return;
        await api(`${cfg.route}/${btn.dataset.del}`, { method: 'DELETE' });
        toast('Deleted.');
        viewCollection(name);
    }));
}

function openEditor(cfg, row) {
    const editor = document.getElementById('editor');
    editor.innerHTML = `<div class="grid grid-2" style="margin-top:1rem;">
        <form class="card form-grid" id="editForm">
            <h3>${row.id ? 'Edit' : 'Add'} ${cfg.title.replace(/s$/, '')}</h3>
            ${cfg.fields(row)}
            <button class="btn btn-accent" type="submit">Save and preview</button>
        </form>
        <div class="card"><h3>Website look</h3><div id="livePrev"></div></div>
    </div>`;
    bindImageFields(editor);
    bindIconFields(editor);
    const paint = () => {
        const f = formValues(document.getElementById('editForm'));
        if (!f.icon_color) f.icon_color = row.icon_color || '#d4af37';
        document.getElementById('livePrev').innerHTML = cfg.preview(f);
    };
    paint();
    editor.addEventListener('input', paint);
    editor.addEventListener('preview-change', paint);
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = formValues(e.target);
        f.show_on_home = e.target.show_on_home?.checked;
        f.featured = e.target.featured?.checked;
        f.is_open = e.target.is_open?.checked;
        const payload = cfg.payload(f, row);
        if (row.id) await api(`${cfg.route}/${row.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        else await api(cfg.route, { method: 'POST', body: JSON.stringify(payload) });
        toast('Saved. The card on the right is how it appears on the website.');
        render();
    });
}

async function viewCareers() {
    app.innerHTML = `<div class="grid grid-3">
        <a class="card" href="#/jobs-list" id="goJobs"><h3>Job openings</h3><p>Add, edit, and preview career cards.</p></a>
        <a class="card" href="#/benefits-list" id="goBenefits"><h3>Why join us</h3><p>Benefit cards with icons and colors.</p></a>
        <a class="card" href="#/careers-page"><h3>Careers page copy</h3><p>Hero, headings, and CTA text.</p></a>
    </div>
    <div id="careerMount" style="margin-top:1rem;"></div>`;
    await viewCollection('jobs');
    const extraNav = document.createElement('div');
    extraNav.className = 'card';
    extraNav.style.marginTop = '1rem';
    extraNav.innerHTML = `<button class="btn btn-ghost" id="editBenefits">Edit benefits</button> <button class="btn btn-ghost" id="editProcess">Edit design process</button> <button class="btn btn-ghost" id="editValues">Edit values</button> <button class="btn btn-ghost" id="editWhy">Edit why choose us</button>`;
    app.appendChild(extraNav);
    extraNav.querySelector('#editBenefits').onclick = () => viewCollection('benefits');
    extraNav.querySelector('#editProcess').onclick = () => viewCollection('process');
    extraNav.querySelector('#editValues').onclick = () => viewCollection('values');
    extraNav.querySelector('#editWhy').onclick = () => viewCollection('why-choose');
}

async function viewInbox(kind) {
    const rows = await api(kind);
    app.innerHTML = `<div class="card"><table class="table">
        <thead><tr><th>Name</th><th>Email</th><th>${kind === 'inquiries' ? 'Project' : 'Position'}</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map((r) => `<tr>
            <td>${esc(r.name)}<div class="muted">${esc(r.created_at)}</div></td>
            <td>${esc(r.email)}<div class="muted">${esc(r.phone)}</div></td>
            <td>${esc(r.project_type || r.position)}</td>
            <td>
                <select data-status="${r.id}">
                    ${['new','reviewed','closed'].map((s) => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </td>
            <td><button class="btn btn-ghost btn-sm" data-view="${r.id}">View</button> <button class="btn btn-danger btn-sm" data-del="${r.id}">Delete</button></td>
        </tr>`).join('') || '<tr><td colspan="5">Nothing here yet.</td></tr>'}</tbody>
    </table></div>`;
    app.querySelectorAll('[data-status]').forEach((sel) => sel.addEventListener('change', async () => {
        await api(`${kind}/${sel.dataset.status}`, { method: 'PUT', body: JSON.stringify({ status: sel.value }) });
        toast('Status updated.');
    }));
    app.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
        await api(`${kind}/${btn.dataset.del}`, { method: 'DELETE' });
        viewInbox(kind);
    }));
    app.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => {
        const row = rows.find((r) => String(r.id) === btn.dataset.view);
        modalBg.classList.add('show');
        modalBg.innerHTML = `<div class="modal"><h3>${esc(row.name)}</h3><p>${esc(row.email)} · ${esc(row.phone)}</p><p>${esc(row.description || row.message)}</p><button class="btn btn-ghost" id="closeM">Close</button></div>`;
        modalBg.querySelector('#closeM').onclick = () => modalBg.classList.remove('show');
    }));
}

async function viewMedia() {
    const items = await api('media');
    mediaCache = items;
    app.innerHTML = `<div class="card">
        <div class="dropzone" id="mediaDrop"><input type="file" accept="image/*"><strong>Upload images here</strong><div class="help">They appear in the library for every page.</div></div>
    </div>
    <div class="media-grid" style="margin-top:1rem;">
        ${items.map((m) => `<div class="media-item"><img src="${esc(asset(m.url))}" alt=""><div style="padding:.5rem;"><div class="muted">${esc(m.original_name || m.filename)}</div></div></div>`).join('')}
    </div>`;
    const zone = document.getElementById('mediaDrop');
    const fileInput = zone.querySelector('input');
    zone.onclick = () => fileInput.click();
    fileInput.onchange = async () => {
        if (fileInput.files[0]) {
            await uploadFile(fileInput.files[0], () => viewMedia());
        }
    };
}

function viewPreview() {
    app.innerHTML = `<div class="card">
        <div style="display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1rem;">
            ${Object.entries(PAGE_FILES).map(([k, url]) => `<button class="btn btn-ghost btn-sm" data-src="${url}">${k}</button>`).join('')}
        </div>
        <iframe class="site-preview" id="siteFrame" src="../index.html" title="Website preview"></iframe>
    </div>`;
    app.querySelectorAll('[data-src]').forEach((btn) => btn.addEventListener('click', () => {
        document.getElementById('siteFrame').src = btn.dataset.src + '?t=' + Date.now();
    }));
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('logout', { method: 'POST' });
    location.href = 'login.html';
});
window.addEventListener('hashchange', render);
api('me').then(render).catch(() => { location.href = 'login.html'; });
