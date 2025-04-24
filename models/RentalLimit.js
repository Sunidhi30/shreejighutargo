const mongoose = require('mongoose');

const rentalLimitSchema = new mongoose.Schema({
  maxRentalPrice: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('RentalLimit', rentalLimitSchema);
