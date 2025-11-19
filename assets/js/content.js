async function loadJSON(path){
  const res=await fetch(path);return await res.json();
}

// API base URL
const DEFAULT_PRODUCTION_API = 'https://kidney-clinic-e2f6c7fnf0cxg5dy.eastus-01.azurewebsites.net'; // Azure deployment
const API_BASE = (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__.API_BASE_URL) 
  ? window.__CONFIG__.API_BASE_URL 
  : DEFAULT_PRODUCTION_API;

async function loadFromAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to load from API ${endpoint}:`, error);
    return [];
  }
}

async function populateHome(){
  // Try to load from API first, fallback to JSON
  let data;
  try {
    data = await loadFromAPI('/api/home');
    // If API returns empty, fallback to JSON
    if (!data || Object.keys(data).length === 0) {
      data = await loadJSON('./data/home.json');
    }
  } catch (error) {
    data = await loadJSON('./data/home.json');
  }
  
  // Helper function to update text content
  const updateText = (selector, value) => {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };
  
  // Helper function to update attribute
  const updateAttr = (selector, attr, value) => {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  
  // Update Hero Section
  updateText('#home-title', data.hero_title);
  updateText('#home-subtitle', data.hero_subtitle);
  const heroCtaPrimary = document.querySelector('[data-edit="hero_cta_primary"]');
  if (heroCtaPrimary && data.hero_cta_primary_text) {
    heroCtaPrimary.textContent = data.hero_cta_primary_text;
    if (data.hero_cta_primary_link) heroCtaPrimary.href = data.hero_cta_primary_link;
  }
  const heroCtaSecondary = document.querySelector('[data-edit="hero_cta_secondary"]');
  if (heroCtaSecondary && data.hero_cta_secondary_text) {
    heroCtaSecondary.textContent = data.hero_cta_secondary_text;
    if (data.hero_cta_secondary_link) heroCtaSecondary.href = data.hero_cta_secondary_link;
  }
  const heroVideo = document.querySelector('[data-edit="hero_video"]');
  if (heroVideo && data.hero_background_video) {
    heroVideo.src = data.hero_background_video;
    heroVideo.parentElement.load();
  }
  
  // Update Features Section (home-highlights) - keep existing structure
 
  
  // Update Transplant Highlights Section - update only text content
  updateText('[data-edit="transplant_badge"]', data.transplant_badge);
  updateText('[data-edit="transplant_heading"]', data.transplant_heading);
  updateText('[data-edit="transplant_description"]', data.transplant_description);
  updateText('[data-edit="stat_value_0"]', data.transplant_stat_value_0);
  updateText('[data-edit="stat_label_0"]', data.transplant_stat_label_0);
  updateText('[data-edit="stat_value_1"]', data.transplant_stat_value_1);
  updateText('[data-edit="stat_label_1"]', data.transplant_stat_label_1);
  updateText('[data-edit="stat_value_2"]', data.transplant_stat_value_2);
  updateText('[data-edit="stat_label_2"]', data.transplant_stat_label_2);
  updateText('[data-edit="care_journey_title"]', data.care_journey_title);
  updateText('[data-edit="journey_item_0"]', data.care_journey_item_0);
  updateText('[data-edit="journey_item_1"]', data.care_journey_item_1);
  updateText('[data-edit="journey_item_2"]', data.care_journey_item_2);
  updateText('[data-edit="feature_title_0"]', data.feature_title_0);
  updateText('[data-edit="feature_desc_0"]', data.feature_desc_0);
  updateText('[data-edit="feature_title_1"]', data.feature_title_1);
  updateText('[data-edit="feature_desc_1"]', data.feature_desc_1);
  updateText('[data-edit="feature_title_2"]', data.feature_title_2);
  updateText('[data-edit="feature_desc_2"]', data.feature_desc_2);
  updateText('[data-edit="feature_title_3"]', data.feature_title_3);
  updateText('[data-edit="feature_desc_3"]', data.feature_desc_3);
  
  // Update Facility Video Section
  updateText('[data-edit="facility_badge"]', data.facility_badge);
  updateText('[data-edit="facility_heading"]', data.facility_heading);
  updateText('[data-edit="facility_description"]', data.facility_description);
  const facilityVideo = document.querySelector('[data-edit="facility_video"]');
  if (facilityVideo && data.facility_video_url) {
    facilityVideo.src = data.facility_video_url;
    facilityVideo.parentElement.load();
  }
  updateText('[data-edit="facility_video_description"]', data.facility_video_description);
  
  // Update CTA Section
  updateText('[data-edit="cta_heading"]', data.cta_heading);
  updateText('[data-edit="cta_description"]', data.cta_description);
  const ctaButton = document.querySelector('[data-edit="cta_button"]');
  if (ctaButton && data.cta_button_text) {
    ctaButton.textContent = data.cta_button_text + ' →';
    if (data.cta_button_link) ctaButton.href = data.cta_button_link;
  }
  
  // Update Showcase Section (if exists)
  const showcase = document.getElementById('home-showcase');
  if (showcase && data.showcase?.videos) {
    showcase.innerHTML = `
      <div class="container">
        <div class="cards">
          ${(data.showcase.videos || []).map(v=>`
            <article class="card">
              <h3>${v.title}</h3>
              <div style="aspect-ratio:16/9;background:#0f1733;border:1px solid var(--border);border-radius:10px;overflow:hidden">
                <iframe src="${v.embedUrl}" title="${v.title}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
              </div>
              <p>${v.description||''}</p>
            </article>
          `).join('')}
        </div>
      </div>`;
  }
  
  // Load and render homepage slideshow
  await populateHomepageSlideshow();
}

async function populateHomepageSlideshow() {
  const slideshowContainer = document.getElementById('homepage-slideshow');
  if (!slideshowContainer) return;

  let slides = [];
  try {
    slides = await loadFromAPI('/api/homepage-slides');
    if (!slides || slides.length === 0) {
      // Use dummy slide when no slides are available
      slides = [{
        imageUrl: './assets/dummy_slide.avif',
        description: '',
        linkUrl: '',
        linkText: ''
      }];
    }
  } catch (error) {
    console.error('Failed to load homepage slides:', error);
    // Use dummy slide when API fails
    slides = [{
      imageUrl: './assets/dummy_slide.avif',
      description: '',
      linkUrl: '',
      linkText: ''
    }];
  }

  if (slides.length === 0) {
    // Use dummy slide as fallback
    slides = [{
      imageUrl: './assets/dummy_slide.avif',
      description: '',
      linkUrl: '',
      linkText: ''
    }];
  }

  let currentSlide = 0;
  const slideInterval = 5000; // 5 seconds per slide

  const renderSlideshow = () => {
    slideshowContainer.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="text-align: center; margin-bottom: 40px;">
          
          <h2 style="font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 800; color: #1a2a44; margin: 20px 0; letter-spacing: -0.5px; line-height: 1.2;">
            Exciting News & Updates
          </h2>
          <p style="font-size: 1.1rem; color: #4a6572; max-width: 1000px; margin: 0 auto; line-height: 1.6;">
            Stay informed with our latest announcements, achievements, and important information
          </p>
        </div>
        <div class="slideshow-wrapper">
          <div class="slideshow-container">
          ${slides.map((slide, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
              <div class="slide-background" style="background-image: url('${slide.imageUrl}');"></div>
              <div class="slide-overlay"></div>
              <div class="slide-content">
                <div style="max-width: 1000px; margin: 0 auto; padding: 0 20px;">
                  ${slide.description ? `<p class="slide-description">${slide.description}</p>` : ''}
                  ${slide.linkUrl && slide.linkText ? `
                    <a href="${slide.linkUrl}" class="slide-cta-btn">${slide.linkText}</a>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        ${slides.length > 1 ? `
          <div class="slideshow-controls">
            <button class="slide-nav-btn prev" aria-label="Previous slide">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button class="slide-nav-btn next" aria-label="Next slide">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
          <div class="slideshow-indicators">
            ${slides.map((_, index) => `
              <button class="indicator ${index === 0 ? 'active' : ''}" data-slide-index="${index}" aria-label="Go to slide ${index + 1}"></button>
            `).join('')}
          </div>
        ` : ''}
        </div>
      </div>
    `;

    // Add event listeners
    if (slides.length > 1) {
      const prevBtn = slideshowContainer.querySelector('.prev');
      const nextBtn = slideshowContainer.querySelector('.next');
      const indicators = slideshowContainer.querySelectorAll('.indicator');
      const slideElements = slideshowContainer.querySelectorAll('.slide');

      const goToSlide = (index) => {
        slideElements.forEach((slide, i) => {
          slide.classList.toggle('active', i === index);
        });
        indicators.forEach((indicator, i) => {
          indicator.classList.toggle('active', i === index);
        });
        currentSlide = index;
      };

      const nextSlide = () => {
        goToSlide((currentSlide + 1) % slides.length);
      };

      const prevSlide = () => {
        goToSlide((currentSlide - 1 + slides.length) % slides.length);
      };

      nextBtn?.addEventListener('click', nextSlide);
      prevBtn?.addEventListener('click', prevSlide);

      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index));
      });

      // Auto-advance slides
      let autoSlideInterval = setInterval(nextSlide, slideInterval);

      // Pause on hover
      slideshowContainer.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
      });

      slideshowContainer.addEventListener('mouseleave', () => {
        autoSlideInterval = setInterval(nextSlide, slideInterval);
      });

      // Touch/swipe support
      let touchStartX = 0;
      let touchEndX = 0;

      slideshowContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });

      slideshowContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
          nextSlide();
        } else if (touchEndX - touchStartX > 50) {
          prevSlide();
        }
      });
    }
  };

  renderSlideshow();
}

async function populateDoctors(){
  const mount=document.getElementById('doctors-list');
  if(!mount) return;
  
  // Try to load from API first, fallback to JSON
  let data;
  try {
    data = await loadFromAPI('/api/doctors');
    if (!data || data.length === 0) {
      const jsonData = await loadJSON('./data/doctors.json');
      data = jsonData.doctors;
    }
  } catch (error) {
    const jsonData = await loadJSON('./data/doctors.json');
    data = jsonData.doctors;
  }
  
  mount.innerHTML=`
    <!-- Doctors Hero Section -->
    <section style="
      background: linear-gradient(135deg, #1a2a44, #0d3d4d);
      color: #ffffff;
      padding: 120px 20px 100px;
      text-align: center;
      margin-bottom: 60px;
      border-bottom: 2px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 35px rgba(0, 188, 212, 0.25);
    ">
      <div style="max-width: 900px; margin: 0 auto;">
        <span style="
          display: inline-block;
          padding: 8px 20px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.12);
          letter-spacing: 2px;
          font-weight: 600;
          font-size: 0.9rem;
        ">MEET OUR SPECIALISTS</span>
        <h1 style="
          font-size: clamp(2.5rem, 4vw, 3.8rem);
          font-weight: 800;
          margin: 24px 0 16px;
          letter-spacing: 1px;
        ">Our Medical Team</h1>
        <p style="
          font-size: 1.15rem;
          line-height: 1.9;
          color: #d0e2ff;
          margin: 0 auto;
        ">Meet our internationally recognized doctors dedicated to providing exceptional kidney care.</p>
      </div>
    </section>

    <!-- Doctors Grid -->
    <div class="container">
      <div class="cards">
        ${data.map(d=>`
          <article class="card" style="text-align:center">
            ${d.photoUrl ? `<img src="${d.photoUrl}" alt="${d.name}" loading="lazy" style="border-radius:10px;aspect-ratio:1;object-fit:cover;margin-bottom:15px;width:100%" />` : ''}
            <h3 style="text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;text-align:center">${d.name}</h3>
            <p class="badge" style="margin-bottom:15px;text-align:center;display:inline-block">${d.title}</p>
            <a href="doctor-detail.html?id=${d.id}" class="btn" style="margin-top:10px;display:inline-block;width:100%;text-align:center">View Full Profile</a>
          </article>
        `).join('')}
      </div>
    </div>`
  
  // No animation - instant load for maximum performance
}

async function populateServices(){
  const mount=document.getElementById('services-list');
  if(!mount) return;

  // Load services from API (live data from admin panel)
  let services=[];
  try {
    services = await loadFromAPI('/api/services');
    if (!services || services.length === 0) {
      // Fallback to local JSON if API fails
      const jsonData = await loadJSON('./data/services.json');
      services = jsonData.services || [];
    }
  } catch(error) {
    console.error('Failed to load services:', error);
    // Fallback to local JSON
    try {
      const jsonData = await loadJSON('./data/services.json');
      services = jsonData.services || [];
    } catch(_) {
      services = [];
    }
  }

  mount.innerHTML=`<div class="container" style="padding-top: 60px;">
    <h1 class="section-title">Our Services</h1>
    <p class="section-sub">Overview of procedures and specialties.</p>
    <div class="cards">
      ${services.map((s, idx)=>`
        <article class="card service-card">
          ${s.image ? `<img src="${s.image}" alt="${s.name}" style="border-radius:10px;aspect-ratio:16/9;object-fit:cover;margin-bottom:10px;width:100%" />` : ''}
          <h3 style="text-transform:uppercase;letter-spacing:1px">${s.name}</h3>
          <p>${s.summary||''}</p>
          <a href="service-detail.html?id=${s.id}" class="btn" style="margin-top:10px;display:inline-block">View Details</a>
        </article>
      `).join('')}
    </div>
    
    <!-- Rezum Video Section -->
    <div style="margin-top: 80px; max-width: 900px; margin-left: auto; margin-right: auto; text-align: center;">
      <div style="border-radius: 24px; overflow: hidden; box-shadow: 0 20px 70px rgba(0,188,212,0.35); border: 4px solid #A5D8DD; background: #1a2a44; margin: 0 auto;">
        <video autoplay muted loop controls style="width: 100%; min-height: 550px; display: block; object-fit: cover;">
          <source src="./assets/rezum.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  </div>`;
}

