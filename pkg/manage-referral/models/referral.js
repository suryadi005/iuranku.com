const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    incentive: { type: Number, default: 0 },
    totalIncentive: { type: Number, default: 0 },
    userId: { type: 'ObjectId', ref: 'User', required: true, unique: true },
    orderRegularIds: [{ type: 'ObjectId', ref: 'User', required: false, default: null }],
    orderHostIds: [{ type: 'ObjectId', ref: 'User', required: false, default: null }],
    totalPaidOrderIncentive: { type: Number, default: 0 }
});

ReferralSchema.virtual('incentiveWithdrawal', {
    ref: 'IncentiveWithdrawal', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'referralId', // is equal to `foreignField`
    justOne: true
});

const Referral = mongoose.model('Referral', ReferralSchema);

module.exports = Referral
