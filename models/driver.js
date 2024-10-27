const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  type: String,
  qty: Number
});

const TrailerInfoSchema = new mongoose.Schema({
  amount: Number,
  type: String,
  length: Number,
  def: Boolean
});

const DriverSchema = new mongoose.Schema({
  driverName: String,
  driverPhoneNumber: String,
  driverCompany: String,
  currentLocation: String,
  availableDate: String,
  driverStatus: String,
  assignedDispatcher: String,
  offers: {
    accepted: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 }
  },
    driverLog: [
    { comment: String }
  ],
  selectedEquipment: [EquipmentSchema],
  trailerInfo: [TrailerInfoSchema],
});

const NewDriver = mongoose.model('NewDriver', DriverSchema);

module.exports = NewDriver;