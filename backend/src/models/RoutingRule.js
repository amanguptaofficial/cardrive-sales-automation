import mongoose from 'mongoose';
import {
  RoutingConditionField,
  RoutingConditionOperator,
  RoutingActionType,
  RoutingAssignTo
} from '../enums/index.js';

const conditionSchema = new mongoose.Schema({
  field: { type: String, enum: Object.values(RoutingConditionField), required: true },
  operator: { type: String, enum: Object.values(RoutingConditionOperator), required: true },
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

const actionSchema = new mongoose.Schema({
  type: { type: String, enum: Object.values(RoutingActionType), required: true },
  assignTo: { type: String, enum: Object.values(RoutingAssignTo) },
  dripSequence: String
}, { _id: false });

const routingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  condition: conditionSchema,
  action: actionSchema,
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
}, {
  timestamps: true
});

routingRuleSchema.index({ priority: -1, isActive: 1 });

export default mongoose.model('RoutingRule', routingRuleSchema);
