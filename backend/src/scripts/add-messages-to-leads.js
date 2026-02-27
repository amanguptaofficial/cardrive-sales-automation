import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Agent from '../models/Agent.js';
import { MessageDirection, MessageChannel, MessageStatus } from '../enums/index.js';

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

const addMessagesToLeads = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('\n❌ [ERROR] MONGODB_URI is required.');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
    
    // Find the agent (Aman Gupta)
    const agent = await Agent.findOne({ 
      $or: [
        { email: 'test@gmail.com' },
        { name: { $regex: 'Aman', $options: 'i' } }
      ]
    });
    
    if (!agent) {
      console.error('❌ Agent not found.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`👤 Found agent: ${agent.name} (${agent.email})\n`);
    
    // Get leads assigned to this agent
    const assignedLeads = await Lead.find({ assignedTo: agent._id }).limit(15);
    
    if (assignedLeads.length === 0) {
      console.log('❌ No leads assigned to this agent.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`📋 Found ${assignedLeads.length} assigned leads. Adding messages...\n`);
    
    const now = new Date();
    let messagesAdded = 0;
    
    for (let i = 0; i < assignedLeads.length; i++) {
      const lead = assignedLeads[i];
      
      // Skip if already has messages
      if (lead.messages && lead.messages.length > 0) {
        continue;
      }
      
      // Calculate response time (within 1-4 hours of lead creation)
      const hoursAgo = 1 + (i % 3); // 1-3 hours
      const responseTime = hoursAgo * 60 * 60 * 1000; // Convert to milliseconds
      const sentAt = new Date(lead.createdAt.getTime() + responseTime);
      
      // Make sure sentAt is in the past
      if (sentAt > now) {
        sentAt.setTime(now.getTime() - (Math.random() * 2 * 60 * 60 * 1000)); // Random time in last 2 hours
      }
      
      const messages = [
        {
          direction: MessageDirection.OUTBOUND,
          channel: MessageChannel.WHATSAPP,
          content: `Hi ${lead.name}! Thanks for your interest in ${lead.interest?.make || 'our vehicles'}. I'd love to help you find the perfect car. When would be a good time to discuss your requirements?`,
          isAI: false,
          sentBy: agent._id,
          sentAt: sentAt,
          status: MessageStatus.SENT
        }
      ];
      
      // Add a follow-up message for some leads (50% chance)
      if (i % 2 === 0 && sentAt < now) {
        const followUpTime = new Date(sentAt.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
        if (followUpTime < now) {
          messages.push({
            direction: MessageDirection.OUTBOUND,
            channel: MessageChannel.WHATSAPP,
            content: `Just following up on my previous message. Are you still interested? I can arrange a test drive at your convenience.`,
            isAI: false,
            sentBy: agent._id,
            sentAt: followUpTime,
            status: MessageStatus.SENT
          });
        }
      }
      
      lead.messages = messages;
      lead.lastActivity = sentAt;
      await lead.save();
      messagesAdded++;
    }
    
    console.log(`✅ Successfully added messages to ${messagesAdded} leads`);
    console.log(`   - Response times: 1-3 hours after lead creation`);
    console.log(`   - Messages spread across last 7 days\n`);
    
    // Convert some leads (about 20%)
    const leadsToConvert = assignedLeads.slice(0, Math.floor(assignedLeads.length * 0.2));
    for (const lead of leadsToConvert) {
      if (lead.status !== 'converted') {
        lead.status = 'converted';
        lead.updatedAt = new Date(lead.createdAt.getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000)); // Within 5 days
        await lead.save();
      }
    }
    
    console.log(`✅ Converted ${leadsToConvert.length} leads\n`);
    
    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

addMessagesToLeads();
