const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userEmail: String,
  text: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now } 
});

const TransactionModel = mongoose.model("transactions", TransactionSchema);

module.exports = TransactionModel;