async function populateMedicalTourism(){
  const mount=document.getElementById('medical-tourism');
  if(!mount) return;
  
  // Try to load medical tourism data from API, fallback to JSON
  let data;
  try {
    data = await loadFromAPI('/api/medical-tourism');
    if (!data || Object.keys(data).length === 0) {
      data = await loadJSON('./data/medical-tourism.json');
    }
  } catch (error) {
    try {
      data = await loadJSON('./data/medical-tourism.json');
    } catch (_) {
      // Fallback to default content
      data = {
        hero: {
          title: "Medical Tourism Excellence",
          subtitle: "World-class kidney care for international patients"
        },
        benefits: [],
        healthGateways: {
          title: "Our Tourism Partner: Health Gateways",
          description: "Health Gateways is our trusted medical tourism partner, dedicated to making your healthcare journey seamless and stress-free.",
          services: [],
          contact: {}
        },
        process: {},
        map: {
          title: "Our International Patients",
          description: "We welcome patients from across the globe for world-class kidney transplant services.",
          locations: []
        }
      };
    }
  }
  
  // Ensure default process steps if missing
  if (!data.process || !data.process.steps || data.process.steps.length === 0) {
    if (!data.process) data.process = {};
    data.process.title = data.process.title || 'How It Works';
    data.process.steps = data.process.steps || [
      { title: 'Initial Consultation', description: 'Contact us to discuss your medical needs and receive personalized guidance.' },
      { title: 'Medical Evaluation', description: 'Our team reviews your medical records and coordinates with Health Gateways for travel arrangements.' },
      { title: 'Travel & Accommodation', description: 'Health Gateways handles all travel logistics, visas, and accommodation booking.' },
      { title: 'Treatment & Recovery', description: 'Receive world-class medical care and comprehensive post-treatment support.' }
    ];
  }
  
  // Ensure default locations if map data is missing
  if (!data.map || !data.map.locations || data.map.locations.length === 0) {
    if (!data.map) data.map = {};
    data.map.locations = [
      { name: 'Qatar', icon: '🇶🇦', description: 'Patients from Qatar trust our clinic for advanced kidney transplant procedures.', lat: 25.3548, lng: 51.1839 },
      { name: 'Dubai, UAE', icon: '🇦🇪', description: 'International patients from Dubai choose us for world-class medical care.', lat: 25.2048, lng: 55.2708 },
      { name: 'Africa', icon: '🌍', description: 'Patients from across Africa travel to our clinic for expert kidney transplant services.', lat: 8.7832, lng: 34.5085 }
    ];
  }
  
  mount.innerHTML=`
    <!-- Health Gateways Partnership Section -->
    <section style="padding: 80px 20px; background: linear-gradient(135deg, #1a2a44, #0d3d4d); color: #ffffff; margin: 60px 0;">
      <div class="container">
        <div style="text-align: center; margin-bottom: 50px;">
          ${data.healthGateways?.badge ? `
          <div style="display: inline-block; padding: 8px 20px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 50px; margin-bottom: 20px;">
            <span style="color: #00BCD4; font-weight: 600; font-size: 0.9rem; letter-spacing: 2px;">${data.healthGateways.badge}</span>
          </div>
          ` : ''}
          <h2 class="section-title" style="color: #ffffff; font-size: 2.5rem; margin: 20px 0; font-weight: 700;">
            ${data.healthGateways?.title || 'Our Tourism Partner: Health Gateways'}
          </h2>
          <p style="font-size: 1.2rem; color: #b0c4de; max-width: 800px; margin: 0 auto; line-height: 1.8;">
            ${data.healthGateways?.description || 'Health Gateways is our trusted medical tourism partner, dedicated to making your healthcare journey seamless and stress-free. They provide comprehensive support services to ensure international patients receive the best possible care and experience.'}
          </p>
        </div>

        ${data.healthGateways?.services && data.healthGateways.services.length > 0 ? `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; margin-top: 60px;">
          ${data.healthGateways.services.map((service, idx) => `
            <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px); transition: all 0.3s;">
              ${service.icon ? `<div style="font-size: 2.5rem; margin-bottom: 15px;">${service.icon}</div>` : ''}
              <h3 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 15px 0; font-weight: 700;">${service.title}</h3>
              <p style="color: #b0c4de; margin: 0; line-height: 1.7;">${service.description}</p>
            </div>
          `).join('')}
        </div>
        ` : `
        <!-- Default Services -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; margin-top: 60px;">
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">✈️</div>
            <h3 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 15px 0; font-weight: 700;">Travel Coordination</h3>
            <p style="color: #b0c4de; margin: 0; line-height: 1.7;">Comprehensive travel arrangements including flights, accommodation, and local transportation.</p>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">📋</div>
            <h3 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 15px 0; font-weight: 700;">Visa & Documentation</h3>
            <p style="color: #b0c4de; margin: 0; line-height: 1.7;">Expert assistance with visa applications, medical documentation, and all required paperwork.</p>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">🏥</div>
            <h3 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 15px 0; font-weight: 700;">Medical Coordination</h3>
            <p style="color: #b0c4de; margin: 0; line-height: 1.7;">Seamless coordination between your home country and our clinic for all medical needs.</p>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; backdrop-filter: blur(10px);">
            <div style="font-size: 2.5rem; margin-bottom: 15px;">💬</div>
            <h3 style="color: #ffffff; font-size: 1.3rem; margin: 0 0 15px 0; font-weight: 700;">24/7 Support</h3>
            <p style="color: #b0c4de; margin: 0; line-height: 1.7;">Round-the-clock support in multiple languages to assist you throughout your journey.</p>
          </div>
        </div>
        `}

        ${data.healthGateways?.contact && (data.healthGateways.contact.email || data.healthGateways.contact.phone || data.healthGateways.contact.website) ? `
        <div style="text-align: center; margin-top: 50px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.2);">
          <h3 style="color: #00BCD4; font-size: 1.5rem; margin-bottom: 20px;">${data.healthGateways.contact.heading || 'Contact Health Gateways'}</h3>
          ${data.healthGateways.contact.email ? `<p style="color: #b0c4de; margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${data.healthGateways.contact.email}" style="color: #00BCD4; text-decoration: none;">${data.healthGateways.contact.email}</a></p>` : ''}
          ${data.healthGateways.contact.phone ? `<p style="color: #b0c4de; margin: 10px 0;"><strong>Phone:</strong> <a href="tel:${data.healthGateways.contact.phone}" style="color: #00BCD4; text-decoration: none;">${data.healthGateways.contact.phone}</a></p>` : ''}
          ${data.healthGateways.contact.website ? `<p style="color: #b0c4de; margin: 10px 0;"><strong>Website:</strong> <a href="${data.healthGateways.contact.website}" target="_blank" style="color: #00BCD4; text-decoration: none;">${data.healthGateways.contact.website}</a></p>` : ''}
        </div>
        ` : ''}
      </div>
    </section>

    <!-- How It Works Section -->
    <section style="padding: 60px 20px; background: #E0F7FA;">
      <div class="container">
        <h2 class="section-title" style="text-align: center; margin-bottom: 50px;">${data.process?.title || 'How It Works'}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
          ${(data.process?.steps || []).map((step, idx) => `
            <div style="text-align: center; position: relative;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #BF4E4E, #8B3636); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 1.5rem; font-weight: 700; box-shadow: 0 4px 15px rgba(191,78,78,0.3);">
                ${idx + 1}
              </div>
              <h3 style="color: #1a2a44; margin-bottom: 15px; font-weight: 700;">${step.title || 'Step ' + (idx + 1)}</h3>
              <p style="color: #4a6572; line-height: 1.7;">${step.description || ''}</p>
            </div>
      `).join('')}
    </div>
      </div>
    </section>

    <!-- Patient Locations Map Section -->
    <section style="padding: 80px 20px; background: #E0F7FA; margin-top: 60px;">
      <div class="container">
        <div style="text-align: center; margin-bottom: 50px;">
          <h2 class="section-title" style="font-size: 2.5rem; margin-bottom: 20px; color: #1a2a44;">${data.map?.title || 'Our International Patients'}</h2>
          <p style="font-size: 1.2rem; color: #4a6572; max-width: 800px; margin: 0 auto; line-height: 1.8;">
            ${data.map?.description || 'We welcome patients from across the globe for world-class kidney transplant services.'}
          </p>
        </div>
        
        <div style="display: flex; justify-content: center; margin-bottom: 40px;">
          <img src="./assets/map.png" alt="Patient Locations Map" style="width: 40%; height: auto; display: block;" />
        </div>
      </div>
    </section>


    <!-- CTA Section -->
    ${data.cta && (data.cta.heading || data.cta.description) ? `
    <section style="padding: 80px 20px; text-align: center; background: linear-gradient(135deg, rgba(191,78,78,0.1), rgba(0,188,212,0.1));">
      <div class="container">
        <h2 style="font-size: 2.5rem; color: #1a2a44; margin-bottom: 20px; font-weight: 700;">${data.cta.heading || 'Ready to Start Your Journey?'}</h2>
        <p style="font-size: 1.2rem; color: #4a6572; max-width: 700px; margin: 0 auto 40px; line-height: 1.8;">
          ${data.cta.description || 'Contact Health Gateways or our clinic directly to begin your medical tourism experience.'}
        </p>
        ${data.cta.buttonText ? `
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
          <a href="${data.cta.buttonLink || './contact.html'}" class="btn primary" style="padding: 18px 40px; font-size: 1.1rem;">${data.cta.buttonText}</a>
        </div>
        ` : ''}
      </div>
    </section>
    ` : ''}
  `
}

