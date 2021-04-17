const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    namaDepan: { type: String, required: true },
    namaBelakang: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    noHp: { type: String, required: true,  unique: true},
    createdAt: { type: Date, default: Date.now},
});

const user = mongoose.model('user', userSchema);

module.exports = user
