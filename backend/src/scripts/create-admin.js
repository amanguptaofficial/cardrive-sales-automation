import bcrypt from 'bcrypt';
import Agent from '../models/Agent.js';
import { connectDB } from '../config/database.js';

const createAdmin = async () => {
  try {
    await connectDB();
    console.log('🌱 Creating admin user...');
    
    const email = 'rahul@cardrive.in';
    const existingAdmin = await Agent.findOne({ email });
    
    if (existingAdmin) {
      existingAdmin.isVerified = true;
      existingAdmin.isActive = true;
      existingAdmin.role = 'manager';
      existingAdmin.password = await bcrypt.hash('password123', 10);
      await existingAdmin.save();
      console.log('✅ Admin user updated and verified!');
    } else {
      const admin = await Agent.create({
        name: 'Rahul Kapoor',
        email: email,
        password: await bcrypt.hash('password123', 10),
        phone: '+91 9876543210',
        role: 'manager',
        isVerified: true,
        isActive: true,
        stats: {
          totalLeads: 0,
          responded: 0,
          qualified: 0,
          closed: 0,
          revenue: 0
        }
      });
      console.log('✅ Admin user created and verified!');
    }
    
    console.log('📧 Email:', email);
    console.log('🔑 Password: password123');
    console.log('✅ You can now login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
};

createAdmin();
