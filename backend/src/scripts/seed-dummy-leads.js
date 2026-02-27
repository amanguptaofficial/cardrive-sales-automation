import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import { LeadSource, LeadStatus, LeadTier, FuelType, MessageDirection, MessageChannel, MessageStatus, PreferredContact, Sentiment } from '../enums/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

const backendEnvPath = path.join(backendDir, '.env');
let envLoaded = false;

try {
  const result = dotenv.config({ path: backendEnvPath });
  if (!result.error && process.env.MONGODB_URI) {
    envLoaded = true;
  }
} catch (err) {}

if (!envLoaded) {
  try {
    const result = dotenv.config();
    if (!result.error && process.env.MONGODB_URI) {
      envLoaded = true;
    }
  } catch (err) {}
}

const carModels = [
  { make: 'Toyota', model: 'Fortuner', variant: '4x4 AT', fuelType: 'diesel', bodyType: 'SUV', budget: { min: 3000000, max: 3500000 } },
  { make: 'Hyundai', model: 'Creta', variant: 'SX(O)', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 1500000, max: 1800000 } },
  { make: 'BMW', model: '3 Series', variant: '330i', fuelType: 'petrol', bodyType: 'Sedan', budget: { min: 4500000, max: 5000000 } },
  { make: 'Mercedes-Benz', model: 'C-Class', variant: 'C200', fuelType: 'petrol', bodyType: 'Sedan', budget: { min: 4200000, max: 4800000 } },
  { make: 'Audi', model: 'A4', variant: 'Premium Plus', fuelType: 'petrol', bodyType: 'Sedan', budget: { min: 4300000, max: 4900000 } },
  { make: 'Mahindra', model: 'Scorpio', variant: 'Z8', fuelType: 'diesel', bodyType: 'SUV', budget: { min: 1600000, max: 2000000 } },
  { make: 'Tata', model: 'Nexon', variant: 'XZ+', fuelType: 'electric', bodyType: 'SUV', budget: { min: 1400000, max: 1700000 } },
  { make: 'Maruti', model: 'Brezza', variant: 'VXI', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 800000, max: 1200000 } },
  { make: 'Honda', model: 'City', variant: 'VX', fuelType: 'petrol', bodyType: 'Sedan', budget: { min: 1200000, max: 1500000 } },
  { make: 'Volkswagen', model: 'Virtus', variant: 'GT', fuelType: 'petrol', bodyType: 'Sedan', budget: { min: 1500000, max: 1800000 } },
  { make: 'Kia', model: 'Seltos', variant: 'HTX', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 1600000, max: 2000000 } },
  { make: 'MG', model: 'Hector', variant: 'Sharp', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 1800000, max: 2200000 } },
  { make: 'Skoda', model: 'Kushaq', variant: 'Style', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 1700000, max: 2100000 } },
  { make: 'Nissan', model: 'Magnite', variant: 'XV Premium', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 700000, max: 1000000 } },
  { make: 'Renault', model: 'Kiger', variant: 'RXZ', fuelType: 'petrol', bodyType: 'SUV', budget: { min: 800000, max: 1100000 } }
];

