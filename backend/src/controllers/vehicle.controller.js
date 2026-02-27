import Vehicle from '../models/Vehicle.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export const getVehicles = asyncHandler(async (req, res) => {
  const { search, status, make, model, page = 1, limit = 20 } = req.query;
  
  const query = {};
  
  if (search) {
    query.$or = [
      { make: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { variant: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { chassisNumber: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }
  
  if (make) {
    query.make = { $regex: make, $options: 'i' };
  }
  
  if (model) {
    query.model = { $regex: model, $options: 'i' };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const vehicles = await Vehicle.find(query)
    .populate('addedBy', 'name email')
    .populate('soldTo', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Vehicle.countDocuments(query);
  
  res.json({
    success: true,
    data: vehicles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('addedBy', 'name email')
    .populate('soldTo', 'name phone email');
  
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  
  res.json({
    success: true,
    data: vehicle
  });
});

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicleData = {
    ...req.body,
    addedBy: req.agent._id
  };
  
  const vehicle = await Vehicle.create(vehicleData);
  
  res.status(201).json({
    success: true,
    data: vehicle
  });
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  
  Object.assign(vehicle, req.body);
  await vehicle.save();
  
  res.json({
    success: true,
    data: vehicle
  });
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  
  if (!vehicle) {
    throw new AppError('Vehicle not found', 404);
  }
  
  await vehicle.deleteOne();
  
  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

export const getVehicleStats = asyncHandler(async (req, res) => {
  const total = await Vehicle.countDocuments();
  const available = await Vehicle.countDocuments({ status: 'available' });
  const reserved = await Vehicle.countDocuments({ status: 'reserved' });
  const sold = await Vehicle.countDocuments({ status: 'sold' });
  const service = await Vehicle.countDocuments({ status: 'service' });
  
  const totalValue = await Vehicle.aggregate([
    { $match: { status: { $ne: 'sold' } } },
    { $group: { _id: null, total: { $sum: '$price' } } }
  ]);
  
  const totalValueAmount = totalValue.length > 0 ? totalValue[0].total : 0;
  
  res.json({
    success: true,
    data: {
      total,
      available,
      reserved,
      sold,
      service,
      totalValue: totalValueAmount
    }
  });
});
