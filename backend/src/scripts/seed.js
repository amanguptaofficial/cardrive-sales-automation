import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Agent from '../models/Agent.js';
import Sequence from '../models/Sequence.js';
import Lead from '../models/Lead.js';
import Integration from '../models/Integration.js';
import { LeadSource, LeadStatus, LeadTier } from '../enums/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, '../..');

const backendEnvPath = path.join(backendDir, '.env');
let envLoaded = false;
let loadedPath = null;

try {
  const result = dotenv.config({ path: backendEnvPath });
  if (!result.error && process.env.MONGODB_URI) {
    envLoaded = true;
    loadedPath = backendEnvPath;
  }
} catch (err) {
}

if (!envLoaded) {
  try {
    const result = dotenv.config(); // Default: looks for .env in process.cwd()
    if (!result.error && process.env.MONGODB_URI) {
      envLoaded = true;
      loadedPath = path.resolve(process.cwd(), '.env');
    }
  } catch (err) {
  }
}

if (!envLoaded) {
  try {
    const rootEnvPath = path.resolve(process.cwd(), 'backend/.env');
    const result = dotenv.config({ path: rootEnvPath });
    if (!result.error && process.env.MONGODB_URI) {
      envLoaded = true;
      loadedPath = rootEnvPath;
    }
  } catch (err) {
  }
}

const checkEnvFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasMongoUri = content.includes('MONGODB_URI') && !content.match(/^#.*MONGODB_URI/m);
      return { exists: true, hasMongoUri, content: content.substring(0, 200) };
    }
    return { exists: false };
  } catch (err) {
    return { exists: false, error: err.message };
  }
};

const seedAgents = async () => {
  const agents = [
    {
      name: 'Rahul Kapoor',
      email: 'rahul@cardrive.in',
      password: await bcrypt.hash('password123', 10),
      phone: '+91 9876543210',
      role: 'manager',
      isVerified: true,
      isActive: true,
      stats: {
        totalLeads: 150,
        responded: 120,
        qualified: 85,
        closed: 45,
        revenue: 25000000
      }
    },
    {
      name: 'Deepa Sharma',
      email: 'deepa@cardrive.in',
      password: await bcrypt.hash('password123', 10),
      phone: '+91 9876543211',
      role: 'senior_agent',
      isVerified: true,
      isActive: true,
      stats: {
        totalLeads: 120,
        responded: 110,
        qualified: 75,
        closed: 38,
        revenue: 19000000
      }
    },
    {
      name: 'Manoj Kumar',
      email: 'manoj@cardrive.in',
      password: await bcrypt.hash('password123', 10),
      phone: '+91 9876543212',
      role: 'senior_agent',
      isVerified: true,
      isActive: true,
      stats: {
        totalLeads: 100,
        responded: 95,
        qualified: 65,
        closed: 32,
        revenue: 16000000
      }
    }
  ];

  await Agent.deleteMany({});
  const createdAgents = await Agent.insertMany(agents);
  console.log('✅ Agents seeded:', createdAgents.length);
  return createdAgents;
};

const seedLeads = async (agents) => {
  const sampleLeads = [
    {
      name: 'Vikram Khanna',
      email: 'vikram.k@gmail.com',
      phone: '+91 9876543201',
      source: LeadSource.CARDEKHO,
      interest: {
        make: 'Toyota',
        model: 'Fortuner',
        variant: '4x4 AT',
        fuelType: 'diesel',
        bodyType: 'SUV',
        budget: { min: 3000000, max: 3500000 },
        isNew: true,
        financeRequired: true
      },
      firstMessage: 'Interested in Fortuner 4x4. Need it by next month. Budget around 32L.',
      preferredContact: 'whatsapp',
      location: {
        city: 'Mumbai',
        area: 'Andheri',
        pincode: '400053'
      },
      score: 94,
      tier: LeadTier.HOT,
      status: LeadStatus.AI_REPLIED,
      assignedTo: agents[1]._id,
      messages: [{
        direction: 'outbound',
        channel: 'whatsapp',
        content: 'Hi Vikram! Great choice - the Fortuner 4x4 is one of our best sellers. We have 2 units available in Glacier White and Phantom Brown. Would you like to schedule a test drive this weekend? We can also discuss financing options.',
        isAI: true,
        sentAt: new Date(Date.now() - 60000),
        status: 'sent'
      }]
    },
    {
      name: 'Sneha Sharma',
      email: 'sneha.s@yahoo.com',
      phone: '+91 9876543202',
      source: LeadSource.WEBSITE,
      interest: {
        make: 'Hyundai',
        model: 'Creta',
        variant: 'SX(O)',
        fuelType: 'petrol',
        bodyType: 'SUV',
        budget: { min: 1500000, max: 1800000 },
        isNew: true
      },
      firstMessage: 'Looking for Creta 2024 model. Please share details.',
      preferredContact: 'whatsapp',
      location: {
        city: 'Delhi',
        area: 'Gurgaon',
        pincode: '122001'
      },
      score: 76,
      tier: LeadTier.WARM,
      status: LeadStatus.NEW
    },
    {
      name: 'Arjun Mehta',
      email: 'arjun.m@corp.in',
      phone: '+91 9876543203',
      source: LeadSource.CARWALE,
      interest: {
        make: 'BMW',
        model: '3 Series',
        variant: '330i',
        fuelType: 'petrol',
        bodyType: 'Sedan',
        budget: { min: 4500000, max: 5000000 },
        isNew: true,
        financeRequired: true
      },
      firstMessage: 'Interested in BMW 3 Series. Premium buyer, ready to close quickly.',
      preferredContact: 'call',
      location: {
        city: 'Bangalore',
        area: 'Whitefield',
        pincode: '560066'
      },
      score: 89,
      tier: LeadTier.HOT,
      status: LeadStatus.QUALIFIED,
      assignedTo: agents[1]._id
    }
  ];

  await Lead.deleteMany({});
  const createdLeads = await Lead.insertMany(sampleLeads);
  console.log('✅ Leads seeded:', createdLeads.length);
  return createdLeads;
};

