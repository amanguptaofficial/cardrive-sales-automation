import Lead from '../models/Lead.js';
import { scoreQueue } from '../queues/index.js';
import { processLeadScoring } from '../services/lead-processing.service.js';
import { getIO } from '../socket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { LeadSource } from '../enums/index.js';
import { logger } from '../utils/logger.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

export const uploadCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('CSV file is required', 400);
  }

  const leads = [];
  const errors = [];
  let rowNumber = 0;

  return new Promise((resolve, reject) => {
    const stream = Readable.from(req.file.buffer.toString());
    const leadPromises = [];
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        const processRow = async () => {
          try {
            if (!row.name || !row.phone) {
              errors.push({ row: rowNumber, error: 'Name and phone are required' });
              return;
            }

            const fuelType = row.fuelType?.trim();
            const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
            const sanitizedFuelType = fuelType && validFuelTypes.includes(fuelType.toLowerCase()) 
              ? fuelType.toLowerCase() 
              : null;

            const leadData = {
              name: row.name.trim(),
              email: row.email?.toLowerCase().trim() || null,
              phone: row.phone.trim(),
              source: row.source || LeadSource.MANUAL,
              interest: {
                make: row.make?.trim() || null,
                model: row.model?.trim() || null,
                variant: row.variant?.trim() || null,
                fuelType: sanitizedFuelType,
                bodyType: row.bodyType?.trim() || null,
                budget: {
                  min: row.budgetMin ? parseInt(row.budgetMin) : null,
                  max: row.budgetMax ? parseInt(row.budgetMax) : null
                },
                isNew: row.isNew?.toLowerCase() === 'true' || row.isNew === '1',
                financeRequired: row.financeRequired?.toLowerCase() === 'true' || row.financeRequired === '1'
              },
              firstMessage: row.message?.trim() || null,
              preferredContact: row.preferredContact?.toLowerCase() || 'whatsapp',
              location: {
                city: row.city?.trim() || null,
                area: row.area?.trim() || null,
                pincode: row.pincode?.trim() || null
              }
            };

          const lead = await Lead.create(leadData);
          leads.push(lead);

          if (scoreQueue) {
            await scoreQueue.add('score-lead', { leadId: lead._id.toString() });
          } else {
            processLeadScoring(lead._id.toString()).catch(err => {
              logger.error(`Error processing CSV lead ${lead._id} directly:`, err);
            });
          }

          const io = getIO();
          if (io) {
            io.emit('lead:new', {
              id: lead._id.toString(),
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              preferredContact: lead.preferredContact,
              interest: lead.interest,
              score: lead.score,
              tier: lead.tier,
              status: lead.status,
              createdAt: lead.createdAt
            });
          }
          } catch (error) {
            errors.push({ row: rowNumber, error: error.message });
          }
        };
        leadPromises.push(processRow());
      })
      .on('end', async () => {
        try {
          await Promise.all(leadPromises);
          resolve({
            success: true,
            message: `Processed ${leads.length} leads successfully`,
            data: {
              imported: leads.length,
              errors: errors.length,
              errorDetails: errors
            }
          });
        } catch (error) {
          reject(new AppError(`CSV processing error: ${error.message}`, 500));
        }
      })
      .on('error', (error) => {
        reject(new AppError(`CSV parsing error: ${error.message}`, 400));
      });
  }).then((result) => {
    res.json(result);
  }).catch((error) => {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`CSV processing error: ${error.message}`, 500);
  });
});

export const downloadTemplate = asyncHandler(async (req, res) => {
  const csvTemplate = `name,email,phone,source,make,model,variant,fuelType,bodyType,budgetMin,budgetMax,isNew,financeRequired,message,preferredContact,city,area,pincode
John Doe,john@example.com,+91 9876543210,manual,Toyota,Fortuner,4x4 AT,diesel,SUV,3000000,3500000,true,true,Interested in Fortuner,whatsapp,Mumbai,Andheri,400053
Jane Smith,jane@example.com,+91 9876543211,website,Hyundai,Creta,SX(O),petrol,SUV,1500000,1800000,true,false,Looking for Creta 2024,whatsapp,Delhi,Gurgaon,122001`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads_template.csv');
  res.send(csvTemplate);
});
