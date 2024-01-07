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
  history: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String, // 'credit' or 'debit'
        required: true,
      },
    },
  ],
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
});

module.exports = mongoose.model('Wallet', walletSchema);

