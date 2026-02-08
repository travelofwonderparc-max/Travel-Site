const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // MODIFICATION 1 : on enlève "required: true" pour userId
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScheduledTrip' },
    userName: String,
    userEmail: String,
    tripId: String,
    tripTitle: String,
    
    // C'est requis, donc on devra le fournir dans le formulaire
    nbPeople: { type: Number, required: true }, 
    
    totalPrice: Number,
    options: [String],
    customMessage: String,
    type: { type: String, enum: ['devis', 'reservation'], default: 'reservation' },
    
    // MODIFICATION 2 : On ajoute 'Terminée' dans la liste
    status: { 
        type: String, 
        enum: ['En attente', 'Validée', 'Refusée', 'Payée', 'Terminée'], 
        default: 'En attente' 
    },
    
    paymentMethod: { type: String, default: 'Non défini' },
    paymentStatus: { type: String, default: 'Non Payé' },
    reservationNumber: { type: String, unique: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);