const cities = [
  { city: 'Mumbai', areas: ['Andheri', 'Bandra', 'Powai', 'Worli'], pincodes: ['400053', '400050', '400076', '400018'] },
  { city: 'Delhi', areas: ['Gurgaon', 'Noida', 'Dwarka', 'Rohini'], pincodes: ['122001', '201301', '110075', '110085'] },
  { city: 'Bangalore', areas: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout'], pincodes: ['560066', '560095', '560038', '560102'] },
  { city: 'Pune', areas: ['Hinjewadi', 'Kothrud', 'Viman Nagar', 'Baner'], pincodes: ['411057', '411038', '411014', '411045'] },
  { city: 'Hyderabad', areas: ['Gachibowli', 'Hitech City', 'Banjara Hills', 'Jubilee Hills'], pincodes: ['500032', '500081', '500034', '500033'] },
  { city: 'Chennai', areas: ['OMR', 'Anna Nagar', 'T Nagar', 'Velachery'], pincodes: ['600096', '600040', '600017', '600042'] }
];

const firstMessages = [
  'Interested in {model}. Need it urgently. Budget around {budget}L.',
  'Looking for {model} 2024 model. Please share details and availability.',
  'Hi, I want to buy {model}. What are the financing options?',
  'Interested in {model}. Ready to close quickly if price is right.',
  'Need {model} by next month. Please call me ASAP.',
  'Looking for {model}. Can you share the best price?',
  'Interested in {model}. Would like to schedule a test drive.',
  'Hi, I am planning to buy {model}. What colors are available?',
  'Need {model} urgently. Budget is around {budget}L. Finance required.',
  'Looking for {model}. Please share EMI options and delivery time.',
  'Interested in {model}. Premium buyer, ready to close quickly.',
  'Want to buy {model}. Can you provide the best deal?',
  'Need {model} for my family. Looking for good financing options.',
  'Interested in {model}. When can I get delivery?',
  'Looking for {model}. Please share all variants and prices.'
];

const names = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
  'Anjali Mehta', 'Rohit Gupta', 'Kavita Nair', 'Suresh Iyer', 'Meera Joshi',
  'Arjun Desai', 'Divya Shah', 'Karan Malhotra', 'Pooja Agarwal', 'Ravi Verma',
  'Neha Kapoor', 'Siddharth Rao', 'Shruti Menon', 'Aditya Chawla', 'Riya Bhatia',
  'Varun Khanna', 'Tanvi Saxena', 'Nikhil Jain', 'Isha Trivedi', 'Kunal Oberoi',
  'Ananya Das', 'Rohan Bakshi', 'Sanya Mehra', 'Yash Goyal', 'Maya Krishnan'
];

const generatePhoneNumber = () => {
  const prefixes = ['98765', '98766', '98767', '98768', '98769', '98770', '98771', '98772'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `+91 ${prefix}${suffix}`;
};

const generateEmail = (name) => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  const nameParts = name.toLowerCase().split(' ');
  const username = nameParts[0] + (nameParts[1] ? nameParts[1][0] : '') + Math.floor(Math.random() * 100);
  return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const generateScore = (tier) => {
  if (tier === LeadTier.HOT) return Math.floor(85 + Math.random() * 15);
  if (tier === LeadTier.WARM) return Math.floor(55 + Math.random() * 30);
  return Math.floor(20 + Math.random() * 35);
};

const generateDummyLeads = (count = 50) => {
  const leads = [];
  const statuses = Object.values(LeadStatus);
  const tiers = Object.values(LeadTier);
  const sources = Object.values(LeadSource);
  const preferredContacts = Object.values(PreferredContact);
  
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const name = getRandomItem(names);
    const car = getRandomItem(carModels);
    const location = getRandomItem(cities);
    const areaIndex = Math.floor(Math.random() * location.areas.length);
    const tier = getRandomItem(tiers);
    const score = generateScore(tier);
    const status = getRandomItem(statuses);
    const source = getRandomItem(sources);
    const preferredContact = getRandomItem(preferredContacts);
    
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    
    const budgetMax = car.budget.max / 100000;
    const firstMessage = getRandomItem(firstMessages)
      .replace('{model}', car.model)
      .replace('{budget}', Math.floor(budgetMax));
    
    const lead = {
      name,
      email: generateEmail(name),
      phone: generatePhoneNumber(),
      source,
      sourceLeadId: `LEAD-${Date.now()}-${i}`,
      interest: {
        make: car.make,
        model: car.model,
        variant: car.variant,
        fuelType: car.fuelType,
        bodyType: car.bodyType,
        budget: { ...car.budget },
        isNew: Math.random() > 0.2,
        financeRequired: Math.random() > 0.4
      },
      firstMessage,
      preferredContact,
      location: {
        city: location.city,
        area: location.areas[areaIndex],
        pincode: location.pincodes[areaIndex]
      },
      score,
      tier,
      scoreHistory: [{
        score,
        tier,
        reason: `Initial scoring based on ${tier} tier criteria`,
        scoredAt: createdAt
      }],
      aiSignals: tier === LeadTier.HOT 
        ? ['specific model', 'clear budget', 'urgency word', 'both contacts']
        : tier === LeadTier.WARM
        ? ['model interest', 'budget range', 'single contact']
        : ['general interest', 'no urgency'],
      sentiment: tier === LeadTier.HOT ? Sentiment.POSITIVE : tier === LeadTier.WARM ? Sentiment.NEUTRAL : Sentiment.NEUTRAL,
      status,
      assignedTo: null,
      messages: [],
      drip: {
        isActive: tier === LeadTier.COLD && Math.random() > 0.5,
        sequence: tier === LeadTier.COLD ? 'cold-14day' : null,
        step: tier === LeadTier.COLD ? Math.floor(Math.random() * 4) : 0,
        nextAt: tier === LeadTier.COLD ? new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null
      },
      testDrive: {
        scheduled: status === LeadStatus.TEST_DRIVE_SCHEDULED,
        date: status === LeadStatus.TEST_DRIVE_SCHEDULED ? new Date(now.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        carAssigned: status === LeadStatus.TEST_DRIVE_SCHEDULED ? car.model : null
      },
      isDuplicate: false,
      tags: [],
      notes: [],
      lastActivity: updatedAt,
      createdAt,
      updatedAt
    };
    
    if (status === LeadStatus.AI_REPLIED || status === LeadStatus.AGENT_REPLIED) {
      lead.messages.push({
        direction: MessageDirection.INBOUND,
        channel: preferredContact === PreferredContact.WHATSAPP ? MessageChannel.WHATSAPP : MessageChannel.EMAIL,
        content: firstMessage,
        isAI: false,
        sentAt: createdAt,
        status: MessageStatus.DELIVERED
      });
      
      lead.messages.push({
        direction: MessageDirection.OUTBOUND,
        channel: preferredContact === PreferredContact.WHATSAPP ? MessageChannel.WHATSAPP : MessageChannel.EMAIL,
        content: `Hi ${name}! Thanks for your interest in ${car.model}. We'd love to help you find the perfect vehicle. Would you like to schedule a test drive?`,
        isAI: status === LeadStatus.AI_REPLIED,
        sentAt: new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000),
        status: MessageStatus.SENT
      });
    }
    
    if (status === LeadStatus.CONVERTED) {
      lead.messages.push({
        direction: MessageDirection.INBOUND,
        channel: MessageChannel.WHATSAPP,
        content: firstMessage,
        isAI: false,
        sentAt: createdAt,
        status: MessageStatus.DELIVERED
      });
      
      lead.messages.push({
        direction: MessageDirection.OUTBOUND,
        channel: MessageChannel.WHATSAPP,
        content: `Hi ${name}! Thanks for your interest in ${car.model}.`,
        isAI: true,
        sentAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        status: MessageStatus.SENT
      });
      
      lead.messages.push({
        direction: MessageDirection.INBOUND,
        channel: MessageChannel.WHATSAPP,
        content: 'Yes, I am interested. When can I get delivery?',
        isAI: false,
        sentAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
        status: MessageStatus.DELIVERED
      });
    }
    
    leads.push(lead);
  }
  
  return leads;
};

