const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    layanan: { type: String, required: true },
    memberCount: { type: Number, default: 0 },
});

GroupSchema.virtual('orders', {
    ref: 'Order', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'groupId', // is equal to `foreignField`
});

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group
