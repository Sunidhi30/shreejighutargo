const mongoose = require('mongoose');

const producerSchema = new mongoose.Schema({
  user_name: { type: String, required: true },
  full_name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // hidden by default
  mobile_number: { type: String },
  image: { type: String },
  status: { type: Number, default: 1 }
}, {
  collection: 'tbl_producer',
  timestamps: true
});

// Optional: for authentication, you might add bcrypt hashing here
const Producer = mongoose.model('Producer', producerSchema);

module.exports = Producer;