async function populateKidney(){
  const mount=document.getElementById('kidney');
  if(!mount) return;
  let data;
  try{
    data=await loadFromAPI('/api/kidney');
    if(!data || Object.keys(data).length===0){
      data=await loadJSON('./data/kidney.json');
    }
  }catch(e){
    try{
      data=await loadJSON('./data/kidney.json');
    }catch(_){
      data=null;
    }
  }
  
  if(!data || Object.keys(data).length===0){
    data={
      hero:{title:'Kidney Transplant Department',subtitle:'Comprehensive transplant care from evaluation to lifelong follow-up.'},
      stats:[],
      procedures:{items:[]},
      journey:{steps:[]},
      symptoms:{categories:[]},
      support:{pillars:[],resources:[]},
      cta:{}
    };
  }
  
  if(data.highlights && (!data.stats || data.stats.length===0)){
    data.stats=(data.highlights||[]).map(h=>({
      icon:'🩺',
      value:h.title||'Highlight',
      label:h.text||'',
      description:''
    }));
  }
  
  const hero=data.hero||{};
  const stats=data.stats||[];
  const procedures=data.procedures||{items:[]};
  const journey=data.journey||{steps:[]};
  const symptoms=data.symptoms||{categories:[]};
  const support=data.support||{pillars:[],resources:[]};
  const cta=data.cta||{};
  
  const heroGradient='linear-gradient(180deg, rgba(10,25,47,0.88) 0%, rgba(10,25,47,0.55) 50%, rgba(10,25,47,0.94) 100%)';
  const heroImageLayer=hero.backgroundImage?`<div style="position:absolute;inset:0;background:url('${hero.backgroundImage}') center/cover no-repeat;opacity:0.10;z-index:0;"></div>`:'';
  const heroSection=`
    <section style="position:relative;padding:140px 20px 120px;color:#ffffff;overflow:hidden;background:${heroGradient};">
      ${heroImageLayer}
      <div class="container" style="max-width:1100px;margin:0 auto;text-align:center;position:relative;z-index:2;">
        ${hero.badge?`<span style="display:inline-block;padding:10px 24px;border:1px solid rgba(255,255,255,0.3);border-radius:999px;background:rgba(0,188,212,0.2);color:#00e5ff;font-weight:600;letter-spacing:2px;text-transform:uppercase;font-size:0.85rem;">${hero.badge}</span>`:''}
        <h1 style="margin:28px 0 18px;font-size:clamp(2.5rem,4vw,3.8rem);font-weight:800;letter-spacing:-1px;line-height:1.15;">${hero.title||'Kidney Transplant Department'}</h1>
        <p style="margin:0 auto 32px;max-width:820px;font-size:1.15rem;line-height:1.9;color:#d0e2ff;">${hero.subtitle||'Comprehensive transplant care from evaluation to lifelong follow-up.'}</p>
        <div style="display:flex;justify-content:center;gap:18px;flex-wrap:wrap;">
          <a href="./contact.html" class="btn primary" style="padding:16px 36px;font-size:1.05rem;">Refer a Patient</a>
          <a href="#kidney-symptoms" class="btn" style="padding:16px 32px;border-color:rgba(255,255,255,0.45);color:#ffffff;">Check Symptoms</a>
    </div>
      </div>
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 20% 20%, rgba(0,188,212,0.25), transparent 55%),radial-gradient(circle at 80% 30%, rgba(191,78,78,0.25), transparent 50%);mix-blend-mode:screen;z-index:1;"></div>
    </section>
  `;
  
  const statsSection=stats.length?`
    <section style="padding:80px 20px;background:#ffffff;">
      <div class="container" style="max-width:1200px;margin:0 auto;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;">
          ${stats.map(stat=>`
            <div style="background:linear-gradient(145deg,#F0F9FF,#ffffff);border:1px solid rgba(0,188,212,0.25);border-radius:20px;padding:32px;box-shadow:0 18px 60px rgba(0,188,212,0.15);text-align:center;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-8px)';this.style.boxShadow='0 24px 70px rgba(0,188,212,0.22)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 18px 60px rgba(0,188,212,0.15)'">
              ${stat.icon?`<div style="font-size:2rem;margin-bottom:16px;">${stat.icon}</div>`:''}
              <div style="font-size:2.3rem;font-weight:800;color:#1a2a44;">${stat.value||''}</div>
              <div style="font-size:1.05rem;font-weight:600;color:#4a6572;margin:10px 0 12px;">${stat.label||''}</div>
              ${stat.description?`<p style="margin:0;color:#607d8b;font-size:0.95rem;line-height:1.6;">${stat.description}</p>`:''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `:'';
  
  const proceduresSection=(procedures.items||[]).length?`
    <section style="padding:90px 20px;background:#E0F7FA;">
      <div class="container" style="max-width:1200px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:60px;">
          <h2 class="section-title" style="margin-bottom:18px;">${procedures.title||'Kidney Transplant Procedures'}</h2>
          ${procedures.subtitle?`<p class="section-sub" style="max-width:780px;margin:0 auto;color:#4a6572;">${procedures.subtitle}</p>`:''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:28px;">
          ${(procedures.items||[]).map(item=>`
            <article style="background:#ffffff;border:1px solid rgba(0,188,212,0.3);border-radius:22px;padding:32px;box-shadow:0 20px 70px rgba(0,188,212,0.18);display:flex;flex-direction:column;height:100%;transition:transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-10px)';this.style.boxShadow='0 26px 90px rgba(0,188,212,0.28)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 20px 70px rgba(0,188,212,0.18)'">
              ${item.icon?`<div style="font-size:2.5rem;margin-bottom:16px;">${item.icon}</div>`:''}
              <h3 style="font-size:1.4rem;font-weight:700;color:#1a2a44;margin:0 0 12px;">${item.name||''}</h3>
              <p style="margin:0 0 18px;color:#546e7a;font-size:1rem;line-height:1.7;flex:0;">${item.description||''}</p>
              ${(item.focusPoints||[]).length?`
                <div style="margin-top:auto;">
                  <h4 style="margin:0 0 12px;font-size:0.95rem;color:#0097a7;letter-spacing:1px;text-transform:uppercase;">Focus Areas</h4>
                  <ul style="padding-left:18px;margin:0;display:grid;gap:8px;color:#455a64;font-size:0.95rem;line-height:1.6;text-align:left;">
                    ${item.focusPoints.map(point=>`<li>${point}</li>`).join('')}
                  </ul>
                </div>
              `:''}
            </article>
          `).join('')}
        </div>
        ${procedures.footnote?`<p style="margin:36px auto 0;max-width:850px;text-align:center;color:#4a6572;font-size:0.98rem;line-height:1.7;">${procedures.footnote}</p>`:''}
      </div>
    </section>
  `:'';
  
  const journeySection=(journey.steps||[]).length?`
    <section style="padding:90px 20px;background:#ffffff;">
      <div class="container" style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:60px;">
          <h2 class="section-title" style="margin-bottom:18px;">${journey.title||'Your Kidney Transplant Journey'}</h2>
          ${journey.subtitle?`<p class="section-sub" style="margin:0 auto;max-width:720px;color:#4a6572;">${journey.subtitle}</p>`:''}
        </div>
        <div style="position:relative;padding-left:0;">
          <div style="display:grid;gap:32px;">
            ${(journey.steps||[]).map((step,idx)=>`
              <div style="display:flex;gap:24px;align-items:flex-start;">
                <div style="min-width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#00BCD4,#0097A7);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;box-shadow:0 12px 40px rgba(0,188,212,0.3);font-size:1.2rem;">
                  ${idx+1}
                </div>
                <div style="flex:1;background:#F0F9FF;border:1px solid rgba(0,188,212,0.2);border-radius:18px;padding:24px 28px;box-shadow:0 14px 45px rgba(0,188,212,0.12);">
                  <h3 style="margin:0 0 12px;font-size:1.25rem;color:#1a2a44;font-weight:700;">${step.title||''}</h3>
                  <p style="margin:0;color:#455a64;line-height:1.75;font-size:1rem;">${step.description||''}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="position:absolute;left:47px;top:30px;bottom:30px;width:2px;background:linear-gradient(180deg,rgba(0,188,212,0.1)0%,rgba(0,188,212,0.6)50%,rgba(0,188,212,0.1)100%);"></div>
        </div>
        ${journey.note?`<p style="margin:48px auto 0;max-width:820px;text-align:center;color:#4a6572;font-size:0.95rem;line-height:1.7;">${journey.note}</p>`:''}
      </div>
    </section>
  `:'';
  
  const symptomsSection=(symptoms.categories||[]).length?`
    <section id="kidney-symptoms" style="padding:90px 20px;background:#0d3d4d;color:#ffffff;">
      <div class="container" style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:50px;">
          <h2 class="section-title" style="color:#ffffff;margin-bottom:16px;">${symptoms.title||'When to See a Kidney Specialist'}</h2>
          ${symptoms.subtitle?`<p class="section-sub" style="color:#cfd8dc;max-width:760px;margin:0 auto;">${symptoms.subtitle}</p>`:''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;">
          ${(symptoms.categories||[]).map(category=>`
            <details style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.2);border-radius:18px;padding:24px;box-shadow:0 18px 40px rgba(0,0,0,0.25);transition:all 0.3s;">
              <summary style="cursor:pointer;font-size:1.2rem;font-weight:700;color:#00e5ff;margin-bottom:12px;outline:none;">${category.title||''}</summary>
              <ul style="padding-left:18px;margin:10px 0 0;display:grid;gap:10px;color:#e0f7fa;font-size:0.98rem;line-height:1.7;">
                ${(category.items||[]).map(item=>`<li>${item}</li>`).join('')}
              </ul>
            </details>
          `).join('')}
        </div>
        ${symptoms.cta?.text?`
          <div style="text-align:center;margin-top:48px;">
            <a href="${symptoms.cta.link||'./contact.html'}" class="btn primary" style="padding:18px 40px;font-size:1.05rem;">${symptoms.cta.text}</a>
          </div>
        `:''}
      </div>
    </section>
  `:'';
  
  const supportSection=((support.pillars||[]).length||(support.resources||[]).length)?`
    <section style="padding:90px 20px;background:#ffffff;">
      <div class="container" style="max-width:1180px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:50px;">
          <h2 class="section-title">${support.title||'Comprehensive Support Services'}</h2>
        </div>
        ${(support.pillars||[]).length?`
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-bottom:50px;">
            ${support.pillars.map(pillar=>`
              <div style="background:#F0F9FF;border:1px solid rgba(0,188,212,0.2);border-radius:18px;padding:28px;text-align:center;box-shadow:0 18px 60px rgba(0,188,212,0.12);">
                ${pillar.icon?`<div style="font-size:2.2rem;margin-bottom:12px;">${pillar.icon}</div>`:''}
                <h3 style="margin:0 0 12px;font-size:1.25rem;color:#1a2a44;font-weight:700;">${pillar.title||''}</h3>
                <p style="margin:0;color:#4a6572;line-height:1.7;font-size:0.98rem;">${pillar.description||''}</p>
              </div>
            `).join('')}
          </div>
        `:''}
        ${(support.resources||[]).length?`
          <div style="background:linear-gradient(135deg,rgba(0,188,212,0.08),rgba(191,78,78,0.12));border:1px solid rgba(0,188,212,0.25);border-radius:22px;padding:40px;">
            <h3 style="margin:0 0 20px;font-size:1.35rem;color:#1a2a44;font-weight:700;text-align:center;">Patient Resources</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px;">
              ${support.resources.map(resource=>`
                <a href="${resource.link||'#'}" style="background:#ffffff;border:1px solid rgba(0,188,212,0.25);border-radius:16px;padding:22px;text-decoration:none;color:#1a2a44;box-shadow:0 14px 45px rgba(0,188,212,0.15);display:flex;flex-direction:column;gap:12px;transition:transform 0.3s, box-shadow 0.3s;" onmouseover="this.style.transform='translateY(-6px)';this.style.boxShadow='0 22px 70px rgba(0,188,212,0.25)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 14px 45px rgba(0,188,212,0.15)'">
                  <strong style="font-size:1.05rem;">${resource.title||''}</strong>
                  <span style="color:#546e7a;font-size:0.95rem;line-height:1.6;">${resource.description||''}</span>
                  <span style="margin-top:auto;font-size:0.9rem;color:#0097a7;font-weight:600;">Learn more →</span>
                </a>
              `).join('')}
            </div>
          </div>
        `:''}
      </div>
    </section>
  `:'';
  
  const ctaSection=(cta.heading||cta.description)?`
    <section style="padding:90px 20px;background:linear-gradient(135deg,rgba(191,78,78,0.15),rgba(0,188,212,0.15));text-align:center;">
      <div class="container" style="max-width:780px;margin:0 auto;">
        ${cta.heading?`<h2 style="font-size:2.4rem;color:#1a2a44;margin-bottom:18px;font-weight:700;">${cta.heading}</h2>`:''}
        ${cta.description?`<p style="font-size:1.15rem;color:#4a6572;line-height:1.8;margin:0 0 32px;">${cta.description}</p>`:''}
        ${cta.buttonText?`<a href="${cta.buttonLink||'./contact.html'}" class="btn primary" style="padding:18px 42px;font-size:1.1rem;">${cta.buttonText}</a>`:''}
      </div>
    </section>
  `:'';
  
  mount.innerHTML=`
    ${heroSection}
    ${statsSection}
    ${proceduresSection}
    ${journeySection}
    ${symptomsSection}
    ${supportSection}
    ${ctaSection}
  `;
}

async function populateAbout(){
  const mount=document.getElementById('about');
  if(!mount) return;
  const data=await loadJSON('./data/about.json');
  mount.innerHTML=`
    <!-- Hero Section -->
    <section style="background: linear-gradient(135deg, #1a2a44 0%, #0d3d4d 100%); color: #ffffff; padding: clamp(80px, 15vw, 120px) 20px clamp(60px, 12vw, 100px); text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('https://images.pexels.com/photos/8460157/pexels-photo-8460157.jpeg?auto=compress&cs=tinysrgb&w=1200') center/cover; opacity: 0.12; filter: blur(3px);"></div>
      <div class="container" style="position: relative; z-index: 2; max-width: 1000px; margin: 0 auto;">
        <h1 style="font-size: clamp(2rem, 8vw, 4rem); font-weight: 800; margin-bottom: 24px; letter-spacing: -2px; line-height: 1.1; text-align: center;">About The Kidney Clinic</h1>
        <p style="font-size: clamp(1rem, 3vw, 1.5rem); color: #b0c4de; line-height: 1.8; max-width: 900px; margin: 0 auto; font-weight: 400; text-align: center;">Empowering patients worldwide with world-class kidney care and innovative transplant solutions since our establishment.</p>
      </div>
    </section>

    <!-- Our Impact Section -->
    <section style="padding: clamp(60px, 12vw, 100px) 20px; background: #ffffff;">
      <div class="container" style="max-width: 1200px; margin: 0 auto;">
        <h2 style="color: #1a2a44; font-size: clamp(1.75rem, 6vw, 2.8rem); margin-bottom: 60px; text-align: center; font-weight: 700;">Our Impact</h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; align-items: start;" class="about-impact-grid">
          <div class="about-impact-card" style="background: linear-gradient(145deg, #F0F9FF, #ffffff); border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; text-align: center; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00BCD4, #0097A7); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(0,188,212,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            </div>
            <div style="font-size: clamp(2rem, 8vw, 3rem); font-weight: 800; color: #1a2a44; margin-bottom: 10px;">50+</div>
            <div style="color: #4a6572; font-size: clamp(0.95rem, 2.5vw, 1.1rem); font-weight: 600;">Expert Specialists</div>
          </div>
          
          <div class="about-impact-card" style="background: linear-gradient(145deg, #F0F9FF, #ffffff); border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; text-align: center; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #BF4E4E, #8B3636); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(191,78,78,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </div>
            <div style="font-size: clamp(2rem, 8vw, 3rem); font-weight: 800; color: #1a2a44; margin-bottom: 10px;">500+</div>
            <div style="color: #4a6572; font-size: clamp(0.95rem, 2.5vw, 1.1rem); font-weight: 600;">Successful Transplants</div>
          </div>
          
          <div class="about-impact-card" style="background: linear-gradient(145deg, #F0F9FF, #ffffff); border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; text-align: center; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00BCD4, #0097A7); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(0,188,212,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            </div>
            <div style="font-size: clamp(2rem, 8vw, 3rem); font-weight: 800; color: #1a2a44; margin-bottom: 10px;">98%</div>
            <div style="color: #4a6572; font-size: clamp(0.95rem, 2.5vw, 1.1rem); font-weight: 600;">Success Rate</div>
          </div>
          
          <div class="about-impact-card" style="background: linear-gradient(145deg, #F0F9FF, #ffffff); border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; text-align: center; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #BF4E4E, #8B3636); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(191,78,78,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg>
            </div>
            <div style="font-size: clamp(2rem, 8vw, 3rem); font-weight: 800; color: #1a2a44; margin-bottom: 10px;">30+</div>
            <div style="color: #4a6572; font-size: clamp(0.95rem, 2.5vw, 1.1rem); font-weight: 600;">Countries Served</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Values Section -->
    <section style="padding: clamp(60px, 12vw, 100px) 20px; background: #E0F7FA;">
      <div class="container" style="max-width: 1200px; margin: 0 auto;">
        <h2 style="color: #1a2a44; font-size: clamp(1.75rem, 6vw, 2.8rem); margin-bottom: 60px; text-align: center; font-weight: 700;">Our Values</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; justify-items: center;" class="about-values-grid">
          <div style="background: #ffffff; border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1); text-align: center; max-width: 500px;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00BCD4, #0097A7); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(0,188,212,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
            </div>
            <h3 style="color: #1a2a44; font-size: clamp(1.2rem, 4vw, 1.5rem); margin-bottom: 15px; font-weight: 700;">Innovation First</h3>
            <p style="color: #4a6572; line-height: 1.8; font-size: clamp(0.95rem, 2.5vw, 1rem); text-align: center;">We stay at the forefront of medical technology, constantly exploring new treatments and procedures to provide the best possible care for our patients.</p>
          </div>
          
          <div style="background: #ffffff; border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1); text-align: center; max-width: 500px;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #BF4E4E, #8B3636); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(191,78,78,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/></svg>
            </div>
            <h3 style="color: #1a2a44; font-size: clamp(1.2rem, 4vw, 1.5rem); margin-bottom: 15px; font-weight: 700;">Patient Success</h3>
            <p style="color: #4a6572; line-height: 1.8; font-size: clamp(0.95rem, 2.5vw, 1rem); text-align: center;">Your health and recovery are our success. We build lasting relationships based on trust, exceptional care, and outstanding medical outcomes.</p>
          </div>
          
          <div style="background: #ffffff; border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1); text-align: center; max-width: 500px;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00BCD4, #0097A7); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(0,188,212,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            </div>
            <h3 style="color: #1a2a44; font-size: clamp(1.2rem, 4vw, 1.5rem); margin-bottom: 15px; font-weight: 700;">Safety & Reliability</h3>
            <p style="color: #4a6572; line-height: 1.8; font-size: clamp(0.95rem, 2.5vw, 1rem); text-align: center;">Medical-grade safety protocols and 99.9% operational reliability ensure that every patient receives the highest standard of care and support.</p>
          </div>
          
          <div style="background: #ffffff; border: 2px solid #A5D8DD; border-radius: 20px; padding: 40px; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,188,212,0.1); text-align: center; max-width: 500px;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0,188,212,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,188,212,0.1)'">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #BF4E4E, #8B3636); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 6px 20px rgba(191,78,78,0.3);">
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
            </div>
            <h3 style="color: #1a2a44; font-size: clamp(1.2rem, 4vw, 1.5rem); margin-bottom: 15px; font-weight: 700;">Expert Team</h3>
            <p style="color: #4a6572; line-height: 1.8; font-size: clamp(0.95rem, 2.5vw, 1rem); text-align: center;">50+ certified specialists with deep expertise in nephrology, transplantation, and critical care, dedicated to your well-being.</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Location Section -->
    <section style="padding: clamp(60px, 12vw, 100px) 20px; background: #ffffff;">
      <div class="container" style="max-width: 1000px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 50px;">
          <h2 style="color: #1a2a44; font-size: clamp(1.75rem, 6vw, 2.8rem); margin-bottom: 20px; font-weight: 700;">📍 Our Location</h2>
          <p style="color: #4a6572; font-size: clamp(1rem, 3vw, 1.2rem); max-width: 700px; margin: 0 auto;">Visit us at our state-of-the-art facility</p>
        </div>
        <div style="background: #F0F9FF; padding: 40px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,188,212,0.2); border: 2px solid #A5D8DD;">
          <div style="width: 100%; height: clamp(200px, 50vw, 350px); border-radius: 16px; overflow: hidden; border: 2px solid rgba(191, 78, 78, 0.2); margin-bottom: 25px;">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.2451271923155!2d73.106847!3d33.573121799999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfed2cd8fd7fc9%3A0x67e31c3aceed5639!2sThe%20Kidney%20Clinic!5e1!3m2!1sen!2s!4v1761664752414!5m2!1sen!2s" 
              style="width: 100%; height: 100%; border: none;" 
              allowfullscreen="" 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
          <div style="text-align: center;">
            <a href="https://www.google.com/maps/place/The+Kidney+Clinic/@33.573121799999996,73.106847,15z" 
               class="btn primary" 
               target="_blank"
               style="display: inline-flex; align-items: center; gap: 10px; padding: 14px 30px; background: linear-gradient(135deg, #BF4E4E, #8B3636); color: white; border-radius: 50px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 15px rgba(191,78,78,0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(191,78,78,0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(191,78,78,0.3)'">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              View on Google Maps
            </a>
          </div>
        </div>
    </div>
    </section>
  `
}

async function populateContact(){
  const mount=document.getElementById('contact');
  if(!mount) return;
  mount.innerHTML=`<div class="container">
    <h1 class="section-title">Contact & Appointments</h1>
    <p class="section-sub">We respond within 24 hours for international patients.</p>
    <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="contact" />
      <p class="sr-only"><label>Don’t fill this out: <input name="bot-field" /></label></p>
      <div class="grid-2">
        <p><label>Full Name<br/><input name="name" required/></label></p>
        <p><label>Email<br/><input name="email" type="email" required/></label></p>
      </div>
      <div class="grid-2">
        <p><label>Phone/WhatsApp<br/><input name="phone" required/></label></p>
        <p><label>Country<br/><input name="country" required/></label></p>
      </div>
      <p><label>Message<br/><textarea name="message" rows="5" required></textarea></label></p>
      <p><button class="btn primary" type="submit">Send Request</button></p>
    </form>
    <div style="margin-top:20px">
      <div class="badge">Location</div>
      <p>Find us on Google Maps:</p>
      <div style="aspect-ratio:16/9;border:1px solid var(--border);border-radius:12px;overflow:hidden">
        <iframe src="https://maps.google.com/maps?q=hospital&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </div>`
}

async function populateReviews(){
  const mount=document.getElementById('reviews');
  if(!mount) return;
  
  // Helper functions for video URLs
  const isYouTubeOrVimeo = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };
  
  const getYouTubeEmbedUrl = (url) => {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    } else if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    } else if (url.includes('youtube.com/embed/')) {
      return url;
    }
    return url;
  };
  
  const getVimeoEmbedUrl = (url) => {
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1].split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };
  
  const escapeHTML = (str='') => str.replace(/[&<>"']/g, (char) => {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[char] || char;
  });
  
  const formatDate = (value) => {
    if (!value) return '';
    const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Load clinic-managed reviews from API
  let localReviews = [];
  try {
    localReviews = await loadFromAPI('/api/reviews');
    if (!localReviews || localReviews.length === 0) {
      // Fallback to local JSON if API fails
      const jsonData = await loadJSON('./data/reviews.json');
      localReviews = jsonData.snippets || [];
    }
  } catch(error) {
    console.error('Failed to load reviews:', error);
    // Fallback to local JSON
    try {
      const jsonData = await loadJSON('./data/reviews.json');
      localReviews = jsonData.snippets || [];
    } catch(_) {
      localReviews = [];
    }
  }
  
  // Load Google reviews from backend proxy
  let googleData = null;
  let googleReviews = [];
  try {
    const data = await loadFromAPI('/api/google-reviews');
    if (data && data.success && Array.isArray(data.snippets)) {
      googleData = data;
      googleReviews = data.snippets.map((r, idx) => ({
        id: `google-${r.time || idx}`,
        author: r.author,
        rating: r.rating,
        text: r.text,
        profilePhotoUrl: r.profilePhotoUrl,
        time: r.time,
        source: 'google'
      }));
    } else {
      googleReviews = [];
    }
  } catch (error) {
    console.error('Failed to load Google reviews:', error);
    googleReviews = [];
  }
  
  // Normalize local reviews
  const normalizedLocalReviews = localReviews.map((r, idx) => ({
    id: r.id || `local-${idx}`,
    author: r.author,
    rating: r.rating,
    text: r.text,
    videoUrl: r.videoUrl,
    createdAt: r.createdAt,
    source: 'local'
  }));
  
  const combinedReviews = [...googleReviews, ...normalizedLocalReviews];
  
  if (!combinedReviews.length) {
    mount.innerHTML = `
      <div class="container">
    <h1 class="section-title" style="text-align: center;">Patient Reviews</h1>
    <p class="section-sub" style="text-align: center;">What our patients say.</p>
        <div style="text-align:center;padding:40px;border:1px solid var(--border);border-radius:16px;background:#F0F9FF;max-width:720px;margin:0 auto;">
          <p style="margin:0;font-size:1.05rem;color:#4a6572;">Reviews will appear here once they are available.</p>
        </div>
      </div>
    `;
    return;
  }
  
  const googleSummary = googleData && googleData.success && (googleData.placeUrl || googleData.overallRating) ? `
    <div class="review-google-summary">
      <div>
        <div style="font-size:0.9rem;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Google Reviews</div>
        <div class="summary-rating">
          ${googleData.overallRating ? `<span>${googleData.overallRating}</span><span>/ 5</span>` : ''}
        </div>
        ${googleData.totalReviews ? `<div style="font-size:0.95rem;opacity:0.85;">Based on ${googleData.totalReviews.toLocaleString()} patient reviews</div>` : ''}
      </div>
      ${googleData.placeUrl ? `<a href="${googleData.placeUrl}" target="_blank" rel="noopener">View all on Google →</a>` : ''}
    </div>
  ` : '';
  
  const reviewCards = combinedReviews.map((review) => {
    const ratingLabel = review.rating ? `<div class="review-rating">⭐ ${review.rating}/5</div>` : '';
    const dateLabel = formatDate(review.time || review.createdAt);
    const dateHTML = dateLabel ? `<span class="review-date">${dateLabel}</span>` : '';
    const avatarHTML = review.profilePhotoUrl ? `<img class="review-avatar" src="${review.profilePhotoUrl}" alt="${escapeHTML(review.author || 'Reviewer')}" loading="lazy" />` : '';
    const sourceBadge = review.source === 'google'
      ? '<span class="review-source-badge">Google Review</span>'
      : '<span class="review-source-badge" style="background:rgba(191,78,78,0.15);color:#8B2E2E;">Patient Testimonial</span>';
    
    const authorName = review.author ? escapeHTML(review.author) : 'Anonymous';
    
    let videoHTML = '';
    if (review.source === 'local') {
      const videoUrl = review.videoUrl || null;
      if (videoUrl) {
        videoHTML = `
          <div style="margin: 15px 0; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.1);">
            ${isYouTubeOrVimeo(videoUrl) ? (
              videoUrl.includes('youtube') ? 
                `<iframe src="${getYouTubeEmbedUrl(videoUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:12px;display:block;"></iframe>` :
                `<iframe src="${getVimeoEmbedUrl(videoUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:12px;display:block;"></iframe>`
            ) : 
            `<video controls style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;display:block;">
              <source src="${videoUrl}" type="video/mp4">
              Your browser does not support the video tag.
            </video>`
            }
          </div>
        `;
      }
    }
    
    return `
      <article class="card review-card ${review.source === 'google' ? 'google' : ''}">
        <div class="review-card-header">
          ${avatarHTML}
          <div style="flex:1;">
            ${ratingLabel}
            <p class="review-author">${authorName}</p>
            ${dateHTML}
          </div>
          ${sourceBadge}
        </div>
        <p class="review-text">"${escapeHTML(review.text || '')}"</p>
          ${videoHTML}
      </article>
    `;
  }).join('');
  
  mount.innerHTML=`<div class="container">
    <h1 class="section-title" style="text-align: center;">Patient Reviews</h1>
    <p class="section-sub" style="text-align: center;">What our patients say.</p>
    ${googleSummary}
    <div class="cards">
      ${reviewCards}
    </div>
  </div>`
}

