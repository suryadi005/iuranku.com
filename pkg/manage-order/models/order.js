const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    typeMember:{type: String, required: true},
    namaDepan: { type: String, required: true },
    namaBelakang: { type: String, required: true },
    email: { type: String, required: true },
    noHp: { type: String, required: true },
    layanan: { type: String, required: true },
    groupId: { type: 'ObjectId', ref: 'Group', required: false, default: null },
    createdAt: { type: Date, default: Date.now},
    status: { 
        type: String, 
        enum: [
            'menunggu_pembayaran',
            'menunggu_anggota',
            'active',
        ],
        default: 'menunggu_pembayaran',
    }
});

OrderSchema.index({ groupId: 1, email: 1, noHp: 1 }, { unique: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order
