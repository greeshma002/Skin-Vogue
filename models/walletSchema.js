const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'collecion_1',

  },
  balance: {
    type: Number,
    default: 0,
  },
  // amount: {
  //   type: Number,
  //   required: true,
  // },
  // type: {
  //   type: String,
  //   enum: ['deposit', 'withdrawal'],
  //   required: true,
  // },
  // description: String,
  // createdAt: {
  //   type: Date,
  //   default: Date.now,
 // },
});

module.exports = mongoose.model('Wallet', walletSchema);
