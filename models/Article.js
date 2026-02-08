const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Titre (ex: "Tout savoir sur Disney 2026")
    image: { type: String, required: true }, // Image de couverture
    content: { type: String, required: true }, // Le texte de l'article
    author: { type: String, default: "Travel of Wonder" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);