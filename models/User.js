const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ... Tes champs existants (email, password, role, name, address...) ...
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'client' },
    name: { type: String, required: true },
    gender: String,
    birthDate: Date,
    address: String,
    phone: String,
    instagram: { type: String },
    emergencyContact: { name: String, phone: String },
    medicalInfo: String,
    
    company: String,
    siret: String,
    wishlist: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ScheduledTrip' 
    }],

    // --- CARNET D'ADRESSES (Enfants, Conjoint sans compte) ---
    companions: [{
        name: String,
        gender: String,
        birthDate: Date,
        relation: String
    }],

    // --- NOUVEAU : LISTE D'AMIS (Vrais comptes utilisateurs) ---
    friends: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);