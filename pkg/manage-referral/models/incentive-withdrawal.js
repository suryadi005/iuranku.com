const mongoose = require('mongoose');

const IncentiveWithdrawalSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: [
        'diproses',
        'berhasil',
        'ditolak',
    ],
    default: 'diproses',
  },
  referralId: { type: 'ObjectId', ref: 'Referral', required: true },
  updatedBy: { type: 'ObjectId', ref: 'User', default: null },
  updatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now},
});

IncentiveWithdrawalSchema.index({ referralId: 1, updatedBy: 1 }, { unique: true });

const IncentiveWithdrawal = mongoose.model('IncentiveWithdrawal', IncentiveWithdrawalSchema);

module.exports = IncentiveWithdrawal
