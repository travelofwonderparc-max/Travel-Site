const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // LIEN AVEC L'UTILISATEUR (Qui a commandé ?)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String }, // On garde le nom pour l'afficher vite fait côté admin
    userEmail: { type: String },

    // DÉTAILS DU VOYAGE
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    tripTitle: { type: String },
    
    // CONFIGURATION
    nbPeople: { type: Number, required: true },
    options: [String], // Liste des options choisies (ex: ["Fast Pass", "Hôtel Luxe"])
    totalPrice: { type: Number }, // Prix estimé

    // ETAT DE LA COMMANDE
    type: { type: String, enum: ['devis', 'reservation'], default: 'reservation' }, // Pro = Devis, Particulier = Resa
    status: { 
        type: String, 
        enum: ['En attente', 'Validée', 'Refusée', 'Payée'], 
        default: 'En attente' 
    },
    paymentMethod: { type: String, enum: ['CB', 'Chèque', 'Espèces', 'Virement', 'Non défini'], default: 'Non défini' },
    paymentStatus: { type: String, enum: ['Non Payé', 'Acompte versé', 'Soldé'], default: 'Non Payé' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);