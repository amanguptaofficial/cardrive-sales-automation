import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Agent from '../models/Agent.js';

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

const assignLeadsToAgent = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('\n❌ [ERROR] MONGODB_URI is required.');
      console.error('💡 Please add MONGODB_URI to your .env file in the backend directory.\n');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
    
    // Find the agent (Aman Gupta)
    const agentEmail = process.argv[2] || 'aman@cardrive.in'; // Default or from command line
    const agent = await Agent.findOne({ 
      $or: [
        { email: agentEmail },
        { name: { $regex: 'Aman', $options: 'i' } }
      ]
    });
    
    if (!agent) {
      console.error('❌ Agent not found. Please provide agent email or name.');
      console.log('\nAvailable agents:');
      const allAgents = await Agent.find({}).select('name email _id');
      allAgents.forEach(a => console.log(`   - ${a.name} (${a.email}) - ID: ${a._id}`));
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`👤 Found agent: ${agent.name} (${agent.email})`);
    console.log(`   Agent ID: ${agent._id}\n`);
    
    // Find unassigned leads
    const unassignedLeads = await Lead.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).limit(20); // Assign first 20 unassigned leads
    
    if (unassignedLeads.length === 0) {
      console.log('ℹ️  No unassigned leads found. Checking all leads...\n');
      
      // Get all leads and assign some to this agent
      const allLeads = await Lead.find({}).limit(20);
      
      if (allLeads.length === 0) {
        console.log('❌ No leads found in database.');
        await mongoose.connection.close();
        process.exit(1);
      }
      
      console.log(`📋 Found ${allLeads.length} leads. Assigning to agent...\n`);
      
      // Assign leads with different dates to show in different periods
      const now = new Date();
      const updates = allLeads.map((lead, index) => {
        // Spread leads across last 7 days
        const daysAgo = index % 7;
        const assignedDate = new Date(now);
        assignedDate.setDate(assignedDate.getDate() - daysAgo);
        assignedDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0);
        
        return {
          updateOne: {
            filter: { _id: lead._id },
            update: {
              $set: {
                assignedTo: agent._id,
                updatedAt: assignedDate,
                lastActivity: assignedDate
              }
            }
          }
        };
      });
      
      await Lead.bulkWrite(updates);
      
      console.log(`✅ Successfully assigned ${allLeads.length} leads to ${agent.name}`);
      console.log(`   - Leads spread across last 7 days`);
      console.log(`   - Updated timestamps to show activity\n`);
      
    } else {
      console.log(`📋 Found ${unassignedLeads.length} unassigned leads. Assigning to agent...\n`);
      
      // Assign leads with different dates
      const now = new Date();
      const updates = unassignedLeads.map((lead, index) => {
        // Spread leads across last 7 days
        const daysAgo = index % 7;
        const assignedDate = new Date(now);
        assignedDate.setDate(assignedDate.getDate() - daysAgo);
        assignedDate.setHours(Math.floor(Math.random() * 12) + 9, Math.floor(Math.random() * 60), 0, 0);
        
        return {
          updateOne: {
            filter: { _id: lead._id },
            update: {
              $set: {
                assignedTo: agent._id,
                updatedAt: assignedDate,
                lastActivity: assignedDate
              }
            }
          }
        };
      });
      
      await Lead.bulkWrite(updates);
      
      console.log(`✅ Successfully assigned ${unassignedLeads.length} leads to ${agent.name}`);
      console.log(`   - Leads spread across last 7 days`);
      console.log(`   - Updated timestamps to show activity\n`);
    }
    
    // Verify assignment
    const assignedCount = await Lead.countDocuments({ assignedTo: agent._id });
    console.log(`📊 Total leads now assigned to ${agent.name}: ${assignedCount}\n`);
    
    await mongoose.connection.close();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

assignLeadsToAgent();