async function populatePodcast(){
  const mount=document.getElementById('podcast');
  if(!mount) return;

  const isYouTubeOrVimeo = (url='') => /youtu\.?be|vimeo/.test(url);
  const getYouTubeEmbedUrl = (url) => {
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    } else if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };
  const getVimeoEmbedUrl = (url) => {
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1].split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  let episodes=[];
  try{
    episodes = await loadFromAPI('/api/podcasts');
  }catch(error){
    console.error('Failed to load podcasts from API:', error);
    try{
      const fallback = await loadJSON('./data/podcasts.json');
      episodes = fallback.episodes || [];
    }catch(_){
      episodes=[];
    }
  }

  if(!episodes || episodes.length===0){
    mount.innerHTML=`
      <div class="container podcast-coming-soon">
        <div class="podcast-card">
          <div class="badge">Podcast</div>
          <h1>Kidney Clinic Podcast</h1>
          <p>Our podcast series featuring transplant stories, medical breakthroughs, and expert conversations is on the way.</p>
          <div class="podcast-placeholder">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>
          <div class="coming-soon-tag">Coming Soon</div>
        </div>
      </div>
    `;
    return;
  }

  const cards = episodes.map(ep => {
    const embed = ep.videoUrl ? (
      isYouTubeOrVimeo(ep.videoUrl)
        ? (ep.videoUrl.includes('vimeo') 
            ? `<iframe src="${getVimeoEmbedUrl(ep.videoUrl)}" title="${ep.title}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
            : `<iframe src="${getYouTubeEmbedUrl(ep.videoUrl)}" title="${ep.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
          )
        : `<video controls preload="metadata"><source src="${ep.videoUrl}" type="video/mp4">Your browser does not support the video tag.</video>`
    ) : '';

    return `
      <article class="podcast-episode">
        <div class="podcast-embed">${embed}</div>
        <h3>${ep.title}</h3>
        <p>${ep.description || 'Episode summary coming soon.'}</p>
      </article>
    `;
  }).join('');

  mount.innerHTML=`
    <div class="container podcast-library">
      <div class="podcast-header">
        <span class="badge">Podcast</span>
        <h1>Kidney Clinic Podcast</h1>
        <p>Conversations with surgeons, transplant coordinators, and patients highlighting breakthroughs in renal care.</p>
      </div>
      <div class="podcast-grid">
        ${cards}
      </div>
    </div>
  `;
}

(async function init(){
  await Promise.all([
    populateHome(),
    populateDoctors(),
    populateServices(),
    populateMedicalTourism(),
    populateKidney(),
    populateAbout(),
    populateContact(),
    populateReviews(),
    populatePodcast()
  ]);
})();



