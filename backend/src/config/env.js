import dotenv from 'dotenv';

dotenv.config();

const validateEnv = () => {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('\n❌ [ERROR] Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\n💡 Please add these to your .env file in the backend directory.\n');
    console.error('📝 Example:');
    console.error('   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long');
    console.error('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname\n');
    process.exit(1);
  }
};

validateEnv();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  
  MONGODB_URI: process.env.MONGODB_URI,
  
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
  
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  FROM_EMAIL: process.env.FROM_EMAIL,
  
  CARDEKHO_WEBHOOK_SECRET: process.env.CARDEKHO_WEBHOOK_SECRET,
  CARWALE_WEBHOOK_SECRET: process.env.CARWALE_WEBHOOK_SECRET,
  
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
};
