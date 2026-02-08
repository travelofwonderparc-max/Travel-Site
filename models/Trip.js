const mongoose = require('mongoose');




const tripSchema = new mongoose.Schema({
    titre: { type: String, required: true },
    description: { type: String, required: true }, // Description courte pour l'accueil
    img: { type: String, required: true },
    prixBase: { type: Number, required: true },
    vues: { type: Number, default: 0 }, 
    // NOUVEAUX CHAMPS DÉTAILLÉS
    details: { type: String }, // Texte long de présentation
    programme: [String],       // Liste des points forts / étapes
    inclus: [String],          // Ce qui est compris (Vol, Hotel...)
    
    options: [
        {
            nom: String,
            prix: Number,
            type: { type: String, enum: ['par_personne', 'forfait'], default: 'par_personne' } 
        }
    ]
});

module.exports = mongoose.model('Trip', tripSchema);