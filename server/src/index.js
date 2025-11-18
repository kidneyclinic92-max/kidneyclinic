import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { upload, uploadToAzure, isAzureConfigured } from './azure-storage.js';
import { sendAppointmentConfirmation, sendAppointmentCancellation, sendAppointmentCompleted, testEmailConnection } from './email-service.js';
import { getCachedGoogleReviews } from './google-reviews-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/clinic_local';
console.log('Connecting to MongoDB...');
try {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
} catch (error) {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
}

// Check email configuration
console.log('\n📧 Email Configuration Check:');
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email configured with:', process.env.EMAIL_USER);
  console.log('✅ Email service ready to send notifications');
} else {
  console.log('⚠️  Email not configured - Set EMAIL_USER and EMAIL_PASS in .env file');
  console.log('   Current EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
}

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  }
};

const toStringSafe = (value) => (typeof value === 'string' ? value : '');

const sanitizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => toStringSafe(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const sanitizeArray = (arr, mapper) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item, index) => {
      try {
        return mapper(item, index);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

function sanitizeKidneyPayload(body = {}) {
  return {
    hero: {
      badge: toStringSafe(body.hero?.badge),
      title: toStringSafe(body.hero?.title),
      subtitle: toStringSafe(body.hero?.subtitle),
      backgroundImage: toStringSafe(body.hero?.backgroundImage)
    },
    stats: sanitizeArray(body.stats, (stat = {}) => {
      const icon = toStringSafe(stat.icon);
      const value = toStringSafe(stat.value);
      const label = toStringSafe(stat.label);
      const description = toStringSafe(stat.description);
      return icon || value || label || description ? { icon, value, label, description } : null;
    }),
    procedures: {
      title: toStringSafe(body.procedures?.title),
      subtitle: toStringSafe(body.procedures?.subtitle),
      footnote: toStringSafe(body.procedures?.footnote),
      items: sanitizeArray(body.procedures?.items, (item = {}) => {
        const icon = toStringSafe(item.icon);
        const name = toStringSafe(item.name);
        const description = toStringSafe(item.description);
        const focusPoints = sanitizeStringArray(item.focusPoints);
        return icon || name || description || focusPoints.length
          ? { icon, name, description, focusPoints }
          : null;
      })
    },
    journey: {
      title: toStringSafe(body.journey?.title),
      subtitle: toStringSafe(body.journey?.subtitle),
      note: toStringSafe(body.journey?.note),
      steps: sanitizeArray(body.journey?.steps, (step = {}) => {
        const title = toStringSafe(step.title);
        const description = toStringSafe(step.description);
        return title || description ? { title, description } : null;
      })
    },
    symptoms: {
      title: toStringSafe(body.symptoms?.title),
      subtitle: toStringSafe(body.symptoms?.subtitle),
      categories: sanitizeArray(body.symptoms?.categories, (category = {}) => {
        const title = toStringSafe(category.title);
        const items = sanitizeStringArray(category.items);
        return title || items.length ? { title, items } : null;
      }),
      cta: {
        text: toStringSafe(body.symptoms?.cta?.text),
        link: toStringSafe(body.symptoms?.cta?.link)
      }
    },
    support: {
      title: toStringSafe(body.support?.title),
      pillars: sanitizeArray(body.support?.pillars, (pillar = {}) => {
        const icon = toStringSafe(pillar.icon);
        const title = toStringSafe(pillar.title);
        const description = toStringSafe(pillar.description);
        return icon || title || description ? { icon, title, description } : null;
      }),
      resources: sanitizeArray(body.support?.resources, (resource = {}) => {
        const title = toStringSafe(resource.title);
        const link = toStringSafe(resource.link);
        const description = toStringSafe(resource.description);
        return title || link || description ? { title, link, description } : null;
      })
    },
    cta: {
      heading: toStringSafe(body.cta?.heading),
      description: toStringSafe(body.cta?.description),
      buttonText: toStringSafe(body.cta?.buttonText),
      buttonLink: toStringSafe(body.cta?.buttonLink)
    }
  };
}

const formatKidney = (doc) => {
  if (!doc) return {};
  const data = doc.toJSON ? doc.toJSON() : doc;
  return sanitizeKidneyPayload(data);
};

const Doctor = mongoose.model('Doctor', new mongoose.Schema({
  name: { type: String },
  title: { type: String },
  specialization: { type: String },
  bio: { type: String },
  employment: { type: String },
  contact: { type: String },
  photoUrl: { type: String },
  interviewUrl: { type: String }
}, { timestamps: true, toJSON }));

const Appointment = mongoose.model('Appointment', new mongoose.Schema({
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientPhone: { type: String, required: true },
  doctorId: { type: String },
  doctorName: { type: String },
  appointmentDate: { type: Date, required: true },
  appointmentTime: { type: String, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true, toJSON }));

// Seed dummy data if collections are empty
async function seedData() {
  try {
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      await Doctor.create([
        {
          name: "Dr. Sarah Johnson",
          title: "Chief Medical Officer",
          specialization: "Cardiology",
          bio: "Dr. Johnson has over 15 years of experience in cardiology and has performed over 1000 successful heart surgeries.",
          photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
          interviewUrl: "https://youtube.com/watch?v=example1"
        },
        {
          name: "Dr. Michael Chen",
          title: "Senior Surgeon",
          specialization: "Orthopedics",
          bio: "Dr. Chen specializes in joint replacement and sports medicine with a 98% success rate.",
          photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
          interviewUrl: "https://youtube.com/watch?v=example2"
        }
      ]);
      console.log('Seeded doctors data');
    }

    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.create([
        {
          name: "Urological Services",
          summary: "Comprehensive urologic care including endoscopic, laparoscopic and stone management.",
          image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
          details: [
            "Diagnostic Procedures",
            "Minimally Invasive Surgeries",
            "Kidney Stone Management",
            "Prostate Health Treatments",
            "Bladder Control Solutions",
            "Pediatric Urology",
            "Infertility Treatments",
            "Urological Cancer Management",
            "Female Urology"
          ]
        },
        {
          name: "Nephrology Services",
          summary: "Kidney care across CKD, hypertension, dialysis programs and follow‑up.",
          image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
          details: [
            "Chronic Kidney Disease Management",
            "Hypertension & Kidney Health",
            "Dialysis Programs (Hemodialysis & Peritoneal)",
            "Kidney Function Testing",
            "Electrolyte & Fluid Balance Management",
            "Glomerular Disease Treatment",
            "Kidney Biopsy & Diagnostics",
            "Pre-Transplant Evaluation",
            "Post-Transplant Follow-up Care"
          ]
        },
        {
          name: "Kidney Transplant",
          summary: "Evaluation, donor matching, surgery and lifelong immunosuppression management.",
          image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800",
          details: [
            "Pre-Transplant Evaluation & Counseling",
            "Living Donor Assessment & Surgery",
            "Deceased Donor Coordination",
            "Advanced Surgical Techniques",
            "Immunosuppression Protocol Management",
            "Rejection Monitoring & Treatment",
            "Long-term Follow-up Care",
            "Transplant Complications Management",
            "International Patient Coordination"
          ]
        }
      ]);
      console.log('Seeded services data');
    }

    const achievementCount = await Achievement.countDocuments();
    if (achievementCount === 0) {
      await Achievement.create([
        {
          title: "1000+ Successful Surgeries",
          text: "Our team has performed over 1000 successful surgeries with a 99.2% success rate."
        },
        {
          title: "Award-Winning Care",
          text: "Recognized as the Best Medical Center 2023 by the National Health Association."
        }
      ]);
      console.log('Seeded achievements data');
    }

    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.create([
        {
          author: "John Smith",
          rating: 5,
          text: "Excellent care and professional staff. Dr. Johnson saved my life!"
        },
        {
          author: "Maria Garcia",
          rating: 5,
          text: "Outstanding service. The joint replacement surgery was a complete success."
        }
      ]);
      console.log('Seeded reviews data');
    }

    const homeCount = await Home.countDocuments();
    if (homeCount === 0) {
      await Home.create({
        features_title: "Advanced Medical Care",
        features_subtitle: "Providing world-class healthcare with cutting-edge technology and compassionate care.",
        showcase_title: "Our Success Stories",
        showcase_subtitle: "See how we've helped thousands of patients achieve better health and quality of life."
      });
      console.log('Seeded home data');
    }

    const kidneyCount = await KidneyPage.countDocuments();
    if (kidneyCount === 0) {
      try {
        const kidneyJsonPath = path.resolve(projectRoot, 'data', 'kidney.json');
        const kidneyContent = JSON.parse(fs.readFileSync(kidneyJsonPath, 'utf-8'));
        await KidneyPage.create(sanitizeKidneyPayload(kidneyContent));
        console.log('Seeded kidney page data');
      } catch (error) {
        console.error('Failed to seed kidney page data:', error.message);
      }
    }

    const podcastCount = await PodcastEpisode.countDocuments();
    if (podcastCount === 0) {
      try {
        const podcastJsonPath = path.resolve(projectRoot, 'data', 'podcasts.json');
        if (fs.existsSync(podcastJsonPath)) {
          const podcastData = JSON.parse(fs.readFileSync(podcastJsonPath, 'utf-8'));
          const episodes = podcastData.episodes || [];
          if (episodes.length) {
            await PodcastEpisode.insertMany(episodes.map(ep => ({
              title: ep.title,
              description: ep.description,
              videoUrl: ep.videoUrl,
              thumbnailUrl: ep.thumbnailUrl
            })));
            console.log('Seeded podcast episodes data');
          }
        }
      } catch (error) {
        console.error('Failed to seed podcast episodes:', error.message);
      }
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

const Service = mongoose.model('Service', new mongoose.Schema({
  name: { type: String },
  summary: { type: String },
  image: { type: String },
  details: [{ type: String }],
  detailVideos: [{ type: String }]
}, { timestamps: true, toJSON }));

const Achievement = mongoose.model('Achievement', new mongoose.Schema({
  title: { type: String },
  text: { type: String }
}, { timestamps: true, toJSON }));

const Review = mongoose.model('Review', new mongoose.Schema({
  author: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  text: { type: String },
  videoUrl: { type: String }
}, { timestamps: true, toJSON }));

const PodcastEpisode = mongoose.model('PodcastEpisode', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String }
}, { timestamps: true, toJSON }));