const seedSequences = async () => {
  const sequences = [
    {
      name: 'Cold Lead Nurture',
      description: '14-day sequence for cold leads',
      targetTier: 'cold',
      isActive: true,
      messages: [
        { day: 1, content: 'Thanks for your interest! Here\'s some info about our EMI plans and new model alerts.', subject: 'Welcome to CarDrive Motors' },
        { day: 3, content: 'Hi {name}, we have some exciting new arrivals. Check out our latest inventory!', subject: 'New Arrivals at CarDrive' },
        { day: 7, content: 'Hey {name}, still looking for the perfect car? We\'re here to help whenever you\'re ready.', subject: 'We\'re Here to Help' },
        { day: 14, content: 'Hi {name}, we have a special offer this month. Would you like to schedule a visit?', subject: 'Special Offer This Month' }
      ]
    },
    {
      name: 'Warm Follow-up',
      description: '7-day follow-up for warm leads',
      targetTier: 'warm',
      isActive: false,
      messages: [
        { day: 1, content: 'Hi! Just checking in - still interested in the {model}? We have some great financing options available.', subject: 'Following Up on Your Interest' },
        { day: 3, content: 'Hey {name}! We just got a new {model} in stock. Would you like to schedule a test drive this weekend?', subject: 'New {model} Available' },
        { day: 7, content: 'Hi {name}, we have a special offer on the {model} this week. Limited time only - want to know more?', subject: 'Special Offer on {model}' }
      ]
    }
  ];

  await Sequence.deleteMany({});
  const createdSequences = await Sequence.insertMany(sequences);
  console.log('✅ Sequences seeded:', createdSequences.length);
  return createdSequences;
};

const seedIntegrations = async () => {
  const integrations = [
    {
      name: 'Website Form',
      source: 'website',
      status: 'connected',
      webhookUrl: '/api/webhooks/website',
      description: 'Contact form submissions from your website',
      icon: 'Link2',
      isActive: true
    },
    {
      name: 'CarDekho API',
      source: 'cardekho',
      status: 'connected',
      webhookUrl: '/api/webhooks/cardekho',
      description: 'Lead integration from CarDekho platform',
      icon: 'Link2',
      isActive: true
    },
    {
      name: 'CarWale',
      source: 'carwale',
      status: 'connected',
      webhookUrl: '/api/webhooks/carwale',
      description: 'Lead integration from CarWale platform',
      icon: 'Link2',
      isActive: true
    },
    {
      name: 'Facebook Ads',
      source: 'facebook',
      status: 'disconnected',
      webhookUrl: '/api/webhooks/facebook',
      description: 'Lead generation from Facebook advertising campaigns',
      icon: 'Link2',
      isActive: true
    }
  ];

  for (const integration of integrations) {
    await Integration.findOneAndUpdate(
      { source: integration.source },
      integration,
      { upsert: true, new: true }
    );
  }
  
  const count = await Integration.countDocuments();
  console.log('✅ Integrations seeded:', count);
  return integrations;
};

const seed = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('\n❌ [ERROR] MONGODB_URI is required for seeding.');
      console.error('💡 Please add MONGODB_URI to your .env file in the backend directory.');
      console.error(`\n📂 Current working directory: ${process.cwd()}`);
      console.error(`📂 Backend directory: ${backendDir}`);
      console.error(`📂 Script location: ${__dirname}`);
      
      const envFileCheck = checkEnvFile(backendEnvPath);
      if (envFileCheck.exists) {
        console.error(`\n✅ Found .env file at: ${backendEnvPath}`);
        if (!envFileCheck.hasMongoUri) {
          console.error('   ⚠️  But MONGODB_URI is missing or commented out.');
          console.error('   💡 Make sure you have a line like:');
          console.error('      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
        }
      } else {
        console.error(`\n❌ Could not find .env file at: ${backendEnvPath}`);
        console.error('   💡 Create a .env file in the backend directory with:');
        console.error('      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
      }
      
      const otherPaths = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend/.env')
      ];
      otherPaths.forEach(p => {
        const check = checkEnvFile(p);
        if (check.exists) {
          console.error(`\n   ℹ️  Found .env at: ${p}`);
        }
      });
      
      console.error(`\n💡 Example from env.example.txt:`);
      console.error(`   MONGODB_URI=mongodb+srv://amangupta:amangupta@aman.id6td9f.mongodb.net/carDrive\n`);
      process.exit(1);
    }
    
    if (loadedPath) {
      console.log(`✅ Loaded .env from: ${loadedPath}`);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    console.log('🌱 Starting seed...');
    
    const agents = await seedAgents();
    await seedLeads(agents);
    await seedSequences();
    await seedIntegrations();
    
    console.log('✅ Seed completed successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seed();
