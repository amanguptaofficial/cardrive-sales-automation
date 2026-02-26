import twilio from 'twilio';
import { Resend } from 'resend';
import { MessageChannel, MessageStatus } from '../enums/index.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
const resend = new Resend(env.RESEND_API_KEY);

const cleanPhoneNumber = (phone) => {
  if (!phone) return null;
  
  let cleaned = phone.toString().trim();
  
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }
  
  cleaned = cleaned.replace(/[^\d+]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+91' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  const digitsOnly = cleaned.replace('+', '');
  if (digitsOnly.length < 10) {
    throw new Error(`Invalid phone number format: ${phone}. Phone number must have at least 10 digits.`);
  }
  
  return cleaned;
};

export const sendWhatsApp = async (to, message) => {
  try {
    if (!env.TWILIO_WHATSAPP_FROM) {
      const errorMsg = 'TWILIO_WHATSAPP_FROM is not configured. Please set it in your .env file. Example: TWILIO_WHATSAPP_FROM=whatsapp:+14155238886';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    let fromNumber = env.TWILIO_WHATSAPP_FROM.trim();
    if (!fromNumber.startsWith('whatsapp:')) {
      fromNumber = `whatsapp:${fromNumber}`;
    }
    
    logger.info(`Using Twilio WhatsApp sender: ${fromNumber}`);
    
    const cleanedToNumber = cleanPhoneNumber(to);
    if (!cleanedToNumber) {
      throw new Error(`Invalid recipient phone number: ${to}`);
    }
    
    const toNumber = `whatsapp:${cleanedToNumber}`;
    
    logger.info(`Sending WhatsApp from ${fromNumber} to ${toNumber}`);
    
    const result = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });
    return { success: true, sid: result.sid, status: MessageStatus.SENT };
  } catch (error) {
    logger.error('WhatsApp send error:', error);
    
    if (error.code === 63007) {
      const errorMsg = `Twilio WhatsApp sender not found. Current value: ${env.TWILIO_WHATSAPP_FROM || 'NOT SET'}. ` +
        `Please verify: 1) Your TWILIO_WHATSAPP_FROM is set to a valid Twilio WhatsApp number (e.g., whatsapp:+14155238886 for sandbox), ` +
        `2) You have joined the Twilio WhatsApp sandbox or have a verified WhatsApp Business number, ` +
        `3) The number format is correct: whatsapp:+[country code][number]. ` +
        `For sandbox setup, go to Twilio Console > Messaging > Try it out > Send a WhatsApp message and join the sandbox.`;
      return { 
        success: false, 
        error: errorMsg,
        status: MessageStatus.FAILED 
      };
    }
    
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      const errorMsg = `Twilio API error (${error.code || error.status}): ${error.message}. ` +
        `Please check your Twilio credentials and WhatsApp sender configuration.`;
      return { 
        success: false, 
        error: errorMsg,
        status: MessageStatus.FAILED 
      };
    }
    
    return { success: false, error: error.message, status: MessageStatus.FAILED };
  }
};

export const sendEmail = async (to, subject, html) => {
  try {
    const result = await resend.emails.send({
      from: env.FROM_EMAIL,
      to,
      subject,
      html
    });
    return { success: true, id: result.id, status: MessageStatus.SENT };
  } catch (error) {
    logger.error('Email send error:', error);
    return { success: false, error: error.message, status: MessageStatus.FAILED };
  }
};

export const sendSMS = async (to, message) => {
  try {
    let fromNumber = env.TWILIO_WHATSAPP_FROM || env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('TWILIO_WHATSAPP_FROM or TWILIO_PHONE_NUMBER is not configured.');
    }
    
    if (fromNumber.startsWith('whatsapp:')) {
      fromNumber = fromNumber.replace('whatsapp:', '');
    }
    
    const toNumber = cleanPhoneNumber(to);
    if (!toNumber) {
      throw new Error(`Invalid recipient phone number: ${to}`);
    }
    
    logger.info(`Sending SMS from ${fromNumber} to ${toNumber}`);
    
    const result = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });
    return { success: true, sid: result.sid, status: MessageStatus.SENT };
  } catch (error) {
    logger.error('SMS send error:', error);
    return { success: false, error: error.message, status: MessageStatus.FAILED };
  }
};

export const sendMessage = async (channel, to, content, subject = null) => {
  try {
    switch (channel) {
      case MessageChannel.WHATSAPP:
        const whatsappResult = await sendWhatsApp(to, content);
        if (!whatsappResult.success) {
          const error = new Error(whatsappResult.error || 'WhatsApp send failed');
          error.status = whatsappResult.status;
          throw error;
        }
        return whatsappResult;
      case MessageChannel.EMAIL:
        const emailHtml = `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</div>`;
        const emailResult = await sendEmail(to, subject || 'CarDrive Motors - Inquiry', emailHtml);
        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Email send failed');
        }
        return emailResult;
      case MessageChannel.SMS:
        const smsResult = await sendSMS(to, content);
        if (!smsResult.success) {
          throw new Error(smsResult.error || 'SMS send failed');
        }
        return smsResult;
      default:
        throw new Error('Invalid channel');
    }
  } catch (error) {
    logger.error(`Send message error for ${channel}:`, error);
    throw error;
  }
};
