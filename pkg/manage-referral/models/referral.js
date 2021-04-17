const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    orderRegularIds: [{ type: 'ObjectId', ref: 'User', required: false, default: null }],
    orderHostIds: [{ type: 'ObjectId', ref: 'User', required: false, default: null }],
});

const Referral = mongoose.model('Referral', ReferralSchema);

module.exports = Referral
