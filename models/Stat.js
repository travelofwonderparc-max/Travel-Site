const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
    name: { type: String, default: 'global_visits' },
    count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stat', statSchema);