const seedDummyLeads = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('\n❌ [ERROR] MONGODB_URI is required.');
      console.error('💡 Please add MONGODB_URI to your .env file in the backend directory.\n');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    console.log('🌱 Generating dummy leads...');
    const dummyLeads = generateDummyLeads(50);
    
    console.log('💾 Inserting leads into database...');
    await Lead.insertMany(dummyLeads);
    
    const stats = {
      total: dummyLeads.length,
      hot: dummyLeads.filter(l => l.tier === LeadTier.HOT).length,
      warm: dummyLeads.filter(l => l.tier === LeadTier.WARM).length,
      cold: dummyLeads.filter(l => l.tier === LeadTier.COLD).length,
      converted: dummyLeads.filter(l => l.status === LeadStatus.CONVERTED).length,
      new: dummyLeads.filter(l => l.status === LeadStatus.NEW).length,
      aiReplied: dummyLeads.filter(l => l.status === LeadStatus.AI_REPLIED).length
    };
    
    console.log('\n✅ Dummy leads seeded successfully!');
    console.log('\n📊 Statistics:');
    console.log(`   Total Leads: ${stats.total}`);
    console.log(`   HOT: ${stats.hot} | WARM: ${stats.warm} | COLD: ${stats.cold}`);
    console.log(`   NEW: ${stats.new} | AI_REPLIED: ${stats.aiReplied} | CONVERTED: ${stats.converted}`);
    console.log('\n💡 All leads are unassigned (no agents) for testing purposes.\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDummyLeads();
