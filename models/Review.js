const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduledTrip', required: true }, // Le voyage concerné
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // L'auteur
    userName: { type: String, required: true }, // Nom affiché (pour éviter de chercher l'user à chaque fois)
    rating: { type: Number, required: true, min: 1, max: 5 }, // Note de 1 à 5
    comment: { type: String, required: true }, // Le texte
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);