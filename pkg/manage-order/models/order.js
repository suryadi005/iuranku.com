const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    nameDepan: { type: String, required: true },
    nameBelakang: { type: String, required: true },
    email: { type: String, required: true },
    noHp: { type: String, required: true },
    layanan: { type: String, required: true },
    groupId: { type: 'ObjectId', ref: 'Group', required: true },
});

OrderSchema.index({ groupId: 1, email: 1, noHp: 1 }, { unique: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order
