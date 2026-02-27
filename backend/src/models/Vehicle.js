import mongoose from 'mongoose';
import { FuelType } from '../enums/index.js';

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  variant: { type: String, required: true },
  year: { type: Number, required: true },
  fuelType: {
    type: String,
    enum: Object.values(FuelType),
    required: true
  },
  bodyType: { type: String, required: true },
  color: { type: String, required: true },
  registrationNumber: { type: String, unique: true, sparse: true },
  chassisNumber: { type: String, unique: true, sparse: true },
  engineNumber: String,
  mileage: { type: Number, default: 0 }, // in km
  price: { type: Number, required: true },
  sellingPrice: Number, // Final selling price
  status: {
    type: String,
    enum: ['available', 'reserved', 'sold', 'service'],
    default: 'available'
  },
  location: {
    city: String,
    showroom: String,
    address: String
  },
  images: [String], // URLs to vehicle images
  features: [String], // Array of feature names
  description: String,
  notes: String,
  purchaseDate: Date,
  purchasePrice: Number,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }, // Reference to lead if sold
  soldDate: Date,
  isNew: { type: Boolean, default: true },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },
  documents: [{
    type: { type: String }, // RC, Insurance, PUC, etc.
    documentNumber: String,
    expiryDate: Date,
    fileUrl: String
  }]
}, {
  timestamps: true
});

vehicleSchema.index({ make: 1, model: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ chassisNumber: 1 });

export default mongoose.model('Vehicle', vehicleSchema);