const HomepageSlide = mongoose.model('HomepageSlide', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, default: '' }, // Optional, but required for active slides (validated in API)
  linkUrl: { type: String, default: '' },
  linkText: { type: String, default: '' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, toJSON }));

const kidneyStatSchema = new mongoose.Schema({
  icon: { type: String },
  value: { type: String },
  label: { type: String },
  description: { type: String }
}, { _id: false });

const kidneyProcedureItemSchema = new mongoose.Schema({
  icon: { type: String },
  name: { type: String },
  description: { type: String },
  focusPoints: [{ type: String }]
}, { _id: false });

const kidneyJourneyStepSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String }
}, { _id: false });

const kidneySymptomCategorySchema = new mongoose.Schema({
  title: { type: String },
  items: [{ type: String }]
}, { _id: false });

const kidneySupportPillarSchema = new mongoose.Schema({
  icon: { type: String },
  title: { type: String },
  description: { type: String }
}, { _id: false });

const kidneySupportResourceSchema = new mongoose.Schema({
  title: { type: String },
  link: { type: String },
  description: { type: String }
}, { _id: false });

const KidneyPage = mongoose.model('KidneyPage', new mongoose.Schema({
  hero: {
    badge: { type: String },
    title: { type: String },
    subtitle: { type: String },
    backgroundImage: { type: String }
  },
  stats: [kidneyStatSchema],
  procedures: {
    title: { type: String },
    subtitle: { type: String },
    footnote: { type: String },
    items: [kidneyProcedureItemSchema]
  },
  journey: {
    title: { type: String },
    subtitle: { type: String },
    note: { type: String },
    steps: [kidneyJourneyStepSchema]
  },
  symptoms: {
    title: { type: String },
    subtitle: { type: String },
    categories: [kidneySymptomCategorySchema],
    cta: {
      text: { type: String },
      link: { type: String }
    }
  },
  support: {
    title: { type: String },
    pillars: [kidneySupportPillarSchema],
    resources: [kidneySupportResourceSchema]
  },
  cta: {
    heading: { type: String },
    description: { type: String },
    buttonText: { type: String },
    buttonLink: { type: String }
  }
}, { timestamps: true, toJSON }));

