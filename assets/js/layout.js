async function loadSiteConfig(){
  try{const res=await fetch('./data/site.json');return await res.json()}catch(e){return {name:'Clinic',nav:[],footerLinks:[]}}
}

async function loadServices(){
  try{const res=await fetch('./data/services.json');const data=await res.json();return data.services||[]}catch(e){return []}
}

function navLink(path,label){const isActive=location.pathname.toLowerCase().endsWith(path.toLowerCase());return `<li><a href="${path}" class="${isActive?'active':''}">${label}</a></li>`}

function buildHeader(cfg){
  const links=(cfg.nav||[]).map(i=>navLink(i.href,i.label)).join('');
  return `
  <header class="site-header">
    <div class="container nav">
      <a class="brand" href="./index.html" aria-label="${cfg.name}">
        <img src="./assets/logo.png" alt="${cfg.name} Logo" class="logo" />
        <span class="name">${cfg.name}</span>
      </a>
      <nav aria-label="Main">
        <ul id="main-nav">${links}</ul>
      </nav>
      <a class="cta" href="./contact.html">Appointment</a>
      <button class="mobile-menu-toggle" aria-label="Toggle Menu" aria-expanded="false">
        <span>☰</span>
      </button>
    </div>
  </header>`
}

async function buildFooter(cfg){
  const year=new Date().getFullYear();
  const services = await loadServices();
  
  // Social media icons mapping
  const socialIcons = {
    facebook: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    twitter: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>',
    instagram: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    linkedin: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    youtube: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
  };
  
  const contact = cfg.contact || {};
  const socialMedia = cfg.socialMedia || [];
  const navLinks = cfg.nav || [];
  const quickLinkExclusions = new Set(['Home', 'Medical Tourism', 'Kidney Transplant Dept', 'Reviews']);
  const filteredNavLinks = navLinks.filter(nav => !quickLinkExclusions.has(nav.label));
  const description = cfg.description || 'Empowering patients worldwide with world-class kidney care and innovative transplant solutions.';
  
  // Build Quick Links from navigation
  const quickLinks = filteredNavLinks.map(nav => `<a href="${nav.href}" class="footer-nav-link">${nav.label}</a>`).join('');
  
  // Build Services Links
  const serviceLinks = services.map(s => {
    const serviceSlug = s.name.toLowerCase().replace(/\s+/g, '-');
    return `<a href="./service-detail.html?service=${serviceSlug}" class="footer-nav-link">${s.name}</a>`;
  }).join('');
  
  // Build Social Links
  const socialLinks = socialMedia.map(social => {
    const icon = socialIcons[social.icon] || '';
    return `<a href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.platform}" class="social-link" title="${social.platform}">${icon}</a>`;
  }).join('');
  const parentCompany = cfg.parentCompany || null;
  const hasParentCompany = parentCompany && (parentCompany.logo || parentCompany.tagline || parentCompany.name);
  const parentCompanyText = hasParentCompany ? (parentCompany.tagline || parentCompany.name || 'Parent Company') : '';
  const parentCompanyLogoAlt = hasParentCompany ? (parentCompany.logoAlt || `${parentCompany.name || parentCompany.tagline || 'Parent Company'} Logo`) : '';
  const parentCompanyMarkup = hasParentCompany ? `
      <div class="container footer-parent">
        <div class="footer-parent-badge">
          ${parentCompany.logo ? `<img src="${parentCompany.logo}" alt="${parentCompanyLogoAlt}" class="parent-company-logo" />` : ''}
          <div class="parent-company-text">
            ${parentCompany.url ? `<a href="${parentCompany.url}" class="parent-company-link">${parentCompanyText}</a>` : `<span>${parentCompanyText}</span>`}
          </div>
        </div>
      </div>
    ` : '';
  
  return `
  <footer class="site-footer">
    ${parentCompanyMarkup}
    
    <div class="container footer-top">
      <div class="footer-column footer-brand">
        <div class="footer-logo">
          <img src="./assets/logo.png" alt="${cfg.name} Logo" style="width: 40px; height: 40px; margin-right: 12px;" />
          <span class="footer-brand-name">${cfg.name}</span>
        </div>
        <p class="footer-description">${description}</p>
      </div>
      
      <div class="footer-column">
        <h3 class="footer-column-title">Quick Links</h3>
        <div class="footer-links-list">${quickLinks}</div>
      </div>
      
      <div class="footer-column">
        <h3 class="footer-column-title">Services</h3>
        <div class="footer-links-list">${serviceLinks}</div>
      </div>
      
      <div class="footer-column">
        <h3 class="footer-column-title">Contact</h3>
        <div class="footer-contact-list">
          ${contact.location ? `<div class="footer-contact-item">
            <svg width="18" height="18" fill="#00BCD4" viewBox="0 0 20 20" style="margin-right: 10px; flex-shrink: 0;"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg>
            <span>${contact.location}</span>
          </div>` : ''}
          ${contact.email ? `<div class="footer-contact-item">
            <svg width="18" height="18" fill="#00BCD4" viewBox="0 0 20 20" style="margin-right: 10px; flex-shrink: 0;"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
            <a href="mailto:${contact.email}" class="footer-contact-link">${contact.email}</a>
          </div>` : ''}
          ${contact.phone ? `<div class="footer-contact-item">
            <svg width="18" height="18" fill="#00BCD4" viewBox="0 0 20 20" style="margin-right: 10px; flex-shrink: 0;"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            <a href="tel:${contact.phone}" class="footer-contact-link">${contact.phone}</a>
          </div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="footer-separator"></div>
    
    <div class="container footer-bottom">
      <div class="footer-copyright">© ${year} ${cfg.name}. All rights reserved.</div>
      <div class="footer-social-icons">${socialLinks}</div>
    </div>
  </footer>`
}

(async function initLayout(){
  const cfg=await loadSiteConfig();
  const header=document.getElementById('site-header');
  const footer=document.getElementById('site-footer');
  if(header) header.innerHTML=buildHeader(cfg);
  if(footer) footer.innerHTML=await buildFooter(cfg);
  
  // Mobile menu toggle functionality
  setTimeout(() => {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('mobile-menu-open');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !nav.contains(e.target)) {
          toggle.setAttribute('aria-expanded', 'false');
          nav.classList.remove('mobile-menu-open');
        }
      });
      
      // Close menu when clicking a link
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.setAttribute('aria-expanded', 'false');
          nav.classList.remove('mobile-menu-open');
        });
      });
    }
  }, 100);
})();



