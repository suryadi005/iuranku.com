const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    layanan: { type: String, required: true },
    memberCount: { type: Number, default: 0 },
});

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group