const MedicalTourism = mongoose.model('MedicalTourism', new mongoose.Schema({
  // Health Gateways Section
  healthGateways_badge: { type: String },
  healthGateways_title: { type: String },
  healthGateways_description: { type: String },
  healthGateways_services: [{ 
    icon: { type: String },
    title: { type: String },
    description: { type: String }
  }],
  healthGateways_contact_heading: { type: String },
  healthGateways_contact_email: { type: String },
  healthGateways_contact_phone: { type: String },
  healthGateways_contact_website: { type: String },
  
  // Process Section
  process_title: { type: String },
  process_steps: [{ 
    title: { type: String },
    description: { type: String }
  }],
  
  // CTA Section
  cta_heading: { type: String },
  cta_description: { type: String },
  cta_button_text: { type: String },
  cta_button_link: { type: String },
  
  // Map Section
  map_title: { type: String },
  map_description: { type: String },
  map_locations: [{ 
    name: { type: String },
    icon: { type: String },
    description: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    stat: { type: String },
    statLabel: { type: String }
  }]
}, { timestamps: true, toJSON }));

const Home = mongoose.model('Home', new mongoose.Schema({
  // Hero Section
  hero_title: { type: String },
  hero_subtitle: { type: String },
  hero_cta_primary_text: { type: String },
  hero_cta_primary_link: { type: String },
  hero_cta_secondary_text: { type: String },
  hero_cta_secondary_link: { type: String },
  hero_background_video: { type: String },
  
  // Features Section (home-highlights) - already exists in content.js
  features_title: { type: String },
  features_subtitle: { type: String },
  features_items: [{ 
    badge: { type: String },
    title: { type: String },
    text: { type: String }
  }],
  
  // Transplant Highlights Section
  transplant_badge: { type: String },
  transplant_heading: { type: String },
  transplant_description: { type: String },
  transplant_stat_value_0: { type: String },
  transplant_stat_label_0: { type: String },
  transplant_stat_value_1: { type: String },
  transplant_stat_label_1: { type: String },
  transplant_stat_value_2: { type: String },
  transplant_stat_label_2: { type: String },
  care_journey_title: { type: String },
  care_journey_item_0: { type: String },
  care_journey_item_1: { type: String },
  care_journey_item_2: { type: String },
  feature_title_0: { type: String },
  feature_desc_0: { type: String },
  feature_title_1: { type: String },
  feature_desc_1: { type: String },
  feature_title_2: { type: String },
  feature_desc_2: { type: String },
  feature_title_3: { type: String },
  feature_desc_3: { type: String },
  
  // Facility Video Section
  facility_badge: { type: String },
  facility_heading: { type: String },
  facility_description: { type: String },
  facility_video_url: { type: String },
  facility_video_description: { type: String },
  
  // CTA Section
  cta_heading: { type: String },
  cta_description: { type: String },
  cta_button_text: { type: String },
  cta_button_link: { type: String },
  
  // Showcase Section (for future use)
  showcase_title: { type: String },
  showcase_subtitle: { type: String }
}, { timestamps: true, toJSON }));

