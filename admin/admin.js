// Simple Admin Panel for JSON Content Management
// Wrap in try-catch to ensure class is defined even if there are errors
try {
class AdminPanel {
  constructor() {
    this.currentUser = null;
    this.currentData = {};
    this.currentSection = 'dashboard';
    this.editingItem = null;
    this.editingType = null;
    // Ensure loadSectionData is always callable even if something overwrites it
    // or if an environment quirk changes method binding.
    this.loadSectionData = (typeof this.loadSectionData === 'function')
      ? this.loadSectionData.bind(this)
      : (section) => this.renderSection(section);
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuth();
  }

  setupEventListeners() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
      return;
    }

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    } else {
      console.warn('Login form not found - admin panel may not be fully loaded');
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks.length > 0) {
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const section = link.getAttribute('href').substring(1);
          this.showSection(section);
        });
      });
    }
  }

  async checkAuth() {
    // Always show login screen - no automatic login
    // Clear any stored token to ensure fresh login each time
    localStorage.removeItem('admin_token');
    this.showLoginScreen();
  }

  // Force logout function to clear stored credentials
  forceLogout() {
    localStorage.removeItem('admin_token');
    this.currentUser = null;
    this.showLoginScreen();
  }

  async handleLogin() {
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');
    
    if (!usernameEl || !passwordEl) {
      console.error('Login form elements not found');
      return;
    }
    
    const username = usernameEl.value;
    const password = passwordEl.value;
    
    // Simple authentication (in production, use proper auth)
    if (username === 'admin' && password === 'admin123') {
      this.currentUser = { username };
      // Don't save token - force login each time
      await this.loadAllData();
      this.showAdminPanel();
    } else {
      alert('Invalid credentials');
    }
  }

  handleLogout() {
    this.currentUser = null;
    // Clear any token if it exists
    localStorage.removeItem('admin_token');
    this.showLoginScreen();
  }

  showLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
  }

  showAdminPanel() {
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    // Show dashboard by default
    this.showSection('dashboard');
  }

  showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const navLink = document.querySelector(`[href="#${sectionName}"]`);
    if (navLink) navLink.classList.add('active');

    // Show section
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionName);
    if (targetSection) targetSection.classList.add('active');

    this.currentSection = sectionName;
    this.loadSectionData(sectionName);
  }

  async loadAllData() {
    try {
      const api = this.getApiBase();
      const [doctors, services, achievements, reviews, home, appointments, medicalTourism, kidney, podcasts, homepageSlides] = await Promise.all([
        this.loadJSON(`${api}/api/doctors`),
        this.loadJSON(`${api}/api/services`),
        this.loadJSON(`${api}/api/achievements`),
        this.loadJSON(`${api}/api/reviews`),
        this.loadJSON(`${api}/api/home`),
        this.loadJSON(`${api}/api/appointments`),
        this.loadJSON(`${api}/api/medical-tourism`),
        this.loadJSON(`${api}/api/kidney`),
        this.loadJSON(`${api}/api/podcasts`),
        this.loadJSON(`${api}/api/homepage-slides?admin=true`)
      ]);

      this.currentData = { doctors, services, achievements, reviews, home, appointments, medicalTourism, kidney, podcasts, homepageSlides };

      this.updateDashboard();
      console.log('Data loaded:', this.currentData);
      this.setStatus('');
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to empty data structure
      this.currentData = { doctors: [], services: [], achievements: [], reviews: [], home: {}, appointments: [], medicalTourism: {}, kidney: {}, podcasts: [], homepageSlides: [] };
      this.setStatus('Failed to load data from API. Check that the server is running at ' + this.getApiBase());
    }
  }

  resolveDataUrl(name) {
    // Build URL relative to the admin page to avoid path issues in different hosts
    // Also add cache-busting to avoid stale JSON in some browsers/hosts
    const url = new URL(`../data/${name}.json`, window.location.href);
    url.searchParams.set('t', String(Date.now()));
    return url.toString();
  }

  getApiBase() {
    const defaultUrl = 'https://kidneyclinicappservice-a3esbebthzb2g8fn.eastus-01.azurewebsites.net';
    
    // Check localStorage first (user override)
    const storedApi = localStorage.getItem('api_base');
    if (storedApi) {
      return storedApi;
    }
    
    // Check window config (from config.js or Render environment variable)
    if (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.API_BASE_URL) {
      return window.__CONFIG__.API_BASE_URL;
    }
    
    // Default to Azure URL
    return defaultUrl;
  }

  async checkApiConnection() {
    const api = this.getApiBase();
    try {
      const response = await fetch(`${api}/health`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  setStatus(message) {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    if (message) {
      bar.textContent = message;
      bar.style.display = 'block';
    } else {
      bar.textContent = '';
      bar.style.display = 'none';
    }
  }

  // Backward-compatible entry point that delegates to renderSection
  async loadSectionData(section) {
    this.renderSection(section);
  }

  renderSection(section) {
    switch (section) {
      case 'doctors':
        this.renderDoctors();
        break;
      case 'services':
        this.renderServices();
        break;
      case 'homepage':
        this.renderHomepage();
        break;
      case 'achievements':
        this.renderMedicalTourism();
        break;
      case 'reviews':
        this.renderReviews();
        break;
      case 'podcasts':
        this.renderPodcasts();
        break;
      case 'kidney':
        this.renderKidney();
        break;
      case 'appointments':
        this.renderAppointments();
        break;
    }
  }

  async loadJSON(url) {
    try {
      console.log('Loading JSON from:', url);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Loaded data from', url, ':', data);
      return data;
    } catch (error) {
      console.error('Error loading JSON from', url, ':', error);
      throw error;
    }
  }

  async saveJSON(url, data) {
    // In a real app, this would POST to an API endpoint
    // For now, we'll just update the local data
    console.log('Would save to:', url, data);
    return true;
  }

  updateDashboard() {
    document.getElementById('doctors-count').textContent = this.currentData.doctors?.length || 0;
    document.getElementById('services-count').textContent = this.currentData.services?.length || 0;
    document.getElementById('reviews-count').textContent = this.currentData.reviews?.length || 0;
  }

  renderDoctors() {
    const container = document.getElementById('doctors-list');
    const doctors = this.currentData.doctors || [];
    
    console.log('Rendering doctors:', doctors);
    console.log('Current data:', this.currentData);
    
    if (doctors.length === 0) {
      container.innerHTML = '<p>No doctors found. <button class="btn primary" onclick="addDoctor()">Add First Doctor</button></p>';
      return;
    }
    
    container.innerHTML = doctors.map((doctor) => `
      <div class="content-item">
        <div class="content-item-info">
          <h4>${doctor.name}</h4>
          <p>${doctor.title} • ${doctor.specialization}</p>
          <small style="color: var(--muted); margin-top: 8px; display: block;">
            ${doctor.photoUrl ? '📷 Photo' : 'No photo'} • 
            ${doctor.interviewUrl ? '🎥 Interview' : 'No interview'}
          </small>
        </div>
        <div class="content-item-actions">
          <button class="btn btn-small" onclick="admin.editItem('doctors', '${doctor.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteItem('doctors', '${doctor.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  renderServices() {
    const container = document.getElementById('services-list');
    const services = this.currentData.services || [];
    
    if (services.length === 0) {
      container.innerHTML = '<p>No services found. <button class="btn primary" onclick="addService()">Add First Service</button></p>';
      return;
    }

    container.innerHTML = services.map((service) => `
      <div class="content-item">
        <div class="content-item-info">
          <h4>${service.name}</h4>
          <p>${service.summary || ''}</p>
          ${service.details && service.details.length > 0 ? `
            <small style="color: var(--muted); margin-top: 8px; display: block;">
              ${service.details.length} detail${service.details.length > 1 ? 's' : ''} • 
              ${service.image ? 'Has image' : 'No image'}
            </small>
          ` : ''}
        </div>
        <div class="content-item-actions">
          <button class="btn btn-small" onclick="admin.editItem('services', '${service.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteItem('services', '${service.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  renderAchievements() {
    // This is now used for medical tourism page editor
    this.renderMedicalTourism();
  }

  renderMedicalTourism() {
    const container = document.getElementById('achievements-list');
    const data = this.currentData.medicalTourism || {};
    const healthGateways = data.healthGateways || {};
    const processData = data.process || {};
    const processSteps = processData.steps || [];
    const cta = data.cta || {};

    const get = (path, defaultValue = '') => {
      const keys = path.split('.');
      let value = data;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) return defaultValue;
      }
      return value || defaultValue;
    };

    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Health Gateways Partnership Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Badge Text (Optional)</label>
            <input type="text" id="hg-badge" value="${get('healthGateways.badge', 'OUR TRUSTED PARTNER')}" placeholder="e.g., OUR TRUSTED PARTNER" />
            <small style="color: var(--muted); display: block; margin-top: 5px;">This appears above the main title. Leave empty to hide the badge.</small>
          </div>
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="hg-title" value="${get('healthGateways.title', 'Our Tourism Partner: Health Gateways')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="hg-description" rows="4">${get('healthGateways.description', 'Health Gateways is our trusted medical tourism partner...')}</textarea>
          </div>
          
          <h4 style="margin-top: 20px; color: #1a2a44; font-weight: 600;">Services Offered</h4>
          <div id="hg-services-list" style="border: 2px dashed var(--border); padding: 15px; border-radius: 8px; background: rgba(0,188,212,0.05); margin-bottom: 10px; min-height: 100px;">
            ${(healthGateways.services || []).length > 0 ? healthGateways.services.map((service, idx) => `
              <div class="service-row" data-service-index="${idx}" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
                  <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: 80px 1fr; gap: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Icon</label>
                        <input type="text" name="service-icon-${idx}" value="${service.icon || ''}" placeholder="✈️" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Title</label>
                        <input type="text" name="service-title-${idx}" value="${service.title || ''}" placeholder="Service Title" style="width: 100%;" />
                      </div>
                    </div>
                    <div style="margin-top: 10px;">
                      <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
                      <textarea name="service-desc-${idx}" rows="2" placeholder="Service description..." style="width: 100%;">${service.description || ''}</textarea>
                    </div>
                  </div>
                  <button type="button" onclick="admin.removeServiceRow(${idx})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
                </div>
              </div>
            `).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No services added. Click "Add Service" to add one.</p>'}
          </div>
          <button type="button" onclick="admin.addServiceRow()" class="btn" style="width: 100%;">+ Add Service</button>
          <input type="hidden" id="service-count" value="${(healthGateways.services || []).length}" />

          <h4 style="margin-top: 30px; color: #1a2a44; font-weight: 600;">Contact Information</h4>
          <div class="form-group">
            <label>Contact Section Heading</label>
            <input type="text" id="hg-contact-heading" value="${get('healthGateways.contact.heading', 'Contact Health Gateways')}" placeholder="Contact Health Gateways" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="hg-contact-email" value="${get('healthGateways.contact.email', '')}" placeholder="info@healthgateways.com" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="hg-contact-phone" value="${get('healthGateways.contact.phone', '')}" placeholder="+1-800-HEALTH-GW" />
            </div>
            <div class="form-group">
              <label>Website</label>
              <input type="url" id="hg-contact-website" value="${get('healthGateways.contact.website', '')}" placeholder="https://www.healthgateways.com" />
            </div>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700; margin-top: 40px;">How It Works Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="process-title" value="${processData.title || 'How It Works'}" placeholder="How It Works" />
          </div>
          <div id="process-list" style="border: 2px dashed var(--border); padding: 15px; border-radius: 8px; background: rgba(0,188,212,0.05); margin-bottom: 10px; min-height: 100px; margin-top: 15px;">
            ${processSteps.length > 0 ? processSteps.map((step, idx) => `
              <div class="process-row" data-process-index="${idx}" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
                  <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Step Title</label>
                        <input type="text" name="process-title-${idx}" value="${step.title || ''}" placeholder="Step Title" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
                        <input type="text" name="process-desc-${idx}" value="${step.description || ''}" placeholder="Step description" style="width: 100%;" />
                      </div>
                    </div>
                  </div>
                  <button type="button" onclick="admin.removeProcessRow(${idx})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
                </div>
              </div>
            `).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No process steps added. Click "Add Step" to add one.</p>'}
          </div>
          <button type="button" onclick="admin.addProcessRow()" class="btn" style="width: 100%;">+ Add Process Step</button>
          <input type="hidden" id="process-count" value="${processSteps.length}" />
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700; margin-top: 40px;">Call-to-Action Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Heading</label>
            <input type="text" id="cta-heading" value="${get('cta.heading', 'Ready to Start Your Journey?')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="cta-description" rows="2">${get('cta.description', 'Contact Health Gateways or our clinic directly to begin your medical tourism experience.')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Button Text</label>
              <input type="text" id="cta-button-text" value="${get('cta.buttonText', 'Book an Appointment')}" />
            </div>
            <div class="form-group">
              <label>Button Link</label>
              <input type="text" id="cta-button-link" value="${get('cta.buttonLink', './contact.html')}" />
            </div>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700; margin-top: 40px;">Patient Locations Map Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="map-title" value="${get('map.title', 'Our International Patients')}" placeholder="Our International Patients" />
          </div>
          <div class="form-group">
            <label>Section Description</label>
            <textarea id="map-description" rows="2" placeholder="Description of international patients...">${get('map.description', 'We welcome patients from across the globe for world-class kidney transplant services.')}</textarea>
          </div>
          
          <div class="form-group" style="margin-top: 20px;">
            <label style="font-weight: 600; margin-bottom: 10px; display: block;">Map Image</label>
            <div style="border: 1px solid var(--border); padding: 15px; border-radius: 8px; background: rgba(0,188,212,0.05);">
              <label style="color: var(--text); font-weight: 600; margin-bottom: 8px; display: block;">📤 Upload Image File</label>
              <input type="file" id="map-image-file" accept="image/*" onchange="admin.previewMapImage(this)" style="display: block; margin-bottom: 10px; width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--card);" />
              <div id="map-image-preview" style="margin-top: 10px;">
                ${get('map.imageUrl', '') ? `<img src="${get('map.imageUrl', '')}" alt="Map Preview" style="max-width: 300px; max-height: 200px; border-radius: 4px; border: 1px solid var(--border); object-fit: contain;" />` : ''}
              </div>
            </div>
            <div style="border: 1px solid var(--border); padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.6); margin-top: 15px;">
              <label style="color: var(--muted); font-weight: 600; margin-bottom: 8px; display: block;">🔗 Or Enter Image URL</label>
              <input type="url" id="map-image-url" value="${get('map.imageUrl', '')}" placeholder="https://example.com/map.png or ./assets/map.png" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--card);" />
              <small style="color: var(--muted); display: block; margin-top: 5px;">Enter a full URL (e.g., https://example.com/map.png) or a relative path (e.g., ./assets/map.png). Used if no file is uploaded above.</small>
            </div>
          </div>
          
          <h4 style="margin-top: 20px; color: #1a2a44; font-weight: 600;">Patient Locations</h4>
          <div id="map-locations-list" style="border: 2px dashed var(--border); padding: 15px; border-radius: 8px; background: rgba(0,188,212,0.05); margin-bottom: 10px; min-height: 100px;">
            ${(data.map?.locations || []).length > 0 ? data.map.locations.map((loc, idx) => `
              <div class="location-row" data-location-index="${idx}" style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
                  <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Location Name</label>
                        <input type="text" name="location-name-${idx}" value="${loc.name || ''}" placeholder="e.g., Qatar" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Icon (Emoji)</label>
                        <input type="text" name="location-icon-${idx}" value="${loc.icon || ''}" placeholder="🇶🇦" style="width: 100%;" />
                      </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                      <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
                      <textarea name="location-desc-${idx}" rows="2" placeholder="Description of patients from this location..." style="width: 100%;">${loc.description || ''}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Latitude</label>
                        <input type="number" step="any" name="location-lat-${idx}" value="${loc.lat || ''}" placeholder="25.3548" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Longitude</label>
                        <input type="number" step="any" name="location-lng-${idx}" value="${loc.lng || ''}" placeholder="51.1839" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Stat Value (Optional)</label>
                        <input type="text" name="location-stat-${idx}" value="${loc.stat || ''}" placeholder="150+" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Stat Label</label>
                        <input type="text" name="location-stat-label-${idx}" value="${loc.statLabel || ''}" placeholder="Patients" style="width: 100%;" />
                      </div>
                    </div>
                  </div>
                  <button type="button" onclick="admin.removeLocationRow(${idx})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
                </div>
              </div>
            `).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No locations added. Click "Add Location" to add one.</p>'}
          </div>
          <button type="button" onclick="admin.addLocationRow()" class="btn" style="width: 100%;">+ Add Location</button>
          <input type="hidden" id="location-count" value="${(data.map?.locations || []).length}" />
          <small style="color: var(--muted); display: block; margin-top: 10px;">
            💡 Tip: Use coordinates for Qatar (25.3548, 51.1839), Dubai (25.2048, 55.2708), and Africa (8.7832, 34.5085)
          </small>
        </div>

        <button class="btn primary" onclick="admin.saveMedicalTourism()" style="width: 100%; padding: 15px; font-size: 1.1rem; margin-top: 20px;">Save All Medical Tourism Changes</button>
      </div>
    `;
  }

  kidneyStatRowTemplate(index, stat = {}) {
    return `
      <div class="kidney-stat-row" data-kidney-stat-index="${index}" style="background: rgba(240,249,255,0.95); padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--border);">
        <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) auto; gap: 12px; align-items: center;">
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Icon</label>
            <input type="text" name="kidney-stat-icon-${index}" value="${stat.icon || ''}" placeholder="🫁" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Value</label>
            <input type="text" name="kidney-stat-value-${index}" value="${stat.value || ''}" placeholder="1,200+" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Label</label>
            <input type="text" name="kidney-stat-label-${index}" value="${stat.label || ''}" placeholder="Successful Transplants" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Description</label>
            <input type="text" name="kidney-stat-description-${index}" value="${stat.description || ''}" placeholder="Additional context" />
          </div>
          <button type="button" onclick="admin.removeKidneyStatRow(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
      </div>
    `;
  }

  kidneyProcedureRowTemplate(index, item = {}) {
    return `
      <div class="kidney-procedure-row" data-kidney-procedure-index="${index}" style="background: #ffffff; padding: 18px; border-radius: 12px; margin-bottom: 14px; border: 1px solid var(--border); box-shadow: 0 6px 20px rgba(0,188,212,0.1);">
        <div style="display: grid; grid-template-columns: 100px repeat(2, minmax(0, 1fr)) auto; gap: 12px; align-items: start;">
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Icon</label>
            <input type="text" name="kidney-procedure-icon-${index}" value="${item.icon || ''}" placeholder="🫂" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Name</label>
            <input type="text" name="kidney-procedure-name-${index}" value="${item.name || ''}" placeholder="Living Donor Transplant" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size: 0.85rem;">Description</label>
            <input type="text" name="kidney-procedure-description-${index}" value="${item.description || ''}" placeholder="Brief summary" />
          </div>
          <button type="button" onclick="admin.removeKidneyProcedureRow(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
        <div class="form-group" style="margin-top: 14px;">
          <label style="font-size: 0.85rem;">Focus Points (one per line)</label>
          <textarea name="kidney-procedure-focus-${index}" rows="3" placeholder="Point one&#10;Point two">${Array.isArray(item.focusPoints) ? item.focusPoints.join('\n') : ''}</textarea>
        </div>
      </div>
    `;
  }

  kidneyJourneyRowTemplate(index, step = {}) {
    return `
      <div class="kidney-journey-row" data-kidney-journey-index="${index}" style="background: rgba(255,255,255,0.95); padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid var(--border);">
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)) auto; gap: 12px; align-items: start;">
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Step Title</label>
            <input type="text" name="kidney-journey-title-${index}" value="${step.title || ''}" placeholder="Referral & Evaluation" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Description</label>
            <input type="text" name="kidney-journey-description-${index}" value="${step.description || ''}" placeholder="Explain what happens in this step" />
          </div>
          <button type="button" onclick="admin.removeKidneyJourneyRow(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
      </div>
    `;
  }

  kidneySymptomCategoryTemplate(index, category = {}) {
    return `
      <div class="kidney-symptom-category" data-kidney-symptom-index="${index}" style="background: rgba(13,61,77,0.12); padding: 16px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.2);">
        <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:start;">
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Category Title</label>
            <input type="text" name="kidney-symptom-title-${index}" value="${category.title || ''}" placeholder="Physical Signals" />
          </div>
          <button type="button" onclick="admin.removeKidneySymptomCategory(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label style="font-size:0.85rem;">Items (one per line)</label>
          <textarea name="kidney-symptom-items-${index}" rows="3" placeholder="Symptom one&#10;Symptom two">${Array.isArray(category.items) ? category.items.join('\n') : ''}</textarea>
        </div>
      </div>
    `;
  }

  kidneySupportPillarTemplate(index, pillar = {}) {
    return `
      <div class="kidney-support-pillar" data-kidney-pillar-index="${index}" style="background:#F0F9FF;padding:16px;border-radius:12px;margin-bottom:12px;border:1px solid var(--border);">
        <div style="display:grid;grid-template-columns:80px repeat(2,minmax(0,1fr)) auto;gap:12px;align-items:start;">
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Icon</label>
            <input type="text" name="kidney-pillar-icon-${index}" value="${pillar.icon || ''}" placeholder="🍎" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Title</label>
            <input type="text" name="kidney-pillar-title-${index}" value="${pillar.title || ''}" placeholder="Nutrition & Lifestyle" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Description</label>
            <input type="text" name="kidney-pillar-description-${index}" value="${pillar.description || ''}" placeholder="Short description" />
          </div>
          <button type="button" onclick="admin.removeKidneySupportPillar(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
      </div>
    `;
  }

  kidneySupportResourceTemplate(index, resource = {}) {
    return `
      <div class="kidney-support-resource" data-kidney-resource-index="${index}" style="background:#ffffff;padding:16px;border-radius:12px;margin-bottom:12px;border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,188,212,0.12);">
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:12px;align-items:start;">
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Resource Title</label>
            <input type="text" name="kidney-resource-title-${index}" value="${resource.title || ''}" placeholder="Preparation Guide" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Link / URL</label>
            <input type="text" name="kidney-resource-link-${index}" value="${resource.link || ''}" placeholder="https://example.com" />
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.85rem;">Description</label>
            <input type="text" name="kidney-resource-description-${index}" value="${resource.description || ''}" placeholder="Brief description" />
          </div>
          <button type="button" onclick="admin.removeKidneySupportResource(${index})" class="btn btn-small btn-danger" style="height: fit-content; margin-top: 22px;">Remove</button>
        </div>
      </div>
    `;
  }

  renderKidney() {
    const container = document.getElementById('kidney-editor');
    if (!container) return;

    const data = this.currentData.kidney || {};
    const hero = data.hero || {};
    const stats = Array.isArray(data.stats) ? data.stats : [];
    const procedures = data.procedures || {};
    const procedureItems = Array.isArray(procedures.items) ? procedures.items : [];
    const journey = data.journey || {};
    const journeySteps = Array.isArray(journey.steps) ? journey.steps : [];
    const symptoms = data.symptoms || {};
    const symptomsCategories = Array.isArray(symptoms.categories) ? symptoms.categories : [];
    const symptomsCta = symptoms.cta || {};
    const support = data.support || {};
    const supportPillars = Array.isArray(support.pillars) ? support.pillars : [];
    const supportResources = Array.isArray(support.resources) ? support.resources : [];
    const cta = data.cta || {};

    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Hero Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div class="form-row">
            <div class="form-group">
              <label>Badge</label>
              <input type="text" id="kidney-hero-badge" value="${hero.badge || ''}" placeholder="Kidney Transplant Center of Excellence" />
            </div>
            <div class="form-group">
              <label>Background Image URL</label>
              <input type="text" id="kidney-hero-image" value="${hero.backgroundImage || ''}" placeholder="./assets/transplant.png" />
            </div>
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="kidney-hero-title" value="${hero.title || ''}" placeholder="Advanced Kidney Transplant & Renal Care" />
          </div>
          <div class="form-group">
            <label>Subtitle</label>
            <textarea id="kidney-hero-subtitle" rows="2" placeholder="Hero description...">${hero.subtitle || ''}</textarea>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Key Outcomes & Stats</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div id="kidney-stats-list">
            ${stats.length ? stats.map((stat, idx) => this.kidneyStatRowTemplate(idx, stat)).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No stats added yet. Click "Add Stat" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneyStatRow()" class="btn" style="width: 100%;">+ Add Stat</button>
          <input type="hidden" id="kidney-stats-count" value="${stats.length}" />
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Procedures & Specialized Therapies</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="kidney-procedures-title" value="${procedures.title || ''}" placeholder="Kidney Transplant Procedures & Specialized Therapies" />
          </div>
          <div class="form-group">
            <label>Section Subtitle</label>
            <textarea id="kidney-procedures-subtitle" rows="2" placeholder="Section subtitle...">${procedures.subtitle || ''}</textarea>
          </div>
          <div id="kidney-procedures-list">
            ${procedureItems.length ? procedureItems.map((item, idx) => this.kidneyProcedureRowTemplate(idx, item)).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No procedures added yet. Click "Add Procedure" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneyProcedureRow()" class="btn" style="width: 100%;">+ Add Procedure</button>
          <input type="hidden" id="kidney-procedures-count" value="${procedureItems.length}" />
          <div class="form-group" style="margin-top: 16px;">
            <label>Section Footnote</label>
            <textarea id="kidney-procedures-footnote" rows="2" placeholder="Footnote or additional context...">${procedures.footnote || ''}</textarea>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Patient Journey</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Journey Title</label>
            <input type="text" id="kidney-journey-title" value="${journey.title || ''}" placeholder="Your Kidney Transplant Journey" />
          </div>
          <div class="form-group">
            <label>Journey Subtitle</label>
            <textarea id="kidney-journey-subtitle" rows="2" placeholder="Journey subtitle...">${journey.subtitle || ''}</textarea>
          </div>
          <div id="kidney-journey-list">
            ${journeySteps.length ? journeySteps.map((step, idx) => this.kidneyJourneyRowTemplate(idx, step)).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No journey steps added yet. Click "Add Journey Step" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneyJourneyRow()" class="btn" style="width: 100%;">+ Add Journey Step</button>
          <input type="hidden" id="kidney-journey-count" value="${journeySteps.length}" />
          <div class="form-group" style="margin-top: 16px;">
            <label>Journey Note</label>
            <textarea id="kidney-journey-note" rows="2" placeholder="Additional note...">${journey.note || ''}</textarea>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Symptoms & When to Seek Care</h3>
        <div style="background: #0d3d4d; padding: 24px; border-radius: 16px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.2); color: #ffffff;">
          <div class="form-group">
            <label>Section Title</label>
            <input type="text" id="kidney-symptoms-title" value="${symptoms.title || ''}" placeholder="When to See a Kidney Specialist" />
          </div>
          <div class="form-group">
            <label>Section Subtitle</label>
            <textarea id="kidney-symptoms-subtitle" rows="2" placeholder="Section subtitle..." style="background: rgba(255,255,255,0.1); color: #ffffff;">${symptoms.subtitle || ''}</textarea>
          </div>
          <div id="kidney-symptoms-list">
            ${symptomsCategories.length ? symptomsCategories.map((category, idx) => this.kidneySymptomCategoryTemplate(idx, category)).join('') : '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 15px;">No symptom categories yet. Click "Add Symptom Category" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneySymptomCategory()" class="btn" style="width: 100%;">+ Add Symptom Category</button>
          <input type="hidden" id="kidney-symptoms-count" value="${symptomsCategories.length}" />
          <div class="form-row" style="margin-top: 18px;">
            <div class="form-group">
              <label>CTA Text</label>
              <input type="text" id="kidney-symptoms-cta-text" value="${symptomsCta.text || ''}" placeholder="Schedule a renal health screening" />
            </div>
            <div class="form-group">
              <label>CTA Link</label>
              <input type="text" id="kidney-symptoms-cta-link" value="${symptomsCta.link || ''}" placeholder="./contact.html" />
            </div>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Support Services & Resources</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Support Title</label>
            <input type="text" id="kidney-support-title" value="${support.title || ''}" placeholder="Beyond Surgery: Support That Sustains You" />
          </div>
          <h4 style="margin: 15px 0 10px; color: #1a2a44; font-weight: 600;">Pillars</h4>
          <div id="kidney-support-pillars">
            ${supportPillars.length ? supportPillars.map((pillar, idx) => this.kidneySupportPillarTemplate(idx, pillar)).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No support pillars yet. Click "Add Pillar" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneySupportPillar()" class="btn" style="width: 100%;">+ Add Pillar</button>
          <input type="hidden" id="kidney-support-pillars-count" value="${supportPillars.length}" />

          <h4 style="margin: 25px 0 10px; color: #1a2a44; font-weight: 600;">Resources</h4>
          <div id="kidney-support-resources">
            ${supportResources.length ? supportResources.map((resource, idx) => this.kidneySupportResourceTemplate(idx, resource)).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No resources yet. Click "Add Resource" to create one.</p>'}
          </div>
          <button type="button" onclick="admin.addKidneySupportResource()" class="btn" style="width: 100%;">+ Add Resource</button>
          <input type="hidden" id="kidney-support-resources-count" value="${supportResources.length}" />
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Page Call-to-Action</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>CTA Heading</label>
            <input type="text" id="kidney-cta-heading" value="${cta.heading || ''}" placeholder="Ready to Discuss Your Transplant Options?" />
          </div>
          <div class="form-group">
            <label>CTA Description</label>
            <textarea id="kidney-cta-description" rows="2" placeholder="CTA description...">${cta.description || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Button Text</label>
              <input type="text" id="kidney-cta-button-text" value="${cta.buttonText || ''}" placeholder="Talk to a Transplant Coordinator" />
            </div>
            <div class="form-group">
              <label>Button Link</label>
              <input type="text" id="kidney-cta-button-link" value="${cta.buttonLink || ''}" placeholder="./contact.html" />
            </div>
          </div>
        </div>

        <button class="btn primary" onclick="admin.saveKidney()" style="width: 100%; padding: 16px; font-size: 1.1rem;">Save Kidney Department Page</button>
      </div>
    `;
  }

  addKidneyStatRow() {
    const container = document.getElementById('kidney-stats-list');
    const countInput = document.getElementById('kidney-stats-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneyStatRowTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneyStatRow(index) {
    const container = document.getElementById('kidney-stats-list');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-stat-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneyStatIndices();
  }

  updateKidneyStatIndices() {
    const container = document.getElementById('kidney-stats-list');
    const countInput = document.getElementById('kidney-stats-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-stat-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-stat-index', idx);
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneyStatRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneyStatRow(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No stats added yet. Click "Add Stat" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  addKidneyProcedureRow() {
    const container = document.getElementById('kidney-procedures-list');
    const countInput = document.getElementById('kidney-procedures-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneyProcedureRowTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneyProcedureRow(index) {
    const container = document.getElementById('kidney-procedures-list');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-procedure-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneyProcedureIndices();
  }

  updateKidneyProcedureIndices() {
    const container = document.getElementById('kidney-procedures-list');
    const countInput = document.getElementById('kidney-procedures-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-procedure-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-procedure-index', idx);
      const inputs = row.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneyProcedureRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneyProcedureRow(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No procedures added yet. Click "Add Procedure" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  addKidneyJourneyRow() {
    const container = document.getElementById('kidney-journey-list');
    const countInput = document.getElementById('kidney-journey-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneyJourneyRowTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneyJourneyRow(index) {
    const container = document.getElementById('kidney-journey-list');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-journey-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneyJourneyIndices();
  }

  updateKidneyJourneyIndices() {
    const container = document.getElementById('kidney-journey-list');
    const countInput = document.getElementById('kidney-journey-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-journey-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-journey-index', idx);
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneyJourneyRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneyJourneyRow(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No journey steps added yet. Click "Add Journey Step" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  addKidneySymptomCategory() {
    const container = document.getElementById('kidney-symptoms-list');
    const countInput = document.getElementById('kidney-symptoms-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneySymptomCategoryTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneySymptomCategory(index) {
    const container = document.getElementById('kidney-symptoms-list');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-symptom-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneySymptomIndices();
  }

  updateKidneySymptomIndices() {
    const container = document.getElementById('kidney-symptoms-list');
    const countInput = document.getElementById('kidney-symptoms-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-symptom-category');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-symptom-index', idx);
      const inputs = row.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneySymptomCategory"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneySymptomCategory(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 15px;">No symptom categories yet. Click "Add Symptom Category" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  addKidneySupportPillar() {
    const container = document.getElementById('kidney-support-pillars');
    const countInput = document.getElementById('kidney-support-pillars-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneySupportPillarTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneySupportPillar(index) {
    const container = document.getElementById('kidney-support-pillars');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-pillar-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneySupportPillarIndices();
  }

  updateKidneySupportPillarIndices() {
    const container = document.getElementById('kidney-support-pillars');
    const countInput = document.getElementById('kidney-support-pillars-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-support-pillar');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-pillar-index', idx);
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneySupportPillar"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneySupportPillar(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No support pillars yet. Click "Add Pillar" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  addKidneySupportResource() {
    const container = document.getElementById('kidney-support-resources');
    const countInput = document.getElementById('kidney-support-resources-count');
    if (!container || !countInput) return;
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    const index = parseInt(countInput.value || 0);
    container.insertAdjacentHTML('beforeend', this.kidneySupportResourceTemplate(index));
    countInput.value = index + 1;
  }

  removeKidneySupportResource(index) {
    const container = document.getElementById('kidney-support-resources');
    if (!container) return;
    const row = container.querySelector(`[data-kidney-resource-index="${index}"]`);
    if (row) row.remove();
    this.updateKidneySupportResourceIndices();
  }

  updateKidneySupportResourceIndices() {
    const container = document.getElementById('kidney-support-resources');
    const countInput = document.getElementById('kidney-support-resources-count');
    if (!container || !countInput) return;
    const rows = container.querySelectorAll('.kidney-support-resource');
    rows.forEach((row, idx) => {
      row.setAttribute('data-kidney-resource-index', idx);
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.name || '';
        const newName = name.replace(/-\d+$/, `-${idx}`);
        input.name = newName;
        input.setAttribute('name', newName);
      });
      const removeBtn = row.querySelector('button[onclick*="removeKidneySupportResource"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeKidneySupportResource(${idx})`);
    });
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No resources yet. Click "Add Resource" to create one.</p>';
    }
    countInput.value = rows.length;
  }

  collectTextareaList(value) {
    if (!value) return [];
    return value.split('\n').map(line => line.trim()).filter(Boolean);
  }

  async saveKidney() {
    const api = this.getApiBase();
    const payload = {};

    payload.hero = {
      badge: document.getElementById('kidney-hero-badge')?.value || '',
      title: document.getElementById('kidney-hero-title')?.value || '',
      subtitle: document.getElementById('kidney-hero-subtitle')?.value || '',
      backgroundImage: document.getElementById('kidney-hero-image')?.value || ''
    };

    // Stats
    const stats = [];
    const statsCount = parseInt(document.getElementById('kidney-stats-count')?.value || 0);
    for (let i = 0; i < statsCount; i++) {
      const icon = document.querySelector(`[name="kidney-stat-icon-${i}"]`)?.value || '';
      const value = document.querySelector(`[name="kidney-stat-value-${i}"]`)?.value || '';
      const label = document.querySelector(`[name="kidney-stat-label-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="kidney-stat-description-${i}"]`)?.value || '';
      if (icon || value || label || description) {
        stats.push({ icon, value, label, description });
      }
    }
    payload.stats = stats;

    // Procedures
    const procedures = {
      title: document.getElementById('kidney-procedures-title')?.value || '',
      subtitle: document.getElementById('kidney-procedures-subtitle')?.value || '',
      footnote: document.getElementById('kidney-procedures-footnote')?.value || '',
      items: []
    };
    const procedureCount = parseInt(document.getElementById('kidney-procedures-count')?.value || 0);
    for (let i = 0; i < procedureCount; i++) {
      const icon = document.querySelector(`[name="kidney-procedure-icon-${i}"]`)?.value || '';
      const name = document.querySelector(`[name="kidney-procedure-name-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="kidney-procedure-description-${i}"]`)?.value || '';
      const focusPointsText = document.querySelector(`[name="kidney-procedure-focus-${i}"]`)?.value || '';
      if (icon || name || description || focusPointsText) {
        procedures.items.push({
          icon,
          name,
          description,
          focusPoints: this.collectTextareaList(focusPointsText)
        });
      }
    }
    payload.procedures = procedures;

    // Journey
    const journey = {
      title: document.getElementById('kidney-journey-title')?.value || '',
      subtitle: document.getElementById('kidney-journey-subtitle')?.value || '',
      note: document.getElementById('kidney-journey-note')?.value || '',
      steps: []
    };
    const journeyCount = parseInt(document.getElementById('kidney-journey-count')?.value || 0);
    for (let i = 0; i < journeyCount; i++) {
      const title = document.querySelector(`[name="kidney-journey-title-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="kidney-journey-description-${i}"]`)?.value || '';
      if (title || description) {
        journey.steps.push({ title, description });
      }
    }
    payload.journey = journey;

    // Symptoms
    const symptoms = {
      title: document.getElementById('kidney-symptoms-title')?.value || '',
      subtitle: document.getElementById('kidney-symptoms-subtitle')?.value || '',
      categories: [],
      cta: {
        text: document.getElementById('kidney-symptoms-cta-text')?.value || '',
        link: document.getElementById('kidney-symptoms-cta-link')?.value || ''
      }
    };
    const symptomCount = parseInt(document.getElementById('kidney-symptoms-count')?.value || 0);
    for (let i = 0; i < symptomCount; i++) {
      const title = document.querySelector(`[name="kidney-symptom-title-${i}"]`)?.value || '';
      const itemsText = document.querySelector(`[name="kidney-symptom-items-${i}"]`)?.value || '';
      if (title || itemsText) {
        symptoms.categories.push({
          title,
          items: this.collectTextareaList(itemsText)
        });
      }
    }
    payload.symptoms = symptoms;

    // Support
    const support = {
      title: document.getElementById('kidney-support-title')?.value || '',
      pillars: [],
      resources: []
    };
    const pillarCount = parseInt(document.getElementById('kidney-support-pillars-count')?.value || 0);
    for (let i = 0; i < pillarCount; i++) {
      const icon = document.querySelector(`[name="kidney-pillar-icon-${i}"]`)?.value || '';
      const title = document.querySelector(`[name="kidney-pillar-title-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="kidney-pillar-description-${i}"]`)?.value || '';
      if (icon || title || description) {
        support.pillars.push({ icon, title, description });
      }
    }
    const resourceCount = parseInt(document.getElementById('kidney-support-resources-count')?.value || 0);
    for (let i = 0; i < resourceCount; i++) {
      const title = document.querySelector(`[name="kidney-resource-title-${i}"]`)?.value || '';
      const link = document.querySelector(`[name="kidney-resource-link-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="kidney-resource-description-${i}"]`)?.value || '';
      if (title || link || description) {
        support.resources.push({ title, link, description });
      }
    }
    payload.support = support;

    payload.cta = {
      heading: document.getElementById('kidney-cta-heading')?.value || '',
      description: document.getElementById('kidney-cta-description')?.value || '',
      buttonText: document.getElementById('kidney-cta-button-text')?.value || '',
      buttonLink: document.getElementById('kidney-cta-button-link')?.value || ''
    };

    try {
      const response = await fetch(`${api}/api/kidney`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save Kidney Department page');
      }
      alert('Kidney Department page saved successfully!');
      await this.loadAllData();
      this.renderKidney();
    } catch (error) {
      console.error('Error saving kidney page:', error);
      alert('Failed to save Kidney Department page. Please try again.');
    }
  }

  renderReviews() {
    const container = document.getElementById('reviews-list');
    const reviews = this.currentData.reviews || [];
    
    if (reviews.length === 0) {
      container.innerHTML = '<p>No reviews found. <button class="btn primary" onclick="addReview()">Add First Review</button></p>';
      return;
    }

    container.innerHTML = reviews.map((review) => `
      <div class="content-item">
        <div class="content-item-info">
          <h4>${review.author} - ⭐ ${review.rating}/5 ${review.videoUrl ? '🎥' : ''}</h4>
          <p>"${review.text}"</p>
          ${review.videoUrl ? `<small style="color: var(--muted); font-size: 0.85rem; display: block; margin-top: 5px;">Has video review</small>` : ''}
        </div>
        <div class="content-item-actions">
          <button class="btn btn-small" onclick="admin.editItem('reviews', '${review.id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="admin.deleteItem('reviews', '${review.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  renderPodcasts() {
    const container = document.getElementById('podcasts-editor');
    if (!container) return;

    const episodes = (this.currentData.podcasts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const episodesList = episodes.length ? episodes.map(ep => `
      <div class="content-item">
        <div class="content-item-info">
          <h4>${ep.title}</h4>
          <p>${ep.description || 'No description provided yet.'}</p>
          <small style="display:block;color:var(--muted);margin-top:6px;">
            Added ${ep.createdAt ? new Date(ep.createdAt).toLocaleDateString() : 'recently'}
          </small>
          ${ep.videoUrl ? `<a href="${ep.videoUrl}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600;">View Video ↗</a>` : ''}
        </div>
        <div class="content-item-actions">
          <button class="btn btn-small btn-danger" onclick="admin.deletePodcastEpisode('${ep.id}')">Delete</button>
        </div>
      </div>
    `).join('') : `<p style="color:var(--muted);">No podcast episodes published yet. When you add one, it will appear here and on the public podcast page.</p>`;

    container.innerHTML = `
      <div style="max-width:900px;margin:0 auto;">
        <div style="background:var(--card);padding:24px;border-radius:12px;border:1px solid var(--border);box-shadow:0 10px 30px rgba(0,0,0,0.05);">
          <h3 style="margin-top:0;">Upload Podcast Episode</h3>
          <p style="color:var(--muted);">Upload MP4/webm files or paste links to YouTube/Vimeo/Azure-hosted episodes.</p>
          <form id="podcast-upload-form" style="display:grid;gap:16px;margin-top:18px;">
            <div class="form-group">
              <label>Episode Title</label>
              <input type="text" name="title" required placeholder="Episode title" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="description" rows="3" placeholder="Brief summary"></textarea>
            </div>
            <div class="form-group">
              <label>Upload Video File (optional)</label>
              <input type="file" name="videoFile" id="podcast-video-file" accept="video/mp4,video/webm,video/*" />
              <small style="color:var(--muted);display:block;margin-top:6px;">If you upload a file it will be stored via Azure storage.</small>
            </div>
            <div class="form-group">
              <label>Or paste an existing video URL</label>
              <input type="url" name="videoUrl" id="podcast-video-url" placeholder="https://youtube.com/watch?v=..." />
              <small style="color:var(--muted);display:block;margin-top:6px;">Use this if the episode already lives on YouTube, Vimeo, etc.</small>
            </div>
            <button type="submit" class="btn primary">Publish Episode</button>
          </form>
        </div>

        <div style="margin-top:30px;">
          <h3>Published Episodes</h3>
          ${episodesList}
        </div>
      </div>
    `;

    const form = document.getElementById('podcast-upload-form');
    if (form) {
      form.addEventListener('submit', (e) => this.savePodcastEpisode(e));
    }
  }

  async savePodcastEpisode(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const fileInput = form.querySelector('#podcast-video-file');
    const urlInput = form.querySelector('#podcast-video-url');
    const manualUrl = urlInput?.value.trim();

    if (!title) {
      alert('Please provide an episode title.');
      return;
    }

    let videoUrl = manualUrl || '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const uploadedUrl = await this.uploadImage(fileInput.files[0]);
      if (!uploadedUrl) {
        alert('Failed to upload video file.');
        return;
      }
      videoUrl = uploadedUrl;
    }

    if (!videoUrl) {
      alert('Please upload a video file or provide a hosted video URL.');
      return;
    }

    try {
      const api = this.getApiBase();
      const response = await fetch(`${api}/api/podcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, videoUrl })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save episode');
      }

      alert('Podcast episode published!');
      form.reset();
      await this.loadAllData();
      this.renderPodcasts();
    } catch (error) {
      console.error('Podcast save failed:', error);
      alert('Failed to publish episode. Please try again.');
    }
  }

  async deletePodcastEpisode(id) {
    if (!confirm('Delete this episode?')) return;
    try {
      const api = this.getApiBase();
      const response = await fetch(`${api}/api/podcasts/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete episode');
      }
      alert('Episode removed.');
      await this.loadAllData();
      this.renderPodcasts();
    } catch (error) {
      console.error('Delete podcast failed:', error);
      alert('Could not delete the episode.');
    }
  }

  renderAppointments() {
    const container = document.getElementById('appointments-list');
    let appointments = this.currentData.appointments || [];
    
    // Get filter value
    const filterSelect = document.getElementById('appointment-status-filter');
    const filterStatus = filterSelect ? filterSelect.value : '';
    
    // Apply filter if selected
    if (filterStatus) {
      appointments = appointments.filter(apt => apt.status === filterStatus);
    }
    
    if (appointments.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">No appointments found.</p>';
      return;
    }
    
    // Sort by date (newest first)
    appointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    
    container.innerHTML = appointments.map((apt) => {
      const date = new Date(apt.appointmentDate);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Status badge styling
      const statusColors = {
        pending: 'background: #ffc107; color: #000',
        confirmed: 'background: #28a745; color: #fff',
        cancelled: 'background: #dc3545; color: #fff',
        completed: 'background: #6c757d; color: #fff'
      };
      
      return `
        <div class="content-item" style="border-left: 4px solid ${apt.status === 'pending' ? '#ffc107' : apt.status === 'confirmed' ? '#28a745' : apt.status === 'cancelled' ? '#dc3545' : '#6c757d'}">
          <div class="content-item-info">
            <h4>${apt.patientName}</h4>
            <p style="margin: 8px 0;">
              📅 ${formattedDate} at ${apt.appointmentTime}<br>
              📧 ${apt.patientEmail} | 📞 ${apt.patientPhone}
              ${apt.doctorName ? `<br>👨‍⚕️ Dr. ${apt.doctorName}` : '<br>👨‍⚕️ Any Available Doctor'}
              ${apt.reason ? `<br>📝 ${apt.reason}` : ''}
            </p>
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;margin-top:8px;${statusColors[apt.status] || statusColors.pending}">
              ${apt.status.toUpperCase()}
            </span>
          </div>
          <div class="content-item-actions" style="display:flex;flex-direction:column;gap:8px">
            ${apt.status === 'pending' ? `
              <button class="btn btn-small" style="background:#28a745" onclick="admin.updateAppointmentStatus('${apt.id}', 'confirmed')">✓ Confirm</button>
              <button class="btn btn-small btn-danger" onclick="admin.updateAppointmentStatus('${apt.id}', 'cancelled')">✗ Cancel</button>
            ` : ''}
            ${apt.status === 'confirmed' ? `
              <button class="btn btn-small" style="background:#6c757d" onclick="admin.updateAppointmentStatus('${apt.id}', 'completed')">✓ Complete</button>
              <button class="btn btn-small btn-danger" onclick="admin.updateAppointmentStatus('${apt.id}', 'cancelled')">✗ Cancel</button>
            ` : ''}
            <button class="btn btn-small" onclick="admin.viewAppointmentDetails('${apt.id}')">👁 View</button>
            <button class="btn btn-small btn-danger" onclick="admin.deleteItem('appointments', '${apt.id}')">🗑 Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderHomepage() {
    const container = document.getElementById('homepage-editor');
    const home = this.currentData.home || {};
    
    const get = (path, defaultValue = '') => home[path] || defaultValue;
    
    container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Hero Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
      <div class="form-group">
            <label>Hero Title</label>
            <input type="text" id="hero-title" value="${get('hero_title', 'World-class Care for International Patients')}" />
      </div>
          <div class="form-group">
            <label>Hero Subtitle</label>
            <textarea id="hero-subtitle" rows="2">${get('hero_subtitle', 'Advanced kidney transplants, minimally invasive procedures, and compassionate care.')}</textarea>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Transplant Highlights Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Badge Text</label>
            <input type="text" id="transplant-badge" value="${get('transplant_badge', 'WORLD-CLASS TRANSPLANT PROGRAM')}" />
          </div>
          <div class="form-group">
            <label>Heading</label>
            <input type="text" id="transplant-heading" value="${get('transplant_heading', 'Excellence in Kidney Transplantation')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="transplant-description" rows="2">${get('transplant_description', 'Performing 70-80 transplants annually with internationally recognized expertise')}</textarea>
          </div>
          
          <h4 style="margin-top: 20px; color: #1a2a44; font-weight: 600;">Statistics</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
            <div class="form-group">
              <label>Stat 1 - Value</label>
              <input type="text" id="stat-value-0" value="${get('transplant_stat_value_0', '70-80')}" />
            </div>
            <div class="form-group">
              <label>Stat 1 - Label</label>
              <input type="text" id="stat-label-0" value="${get('transplant_stat_label_0', 'Annual Transplants')}" />
            </div>
            <div class="form-group">
              <label>Stat 2 - Value</label>
              <input type="text" id="stat-value-1" value="${get('transplant_stat_value_1', '24/7')}" />
            </div>
            <div class="form-group">
              <label>Stat 2 - Label</label>
              <input type="text" id="stat-label-1" value="${get('transplant_stat_label_1', 'Expert Care')}" />
            </div>
            <div class="form-group">
              <label>Stat 3 - Value</label>
              <input type="text" id="stat-value-2" value="${get('transplant_stat_value_2', '100%')}" />
            </div>
            <div class="form-group">
              <label>Stat 3 - Label</label>
              <input type="text" id="stat-label-2" value="${get('transplant_stat_label_2', 'Dedicated Team')}" />
            </div>
          </div>

          <h4 style="margin-top: 20px; color: #1a2a44; font-weight: 600;">Care Journey Card</h4>
          <div class="form-group">
            <label>Title</label>
            <input type="text" id="care-journey-title" value="${get('care_journey_title', 'Comprehensive Care Journey')}" />
          </div>
          <div class="form-group">
            <label>Journey Item 1</label>
            <input type="text" id="journey-item-0" value="${get('care_journey_item_0', 'Pre-transplant evaluation & diagnostics')}" />
          </div>
          <div class="form-group">
            <label>Journey Item 2</label>
            <input type="text" id="journey-item-1" value="${get('care_journey_item_1', 'Post-transplant care & follow-up')}" />
          </div>
          <div class="form-group">
            <label>Journey Item 3</label>
            <input type="text" id="journey-item-2" value="${get('care_journey_item_2', 'Personalized treatment plans')}" />
          </div>

          <h4 style="margin-top: 20px; color: #1a2a44; font-weight: 600;">Transplant Features</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="form-group">
              <label>Feature 1 - Title</label>
              <input type="text" id="feature-title-0" value="${get('feature_title_0', 'Renowned Transplant Surgeons')}" />
            </div>
            <div class="form-group">
              <label>Feature 1 - Description</label>
              <textarea id="feature-desc-0" rows="2">${get('feature_desc_0', 'Internationally recognized experts with decades of experience in kidney transplantation')}</textarea>
            </div>
            <div class="form-group">
              <label>Feature 2 - Title</label>
              <input type="text" id="feature-title-1" value="${get('feature_title_1', 'Multidisciplinary Team')}" />
            </div>
            <div class="form-group">
              <label>Feature 2 - Description</label>
              <textarea id="feature-desc-1" rows="2">${get('feature_desc_1', 'Nephrologists, cardiologists, pulmonologists, immunologists, and intensive care specialists working together')}</textarea>
            </div>
            <div class="form-group">
              <label>Feature 3 - Title</label>
              <input type="text" id="feature-title-2" value="${get('feature_title_2', 'State-of-Art Facilities')}" />
            </div>
            <div class="form-group">
              <label>Feature 3 - Description</label>
              <textarea id="feature-desc-2" rows="2">${get('feature_desc_2', 'Modular operating rooms and ICUs equipped with cutting-edge medical technology')}</textarea>
            </div>
            <div class="form-group">
              <label>Feature 4 - Title</label>
              <input type="text" id="feature-title-3" value="${get('feature_title_3', 'Latest Therapies & Patient Support')}" />
            </div>
            <div class="form-group">
              <label>Feature 4 - Description</label>
              <textarea id="feature-desc-3" rows="2">${get('feature_desc_3', 'Access to cutting-edge immunosuppressives, counseling, nutrition, and physical therapy')}</textarea>
            </div>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">Facility Video Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Badge Text</label>
            <input type="text" id="facility-badge" value="${get('facility_badge', 'OUR FACILITY')}" />
          </div>
          <div class="form-group">
            <label>Heading</label>
            <input type="text" id="facility-heading" value="${get('facility_heading', 'Tour Our State-of-the-Art Medical Center')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="facility-description" rows="2">${get('facility_description', 'Experience our world-class facilities designed for your comfort and care')}</textarea>
          </div>
          <div class="form-group">
            <label>Video URL</label>
            <input type="text" id="facility-video-url" value="${get('facility_video_url', './assets/clinic_video.mp4')}" />
          </div>
          <div class="form-group">
            <label>Video Description</label>
            <textarea id="facility-video-description" rows="3">${get('facility_video_description', 'Take a virtual tour of our cutting-edge medical facility, featuring advanced surgical suites, comfortable patient rooms, and comprehensive diagnostic centers—all designed to provide the highest standard of care for our international patients.')}</textarea>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700;">CTA Section</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <div class="form-group">
            <label>Heading</label>
            <input type="text" id="cta-heading" value="${get('cta_heading', 'Ready to Start Your Journey?')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="cta-description" rows="2">${get('cta_description', 'Schedule a consultation with our expert medical team today')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Button Text</label>
              <input type="text" id="cta-button-text" value="${get('cta_button_text', 'Schedule Your Consultation')}" />
            </div>
            <div class="form-group">
              <label>Button Link</label>
              <input type="text" id="cta-button-link" value="${get('cta_button_link', './contact.html')}" />
            </div>
          </div>
        </div>

        <h3 style="color: #1a2a44; margin-bottom: 20px; font-weight: 700; margin-top: 40px;">Latest Updates Slideshow</h3>
        <div style="background: var(--card); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border);">
          <p style="color: var(--muted); margin-bottom: 20px; font-size: 0.9rem;">Manage slides for the homepage slideshow. Slides will appear between the hero section and transplant highlights.</p>
          <div id="homepage-slides-list" style="border: 2px dashed var(--border); padding: 15px; border-radius: 8px; background: rgba(0,188,212,0.05); margin-bottom: 15px; min-height: 100px;">
            ${(this.currentData.homepageSlides || []).length > 0 ? (this.currentData.homepageSlides || []).map((slide, idx) => `
              <div class="slide-row" data-slide-id="${slide.id}" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: start;">
                  <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Title *</label>
                        <input type="text" name="slide-title-${idx}" value="${slide.title || ''}" placeholder="Slide Title" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Image URL *</label>
                        <input type="url" name="slide-image-${idx}" value="${slide.imageUrl || ''}" placeholder="https://example.com/image.jpg" style="width: 100%; margin-bottom: 8px;" />
                        <div style="display: flex; gap: 8px; align-items: center;">
                          <input type="file" name="slide-file-${idx}" accept="image/*" style="font-size: 0.85rem; flex: 1;" onchange="admin.handleImageUpload(${idx}, this)" />
                          <button type="button" onclick="document.querySelector('input[name=\\'slide-file-${idx}\\']').click()" class="btn btn-small" style="padding: 6px 12px; font-size: 0.85rem;">Upload</button>
                        </div>
                        ${slide.imageUrl ? `<div class="image-preview-container" style="margin-top: 8px;"><img src="${slide.imageUrl}" alt="Preview" style="max-width: 200px; max-height: 100px; border-radius: 4px; border: 1px solid var(--border); object-fit: contain;" /></div>` : ''}
                        <div id="upload-status-${idx}" style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;"></div>
                      </div>
                    </div>
                    <div style="margin-bottom: 10px;">
                      <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
                      <textarea name="slide-desc-${idx}" rows="2" placeholder="Slide description..." style="width: 100%;">${slide.description || ''}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Link URL</label>
                        <input type="url" name="slide-link-${idx}" value="${slide.linkUrl || ''}" placeholder="https://example.com" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Link Text</label>
                        <input type="text" name="slide-link-text-${idx}" value="${slide.linkText || ''}" placeholder="Learn More" style="width: 100%;" />
                      </div>
                      <div>
                        <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Order</label>
                        <input type="number" name="slide-order-${idx}" value="${slide.order || 0}" placeholder="0" style="width: 100%;" />
                      </div>
                    </div>
                    <div style="margin-top: 10px;">
                      <label style="font-size: 0.85rem; color: var(--text); display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" name="slide-active-${idx}" ${slide.isActive !== false ? 'checked' : ''} />
                        <span>Active (visible on homepage)</span>
                      </label>
                    </div>
                  </div>
                  <button type="button" onclick="admin.deleteHomepageSlide('${slide.id}')" class="btn btn-small btn-danger" style="padding: 8px 16px; margin-top: 22px;">Delete</button>
                </div>
              </div>
            `).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No slides added. Click "Add New Slide" to add one.</p>'}
          </div>
          <button type="button" onclick="admin.addHomepageSlide()" class="btn" style="width: 100%;">+ Add New Slide</button>
        </div>

        <button class="btn primary" onclick="admin.saveHomepage()" style="width: 100%; padding: 15px; font-size: 1.1rem; margin-top: 20px;">Save All Homepage Changes</button>
      </div>
    `;
  }
  

  addDoctor() {
    this.editingType = 'doctors';
    this.editingItem = null;
    this.showEditModal();
  }

  addService() {
    this.editingType = 'services';
    this.editingItem = null;
    this.showEditModal();
  }

  addAchievement() {
    // This now redirects to medical tourism editor
    this.showSection('achievements');
  }

  addReview() {
    this.editingType = 'reviews';
    this.editingItem = null;
    this.showEditModal();
  }

  editItem(type, id) {
    this.editingType = type;
    this.editingItem = id;
    this.showEditModal();
  }

  async deleteItem(type, id) {
    if (confirm('Are you sure you want to delete this item?')) {
      const api = this.getApiBase();
      await fetch(`${api}/api/${type}/${id}`, { method: 'DELETE' });
      await this.loadAllData();
      this.loadSectionData(this.currentSection);
      this.updateDashboard();
    }
  }

  showEditModal() {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    const title = document.getElementById('modal-title');
    
    let formHTML = '';
    let itemData = {};
    
    if (this.editingType === 'doctors') {
      title.textContent = this.editingItem !== null ? 'Edit Doctor' : 'Add Doctor';
      const doctors = this.currentData.doctors || [];
      itemData = this.editingItem !== null ? doctors.find(d => d.id === this.editingItem) || {} : {};
      
      formHTML = `
        <div class="form-group">
          <label>Name</label>
          <input type="text" name="name" value="${itemData.name || ''}" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" value="${itemData.title || ''}" required />
          </div>
          <div class="form-group">
            <label>Education</label>
            <input type="text" name="specialization" value="${itemData.specialization || ''}" required />
          </div>
        </div>
        <div class="form-group">
          <label>Bio</label>
          <textarea name="bio" required>${itemData.bio || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Employment</label>
            <input type="text" name="employment" value="${itemData.employment || ''}" />
          </div>
          <div class="form-group">
            <label>Contact</label>
            <input type="text" name="contact" value="${itemData.contact || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label>Photo</label>
          <small style="color:var(--muted);display:block;margin-bottom:8px">
            ✅ Recommended: Upload image file (stores in Azure Storage)<br>
            💡 Fallback: Use URL if you don't have a file to upload
          </small>
          
          <div style="border:2px dashed var(--border);padding:20px;border-radius:8px;margin-bottom:15px;background:rgba(255,255,255,0.6)">
            <label style="color:var(--accent);font-weight:700;margin-bottom:8px">📁 Upload Image File (Recommended)</label>
            <input type="file" id="photoFile" accept="image/*" onchange="admin.previewImage(this, 'photoPreview')" style="display:block;margin-top:8px" />
            <div id="photoPreview" style="margin-top:10px">
              ${itemData.photoUrl ? `<img src="${itemData.photoUrl}" style="max-width:200px;border-radius:8px" />` : ''}
            </div>
          </div>
          
          <div style="border:1px solid var(--border);padding:15px;border-radius:8px;background:rgba(255,255,255,0.6)">
            <label style="color:var(--muted);font-weight:600;margin-bottom:8px">🔗 Or Enter Image URL (Fallback)</label>
            <input type="url" id="photoUrlManual" value="${itemData.photoUrl || ''}" placeholder="https://example.com/image.jpg" style="margin-top:5px;width:100%" />
            <small style="color:var(--muted);display:block;margin-top:5px">Only used if no file is uploaded above</small>
          </div>
          
          <input type="hidden" name="photoUrl" id="photoUrl" value="${itemData.photoUrl || ''}" />
        </div>
        <div class="form-group">
          <label>Interview URL (YouTube)</label>
          <input type="url" name="interviewUrl" value="${itemData.interviewUrl || ''}" />
        </div>
      `;
    } else if (this.editingType === 'services') {
      title.textContent = this.editingItem !== null ? 'Edit Service' : 'Add Service';
      const services = this.currentData.services || [];
      itemData = this.editingItem !== null ? services.find(s => s.id === this.editingItem) || {} : {};
      
      const detailsData = itemData.details && Array.isArray(itemData.details) ? itemData.details : [];
      const detailTextsData = itemData.detailTexts && Array.isArray(itemData.detailTexts) ? itemData.detailTexts : [];
      const videosData = itemData.detailVideos && Array.isArray(itemData.detailVideos) ? itemData.detailVideos : [];
      
      formHTML = `
        <div class="form-group">
          <label>Service Name</label>
          <input type="text" name="name" value="${itemData.name || ''}" required />
        </div>
        <div class="form-group">
          <label>Summary</label>
          <textarea name="summary" rows="3" required>${itemData.summary || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input type="url" name="image" value="${itemData.image || ''}" placeholder="https://example.com/image.jpg" />
        </div>
        <div class="form-group">
          <label>Service Details with Videos</label>
          <small style="color: var(--muted); font-size: 0.85rem; display: block; margin-bottom: 15px;">
            Add service detail cards. Each detail can have an optional video (YouTube, Vimeo, or direct video file).
          </small>
          <div id="service-details-list" style="border: 2px dashed var(--border); padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.6); margin-bottom: 10px; min-height: 100px;">
            ${detailsData.length > 0 ? detailsData.map((detail, idx) => `
                <div class="detail-row" data-detail-index="${idx}" style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
                  <div style="flex: 1;">
                    <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Detail Title</label>
                    <input type="text" name="detail-${idx}" value="${detail || ''}" placeholder="e.g., Diagnostic Procedures" required style="width: 100%;" />
                  </div>
                  <button type="button" onclick="admin.removeDetailRow(${idx})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
                </div>
                <div style="margin-top: 10px;">
                  <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Detail Description/Text</label>
                  <textarea name="detail-text-${idx}" rows="3" placeholder="Enter a detailed description for this sub-service..." style="width: 100%; resize: vertical;">${detailTextsData[idx] || ''}</textarea>
                  <small style="color: var(--muted); font-size: 0.75rem;">This text will be displayed below the detail title on the service detail page.</small>
                </div>
                <div style="margin-top: 10px;">
                  <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Video URL (Optional)</label>
                  <input type="url" name="video-${idx}" value="${videosData[idx] || ''}" placeholder="YouTube, Vimeo, or ./assets/video.mp4" style="width: 100%;" />
                </div>
              </div>
            `).join('') : '<p style="color: var(--muted); text-align: center; padding: 15px;">No details added. Click "Add Detail" to add one.</p>'}
          </div>
          <button type="button" onclick="admin.addDetailRow()" class="btn" style="width: 100%;">+ Add Detail</button>
          <input type="hidden" id="detail-count" value="${detailsData.length}" />
        </div>
      `;
    } else if (this.editingType === 'achievements') {
      title.textContent = this.editingItem !== null ? 'Edit Medical Tourism Item' : 'Add Medical Tourism Item';
      const achievements = this.currentData.achievements || [];
      itemData = this.editingItem !== null ? achievements.find(a => a.id === this.editingItem) || {} : {};
      
      formHTML = `
        <div class="form-group">
          <label>Title</label>
          <input type="text" name="title" value="${itemData.title || ''}" required placeholder="e.g., Medical Tourism Service, Partnership Benefit" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="text" required placeholder="Describe the medical tourism item...">${itemData.text || ''}</textarea>
        </div>
      `;
    } else if (this.editingType === 'reviews') {
      title.textContent = this.editingItem !== null ? 'Edit Review' : 'Add Review';
      const reviews = this.currentData.reviews || [];
      itemData = this.editingItem !== null ? reviews.find(r => r.id === this.editingItem) || {} : {};
      
      formHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Author Name</label>
            <input type="text" name="author" value="${itemData.author || ''}" required />
          </div>
          <div class="form-group">
            <label>Rating (1-5)</label>
            <input type="number" name="rating" min="1" max="5" value="${itemData.rating || 5}" required />
          </div>
        </div>
        <div class="form-group">
          <label>Review Text</label>
          <textarea name="text" required>${itemData.text || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Video URL (Optional)</label>
          <small style="color:var(--muted);display:block;margin-bottom:8px">
            Add a video review (YouTube, Vimeo, or direct video file). Leave empty for text-only review.
          </small>
          <input type="url" name="videoUrl" value="${itemData.videoUrl || ''}" placeholder="https://youtube.com/watch?v=... or ./assets/video.mp4" />
        </div>
      `;
    }
    
    form.innerHTML = formHTML;
    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
    this.editingItem = null;
    this.editingType = null;
  }

  // Image preview function
  previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" style="max-width:200px;border-radius:8px;margin-top:10px" />`;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  previewMapImage(input) {
    const preview = document.getElementById('map-image-preview');
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Map Preview" style="max-width: 300px; max-height: 200px; border-radius: 4px; border: 1px solid var(--border); object-fit: contain;" />`;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // Add detail row to service form
  addDetailRow() {
    const container = document.getElementById('service-details-list');
    const countInput = document.getElementById('detail-count');
    const currentCount = parseInt(countInput.value || 0);
    const newIndex = currentCount;
    
    // Remove empty message if exists
    const emptyMsg = container.querySelector('p[style*="text-align: center"]');
    if (emptyMsg) {
      container.innerHTML = '';
    }
    
    const rowHTML = `
      <div class="detail-row" data-detail-index="${newIndex}" style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);">
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
          <div style="flex: 1;">
            <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Detail Title</label>
            <input type="text" name="detail-${newIndex}" placeholder="e.g., Diagnostic Procedures" required style="width: 100%;" />
          </div>
          <button type="button" onclick="admin.removeDetailRow(${newIndex})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
        </div>
        <div style="margin-top: 10px;">
          <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Detail Description/Text</label>
          <textarea name="detail-text-${newIndex}" rows="3" placeholder="Enter a detailed description for this sub-service..." style="width: 100%; resize: vertical;"></textarea>
          <small style="color: var(--muted); font-size: 0.75rem;">This text will be displayed below the detail title on the service detail page.</small>
        </div>
        <div style="margin-top: 10px;">
          <label style="font-size: 0.85rem; color: #1a2a44; display: block; margin-bottom: 5px; font-weight: 600;">Video URL (Optional)</label>
          <input type="url" name="video-${newIndex}" placeholder="YouTube, Vimeo, or ./assets/video.mp4" style="width: 100%;" />
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    countInput.value = newIndex + 1;
  }
  
  // Remove detail row from service form
  removeDetailRow(index) {
    const container = document.getElementById('service-details-list');
    const row = container.querySelector(`[data-detail-index="${index}"]`);
    if (row) {
      row.remove();
      this.updateDetailRowIndices();
      
      // Show empty message if no rows left
      if (container.children.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No details added. Click "Add Detail" to add one.</p>';
        document.getElementById('detail-count').value = 0;
      }
    }
  }
  
  // Update indices after removal
  updateDetailRowIndices() {
    const container = document.getElementById('service-details-list');
    const rows = container.querySelectorAll('.detail-row');
    const countInput = document.getElementById('detail-count');
    
    rows.forEach((row, idx) => {
      row.setAttribute('data-detail-index', idx);
      const titleInput = row.querySelector(`input[name^="detail-"]`);
      const videoInput = row.querySelector(`input[name^="video-"]`);
      const removeBtn = row.querySelector('button[onclick*="removeDetailRow"]');
      
      if (titleInput) titleInput.name = `detail-${idx}`;
      if (videoInput) videoInput.name = `video-${idx}`;
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeDetailRow(${idx})`);
    });
    
    if (countInput) countInput.value = rows.length;
  }

  // Upload image file
  async uploadImage(file, previewId = 'photoPreview') {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      // Show uploading feedback
      const preview = document.getElementById(previewId);
      if (preview) {
        preview.innerHTML = `
          <div style="padding:20px;text-align:center;color:var(--accent)">
            <div style="font-size:24px;margin-bottom:10px">⏳</div>
            <div>Uploading to Azure Storage...</div>
          </div>
        `;
      }
      
      const api = this.getApiBase();
      const response = await fetch(`${api}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Show success feedback
      if (preview) {
        const isMapPreview = previewId === 'map-image-preview';
        const imgStyle = isMapPreview 
          ? 'max-width: 300px; max-height: 200px; border-radius: 4px; border: 1px solid var(--border); object-fit: contain;'
          : 'max-width:200px;border-radius:8px;margin-top:10px';
        preview.innerHTML = `
          <div style="padding:20px;background:rgba(0,255,0,0.1);border-radius:8px;margin-top:10px">
            <div style="font-size:24px;margin-bottom:10px">✅</div>
            <div style="color:#00ff00;font-weight:600">Uploaded to Azure Storage!</div>
            <img src="${result.url}" style="${imgStyle}" />
            <div style="font-size:12px;color:var(--muted);margin-top:8px;word-break:break-all">${result.url}</div>
          </div>
        `;
      }
      
      // Update URL input field if it exists (for map image)
      if (previewId === 'map-image-preview') {
        const urlInput = document.getElementById('map-image-url');
        if (urlInput) {
          urlInput.value = result.url;
        }
      }
      
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Show error feedback
      const preview = document.getElementById(previewId);
      if (preview) {
        preview.innerHTML = `
          <div style="padding:20px;background:rgba(255,0,0,0.1);border-radius:8px;margin-top:10px">
            <div style="font-size:24px;margin-bottom:10px">❌</div>
            <div style="color:#ff0000;font-weight:600">Upload Failed</div>
            <div style="font-size:12px;color:var(--muted);margin-top:8px">${error.message}</div>
          </div>
        `;
      }
      
      const errorMsg = previewId === 'map-image-preview' 
        ? 'Failed to upload map image to Azure Storage.\n\nError: ' + error.message + '\n\nPlease check:\n1. Backend server is running\n2. Azure connection is configured\n3. Internet connection is stable\n\nYou can use the URL field as a fallback.'
        : 'Failed to upload image to Azure Storage.\n\nError: ' + error.message + '\n\nPlease check:\n1. Backend server is running\n2. Azure connection is configured\n3. Internet connection is stable\n\nYou can use the URL field as a fallback.';
      alert(errorMsg);
      return null;
    }
  }

  async saveItem() {
    const form = document.getElementById('edit-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const api = this.getApiBase();
    const type = this.editingType;
    const id = this.editingItem;
    
    // Handle photo upload for doctors (prioritize file upload)
    if (type === 'doctors') {
      const photoFile = document.getElementById('photoFile');
      const photoUrlManual = document.getElementById('photoUrlManual');
      
      let uploadMethod = 'none';
      
      // Priority 1: File Upload to Azure Storage
      if (photoFile && photoFile.files && photoFile.files[0]) {
        console.log('📤 Uploading image to Azure Storage...');
        const uploadedUrl = await this.uploadImage(photoFile.files[0]);
        if (uploadedUrl) {
          data.photoUrl = uploadedUrl;
          uploadMethod = 'azure-upload';
          console.log('✅ Image uploaded to Azure:', uploadedUrl);
        } else {
          console.error('❌ Azure upload failed');
        }
      }
      // Priority 2: Manual URL (fallback)
      else if (photoUrlManual && photoUrlManual.value) {
        data.photoUrl = photoUrlManual.value;
        uploadMethod = 'manual-url';
        console.log('🔗 Using manual URL:', data.photoUrl);
      }
      // Priority 3: Keep existing URL if no changes
      else if (data.photoUrl) {
        uploadMethod = 'existing';
        console.log('📌 Keeping existing photo URL');
      }
      
      // Log which method was used
      console.log('Photo method used:', uploadMethod);
    }

    console.log('Saving item:', { type, id, data });

    if (type === 'doctors') {
      const payload = {
        name: data.name,
        title: data.title,
        specialization: data.specialization,
        bio: data.bio,
        employment: data.employment || null,
        contact: data.contact || null,
        photoUrl: data.photoUrl || null,
        interviewUrl: data.interviewUrl || null
      };
      if (id !== null) {
        await fetch(`${api}/api/doctors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${api}/api/doctors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    } else if (type === 'services') {
      // Parse details, detail texts, and videos from dynamic form
      const detailsArray = [];
      const detailTextsArray = [];
      const videosArray = [];
      const detailCount = parseInt(document.getElementById('detail-count')?.value || 0);
      
      for (let i = 0; i < detailCount; i++) {
        const detailTitle = data[`detail-${i}`];
        const detailText = data[`detail-text-${i}`];
        const videoUrl = data[`video-${i}`];
        
        if (detailTitle && detailTitle.trim()) {
          detailsArray.push(detailTitle.trim());
          detailTextsArray.push(detailText && detailText.trim() ? detailText.trim() : '');
          videosArray.push(videoUrl && videoUrl.trim() ? videoUrl.trim() : '');
        }
      }
      
      const payload = { 
        name: data.name,
        summary: data.summary,
        image: data.image || null,
        details: detailsArray,
        detailTexts: detailTextsArray,
        detailVideos: videosArray
      };
      if (id !== null) {
        await fetch(`${api}/api/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${api}/api/services`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    } else if (type === 'achievements') {
      const payload = { title: data.title, text: data.text };
      if (id !== null) {
        await fetch(`${api}/api/achievements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${api}/api/achievements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    } else if (type === 'reviews') {
      const payload = { 
        author: data.author, 
        rating: Number(data.rating), 
        text: data.text,
        videoUrl: data.videoUrl || null
      };
      if (id !== null) {
        await fetch(`${api}/api/reviews/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${api}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
    }

    this.closeModal();
    await this.loadAllData();
    this.loadSectionData(this.currentSection);
    this.updateDashboard();
    console.log('Save completed successfully');
  }

  addServiceRow() {
    const container = document.getElementById('hg-services-list');
    const currentCount = parseInt(document.getElementById('service-count')?.value || 0);
    const newIndex = currentCount;
    
    const newRow = document.createElement('div');
    newRow.className = 'service-row';
    newRow.setAttribute('data-service-index', newIndex);
    newRow.style.cssText = 'background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);';
    newRow.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
        <div style="flex: 1;">
          <div style="display: grid; grid-template-columns: 80px 1fr; gap: 10px;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Icon</label>
              <input type="text" name="service-icon-${newIndex}" value="" placeholder="✈️" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Title</label>
              <input type="text" name="service-title-${newIndex}" value="" placeholder="Service Title" style="width: 100%;" />
            </div>
          </div>
          <div style="margin-top: 10px;">
            <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
            <textarea name="service-desc-${newIndex}" rows="2" placeholder="Service description..." style="width: 100%;"></textarea>
          </div>
        </div>
        <button type="button" onclick="admin.removeServiceRow(${newIndex})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
      </div>
    `;
    
    // Remove empty message if present
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    
    container.appendChild(newRow);
    document.getElementById('service-count').value = newIndex + 1;
  }

  removeServiceRow(index) {
    const container = document.getElementById('hg-services-list');
    const row = container.querySelector(`[data-service-index="${index}"]`);
    if (row) row.remove();
    
    // Update indices
    const rows = container.querySelectorAll('.service-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-service-index', idx);
      const removeBtn = row.querySelector('button[onclick*="removeServiceRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeServiceRow(${idx})`);
      
      // Update input names
      const inputs = row.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const name = input.name || input.getAttribute('name');
        if (name) {
          const newName = name.replace(/-\d+$/, `-${idx}`);
          input.name = newName;
          input.setAttribute('name', newName);
        }
      });
    });
    
    // Update count
    document.getElementById('service-count').value = rows.length;
    
    // Show empty message if no rows
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No services added. Click "Add Service" to add one.</p>';
      document.getElementById('service-count').value = 0;
    }
  }

  addProcessRow() {
    const container = document.getElementById('process-list');
    const currentCount = parseInt(document.getElementById('process-count')?.value || 0);
    const newIndex = currentCount;
    
    const newRow = document.createElement('div');
    newRow.className = 'process-row';
    newRow.setAttribute('data-process-index', newIndex);
    newRow.style.cssText = 'background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);';
    newRow.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
        <div style="flex: 1;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Step Title</label>
              <input type="text" name="process-title-${newIndex}" value="" placeholder="Step Title" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
              <input type="text" name="process-desc-${newIndex}" value="" placeholder="Step description" style="width: 100%;" />
            </div>
          </div>
        </div>
        <button type="button" onclick="admin.removeProcessRow(${newIndex})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
      </div>
    `;
    
    // Remove empty message if present
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    
    container.appendChild(newRow);
    document.getElementById('process-count').value = newIndex + 1;
  }

  removeProcessRow(index) {
    const container = document.getElementById('process-list');
    const row = container.querySelector(`[data-process-index="${index}"]`);
    if (row) row.remove();
    
    // Update indices
    const rows = container.querySelectorAll('.process-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-process-index', idx);
      const removeBtn = row.querySelector('button[onclick*="removeProcessRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeProcessRow(${idx})`);
      
      // Update input names
      const inputs = row.querySelectorAll('input');
      inputs.forEach(input => {
        const name = input.name || input.getAttribute('name');
        if (name) {
          const newName = name.replace(/-\d+$/, `-${idx}`);
          input.name = newName;
          input.setAttribute('name', newName);
        }
      });
    });
    
    // Update count
    document.getElementById('process-count').value = rows.length;
    
    // Show empty message if no rows
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No process steps added. Click "Add Step" to add one.</p>';
      document.getElementById('process-count').value = 0;
    }
  }

  addLocationRow() {
    const container = document.getElementById('map-locations-list');
    const currentCount = parseInt(document.getElementById('location-count')?.value || 0);
    const newIndex = currentCount;
    
    const newRow = document.createElement('div');
    newRow.className = 'location-row';
    newRow.setAttribute('data-location-index', newIndex);
    newRow.style.cssText = 'background: rgba(255,255,255,0.03); padding: 12px; border-radius: 6px; margin-bottom: 10px; border: 1px solid var(--border);';
    newRow.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: start;">
        <div style="flex: 1;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Location Name</label>
              <input type="text" name="location-name-${newIndex}" value="" placeholder="e.g., Qatar" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Icon (Emoji)</label>
              <input type="text" name="location-icon-${newIndex}" value="" placeholder="🇶🇦" style="width: 100%;" />
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Description</label>
            <textarea name="location-desc-${newIndex}" rows="2" placeholder="Description of patients from this location..." style="width: 100%;"></textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Latitude</label>
              <input type="number" step="any" name="location-lat-${newIndex}" value="" placeholder="25.3548" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Longitude</label>
              <input type="number" step="any" name="location-lng-${newIndex}" value="" placeholder="51.1839" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Stat Value (Optional)</label>
              <input type="text" name="location-stat-${newIndex}" value="" placeholder="150+" style="width: 100%;" />
            </div>
            <div>
              <label style="font-size: 0.85rem; color: var(--text); display: block; margin-bottom: 5px;">Stat Label</label>
              <input type="text" name="location-stat-label-${newIndex}" value="" placeholder="Patients" style="width: 100%;" />
            </div>
          </div>
        </div>
        <button type="button" onclick="admin.removeLocationRow(${newIndex})" class="btn btn-small btn-danger" style="padding: 6px 12px; margin-top: 22px;">Remove</button>
      </div>
    `;
    
    // Remove empty message if present
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();
    
    container.appendChild(newRow);
    document.getElementById('location-count').value = newIndex + 1;
  }

  removeLocationRow(index) {
    const container = document.getElementById('map-locations-list');
    const row = container.querySelector(`[data-location-index="${index}"]`);
    if (row) row.remove();
    
    // Update indices
    const rows = container.querySelectorAll('.location-row');
    rows.forEach((row, idx) => {
      row.setAttribute('data-location-index', idx);
      const removeBtn = row.querySelector('button[onclick*="removeLocationRow"]');
      if (removeBtn) removeBtn.setAttribute('onclick', `admin.removeLocationRow(${idx})`);
      
      // Update input names
      const inputs = row.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const name = input.name || input.getAttribute('name');
        if (name) {
          const newName = name.replace(/-\d+$/, `-${idx}`);
          input.name = newName;
          input.setAttribute('name', newName);
        }
      });
    });
    
    // Update count
    document.getElementById('location-count').value = rows.length;
    
    // Show empty message if no rows
    if (rows.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 15px;">No locations added. Click "Add Location" to add one.</p>';
      document.getElementById('location-count').value = 0;
    }
  }

  async saveMedicalTourism() {
    const api = this.getApiBase();
    console.log('🌐 Using API base URL:', api);
    
    // Collect Health Gateways data
    const healthGatewaysBadge = document.getElementById('hg-badge')?.value || '';
    const healthGatewaysTitle = document.getElementById('hg-title')?.value || '';
    const healthGatewaysDescription = document.getElementById('hg-description')?.value || '';
    
    // Collect services
    const services = [];
    const serviceCount = parseInt(document.getElementById('service-count')?.value || 0);
    for (let i = 0; i < serviceCount; i++) {
      const icon = document.querySelector(`[name="service-icon-${i}"]`)?.value || '';
      const title = document.querySelector(`[name="service-title-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="service-desc-${i}"]`)?.value || '';
      
      if (title.trim() || description.trim()) {
        services.push({ icon, title, description });
      }
    }
    
    // Collect contact info
    const contactHeading = document.getElementById('hg-contact-heading')?.value || '';
    const contactEmail = document.getElementById('hg-contact-email')?.value || '';
    const contactPhone = document.getElementById('hg-contact-phone')?.value || '';
    const contactWebsite = document.getElementById('hg-contact-website')?.value || '';
    
    // Collect process steps
    const processTitle = document.getElementById('process-title')?.value || '';
    const processSteps = [];
    const processCount = parseInt(document.getElementById('process-count')?.value || 0);
    for (let i = 0; i < processCount; i++) {
      const title = document.querySelector(`[name="process-title-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="process-desc-${i}"]`)?.value || '';
      
      if (title.trim() || description.trim()) {
        processSteps.push({ title, description });
      }
    }
    
    // Collect CTA data
    const ctaHeading = document.getElementById('cta-heading')?.value || '';
    const ctaDescription = document.getElementById('cta-description')?.value || '';
    const ctaButtonText = document.getElementById('cta-button-text')?.value || '';
    const ctaButtonLink = document.getElementById('cta-button-link')?.value || '';
    
    // Collect Map data
    const mapTitle = document.getElementById('map-title')?.value || '';
    const mapDescription = document.getElementById('map-description')?.value || '';
    
    // Handle map image upload or URL
    let mapImageUrl = '';
    const mapImageFile = document.getElementById('map-image-file');
    const mapImageUrlInput = document.getElementById('map-image-url');
    
    // Priority 1: File Upload
    if (mapImageFile && mapImageFile.files && mapImageFile.files[0]) {
      try {
        const uploadedUrl = await this.uploadImage(mapImageFile.files[0], 'map-image-preview');
        if (uploadedUrl) {
          mapImageUrl = uploadedUrl;
          console.log('✅ Map image uploaded:', uploadedUrl);
        } else {
          console.warn('⚠️ Map image upload failed, falling back to URL');
        }
      } catch (error) {
        console.error('❌ Map image upload error:', error);
        alert('Failed to upload map image: ' + error.message + '\n\nYou can use the URL field instead.');
      }
    }
    
    // Priority 2: Manual URL (fallback or if no file uploaded)
    if (!mapImageUrl && mapImageUrlInput) {
      const urlValue = mapImageUrlInput.value ? mapImageUrlInput.value.trim() : '';
      if (urlValue) {
        mapImageUrl = urlValue;
        console.log('🔗 Using map image URL:', mapImageUrl);
      } else {
        // Allow empty string to clear the image
        mapImageUrl = '';
      }
    }
    
    const mapLocations = [];
    const locationCount = parseInt(document.getElementById('location-count')?.value || 0);
    for (let i = 0; i < locationCount; i++) {
      const name = document.querySelector(`[name="location-name-${i}"]`)?.value || '';
      const icon = document.querySelector(`[name="location-icon-${i}"]`)?.value || '';
      const description = document.querySelector(`[name="location-desc-${i}"]`)?.value || '';
      const lat = parseFloat(document.querySelector(`[name="location-lat-${i}"]`)?.value || 0);
      const lng = parseFloat(document.querySelector(`[name="location-lng-${i}"]`)?.value || 0);
      const stat = document.querySelector(`[name="location-stat-${i}"]`)?.value || '';
      const statLabel = document.querySelector(`[name="location-stat-label-${i}"]`)?.value || '';
      
      if (name.trim()) {
        mapLocations.push({ name, icon, description, lat: lat || undefined, lng: lng || undefined, stat, statLabel });
      }
    }
    
    const payload = {
      healthGatewaysBadge,
      healthGatewaysTitle,
      healthGatewaysDescription,
      healthGatewaysServices: services,
      healthGatewaysContactHeading: contactHeading,
      healthGatewaysContactEmail: contactEmail,
      healthGatewaysContactPhone: contactPhone,
      healthGatewaysContactWebsite: contactWebsite,
      processTitle,
      processSteps,
      ctaHeading,
      ctaDescription,
      ctaButtonText,
      ctaButtonLink,
      mapTitle,
      mapDescription,
      mapImageUrl: mapImageUrl || null, // Send null if empty string
      mapLocations
    };
    
    console.log('📤 Saving medical tourism data:', { mapImageUrl: payload.mapImageUrl });
    
    try {
      const response = await fetch(`${api}/api/medical-tourism`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert('✅ Medical Tourism page updated successfully!');
        await this.loadAllData();
        this.renderMedicalTourism();
      } else {
        let errorMessage = 'Unknown error';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || JSON.stringify(error);
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('❌ Save failed:', errorMessage);
        alert('❌ Failed to save: ' + errorMessage + '\n\nCheck console for details.');
      }
    } catch (error) {
      console.error('❌ Error saving medical tourism:', error);
      const errorMsg = error.message || 'Network error or server not responding';
      alert('❌ Failed to save: ' + errorMsg + '\n\nPlease check:\n1. Backend server is running on ' + api + '\n2. Check browser console for details');
    }
  }

  async saveHomepage() {
    const api = this.getApiBase();
    
    const payload = {
      // Hero Section
      heroTitle: document.getElementById('hero-title')?.value || '',
      heroSubtitle: document.getElementById('hero-subtitle')?.value || '',
      
      // Transplant Highlights Section
      transplantBadge: document.getElementById('transplant-badge')?.value || '',
      transplantHeading: document.getElementById('transplant-heading')?.value || '',
      transplantDescription: document.getElementById('transplant-description')?.value || '',
      transplantStatValue0: document.getElementById('stat-value-0')?.value || '',
      transplantStatLabel0: document.getElementById('stat-label-0')?.value || '',
      transplantStatValue1: document.getElementById('stat-value-1')?.value || '',
      transplantStatLabel1: document.getElementById('stat-label-1')?.value || '',
      transplantStatValue2: document.getElementById('stat-value-2')?.value || '',
      transplantStatLabel2: document.getElementById('stat-label-2')?.value || '',
      careJourneyTitle: document.getElementById('care-journey-title')?.value || '',
      careJourneyItem0: document.getElementById('journey-item-0')?.value || '',
      careJourneyItem1: document.getElementById('journey-item-1')?.value || '',
      careJourneyItem2: document.getElementById('journey-item-2')?.value || '',
      featureTitle0: document.getElementById('feature-title-0')?.value || '',
      featureDesc0: document.getElementById('feature-desc-0')?.value || '',
      featureTitle1: document.getElementById('feature-title-1')?.value || '',
      featureDesc1: document.getElementById('feature-desc-1')?.value || '',
      featureTitle2: document.getElementById('feature-title-2')?.value || '',
      featureDesc2: document.getElementById('feature-desc-2')?.value || '',
      featureTitle3: document.getElementById('feature-title-3')?.value || '',
      featureDesc3: document.getElementById('feature-desc-3')?.value || '',
      
      // Facility Video Section
      facilityBadge: document.getElementById('facility-badge')?.value || '',
      facilityHeading: document.getElementById('facility-heading')?.value || '',
      facilityDescription: document.getElementById('facility-description')?.value || '',
      facilityVideoUrl: document.getElementById('facility-video-url')?.value || '',
      facilityVideoDescription: document.getElementById('facility-video-description')?.value || '',
      
      // CTA Section
      ctaHeading: document.getElementById('cta-heading')?.value || '',
      ctaDescription: document.getElementById('cta-description')?.value || '',
      ctaButtonText: document.getElementById('cta-button-text')?.value || '',
      ctaButtonLink: document.getElementById('cta-button-link')?.value || ''
    };
    
    try {
      // Check API connection before saving
      const isConnected = await this.checkApiConnection();
      if (!isConnected) {
        const defaultUrl = 'https://kidneyclinicappservice-a3esbebthzb2g8fn.eastus-01.azurewebsites.net';
        const useDefault = confirm(`Cannot connect to API at ${api}. The server may not be running.\n\nWould you like to try with the default URL (${defaultUrl})?`);
        if (useDefault) {
          localStorage.setItem('api_base', defaultUrl);
          // Retry with default URL
          return this.saveHomepage();
        } else {
          throw new Error(`Cannot connect to server at ${api}. Please ensure the server is running.`);
        }
      }
      
      const response = await fetch(`${api}/api/home`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!response.ok) throw new Error('Failed to save');
    await this.loadAllData();
      // Save slides
      await this.saveHomepageSlides();
      
      // Reload all data to get updated slides
      await this.loadAllData();
      this.renderHomepage();
      alert('Homepage saved successfully!');
    } catch (error) {
      console.error('Error saving homepage:', error);
      alert(`Failed to save homepage: ${error.message || 'Please check the console for details.'}`);
    }
  }

  async saveHomepageSlides() {
    const api = this.getApiBase();
    const slidesList = document.getElementById('homepage-slides-list');
    if (!slidesList) return;

    const slideRows = slidesList.querySelectorAll('.slide-row');
    const slides = Array.from(slideRows).map((row, idx) => {
      const slideId = row.getAttribute('data-slide-id');
      const titleInput = row.querySelector(`input[name="slide-title-${idx}"]`);
      const descInput = row.querySelector(`textarea[name="slide-desc-${idx}"]`);
      const imageInput = row.querySelector(`input[name="slide-image-${idx}"]`);
      const linkInput = row.querySelector(`input[name="slide-link-${idx}"]`);
      const linkTextInput = row.querySelector(`input[name="slide-link-text-${idx}"]`);
      const orderInput = row.querySelector(`input[name="slide-order-${idx}"]`);
      const activeInput = row.querySelector(`input[name="slide-active-${idx}"]`);
      
      return {
        id: slideId,
        title: titleInput?.value || '',
        description: descInput?.value || '',
        imageUrl: imageInput?.value || '',
        linkUrl: linkInput?.value || '',
        linkText: linkTextInput?.value || '',
        order: parseInt(orderInput?.value || '0', 10),
        isActive: activeInput?.checked !== false
      };
    });
    
    console.log('Saving slides:', slides); // Debug log

    // Update existing slides and create new ones
    for (const slide of slides) {
      try {
        if (slide.id && slide.id !== 'undefined' && slide.id !== 'null') {
          // Update existing slide - don't send id in body
          const { id, ...updateData } = slide;
          const updateResponse = await fetch(`${api}/api/homepage-slides/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`Error updating slide ${slide.id}: ${errorData.error}`);
            throw new Error(`Failed to update slide: ${errorData.error || 'Unknown error'}`);
          }
        } else if (slide.title) {
          // Create new slide if it has title (imageUrl can be added later)
          const createResponse = await fetch(`${api}/api/homepage-slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: slide.title,
              description: slide.description,
              imageUrl: slide.imageUrl,
              linkUrl: slide.linkUrl,
              linkText: slide.linkText,
              order: slide.order,
              isActive: slide.isActive
            })
          });
          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({ error: 'Unknown error' }));
            const errorMsg = errorData.error || `Failed with status ${createResponse.status}`;
            console.error(`Error creating slide: ${errorMsg}`);
            throw new Error(`Failed to create slide: ${errorMsg}`);
          }
        }
      } catch (error) {
        console.error(`Error saving slide:`, error);
        let errorMessage = error.message;
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Network error: Could not connect to server. Please check if the server is running at ' + api;
        }
        throw new Error(errorMessage); // Re-throw with improved message
      }
    }
  }

  async addHomepageSlide() {
    const api = this.getApiBase();
    try {
      const newSlide = {
        title: 'New Slide',
        description: '',
        imageUrl: '',
        linkUrl: '',
        linkText: '',
        order: (this.currentData.homepageSlides || []).length,
        isActive: true
      };

      const response = await fetch(`${api}/api/homepage-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlide)
      });

      if (response.ok) {
        await this.loadAllData();
        this.renderHomepage();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to add slide: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding slide:', error);
      alert(`Failed to add slide: ${error.message || 'Please check the console for details.'}`);
    }
  }

  async deleteHomepageSlide(slideId) {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    const api = this.getApiBase();
    try {
      const response = await fetch(`${api}/api/homepage-slides/${slideId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await this.loadAllData();
        this.renderHomepage();
      } else {
        alert('Failed to delete slide');
      }
    } catch (error) {
      console.error('Error deleting slide:', error);
      alert('Failed to delete slide. Please check the console for details.');
    }
  }

  async handleImageUpload(slideIndex, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const api = this.getApiBase();
    const statusDiv = document.getElementById(`upload-status-${slideIndex}`);
    const imageInput = document.querySelector(`input[name="slide-image-${slideIndex}"]`);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      statusDiv.textContent = 'Please select an image file';
      statusDiv.style.color = 'var(--accent)';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      statusDiv.textContent = 'File size must be less than 10MB';
      statusDiv.style.color = 'var(--accent)';
      return;
    }

    statusDiv.textContent = 'Uploading...';
    statusDiv.style.color = 'var(--muted)';

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${api}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Update the image URL input field
      if (imageInput) {
        imageInput.value = data.url;
        
        // Show/update preview
        const slideRow = fileInput.closest('.slide-row');
        const imageContainer = imageInput.parentElement;
        
        // Remove existing preview if any
        const existingPreview = imageContainer.querySelector('.image-preview-container');
        if (existingPreview) {
          existingPreview.remove();
        }
        
        // Add new preview
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview-container';
        previewDiv.style.marginTop = '8px';
        previewDiv.innerHTML = `<img src="${data.url}" alt="Preview" style="max-width: 200px; max-height: 100px; border-radius: 4px; border: 1px solid var(--border); object-fit: contain;" />`;
        imageContainer.appendChild(previewDiv);
      }

      statusDiv.textContent = 'Upload successful!';
      statusDiv.style.color = '#4caf50';
      
      // Clear status after 3 seconds
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      let errorMessage = error.message;
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Network error: Could not connect to server. Please check if the server is running and try again.';
      }
      statusDiv.textContent = `Upload failed: ${errorMessage}`;
      statusDiv.style.color = 'var(--accent)';
    }
  }

  // Appointment management functions
  async updateAppointmentStatus(appointmentId, newStatus) {
    if (!confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
      return;
    }

    try {
      const api = this.getApiBase();
      const response = await fetch(`${api}/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(`Appointment ${newStatus} successfully!`);
        // Reload data and refresh view
        await this.loadAllData();
        this.renderAppointments();
      } else {
        const error = await response.json();
        alert('Failed to update appointment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    }
  }

  viewAppointmentDetails(appointmentId) {
    const appointment = this.currentData.appointments.find(apt => apt.id === appointmentId);
    if (!appointment) {
      alert('Appointment not found');
      return;
    }

    const date = new Date(appointment.appointmentDate);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const details = `
📅 Appointment Details
━━━━━━━━━━━━━━━━━━━━━

👤 Patient: ${appointment.patientName}
📧 Email: ${appointment.patientEmail}
📞 Phone: ${appointment.patientPhone}

📅 Date: ${formattedDate}
⏰ Time: ${appointment.appointmentTime}

👨‍⚕️ Doctor: ${appointment.doctorName || 'Any Available Doctor'}

📝 Reason: ${appointment.reason || 'Not specified'}

📊 Status: ${appointment.status.toUpperCase()}

🆔 ID: ${appointment.id}
📅 Created: ${new Date(appointment.createdAt).toLocaleString()}
    `.trim();

    alert(details);
  }

  filterAppointments() {
    this.renderAppointments();
  }
} // End of AdminPanel class

// Make the class globally accessible even though it's defined inside the try block
window.AdminPanel = AdminPanel;

} catch (error) {
  console.error('CRITICAL ERROR: Failed to define AdminPanel class:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name
  });
  // Define a minimal AdminPanel to prevent further errors
  window.AdminPanel = class AdminPanel {
    constructor() {
      console.error('AdminPanel class definition failed. Using fallback.');
    }
  };
}

// Global functions for onclick handlers
function showSection(section) {
  admin.showSection(section);
}

function addDoctor() {
  admin.addDoctor();
}

function addService() {
  admin.addService();
}

function addAchievement() {
  admin.addAchievement();
}

function addReview() {
  admin.addReview();
}

function closeModal() {
  admin.closeModal();
}

function saveItem() {
  admin.saveItem();
}

// Force logout function (call from browser console)
function forceLogout() {
  admin.forceLogout();
}

// Initialize admin panel when DOM is ready
// Only initialize if AdminPanel class is defined (prevents errors if class definition failed)
(function() {
  'use strict';
  
  function initAdminPanel() {
    if (typeof AdminPanel === 'undefined') {
      console.error('AdminPanel class is not defined. Check for JavaScript errors above.');
      console.error('This usually means there is a syntax error or runtime error in admin.js');
      return;
    }
    
    let admin;
    try {
      admin = new AdminPanel();
      window.admin = admin; // Make it globally available
      console.log('AdminPanel initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdminPanel:', error);
      console.error('Error stack:', error.stack);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
  } else {
    // DOM is already ready
    initAdminPanel();
  }
})();
