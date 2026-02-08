const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,      // NOUVEAU
    paymentMethod: String, // NOUVEAU (ex: CB, Chèque, ANCV...)
    status: { type: String, default: 'Confirmé' }, // Confirmé (Admin) ou En attente (Web)
    addedAt: { type: Date, default: Date.now }
});

const scheduledTripSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    image: String, // Nom de l'image (ex: japon.jpg)
    description: String,
    dateDepart: String, // Ex: "12 Octobre 2026"
    prix: Number,
    isFeatured: { type: Boolean, default: false }, // Par défaut, ce n'est pas à la une
    // GESTION DU STOCK
    capacity: { type: Number, required: true }, // Total places (ex: 15)
    filled: { type: Number, default: 0 }, // Places prises (ex: 3)
    
    // LISTE DES GENS INSCRITS
    participants: [participantSchema], // On utilise le nouveau schéma
    status: { type: String, enum: ['Ouvert', 'Complet', 'Fermé'], default: 'Ouvert' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledTrip', scheduledTripSchema);