// Health
app.get('/health', async (_req, res) => {
  const state = mongoose.connection.readyState; // 1 connected
  res.json({ ok: state === 1, state });
});

// --- Email Test Endpoint ---
app.get('/api/test-email', async (_req, res) => {
  try {
    const result = await testEmailConnection();
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email connection verified successfully! ✅',
        configured: true
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Email not configured. Set EMAIL_USER and EMAIL_PASS in .env file.',
        error: result.error,
        configured: false
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      configured: false
    });
  }
});

// --- File Upload Endpoint ---
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload to Azure Blob Storage
    const fileUrl = await uploadToAzure(req.file);
    
    res.json({ 
      success: true, 
      url: fileUrl,
      filename: req.file.originalname,
      storage: 'azure-blob'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// --- Doctors ---
app.get('/api/doctors', async (_req, res) => {
  const docs = await Doctor.find();
  res.json(docs);
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/doctors', async (req, res) => {
  const created = await Doctor.create(req.body);
  res.status(201).json({ id: created.id });
});

app.put('/api/doctors/:id', async (req, res) => {
  await Doctor.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

app.delete('/api/doctors/:id', async (req, res) => {
  await Doctor.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// --- Services ---
app.get('/api/services', async (_req, res) => {
  const docs = await Service.find();
  res.json(docs);
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const doc = await Service.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Service not found' });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  const created = await Service.create(req.body);
  res.status(201).json({ id: created.id });
});

app.put('/api/services/:id', async (req, res) => {
  await Service.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

app.delete('/api/services/:id', async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// --- Achievements ---
app.get('/api/achievements', async (_req, res) => {
  const docs = await Achievement.find();
  res.json(docs);
});

app.post('/api/achievements', async (req, res) => {
  const created = await Achievement.create(req.body);
  res.status(201).json({ id: created.id });
});

app.put('/api/achievements/:id', async (req, res) => {
  await Achievement.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

app.delete('/api/achievements/:id', async (req, res) => {
  await Achievement.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// --- Reviews ---
app.get('/api/reviews', async (_req, res) => {
  const docs = await Review.find();
  res.json(docs);
});

// --- Google Reviews ---
app.get('/api/google-reviews', async (req, res) => {
  try {
    // Your clinic's Google Place ID
    const placeId = process.env.GOOGLE_PLACE_ID || 'ChIJyX_-2MztOj4ROVbuY8wjPmc'; // The Kidney Clinic
    
    const reviews = await getCachedGoogleReviews(placeId);
    
    if (!reviews.success) {
      return res.status(500).json({
        error: reviews.error,
        message: 'Failed to fetch Google reviews. Please check API configuration.',
        snippets: []
      });
    }
    
    res.json(reviews);
  } catch (error) {
    console.error('Error in /api/google-reviews:', error);
    res.status(500).json({
      error: error.message,
      snippets: []
    });
  }
});

app.post('/api/reviews', async (req, res) => {
  const created = await Review.create(req.body);
  res.status(201).json({ id: created.id });
});

app.put('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndUpdate(req.params.id, req.body);
  res.json({ ok: true });
});

app.delete('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// --- Podcasts ---
app.get('/api/podcasts', async (_req, res) => {
  const docs = await PodcastEpisode.find();
  // Sort in memory to avoid Cosmos DB index requirements
  const episodes = docs.map(doc => doc.toJSON ? doc.toJSON() : doc);
  episodes.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA; // Descending (newest first)
  });
  res.json(episodes);
});

app.post('/api/podcasts', async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required.' });
    }
    const created = await PodcastEpisode.create({
      title,
      description,
      videoUrl,
      thumbnailUrl
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/podcasts/:id', async (req, res) => {
  try {
    await PodcastEpisode.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Homepage Slides ---
app.get('/api/homepage-slides', async (req, res) => {
  // If admin query param, return all slides (including inactive)
  const includeInactive = req.query.admin === 'true';
  const query = includeInactive ? {} : { isActive: true };
  const slides = await HomepageSlide.find(query).sort({ order: 1, createdAt: -1 });
  res.json(slides);
});

app.post('/api/homepage-slides', async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, linkText, order, isActive } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    // Allow empty imageUrl during creation, but require it when updating (handled in PUT)
    const created = await HomepageSlide.create({
      title,
      description: description || '',
      imageUrl: imageUrl || '',
      linkUrl: linkUrl || '',
      linkText: linkText || '',
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/homepage-slides/:id', async (req, res) => {
  try {
    const { title, imageUrl, isActive } = req.body;
    console.log('PUT /api/homepage-slides/:id - Received data:', req.body); // Debug log
    
    // Validate required fields when updating
    if (title !== undefined && !title) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
    
    // Get current slide to check if it's being activated
    const currentSlide = await HomepageSlide.findById(req.params.id);
    if (!currentSlide) {
      return res.status(404).json({ error: 'Slide not found' });
    }
    
    // Only require imageUrl if the slide is being set to active (or is already active)
    const willBeActive = isActive !== undefined ? isActive : currentSlide.isActive;
    const newImageUrl = imageUrl !== undefined ? imageUrl : currentSlide.imageUrl;
    
    if (willBeActive && !newImageUrl) {
      return res.status(400).json({ error: 'Image URL is required for active slides.' });
    }
    
    // Update with all provided fields
    const updateData = { ...req.body };
    delete updateData.id; // Remove id if present in body
    
    const updated = await HomepageSlide.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    console.log('PUT /api/homepage-slides/:id - Updated slide:', updated); // Debug log
    res.json(updated);
  } catch (error) {
    console.error('PUT /api/homepage-slides/:id - Error:', error); // Debug log
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/homepage-slides/:id', async (req, res) => {
  try {
    await HomepageSlide.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Home (single row JSON-ish) ---
app.get('/api/home', async (_req, res) => {
  const doc = await Home.findOne();
  res.json(doc || {});
});

// --- Medical Tourism ---
app.get('/api/medical-tourism', async (_req, res) => {
  const doc = await MedicalTourism.findOne();
  if (!doc) {
    // Return empty structure if no data exists
    return res.json({});
  }
  // Convert to frontend format
  const data = doc.toJSON ? doc.toJSON() : doc;
  res.json({
    healthGateways: {
      badge: data.healthGateways_badge,
      title: data.healthGateways_title,
      description: data.healthGateways_description,
      services: data.healthGateways_services || [],
      contact: {
        heading: data.healthGateways_contact_heading,
        email: data.healthGateways_contact_email,
        phone: data.healthGateways_contact_phone,
        website: data.healthGateways_contact_website
      }
    },
    process: {
      title: data.process_title,
      steps: data.process_steps || []
    },
    cta: {
      heading: data.cta_heading,
      description: data.cta_description,
      buttonText: data.cta_button_text,
      buttonLink: data.cta_button_link
    },
    map: {
      title: data.map_title,
      description: data.map_description,
      locations: data.map_locations || []
    }
  });
});

app.put('/api/medical-tourism', async (req, res) => {
  const update = {
    // Health Gateways Section
    healthGateways_badge: req.body.healthGatewaysBadge ?? null,
    healthGateways_title: req.body.healthGatewaysTitle ?? null,
    healthGateways_description: req.body.healthGatewaysDescription ?? null,
    healthGateways_services: req.body.healthGatewaysServices ?? [],
    healthGateways_contact_heading: req.body.healthGatewaysContactHeading ?? null,
    healthGateways_contact_email: req.body.healthGatewaysContactEmail ?? null,
    healthGateways_contact_phone: req.body.healthGatewaysContactPhone ?? null,
    healthGateways_contact_website: req.body.healthGatewaysContactWebsite ?? null,
    
    // Process Section
    process_title: req.body.processTitle ?? null,
    process_steps: req.body.processSteps ?? [],
    
    // CTA Section
    cta_heading: req.body.ctaHeading ?? null,
    cta_description: req.body.ctaDescription ?? null,
    cta_button_text: req.body.ctaButtonText ?? null,
    cta_button_link: req.body.ctaButtonLink ?? null,
    
    // Map Section
    map_title: req.body.mapTitle ?? null,
    map_description: req.body.mapDescription ?? null,
    map_locations: req.body.mapLocations ?? []
  };
  await MedicalTourism.findOneAndUpdate({}, update, { upsert: true });
  res.json({ ok: true });
});

app.get('/api/kidney', async (_req, res) => {
  const doc = await KidneyPage.findOne();
  if (!doc) {
    return res.json({});
  }
  res.json(formatKidney(doc));
});

app.put('/api/kidney', async (req, res) => {
  const update = sanitizeKidneyPayload(req.body || {});
  await KidneyPage.findOneAndUpdate({}, update, { upsert: true });
  res.json({ ok: true });
});

app.put('/api/home', async (req, res) => {
  const update = {
    // Hero Section
    hero_title: req.body.heroTitle ?? null,
    hero_subtitle: req.body.heroSubtitle ?? null,
    hero_cta_primary_text: req.body.heroCtaPrimaryText ?? null,
    hero_cta_primary_link: req.body.heroCtaPrimaryLink ?? null,
    hero_cta_secondary_text: req.body.heroCtaSecondaryText ?? null,
    hero_cta_secondary_link: req.body.heroCtaSecondaryLink ?? null,
    hero_background_video: req.body.heroBackgroundVideo ?? null,
    
    // Features Section
    features_title: req.body.featuresTitle ?? null,
    features_subtitle: req.body.featuresSubtitle ?? null,
    features_items: req.body.featuresItems ?? [],
    
    // Transplant Highlights Section
    transplant_badge: req.body.transplantBadge ?? null,
    transplant_heading: req.body.transplantHeading ?? null,
    transplant_description: req.body.transplantDescription ?? null,
    transplant_stat_value_0: req.body.transplantStatValue0 ?? null,
    transplant_stat_label_0: req.body.transplantStatLabel0 ?? null,
    transplant_stat_value_1: req.body.transplantStatValue1 ?? null,
    transplant_stat_label_1: req.body.transplantStatLabel1 ?? null,
    transplant_stat_value_2: req.body.transplantStatValue2 ?? null,
    transplant_stat_label_2: req.body.transplantStatLabel2 ?? null,
    care_journey_title: req.body.careJourneyTitle ?? null,
    care_journey_item_0: req.body.careJourneyItem0 ?? null,
    care_journey_item_1: req.body.careJourneyItem1 ?? null,
    care_journey_item_2: req.body.careJourneyItem2 ?? null,
    feature_title_0: req.body.featureTitle0 ?? null,
    feature_desc_0: req.body.featureDesc0 ?? null,
    feature_title_1: req.body.featureTitle1 ?? null,
    feature_desc_1: req.body.featureDesc1 ?? null,
    feature_title_2: req.body.featureTitle2 ?? null,
    feature_desc_2: req.body.featureDesc2 ?? null,
    feature_title_3: req.body.featureTitle3 ?? null,
    feature_desc_3: req.body.featureDesc3 ?? null,
    
    // Facility Video Section
    facility_badge: req.body.facilityBadge ?? null,
    facility_heading: req.body.facilityHeading ?? null,
    facility_description: req.body.facilityDescription ?? null,
    facility_video_url: req.body.facilityVideoUrl ?? null,
    facility_video_description: req.body.facilityVideoDescription ?? null,
    
    // CTA Section
    cta_heading: req.body.ctaHeading ?? null,
    cta_description: req.body.ctaDescription ?? null,
    cta_button_text: req.body.ctaButtonText ?? null,
    cta_button_link: req.body.ctaButtonLink ?? null,
    
    // Showcase Section
    showcase_title: req.body.showcaseTitle ?? null,
    showcase_subtitle: req.body.showcaseSubtitle ?? null
  };
  await Home.findOneAndUpdate({}, update, { upsert: true });
  res.json({ ok: true });
});

// --- Appointments ---
app.get('/api/appointments', async (req, res) => {
  const { status, date } = req.query;
  let query = {};
  if (status) query.status = status;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.appointmentDate = { $gte: startDate, $lt: endDate };
  }
  const docs = await Appointment.find(query);
  res.json(docs);
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const doc = await Appointment.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Appointment not found' });
    res.json(doc);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const created = await Appointment.create(req.body);
    res.status(201).json({ id: created.id, message: 'Appointment request submitted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const oldAppointment = await Appointment.findById(req.params.id);
    const oldStatus = oldAppointment ? oldAppointment.status : null;
    
    await Appointment.findByIdAndUpdate(req.params.id, req.body);
    const updatedAppointment = await Appointment.findById(req.params.id);
    
    // Send email notifications when status changes
    const newStatus = req.body.status || updatedAppointment.status;
    
    if (oldStatus !== newStatus && updatedAppointment) {
      // Get doctor info if available
      let doctor = null;
      if (updatedAppointment.doctorId) {
        try {
          doctor = await Doctor.findById(updatedAppointment.doctorId);
        } catch (error) {
          console.error('Error fetching doctor:', error);
        }
      }
      
      // Convert appointment to plain object for email
      const appointmentData = updatedAppointment.toJSON ? updatedAppointment.toJSON() : updatedAppointment;
      
      // Send appropriate email based on new status
      try {
        let emailResult = null;
        if (newStatus === 'confirmed') {
          emailResult = await sendAppointmentConfirmation(appointmentData, doctor);
          if (emailResult.success) {
            console.log('✅ Confirmation email sent successfully to:', appointmentData.patientEmail);
          } else {
            console.error('❌ Failed to send confirmation email:', emailResult.reason || emailResult.error);
            console.log('   Appointment was still updated successfully.');
          }
        } else if (newStatus === 'cancelled') {
          emailResult = await sendAppointmentCancellation(appointmentData, doctor);
          if (emailResult.success) {
            console.log('✅ Cancellation email sent successfully to:', appointmentData.patientEmail);
          } else {
            console.error('❌ Failed to send cancellation email:', emailResult.reason || emailResult.error);
            console.log('   Appointment was still updated successfully.');
          }
        } else if (newStatus === 'completed') {
          emailResult = await sendAppointmentCompleted(appointmentData, doctor);
          if (emailResult.success) {
            console.log('✅ Thank you email sent successfully to:', appointmentData.patientEmail);
          } else {
            console.error('❌ Failed to send thank you email:', emailResult.reason || emailResult.error);
            console.log('   Appointment was still updated successfully.');
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
        console.error('   Error details:', emailError.message);
        console.log('   Appointment was still updated successfully.');
      }
    }
    
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available time slots for a specific date
app.get('/api/appointments/available-slots/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));
    
    // Get all booked appointments for this date
    const bookedAppointments = await Appointment.find({
      appointmentDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Define available time slots (9 AM - 5 PM, hourly)
    const allSlots = [
      '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];
    
    // Filter out booked slots
    const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json({ availableSlots });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Seed data after all models are defined
console.log('Starting data seeding...');
await seedData();
console.log('Data seeding completed');

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


