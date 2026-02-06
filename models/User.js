const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    
    role: { 
        type: String, 
        enum: ['particulier', 'pro', 'admin'], 
        default: 'particulier' 
    },

    // --- NOUVEAU : VALIDATION ---
    isValidated: { 
        type: Boolean, 
        default: false // Par sécurité, faux par défaut (on gérera la logique dans server.js)
    },

    company: { type: String },
    siret: { type: String },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);