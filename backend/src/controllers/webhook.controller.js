import crypto from 'crypto';
import Lead from '../models/Lead.js';
import { scoreQueue } from '../queues/index.js';
import { getIO } from '../socket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { LeadSource } from '../enums/index.js';
import { env } from '../config/env.js';

export const websiteWebhook = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    carModel,
    carMake,
    budget,
    message,
    location
  } = req.body;

  if (!name || !phone) {
    throw new AppError('Name and phone are required', 400);
  }

  const [make, model] = carModel ? carModel.split(' ') : [null, null];

  const lead = await Lead.create({
    name,
    email: email?.toLowerCase(),
    phone,
    source: LeadSource.WEBSITE,
    interest: {
      make: carMake || make,
      model: model || carModel,
      budget: budget ? {
        min: budget.min || null,
        max: budget.max || null
      } : null
    },
    firstMessage: message,
    location: location ? {
      city: location.city,
      area: location.area,
      pincode: location.pincode
    } : null,
    preferredContact: 'whatsapp'
  });

  if (scoreQueue) {
    await scoreQueue.add('score-lead', { leadId: lead._id.toString() });
  }

  const io = getIO();
  if (io) {
    io.emit('lead:new', {
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      interest: lead.interest,
      score: lead.score,
      tier: lead.tier,
      status: lead.status,
      createdAt: lead.createdAt
    });
  }

  res.status(201).json({
    success: true,
    message: 'Lead created successfully'
  });
});

export const cardekhoWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-cardekho-signature'];
  const secret = env.CARDEKHO_WEBHOOK_SECRET;

  if (secret) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    
    if (signature !== digest) {
      throw new AppError('Invalid signature', 401);
    }
  }

  const {
    lead_id,
    name,
    email,
    phone,
    car_make,
    car_model,
    car_variant,
    budget_min,
    budget_max,
    message,
    city,
    pincode
  } = req.body;

  const lead = await Lead.create({
    name,
    email: email?.toLowerCase(),
    phone,
    source: LeadSource.CARDEKHO,
    sourceLeadId: lead_id,
    interest: {
      make: car_make,
      model: car_model,
      variant: car_variant,
      budget: {
        min: budget_min || null,
        max: budget_max || null
      }
    },
    firstMessage: message,
    location: {
      city,
      pincode
    },
    preferredContact: 'whatsapp'
  });

  if (scoreQueue) {
    await scoreQueue.add('score-lead', { leadId: lead._id.toString() });
  }

  const io = getIO();
  if (io) {
    io.emit('lead:new', {
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      interest: lead.interest,
      score: lead.score,
      tier: lead.tier,
      status: lead.status,
      createdAt: lead.createdAt
    });
  }

  res.status(201).json({
    success: true,
    message: 'Lead created successfully'
  });
});

export const carwaleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-carwale-signature'];
  const secret = env.CARWALE_WEBHOOK_SECRET;

  if (secret) {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
    
    if (signature !== digest) {
      throw new AppError('Invalid signature', 401);
    }
  }

  const {
    lead_id,
    name,
    email,
    phone,
    car_make,
    car_model,
    car_variant,
    budget_min,
    budget_max,
    message,
    city,
    pincode
  } = req.body;

  const lead = await Lead.create({
    name,
    email: email?.toLowerCase(),
    phone,
    source: LeadSource.CARWALE,
    sourceLeadId: lead_id,
    interest: {
      make: car_make,
      model: car_model,
      variant: car_variant,
      budget: {
        min: budget_min || null,
        max: budget_max || null
      }
    },
    firstMessage: message,
    location: {
      city,
      pincode
    },
    preferredContact: 'whatsapp'
  });

  if (scoreQueue) {
    await scoreQueue.add('score-lead', { leadId: lead._id.toString() });
  }

  const io = getIO();
  if (io) {
    io.emit('lead:new', {
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      interest: lead.interest,
      score: lead.score,
      tier: lead.tier,
      status: lead.status,
      createdAt: lead.createdAt
    });
  }

  res.status(201).json({
    success: true,
    message: 'Lead created successfully'
  });
});
