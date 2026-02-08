require('dotenv').config(); // Charge le fichier .env
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose'); // L'outil pour MongoDB
// ... les autres require ...
const User = require('./models/User'); // Importe ton modèle
const bcrypt = require('bcryptjs'); // Importe le crypteur
const session = require('express-session');
const flash = require('connect-flash');
const Trip = require('./models/Trip');
const Order = require('./models/Order');
const ScheduledTrip = require('./models/ScheduledTrip');
const Stat = require('./models/Stat');
const Article = require('./models/Article');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const Review = require('./models/Review');

// CONFIGURATION DE LA BOÎTE MAIL
// Remplacer par tes vraies infos
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'travel.of.wonderparc@gmail.com', // ⚠️ METS TON ADRESSE ICI
        pass: 'akes gvao iuqx kpcg' // ⚠️ VOIR NOTE EN BAS
    }
});

// FONCTION POUR ENVOYER UN MAIL
async function sendEmail(to, subject, htmlContent) {
    try {
        await transporter.sendMail({
            from: '"Travel of Wonder ✈️" <travel.of.wonderparc@gmail.com>',
            to: to,
            subject: subject,
            html: htmlContent
        });
        console.log(`Email envoyé à ${to}`);
    } catch (error) {
        console.error("Erreur envoi email:", error);
    }
}
// --- CONNEXION BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connecté à MongoDB avec succès !'))
    .catch((err) => console.error('❌ Erreur de connexion MongoDB :', err));

// --- CONFIGURATION ---
app.use(express.urlencoded({ extended: true })); // Pour lire les formulaires (login/register)
app.use(express.json()); // Pour lire le JSON

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ... La suite du code (const voyages = ...) ne change pas
app.use(session({
    secret: 'travelofwonder_secret_key', // Une phrase secrète pour signer les cookies
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // La session dure 24h
}));
app.use(flash());
// --- ROUTE DE MISE À JOUR COMPLETE DU CATALOGUE ---
app.get('/setup-voyages', async (req, res) => {
    const listeVoyages = [
        // ==========================================
        // 1. COTE OUEST USA (Le Road Trip)
        // ==========================================
        { 
            titre: "USA - Road Trip Côte Ouest Légendaire", 
            prixBase: 2400, // Prix estimé pour le package de base
            img: "california.avif", 
            description: "Séjour Unique Road Trip Sur la Cote Ouest des USA ! Au programme : 2 jours Visite de Los Angeles (devenez une star à Hollywood) + Hôtel Hollywood. 1 jour Universal Studio (Harry Potter, Mario...), 1 jour Six Flags Magic Mountain (20 montagnes russes !), 2 jours au tout premier Disneyland avec Hôtel Pixar (Cars Land, Galaxy's Edge, Avengers Campus). Ensuite route pour la démesure avec 2 jours à Las Vegas. 1 jour Grand Canyon, 1 jour Monument Valley et Antelope Canyon. Nuit au cœur d'un parc Naturel. Arrêt à Death Valley avant le retour. Vol compris depuis Marseille.", 
            options: [
                {nom: "Universal Studios Hollywood (Option)", prix: 110},
                {nom: "Six Flags Magic Mountain (Option)", prix: 70},
                {nom: "Disneyland Resort (2j + Hôtel Pixar)", prix: 400},
                {nom: "Musée Petersen Automotive", prix: 25},
                {nom: "Chambre Supérieure Las Vegas (Vue Strip)", prix: 50, type: 'forfait'},
                {nom: "Bagage en soute", prix: 140}
            ] 
        },

        // ==========================================
        // 2. FLORIDE - FORMULE 1 (10 Jours)
        // ==========================================
        { 
            titre: "Floride - Magie Disney (10 Jours)", 
            prixBase: 3400, 
            img: "floride.webp", 
            description: "Séjour Walt Disney World Ultime. 8 jours d'accès aux 4 parcs (Magic Kingdom, Epcot, Hollywood Studios, Animal Kingdom). Transport Avion + Hôtel inclus. Durée totale du séjour : 10 jours.", 
            options: [
                {nom: "Formule Repas Standard (10j)", prix: 400},
                {nom: "Formule Repas + (10j)", prix: 700},
                {nom: "Chambre Supérieure", prix: 100, type: 'forfait'},
                {nom: "Hôtel Supérieur", prix: 300, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 3. FLORIDE - FORMULE 2 (13 Jours)
        // ==========================================
        { 
            titre: "Floride - Duo Disney & Universal (13 Jours)", 
            prixBase: 3600, 
            img: "wdwuniversal.avif", 
            description: "Le combo parfait. Séjour Walt Disney World (8 jours / 4 parcs) + Universal Orlando Resort (3 jours / 3 parcs). Transport Avion + Hôtel inclus. Durée totale du séjour : 13 jours.", 
            options: [
                {nom: "Formule Repas Standard (13j)", prix: 500},
                {nom: "Formule Repas + (13j)", prix: 900},
                {nom: "Chambre Supérieure", prix: 100, type: 'forfait'},
                {nom: "Hôtel Supérieur", prix: 300, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 4. FLORIDE - FORMULE 3 (18 Jours - L'Ultime)
        // ==========================================
        { 
            titre: "Floride - L'Expérience Totale (18 Jours)", 
            prixBase: 5000, 
            img: "wdwuniversal.avif", 
            description: "Pour ceux qui veulent tout voir sans compromis. Disney World (10 jours / 6 parcs incluant aquatiques) + Universal Orlando (6 jours / 3 parcs). Transport Avion + Hôtel inclus. Durée totale du séjour : 18 jours.", 
            options: [
                {nom: "Formule Repas Standard (18j)", prix: 700},
                {nom: "Formule Repas + (18j)", prix: 1100},
                {nom: "Chambre Supérieure", prix: 100, type: 'forfait'},
                {nom: "Hôtel Supérieur", prix: 300, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 5. PARIS
        // ==========================================
        { 
            titre: "Paris - Magie Européenne", 
            prixBase: 250, 
            img: "paris.jpg", 
            description: "Séjour de base : 2 jours aux 2 parcs Disneyland Paris. 2 nuits dont 1 nuit Disney. Transport compris.", 
            options: [
                {nom: "Journée Supplémentaire Disney", prix: 160},
                {nom: "Journée Parc Astérix", prix: 130},
                {nom: "Journée Visite Paris", prix: 50},
                {nom: "Photo Pass", prix: 20, type: 'forfait'},
                {nom: "Hôtel 3 Étoiles", prix: 30, type: 'forfait'},
                {nom: "Hôtel 4 Étoiles", prix: 60, type: 'forfait'},
                {nom: "Hôtel 5 Étoiles (Disneyland Hotel)", prix: 250, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 6. POLOGNE
        // ==========================================
        { 
            titre: "Pologne - Coasters & Histoire", 
            prixBase: 300, 
            img: "pologne.jpg", 
            description: "Séjour de Base : 2 jours Energylandia + 1 jour visite de Cracovie. Transport compris.", 
            options: [
                {nom: "Journée Supplémentaire Energylandia", prix: 60},
                {nom: "Visite Auschwitz-Birkenau", prix: 60},
                {nom: "Visite Mines de Sel", prix: 50} // J'ai mis 50€ car tu n'avais pas précisé le prix
            ] 
        },

        // ==========================================
        // 7. ALLEMAGNE
        // ==========================================
        { 
            titre: "Tournée Allemande", 
            prixBase: 600, // Prix estimé basé sur tes infos précédentes
            img: "allemagne.jfif", 
            description: "2 Jours Europa Park + 2 jours Phantasialand. Transport compris, Hôtel compris.", 
            options: [
                {nom: "Soirée Rulantica (Parc Aquatique)", prix: 50},
                {nom: "Journée Visite Cologne", prix: 40},
                {nom: "Journée Supplémentaire Phantasialand", prix: 60},
                {nom: "Journée Supplémentaire Europa Park", prix: 60},
                {nom: "Hôtel Supérieur", prix: 120, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 8. JAPON
        // ==========================================
        { 
            titre: "Japon - L'Empire des Sensations", 
            prixBase: 2500, 
            img: "japon.jpg", 
            description: "2 jours Tokyo + 2 jours Tokyo Disneyland + 1 jour Osaka + 1 jour Universal Studios Japan.", 
            options: [
                {nom: "Journée Supplémentaire Disney", prix: 150},
                {nom: "Journée Supplémentaire Universal", prix: 150},
                {nom: "Journée Visite Ville", prix: 40},
                {nom: "Randonnée Mont Fuji (2 jours)", prix: 300}
            ] 
        },

        // ==========================================
        // 9. CHINE
        // ==========================================
        { 
            titre: "Chine Tour", 
            prixBase: 2200, // Prix estimé
            img: "chine.jpg", 
            description: "2 Jours Shanghai Disneyland + 2 jours Hong Kong Disneyland + 1 jour Hong Kong + 1 jour Shanghai. Transport + Hôtel inclus.", 
            options: [
                {nom: "Journée Parc Supplémentaire", prix: 150},
                {nom: "Hôtel Supérieur", prix: 200, type: 'forfait'}
            ] 
        },

        // ==========================================
        // 10. COTE EST USA
        // ==========================================
        { 
            titre: "USA - Côte Est & Adrénaline", 
            prixBase: 2000, 
            img: "usa_est.jfif", 
            description: "3 jours New York + 2 jours Cedar Point (La capitale des montagnes russes).", 
            options: [
                {nom: "Journée Détroit", prix: 150},
                {nom: "Hôtel Supérieur", prix: 500, type: 'forfait'}
            ] 
        }
    ];

    try {
        await Trip.deleteMany({}); // On vide la base pour éviter les doublons
        await Trip.insertMany(listeVoyages); // On insère la nouvelle liste
        console.log("Catalogue mis à jour avec succès !");
        res.send("✅ Base de données mise à jour avec tes 10 voyages complets et les bonnes options !");
    } catch (err) {
        console.error(err);
        res.send("❌ Erreur lors de la mise à jour : " + err);
    }
});
// --- MIDDLEWARE POUR LES MESSAGES GLOBAUX ---
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg'); // Message vert
    res.locals.error_msg = req.flash('error_msg');     // Message rouge
    res.locals.user = req.session.user || null;        // Utilisateur connecté
    next();
});
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


    // Tes 10 séjours réels
    const voyages = [
        { id: 1, titre: "Orlando - La Capitale des Parcs", prix: 1800, img: "floride.webp", desc: "Disney World, Universal Studios & SeaWorld." },
        { id: 2, titre: "California Road Trip", prix: 2200, img: "californie.avif", desc: "De Disneyland Anaheim à Six Flags Magic Mountain." },
        { id: 3, titre: "Japon - L'Excellence", prix: 2600, img: "japon.jpg", desc: "Tokyo Disney Resort & Universal Osaka." },
        { id: 4, titre: "Paris - Magie Européenne", prix: 450, img: "paris.jpg", desc: "Disneyland Paris & Parc Astérix." },
        { id: 5, titre: "Allemagne - Sensations Fortes", prix: 600, img: "allemagne.jfif", desc: "Europa Park & Phantasialand." },
        { id: 6, titre: "Pologne - L'Outsider", prix: 550, img: "pologne.avif", desc: "Energylandia, le roi des montagnes russes." },
        { id: 7, titre: "Chine - Grandeur Nature", prix: 2100, img: "chine.jpg", desc: "Shanghai, Hong Disney & Universal Beijing." },
        { id: 8, titre: "Côte Est USA", prix: 1900, img: "usa_est.jfif", desc: "De New york jusqu'à Cedar point" },
        { id: 9, titre: "Balade Espagnol", prix: 400, img: "espagne.webp", desc: "Soleil et adrénaline en Espagne." },
        { id: 10, titre: "La grande Angleterre ", prix: 350, img: "londre.jpg", desc: "La féérie de l'Angleterre." }
    ];
// --- 3. ROUTES (Les Pages du site) ---
// --- PAGE DÉTAILS VOYAGE & AVIS ---

// 1. AFFICHER LE VOYAGE EN DÉTAIL
// 1. AFFICHER LE VOYAGE EN DÉTAIL (AVEC AMIS PARTICIPANTS)
app.get('/voyage/:id', async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.id);
        const reviews = await Review.find({ tripId: trip._id }).sort({ createdAt: -1 });

        // Calcul Note Moyenne
        let averageRating = 0;
        if (reviews.length > 0) {
            const total = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = (total / reviews.length).toFixed(1);
        }

        // --- LOGIQUE AMIS PARTICIPANTS ---
        let friendsGoing = []; // Liste des amis qui viennent
        let canReview = false;

        if (req.session.user) {
            const currentUser = await User.findById(req.session.user._id);
            
            // 1. On cherche les commandes sur ce voyage faites par mes amis
            // (On cherche les commandes dont le userId est DANS ma liste d'amis)
            const friendsOrders = await Order.find({ 
                tripId: trip._id,
                userId: { $in: currentUser.friends }, // La magie est ici
                status: { $in: ['Validée', 'Payée', 'Terminée'] }
            }).populate('userId'); // On récupère les infos de l'ami

            // On extrait juste les noms pour l'affichage (sans doublons)
            const uniqueFriends = new Set();
            friendsOrders.forEach(o => uniqueFriends.add(o.userId.name));
            friendsGoing = Array.from(uniqueFriends);

            // 2. Logic Can Review (Déjà vu avant)
            const userOrder = await Order.findOne({ 
                userId: req.session.user._id, 
                tripId: trip._id, // Assure-toi d'utiliser tripId maintenant
                status: { $in: ['Payée', 'Terminée'] } 
            });
            const existingReview = await Review.findOne({ userId: req.session.user._id, tripId: trip._id });
            if (userOrder && !existingReview) canReview = true;
        }
        // ---------------------------------

        res.render('voyage-details', { 
            trip: trip, 
            reviews: reviews, 
            averageRating: averageRating,
            user: req.session.user,
            canReview: canReview,
            friendsGoing: friendsGoing // <--- ON ENVOIE LA LISTE
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// 2. POSTER UN AVIS
app.post('/voyage/:id/review', isAuthenticated, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const trip = await ScheduledTrip.findById(req.params.id);

        // On crée l'avis
        await Review.create({
            tripId: trip._id,
            userId: req.session.user._id,
            userName: req.session.user.name,
            rating: parseInt(rating),
            comment: comment
        });

        res.redirect('/voyage/' + trip._id); // On recharge la page

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// ROUTE ACCUEIL (CORRIGÉE : AVEC TOUT)
app.get('/', async (req, res) => {
    try {
        // 1. COMPTEUR DE VISITES (Stats)
        let stats = await Stat.findOne({ name: 'global_visits' });
        if (!stats) stats = new Stat({ name: 'global_visits', count: 0 });
        stats.count += 1;
        await stats.save();

        // 2. RÉCUPÉRER LES VOYAGES À LA UNE (ScheduledTrip) - Max 3
        const featuredTrips = await ScheduledTrip.find({ isFeatured: true, status: { $ne: 'Fermé' } }).limit(3);

        // 3. RÉCUPÉRER LES VOYAGES CLASSIQUES (Trip) - C'est ça qui manquait !
        const voyages = await Trip.find(); 

        // 4. ENVYER TOUT À LA PAGE
        res.render('index', { 
            user: req.session.user,
            
            featuredTrips: featuredTrips, // Les nouveautés
            voyages: voyages,             // ✅ Les classiques (pour corriger l'erreur)
            
            pageTitle: "Accueil - Travel of Wonder",
            pageDescription: "Votre agence de voyage spécialisée."
        });

    } catch (err) {
        console.error(err);
        // En cas d'erreur, on envoie des listes vides pour éviter le crash
        res.render('index', { user: req.session.user, featuredTrips: [], voyages: [] });
    }
});
// Page de détail d'un séjour
app.get('/sejour/:id', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.send("Voyage introuvable.");

        // COMPTEUR DE VUES +1
        trip.vues = trip.vues + 1;
        await trip.save();

        res.render('sejour', { trip: trip });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});
// --- VERIFICATION GOOGLE SEARCH CONSOLE ---
app.get('/google3f3ad9d8771e66b2.html', (req, res) => {
    // On répond simplement avec le texte que Google attend
    res.send('google-site-verification: google3f3ad9d8771e66b2.html');
});
// --- Pages du Menu (En construction pour l'instant) ---
// Page DESTINATIONS (Catalogue complet)
app.get('/destinations', async (req, res) => {
    try {
        const trips = await Trip.find(); // On récupère tout
        res.render('destinations', { voyages: trips });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// 1. AFFICHER LA PAGE DE DEMANDE
app.get('/demande', (req, res) => {
    res.render('demande', { user: req.session.user });
});

// 2. TRAITER LE FORMULAIRE GÉNÉRAL
app.post('/demande/envoyer-generale', async (req, res) => {
    try {
        // Si l'utilisateur n'est pas connecté, on ne peut pas enregistrer la commande liée à un ID
        // Pour l'instant, on oblige la connexion, ou alors il faut modifier le modèle Order pour accepter les anonymes.
        // ICI : On oblige la connexion pour faire simple et sécurisé.
        if (!req.session.user) {
            req.flash('error_msg', 'Veuillez vous connecter ou créer un compte pour envoyer une demande.');
            return res.redirect('/connexion');
        }

        const { destination, date, nbPeople, budget, message } = req.body;

        const newOrder = new Order({
            userId: req.session.user._id,
            userName: req.session.user.name,
            userEmail: req.session.user.email,
            tripTitle: `Demande Sur Mesure : ${destination}`, // Titre personnalisé
            nbPeople: nbPeople,
            totalPrice: 0, // Prix à définir sur devis
            type: 'devis',
            customMessage: `Date: ${date} | Budget: ${budget}€ | Msg: ${message}`,
            status: 'En attente'
        });

        await newOrder.save();
        req.flash('success_msg', 'Votre demande sur mesure a bien été envoyée !');
        res.redirect('/mes-demandes');

    } catch (err) {
        console.error(err);
        res.redirect('/demande');
    }
});
// --- ROUTE DE MISE À JOUR COMPLETE AVEC DETAILS ---

// Page AVIS CLIENTS
app.get('/avis', (req, res) => {
    // Les données de ta capture d'écran
    const avisClients = [
        { nom: "Alexandre", note: 5, sejour: "Disneyland Paris 2025", commentaire: "Merci à toi Lukas. Séjour très sympa et bien organisé." },
        { nom: "Cédric", note: 5, sejour: "Disneyland Paris 2025", commentaire: "Séjour Nickel a refaire." },
        { nom: "Sidney", note: 5, sejour: "Disneyland Paris 2025", commentaire: "Super séjour, c'est dommage que c'est terminé." },
        { nom: "Lucie", note: 5, sejour: "Disneyland Paris 2024", commentaire: "Séjour Disneyland paris 2024 Carré." },
        { nom: "Mathis", note: 5, sejour: "Disneyland 2024", commentaire: "Séjour Disneyland paris 2024 Nickel." },
        { nom: "Dorian", note: 5, sejour: "Disneyland 2024", commentaire: "Séjour Disneyland Paris 2024. Le spectacles est incroyable, L'hôtel est incroyable." },
        { nom: "Margaux", note: 5, sejour: "Disneyland Paris 2025", commentaire: "Super séjour, vraiment une chance d'avoir pu partir. Le prix est vraiment exceptionnel. L'organisation était vraiment bonne, que ce soit les réservations d'hôtels ou encore les tickets pour le RER/Metro. Les activités ont aussi été très bien encadrées. Encore merci, je suis ravi d'avoir fait ce voyage avec vous. Si vous en refaites, je reviendrais avec plaisir ! Bravo et merci ✨" },
        { nom: "Andréa", note: 5, sejour: "Disneyland 2025", commentaire: "J'ai vraiment aimé ce séjour étant fan de Disney et des parcs Disneyland, la visite de l'assemblée était très intéressante." },
        { nom: "Chris", note: 5, sejour: "Disneyland 2025", commentaire: "Juste Incroyable." }
    ];

    res.render('avis', { avis: avisClients });
});

// Page HORIZON (Aventure)
app.get('/horizon', (req, res) => {
    res.render('horizon', { page: 'horizon' });
});

// Page CELESTE (Luxe)
app.get('/celeste', (req, res) => {
    res.render('celeste', { page: 'celeste' });
});

// Page À PROPOS
app.get('/apropos', (req, res) => {
    res.render('apropos');
});

// Page de Connexion
// Page de Connexion / Inscription
app.get('/connexion', (req, res) => {
    res.render('login');
});

// (Optionnel pour l'instant) Fausses routes pour simuler que ça marche
// --- LOGIQUE DE CONNEXION ---
// --- CONNEXION ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });

        if (!user) {
            req.flash('error_msg', 'Email introuvable.');
            return res.redirect('/connexion');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Mot de passe incorrect.');
            return res.redirect('/connexion');
        }

        // --- LE VERROU PRO ---
        // Si c'est un pro ET qu'il n'est pas validé -> On bloque
        if (user.role === 'pro' && user.isValidated === false) {
            req.flash('error_msg', 'Votre compte Pro est en attente de validation par l\'administration.');
            return res.redirect('/connexion');
        }

        // Si tout est bon
        req.session.user = user;
        req.flash('success_msg', 'Ravi de vous revoir !'); // Petit message sympa (optionnel)
        res.redirect('/mon-compte'); // On redirige direct vers le dashboard

    } catch (err) {
        console.error(err);
        res.redirect('/connexion');
    }
});
// --- GESTION DU PROFIL & COMPAGNONS ---

// 1. AFFICHER LA PAGE PROFIL
// 1. AFFICHER LA PAGE PROFIL (AVEC POPULATE)
app.get('/mon-profil', isAuthenticated, async (req, res) => {
    try {
        // .populate('friends') va chercher les infos (nom, email) des amis
        const user = await User.findById(req.session.user._id).populate('friends');
        
        res.render('mon-profil', { user: user });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// 2. METTRE À JOUR LES INFOS (Général + Mot de passe)
app.post('/mon-profil/update', isAuthenticated, async (req, res) => {
    try {
        const { name, email, phone, address, gender, birthDate, emergencyName, emergencyPhone, medicalInfo, newPassword } = req.body;
        
        // Objet de mise à jour de base
        let updateData = {
            name, email, phone, address, gender, birthDate, medicalInfo,
            instagram: instagram,
            emergencyContact: { name: emergencyName, phone: emergencyPhone }
        };

        // Si l'utilisateur veut changer son mot de passe
        if (newPassword && newPassword.trim() !== "") {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        await User.findByIdAndUpdate(req.session.user._id, updateData);
        
        // On met à jour la session aussi pour que le nom change direct en haut à droite
        req.session.user = await User.findById(req.session.user._id);

        req.flash('success_msg', 'Profil mis à jour avec succès !');
        res.redirect('/mon-profil');

    } catch (err) {
        console.error(err);
        res.redirect('/mon-profil');
    }
});

// 3. AJOUTER UN COMPAGNON
app.post('/mon-profil/add-companion', isAuthenticated, async (req, res) => {
    try {
        const { name, gender, birthDate, relation } = req.body;
        
        await User.findByIdAndUpdate(req.session.user._id, {
            $push: { companions: { name, gender, birthDate, relation } }
        });

        req.flash('success_msg', 'Compagnon ajouté !');
        res.redirect('/mon-profil');
    } catch (err) {
        res.redirect('/mon-profil');
    }
});
// 5. AJOUTER UN AMI (Par email)
app.post('/mon-profil/add-friend', isAuthenticated, async (req, res) => {
    try {
        const friendEmail = req.body.email.trim();

        // 1. On cherche si l'ami existe
        const friend = await User.findOne({ email: friendEmail });
        
        // Erreurs possibles
        if (!friend) {
            req.flash('error_msg', 'Aucun utilisateur trouvé avec cet email.');
            return res.redirect('/mon-profil');
        }
        if (friend._id.equals(req.session.user._id)) {
            req.flash('error_msg', 'Vous ne pouvez pas vous ajouter vous-même !');
            return res.redirect('/mon-profil');
        }

        // 2. On vérifie s'ils sont déjà amis
        const currentUser = await User.findById(req.session.user._id);
        if (currentUser.friends.includes(friend._id)) {
            req.flash('error_msg', 'Cette personne est déjà dans vos amis.');
            return res.redirect('/mon-profil');
        }

        // 3. On ajoute l'ami !
        await User.findByIdAndUpdate(currentUser._id, {
            $push: { friends: friend._id }
        });

        // (Optionnel : Réciprocité - L'ami vous ajoute aussi automatiquement ?)
        // Pour l'instant on fait simple : A suit B.

        req.flash('success_msg', `Super ! ${friend.name} a été ajouté à vos amis.`);
        res.redirect('/mon-profil');

    } catch (err) {
        console.error(err);
        res.redirect('/mon-profil');
    }
});

// 6. SUPPRIMER UN AMI
app.get('/mon-profil/delete-friend/:id', isAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.session.user._id, {
            $pull: { friends: req.params.id }
        });
        res.redirect('/mon-profil');
    } catch (err) {
        res.redirect('/mon-profil');
    }
});
// 4. SUPPRIMER UN COMPAGNON
app.get('/mon-profil/delete-companion/:id', isAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.session.user._id, {
            $pull: { companions: { _id: req.params.id } }
        });
        res.redirect('/mon-profil');
    } catch (err) {
        res.redirect('/mon-profil');
    }
});
// --- GESTION DE LA WISHLIST (FAVORIS) ---

// 1. AJOUTER / RETIRER DES FAVORIS (Toggle)
app.get('/wishlist/toggle/:id', isAuthenticated, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.session.user._id;

        const user = await User.findById(userId);

        // On vérifie si le voyage est déjà dans la liste
        if (user.wishlist.includes(tripId)) {
            // Si oui, on l'enlève (Pull)
            await User.findByIdAndUpdate(userId, { $pull: { wishlist: tripId } });
            req.flash('success_msg', 'Retiré de vos favoris.');
        } else {
            // Si non, on l'ajoute (Push)
            await User.findByIdAndUpdate(userId, { $push: { wishlist: tripId } });
            req.flash('success_msg', 'Ajouté à vos favoris ! ❤️');
        }

        // On met à jour la session
        req.session.user = await User.findById(userId);

        // On renvoie l'utilisateur à la page d'où il vient
        res.redirect('back');

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// 2. VOIR MA WISHLIST (Page dédiée)
app.get('/ma-wishlist', isAuthenticated, async (req, res) => {
    try {
        // On récupère l'utilisateur et on REMPLIT (populate) les infos des voyages
        const user = await User.findById(req.session.user._id).populate('wishlist');
        
        res.render('ma-wishlist', { trips: user.wishlist });
    } catch (err) {
        res.redirect('/');
    }
});
// --- DÉCONNEXION ---
app.get('/logout', (req, res) => {
    req.session.destroy(); // On détruit la session
    res.redirect('/'); // Retour à l'accueil
});
// --- LOGIQUE D'INSCRIPTION ---
// --- INSCRIPTION ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, company, siret } = req.body;

        // Vérif si existe déjà
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            // On renvoie vers login avec un message d'erreur
            req.flash('error_msg', 'Cet email est déjà utilisé.');
            return res.redirect('/connexion');
        }

        // Cryptage
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- LA LOGIQUE DE VALIDATION ---
        // Si c'est un PRO -> Pas validé (false)
        // Si c'est un PARTICULIER -> Validé direct (true)
        let isValid = (role === 'particulier'); 

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            company,
            siret,
            isValidated: isValid // On applique la logique
        });

        await newUser.save();

        // --- MESSAGE DE SUCCÈS DIFFÉRENT ---
        if (role === 'pro') {
            req.flash('success_msg', 'Compte Pro créé ! Il sera activé après validation par un administrateur.');
        } else {
            req.flash('success_msg', 'Compte créé avec succès ! Vous pouvez vous connecter.');
        }

        res.redirect('/connexion');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Erreur lors de l\'inscription.');
        res.redirect('/connexion');
    }
});


// Recherche (Pour la barre de recherche)
// FONCTION RECHERCHE
// --- FONCTION RECHERCHE ---
app.get('/search', async (req, res) => {
    try {
        const query = req.query.q; // On récupère ce qu'il y a dans ?q=...
        
        // Si la recherche est vide, on renvoie à l'accueil
        if (!query || query.trim() === '') {
            return res.redirect('/');
        }

        // Recherche insensible à la casse dans Titre ou Description
        const resultats = await Trip.find({
            $or: [
                { titre: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { details: { $regex: query, $options: 'i' } } // On cherche aussi dans les détails
            ]
        });

        // On affiche la page destinations avec les résultats
        res.render('destinations', { 
            voyages: resultats,
            searchQuery: query // Important pour afficher le message "Résultats pour..."
        });

    } catch (err) {
        console.error("Erreur Recherche:", err);
        res.redirect('/');
    }
});

// Sécurité : Vérifie si c'est un Admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next(); // C'est le boss, il passe
    }
    req.flash('error_msg', 'Accès interdit ! Zone réservée.');
    res.redirect('/mon-compte');
}
// --- 4. LANCEMENT DU SERVEUR ---
const PORT = process.env.PORT || 3000; // Important pour l'hébergeur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
// --- FONCTION DE SÉCURITÉ ---
// Si l'utilisateur n'est pas connecté, on le vire vers la connexion
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next(); // C'est bon, passe !
    }
    res.redirect('/connexion'); // Pas bon, dehors !
}

// --- ROUTES DE L'ESPACE MEMBRE ---

// 1. Le Dashboard Principal
app.get('/mon-compte', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// 2. Les Pages spécifiques (On met des pages temporaires pour tester)

// PARTICULIER
app.get('/mes-voyages', isAuthenticated, (req, res) => {
    res.send('<h1>Ici : Liste des voyages personnels (À coder avec la BDD)</h1><a href="/mon-compte">Retour</a>');
});
// Page : MES DEMANDES (Particulier)
// Page : MES DEMANDES / MES VOYAGES (Commune à tous)
// AFFICHER LES DEMANDES DU CLIENT (Espace Membre)
// AFFICHER LE PROFIL ET LA FIDÉLITÉ
// AFFICHER LE PROFIL, FIDÉLITÉ ET GÉRER LES AVIS
app.get('/mes-demandes', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;

        // 1. On récupère les commandes
        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

        // 2. On récupère les AVIS que ce client a DÉJÀ écrits
        const myReviews = await Review.find({ userId: userId });
        // On crée une liste simple des ID de voyages déjà notés (ex: ["id_voyage_1", "id_voyage_2"])
        const reviewedTripIds = myReviews.map(r => r.tripId.toString());

        // 3. Calcul Fidélité (Code habituel)
        const tripCount = await Order.countDocuments({ 
            userId: userId, 
            status: { $in: ['Payée', 'Terminée'] } 
        });

        let level = 'Explorateur';
        let nextLevelTrips = 2;
        let badgeColor = '#6c757d';
        
        if (tripCount >= 2 && tripCount < 7) {
            level = 'Wonder 1'; nextLevelTrips = 7; badgeColor = '#cd7f32';
        } else if (tripCount >= 7 && tripCount < 15) {
            level = 'Wonder 2'; nextLevelTrips = 15; badgeColor = '#c0c0c0';
        } else if (tripCount >= 15) {
            level = 'Wonder 3'; nextLevelTrips = 100; badgeColor = '#ffd700';
        }

        res.render('mes-demandes', { 
            user: req.session.user, 
            orders: orders,
            reviewedTripIds: reviewedTripIds, // <--- ON ENVOIE LA LISTE ICI
            loyalty: {
                count: tripCount,
                level: level,
                nextTarget: nextLevelTrips,
                color: badgeColor
            }
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});
// --- SYSTÈME D'AVIS DEPUIS L'ESPACE CLIENT ---

// 1. Afficher le formulaire "Donner mon avis"
app.get('/mes-demandes/avis/:tripId', isAuthenticated, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.tripId);
        if (!trip) return res.redirect('/mes-demandes');

        res.render('donner-avis', { trip: trip, user: req.session.user });
    } catch (err) {
        res.redirect('/mes-demandes');
    }
});

// 2. Enregistrer l'avis
app.post('/mes-demandes/avis/:tripId', isAuthenticated, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        
        // On vérifie s'il a déjà noté pour éviter les doublons
        const existing = await Review.findOne({ userId: req.session.user._id, tripId: req.params.tripId });
        if (existing) return res.redirect('/mes-demandes');

        await Review.create({
            tripId: req.params.tripId,
            userId: req.session.user._id,
            userName: req.session.user.name,
            rating: parseInt(rating),
            comment: comment
        });

        req.flash('success_msg', 'Merci pour votre avis ! ⭐');
        res.redirect('/mes-demandes');

    } catch (err) {
        console.error(err);
        res.redirect('/mes-demandes');
    }
});
// --- GÉNÉRATION PDF (BILLET / FACTURE) ---
app.get('/mes-demandes/facture/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        // Sécurité : On vérifie que c'est bien le voyage du client (ou que c'est l'admin)
        if (order.userId.toString() !== req.session.user._id.toString() && req.session.user.role !== 'admin') {
            return res.redirect('/mes-demandes');
        }

        // On crée le document PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // On dit au navigateur : "C'est un PDF, propose de le télécharger"
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Billet-${order.reservationNumber}.pdf`);

        // On envoie le PDF directement vers le navigateur
        doc.pipe(res);

        // --- DESIGN DU BILLET ---

        // 1. En-tête (Logo et Titre)
        doc.fillColor('#444').fontSize(20).text('TRAVEL OF WONDER', 50, 50);
        doc.fontSize(10).text('L\'agence de vos rêves', 50, 75);
        doc.moveDown();

        // Ligne de séparation
        doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#ccc').stroke();

        // 2. Titre du Voyage
        doc.moveDown(2);
        doc.fillColor('#0d47a1').fontSize(25).font('Helvetica-Bold').text(order.tripTitle, { align: 'center' });
        doc.moveDown();

        // 3. Infos principales (Cadre gris)
        doc.rect(50, 180, 500, 130).fill('#f8f9fa');
        doc.fillColor('#333').fontSize(12).font('Helvetica');
        
        doc.text(`Voyageur Principal : ${order.userName}`, 70, 200);
        doc.text(`Nombre de personnes : ${order.nbPeople}`, 70, 220);
        doc.text(`Numéro de Dossier : ${order.reservationNumber}`, 70, 240);
        doc.text(`Date de commande : ${new Date(order.createdAt).toLocaleDateString()}`, 70, 260);
        
        // 4. Statut et Prix
        doc.fontSize(16).fillColor('#27ae60').text('STATUT : PAYÉ / CONFIRMÉ', 70, 290);
        doc.fontSize(20).fillColor('#000').text(`${order.totalPrice} €`, 450, 290, { align: 'right' });

        // 5. Bas de page (Faux QR Code et Footer)
        doc.moveDown(10);
        doc.fontSize(10).fillColor('#777').text('Ce document tient lieu de confirmation de réservation.', { align: 'center' });
        doc.text('Présentez ce billet lors de votre arrivée.', { align: 'center' });

        // Faux QR Code (Carré noir)
        doc.rect(250, 450, 100, 100).fill('#000');
        doc.fillColor('#fff').fontSize(10).text('QR CODE', 275, 495);

        doc.fillColor('#555').fontSize(10).text('Travel of Wonder - SAS au capital de 1000€ - RCS Paris B 123 456', 50, 700, { align: 'center' });

        // Fin du document
        doc.end();

    } catch (err) {
        console.error(err);
        res.redirect('/mes-demandes');
    }
});
// PRO
// Page Vitrine GROUPE PRO
app.get('/voyages-groupe', isAuthenticated, async (req, res) => {
    // Sécurité : Seulement pour les pros
    if (req.session.user.role !== 'pro') {
        req.flash('error_msg', 'Accès réservé aux comptes professionnels.');
        return res.redirect('/mon-compte');
    }

    // On récupère les voyages
    const trips = await Trip.find();
    res.render('voyages-groupe', { voyages: trips });
});
// 1. AFFICHER LE FORMULAIRE GROUPE
// Page Vitrine GROUPE PRO (Correction)
app.get('/demande-groupe', isAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'pro') {
        req.flash('error_msg', 'Accès réservé aux pros.');
        return res.redirect('/mon-compte');
    }
    
    const trips = await Trip.find();
    
    // C'EST ICI LA CORRECTION : On définit 'selected' même s'il est vide
    const selectedTripId = req.query.trip || null; 

    // On envoie bien 'selected' à la vue
    res.render('demande-groupe', { trips: trips, selected: selectedTripId });
});

// 2. TRAITER LA DEMANDE GROUPE (Calcul automatique)
app.post('/demande-groupe/envoyer', isAuthenticated, async (req, res) => {
    try {
        const { tripId, nbPeople, customMessage } = req.body;
        
        // On récupère le voyage original
        const trip = await Trip.findById(tripId);
        
        // LOGIQUE DE PRIX PRO : Prix de base - 50€
        const prixPro = trip.prixBase - 50;
        const totalEstime = prixPro * nbPeople;

        const newOrder = new Order({
            userId: req.session.user._id,
            userName: req.session.user.name,
            userEmail: req.session.user.email,
            tripId: trip._id,
            tripTitle: trip.titre + " (Tarif Groupe Pro)",
            nbPeople: nbPeople,
            totalPrice: totalEstime,
            type: 'devis',
            customMessage: customMessage || "Demande de groupe standard (-50€/pers appliqué)",
            reservationNumber: generateReservationNumber(),
            status: 'En attente'
        });

        await newOrder.save();
        req.flash('success_msg', `Devis Groupe envoyé ! Tarif appliqué : ${prixPro}€/pers (au lieu de ${trip.prixBase}€).`);
        res.redirect('/mon-compte');

    } catch (err) {
        console.error(err);
        res.redirect('/demande-groupe');
    }
});

// PARAMETRES
// AFFICHER LA PAGE PARAMETRES
app.get('/parametres', isAuthenticated, (req, res) => {
    res.render('parametres', { user: req.session.user });
});

// A. VOIR LE DÉTAIL D'UN VOYAGE (GESTION)
app.get('/admin/departs/manage/:id', isAuthenticated, isAdmin, async (req, res) => {
    const trip = await ScheduledTrip.findById(req.params.id);
    res.render('admin-manage-trip', { trip: trip });
});
// --- GESTION DES CLIENTS (CRM) ---

// 1. LISTE DE TOUS LES CLIENTS
app.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    // On récupère tous les utilisateurs qui ne sont PAS admins (donc les clients et pros)
    const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 });
    res.render('admin-users-list', { users: users });
});

// 2. FICHE DÉTAILLÉE D'UN CLIENT (CORRECTION VARIABLE)
app.get('/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // On ajoute .populate('wishlist') pour charger les infos des voyages likés
        const userRaw = await User.findById(req.params.id).populate('wishlist');
        if (!userRaw) return res.redirect('/admin/users');

        const ordersRaw = await Order.find({ userId: userRaw._id }).sort({ createdAt: -1 });

        // On nettoie les objets
        const targetUser = JSON.parse(JSON.stringify(userRaw)); // <-- On l'appelle targetUser
        const orders = JSON.parse(JSON.stringify(ordersRaw));

        // --- STATS ---
        const tripCount = orders.filter(o => o.status === 'Payée' || o.status === 'Terminée').length;

        let totalSpent = 0;
        orders.forEach(o => {
            if ((o.status === 'Payée' || o.status === 'Terminée') && o.totalPrice) {
                totalSpent += o.totalPrice;
            }
        });

        let level = 'Explorateur';
        let badgeColor = '#6c757d'; 
        if (tripCount >= 2) { level = 'Wonder 1'; badgeColor = '#cd7f32'; }
        if (tripCount >= 7) { level = 'Wonder 2'; badgeColor = '#c0c0c0'; }
        if (tripCount >= 15) { level = 'Wonder 3'; badgeColor = '#ffd700'; }

        res.render('admin-user-detail', { 
            targetUser: targetUser, // <-- Changement ici
            orders: orders,
            stats: { tripCount, totalSpent, level, badgeColor }
        });

    } catch (err) {
        console.error("Erreur fiche:", err);
        res.redirect('/admin/users');
    }
});
// B. MODIFIER LE VOYAGE (CAPACITÉ, DATE...)
app.post('/admin/departs/update/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { capacity, status, dateDepart } = req.body;
        await ScheduledTrip.findByIdAndUpdate(req.params.id, {
            capacity: parseInt(capacity),
            status: status,
            dateDepart: dateDepart
        });
        req.flash('success_msg', 'Voyage mis à jour !');
        res.redirect('/admin/departs/manage/' + req.params.id);
    } catch (err) {
        console.error(err);
        res.redirect('/admin/departs');
    }
});

// C. SUPPRIMER UN PARTICIPANT (KICK)
app.get('/admin/departs/kick/:tripId/:participantId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.tripId);
        
        // On enlève le participant du tableau
        trip.participants = trip.participants.filter(p => p._id.toString() !== req.params.participantId);
        
        // On réduit le compteur
        trip.filled -= 1;
        if(trip.filled < 0) trip.filled = 0;
        
        // On rouvre le voyage s'il était complet
        if(trip.status === 'Complet' && trip.filled < trip.capacity) {
            trip.status = 'Ouvert';
        }

        await trip.save();
        req.flash('success_msg', 'Participant retiré du voyage.');
        res.redirect('/admin/departs/manage/' + req.params.tripId);

    } catch (err) {
        console.error(err);
        res.redirect('/admin/departs');
    }
});
// --- GESTION DU BLOG (ADMIN) ---

// 1. FORMULAIRE POUR ÉCRIRE UN ARTICLE
app.get('/admin/blog/add', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin-add-article');
});

// 2. SAUVEGARDER L'ARTICLE
app.post('/admin/blog/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, image, content } = req.body;
        
        await Article.create({
            title,
            image,
            content // On peut mettre du HTML ici si on veut
        });

        req.flash('success_msg', 'Article publié avec succès ! 📝');
        res.redirect('/blog'); // On redirige vers le blog public pour voir le résultat

    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});
// --- BLOG / ACTUALITÉS ---
// --- GESTION AVANCÉE DU BLOG (LISTE, MODIFIER, SUPPRIMER) ---

// 1. TABLEAU DE BORD BLOG (Liste des articles)
app.get('/admin/blog', isAuthenticated, isAdmin, async (req, res) => {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('admin-blog', { articles: articles });
});

// 2. SUPPRIMER UN ARTICLE
app.get('/admin/blog/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await Article.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Article supprimé.');
        res.redirect('/admin/blog');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/blog');
    }
});

// 3. AFFICHER LE FORMULAIRE DE MODIFICATION
app.get('/admin/blog/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        res.render('admin-edit-article', { article: article });
    } catch (err) {
        res.redirect('/admin/blog');
    }
});

// 4. ENREGISTRER LES MODIFICATIONS
app.post('/admin/blog/edit/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, image, content } = req.body;
        
        await Article.findByIdAndUpdate(req.params.id, {
            title: title,
            image: image,
            content: content
        });

        req.flash('success_msg', 'Article mis à jour !');
        res.redirect('/admin/blog');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/blog');
    }
});

// 1. LISTE DE TOUS LES ARTICLES
app.get('/blog', async (req, res) => {
    // On récupère les articles du plus récent au plus ancien
    const articles = await Article.find().sort({ createdAt: -1 });
    res.render('blog', { articles: articles, user: req.session.user });
});

// 2. LIRE UN ARTICLE EN DÉTAIL
app.get('/blog/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        res.render('blog-post', { article: article, user: req.session.user });
    } catch (err) {
        res.redirect('/blog');
    }
});
// VALIDER UN PAIEMENT (Admin)
// ROUTE POUR METTRE A JOUR LE STATUT D'UNE COMMANDE (Depuis le tableau)
app.post('/admin/paiement', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        // On met à jour le statut
        await Order.findByIdAndUpdate(orderId, { 
            status: status,
            // Si on met "Payée", on met aussi paymentStatus à "Soldé" pour être cohérent
            paymentStatus: (status === 'Payée') ? 'Soldé' : 'En attente'
        });

        req.flash('success_msg', 'Commande mise à jour !');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});
// --- GESTION DES VOYAGES PRÉVUS (DÉPARTS GROUPÉS) ---

// 1. AFFICHER LE DASHBOARD "DÉPARTS GROUPÉS"
app.get('/admin/departs', isAuthenticated, isAdmin, async (req, res) => {
    const trips = await ScheduledTrip.find().sort({ createdAt: -1 });
    res.render('admin-departs', { trips: trips });
});

// 2. CRÉER UN NOUVEAU DÉPART
app.post('/admin/departs/add', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { titre, image, dateDepart, prix, capacity, description } = req.body;
        
        await ScheduledTrip.create({
            titre, image, dateDepart, prix, capacity, description,
            filled: 0,
            status: 'Ouvert'
        });
        
        req.flash('success_msg', 'Voyage programmé créé !');
        res.redirect('/admin/departs');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/departs');
    }
});

// 3. AJOUTER UN PARTICIPANT MANUELLEMENT (+1 PLACE)
app.post('/admin/departs/add-participant/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.id);
        const { name } = req.body; // Juste le nom pour aller vite

        if (trip.filled < trip.capacity) {
            trip.participants.push({ name: name, email: 'Ajout Manuel', status: 'Confirmé' });
            trip.filled += 1; // On augmente le compteur
            
            // Si c'est plein, on passe en Complet
            if(trip.filled >= trip.capacity) trip.status = 'Complet';
            
            await trip.save();
            req.flash('success_msg', 'Participant ajouté (+1 place).');
        } else {
            req.flash('error_msg', 'Le voyage est déjà complet !');
        }
        res.redirect('/admin/departs');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/departs');
    }
});

// 4. SUPPRIMER UN VOYAGE
app.get('/admin/departs/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    await ScheduledTrip.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Voyage supprimé.');
    res.redirect('/admin/departs');
});
// 1. AFFICHER LE FORMULAIRE D'IMPORT

app.get('/admin/import', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin-import');
});
// 2. TRAITER L'IMPORT MANUEL
app.post('/admin/import', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // 1. On récupère nbPeople en plus
        const { clientName, clientEmail, tripTitle, tripDate, price, status, nbPeople } = req.body;

        const newOrder = new Order({
            userId: null, // Maintenant autorisé grâce à l'étape 1
            userName: clientName,
            userEmail: clientEmail,
            tripTitle: tripTitle,
            reservationNumber: generateReservationNumber(),
            
            nbPeople: nbPeople, // On l'enregistre ici !
            
            totalPrice: price,
            status: status, // 'Terminée' est maintenant autorisé
            customMessage: `Import Ancien Dossier (Date : ${tripDate})`,
            type: 'reservation'
        });

        await newOrder.save();
        req.flash('success_msg', `Dossier importé ! N° : ${newOrder.reservationNumber}`);
        res.redirect('/admin');

    } catch (err) {
        console.error(err); // Affiche l'erreur si ça plante encore
        req.flash('error_msg', 'Erreur import : ' + err.message);
        res.redirect('/admin');
    }
});

// AJOUTER UN VOYAGE (Page simple)
app.get('/admin/add-trip', isAuthenticated, isAdmin, (req, res) => {
    res.render('add-trip');
});

// SAUVEGARDER LE NOUVEAU VOYAGE
app.post('/admin/add-trip', isAuthenticated, isAdmin, async (req, res) => {
    // Pour faire simple, on crée un voyage basique qui pourra être édité via le code ou un formulaire plus complexe plus tard
    // Ici je fais une version simplifiée pour que ça marche direct
    try {
        const newTrip = new Trip(req.body);
        await newTrip.save();
        req.flash('success_msg', 'Nouveau séjour ajouté au catalogue !');
        res.redirect('/admin');
    } catch(err) {
        console.log(err);
        res.send("Erreur ajout voyage");
    }
});
// --- PAGE PUBLIQUE : DÉPARTS GROUPÉS ---
// --- PAGE PUBLIQUE : DÉPARTS GROUPÉS (RÉPARATION) ---
// AFFICHER TOUS LES VOYAGES (AVEC RECHERCHE)
app.get('/departs-groupes', async (req, res) => {
    try {
        let query = {}; // Par défaut, on cherche tout (vide)

        // Si l'utilisateur a tapé quelque chose dans la barre de recherche
        if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            // On cherche dans le Titre OU dans la Description
            query = { 
                $or: [
                    { titre: regex }, 
                    { description: regex }
                ] 
            };
        }

        const trips = await ScheduledTrip.find(query).sort({ dateDepart: 1 });
        
        // On récupère l'utilisateur pour savoir s'il a liké des trucs
        let user = null;
        if (req.session.user) {
            user = await User.findById(req.session.user._id);
        }

        res.render('departs-groupes', { trips: trips, user: user, search: req.query.search });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Petite fonction utilitaire pour nettoyer le texte de recherche (Sécurité)
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
// 1. AFFICHER LA PAGE DES VOYAGES PRÉVUS
// A. AFFICHER LE FORMULAIRE DE RÉSERVATION (GET)
app.get('/departs-groupes/reserve/:id', isAuthenticated, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.id);
        if(!trip) return res.redirect('/departs-groupes');
        
        // On affiche la page de confirmation
        res.render('reservation-confirm', { trip: trip, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.redirect('/departs-groupes');
    }
});

// B. TRAITER LA RÉSERVATION COMPLETE (POST)
app.post('/departs-groupes/confirm/:id', isAuthenticated, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.id);
        const { fullName, phone, paymentMethod } = req.body; // On récupère les infos du formulaire

        // Vérif places et doublons...
        if (trip.filled >= trip.capacity) {
            req.flash('error_msg', 'Complet !');
            return res.redirect('/departs-groupes');
        }

        // Création Commande
        const newOrder = new Order({
            userId: req.session.user._id,
            userName: fullName, // On utilise le nom fourni
            userEmail: req.session.user.email,
            tripId: trip._id,
            tripTitle: `[GROUPE] ${trip.titre}`,
            tripId: trip._id,
            nbPeople: 1,
            totalPrice: trip.prix,
            paymentMethod: paymentMethod, // On note la préférence
            status: 'En attente',
            type: 'reservation',
            reservationNumber: generateReservationNumber(),
            customMessage: `Tél: ${phone}`
        });
        await newOrder.save();

        // Ajout au Voyage
        trip.participants.push({ 
            userId: req.session.user._id,
            name: fullName,
            email: req.session.user.email,
            phone: phone,
            paymentMethod: paymentMethod,
            status: 'En attente' 
        });
        trip.filled += 1;
        if (trip.filled >= trip.capacity) trip.status = 'Complet';
        
        await trip.save();
        // ... (Code existant : création newOrder, sauvegarde trip...)

        await trip.save(); // La réservation est enregistrée

        // --- ENVOI DU MAIL DE CONFIRMATION ---
        
        // 1. Le contenu du mail (HTML)
        const emailHTML = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #0d47a1;">Félicitations ${fullName} ! 🌍</h1>
                <p>Votre demande de réservation pour <strong>${trip.titre}</strong> est bien enregistrée.</p>
                
                <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>📅 Date :</strong> ${trip.dateDepart}</p>
                    <p><strong>💰 Prix :</strong> ${trip.prix} €</p>
                    <p><strong>🆔 N° Dossier :</strong> ${newOrder.reservationNumber}</p>
                </div>

                <p>Votre statut est actuellement : <span style="color: orange; font-weight: bold;">En attente de validation</span>.</p>
                <p>Nous reviendrons vers vous très vite pour le paiement (${paymentMethod}).</p>
                
                <br>
                <p>À très vite,<br>L'équipe Travel of Wonder ✨</p>
            </div>
        `;

        // 2. On envoie !
        sendEmail(req.session.user.email, `Confirmation de réservation - ${trip.titre}`, emailHTML);

        // 3. (Optionnel) Mail pour TOI (l'Admin)
        sendEmail('travel.of.wonderparc@gmail.com', 'Nouvelle Réservation ! 🚀', `Quelqu'un a réservé pour ${trip.titre}. Va voir l'admin !`);

        // ... (Suite du code : req.flash, redirect...)

        req.flash('success_msg', 'Inscription validée !');
        res.redirect('/mes-demandes');


    } catch (err) {
        console.error(err);
        res.redirect('/departs-groupes');
    }
});
// --- LIER UN ANCIEN VOYAGE À SON COMPTE ---
app.post('/mes-demandes/link', isAuthenticated, async (req, res) => {
    try {
        const { reservationNumber, emailVerify } = req.body;

        // 1. On cherche la commande
        const order = await Order.findOne({ reservationNumber: reservationNumber });

        // 2. Vérifications de sécurité
        if (!order) {
            req.flash('error_msg', 'Numéro de réservation introuvable.');
            return res.redirect('/mes-demandes');
        }

        if (order.userId) {
            req.flash('error_msg', 'Ce voyage est déjà lié à un compte.');
            return res.redirect('/mes-demandes');
        }

        // On vérifie que l'email correspond (pour éviter qu'on vole la résa d'un autre)
        if (order.userEmail.toLowerCase() !== emailVerify.toLowerCase()) {
            req.flash('error_msg', 'L\'email ne correspond pas à ce numéro de dossier.');
            return res.redirect('/mes-demandes');
        }

        // 3. Tout est bon : On fait le lien !
        order.userId = req.session.user._id;
        // On met à jour le nom aussi au cas où
        if(!order.userName) order.userName = req.session.user.name;
        
        await order.save();

        req.flash('success_msg', '🎉 Voyage récupéré avec succès ! Il est maintenant dans votre liste.');
        res.redirect('/mes-demandes');

    } catch (err) {
        console.error(err);
        res.redirect('/mes-demandes');
    }
});
// ENREGISTRER LES MODIFICATIONS
app.post('/parametres/update', isAuthenticated, async (req, res) => {
    try {
        const { name, email, company, siret } = req.body;
        
        // On met à jour l'utilisateur
        await User.findByIdAndUpdate(req.session.user._id, {
            name, email, company, siret
        });

        // On met à jour la session
        req.session.user.name = name;
        req.session.user.email = email;
        if(company) req.session.user.company = company;

        req.flash('success_msg', 'Profil mis à jour avec succès !');
        res.redirect('/parametres');
    } catch (err) {
        req.flash('error_msg', 'Erreur lors de la mise à jour.');
        res.redirect('/parametres');
    }
});
// FONCTION POUR GÉNÉRER UN NUMÉRO DE RÉSA UNIQUE (Ex: TW-2026-X789)
function generateReservationNumber() {
    const year = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000); // Nombre entre 1000 et 9999
    return `TW-${year}-${randomPart}`;
}
// --- ROUTES ADMINISTRATEUR ---

// 1. Le Tableau de Bord
// --- TABLEAU DE BORD ADMIN ---
// PAGE ADMIN (AVEC STATISTIQUES COMPLÈTES)
// PAGE ADMIN (VERSION CORRIGÉE ET COMPLÈTE)
app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // 1. Récupérer les commandes
        const orders = await Order.find().sort({ createdAt: -1 });

        // 2. Récupérer les visites
        const visitStat = await Stat.findOne({ name: 'global_visits' });
        const totalVisits = visitStat ? visitStat.count : 0;

        // 3. Récupérer le nombre de clients
        const userCount = await User.countDocuments({ role: 'client' });

        // 4. Calculer le Chiffre d'Affaires
        let totalRevenue = 0;
        orders.forEach(order => {
            if (order.status === 'Validée' || order.status === 'Payée' || order.status === 'Terminée') {
                if (order.totalPrice) {
                    totalRevenue += order.totalPrice;
                }
            }
        });

        // 5. RÉCUPÉRER LES PROS EN ATTENTE (C'est ça qui manquait !)
        const pendingPros = await User.find({ role: 'pro', isVerified: false });

        // 6. Envoyer tout ça à la vue
        res.render('admin', { 
            orders: orders, 
            totalVisits: totalVisits,
            userCount: userCount,
            totalUsers: userCount, // Pour éviter l'autre erreur
            totalRevenue: totalRevenue,
            pendingPros: pendingPros // ✅ On renvoie bien la liste des pros
        });

    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});
// 2. Action : Valider un compte
app.get('/admin/validate/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isValidated: true });
        req.flash('success_msg', 'Compte Professionnel validé avec succès !');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});
// TOGGLE "À LA UNE" (ON/OFF)
app.get('/admin/departs/feature/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const trip = await ScheduledTrip.findById(req.params.id);
        // On inverse la valeur (Si c'est vrai ça devient faux, et inversement)
        trip.isFeatured = !trip.isFeatured; 
        await trip.save();
        res.redirect('/admin/departs'); // On recharge la page
    } catch (err) {
        console.error(err);
        res.redirect('/admin/departs');
    }
});

// 3. Action : Supprimer un compte (Refus)
app.get('/admin/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        req.flash('error_msg', 'Utilisateur supprimé définitivement.');
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});
// Action : Changer le statut d'une commande
app.get('/admin/order/:id/:status', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id, status } = req.params;
        
        // On met à jour le statut
        await Order.findByIdAndUpdate(id, { status: status });
        
        req.flash('success_msg', `Commande mise à jour : ${status}`);
        res.redirect('/admin');
    } catch (err) {
        console.error(err);
        res.redirect('/admin');
    }
});
// --- SITEMAP DYNAMIQUE (POUR GOOGLE) ---
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = "https://travel-of-wonder.onrender.com"; // ⚠️ REMPLACE PAR TON URL RENDER EXACTE
        const trips = await Trip.find();

        let content = `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>${baseUrl}/</loc>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>${baseUrl}/destinations</loc>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>`;

        // On ajoute chaque voyage dynamiquement
        trips.forEach(trip => {
            content += `
            <url>
                <loc>${baseUrl}/sejour/${trip._id}</loc>
                <changefreq>weekly</changefreq>
                <priority>0.7</priority>
            </url>`;
        });

        content += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(content);

    } catch (err) {
        res.status(500).end();
    }
});
// --- TRAITEMENT DE LA DEMANDE (POST) ---
// --- TRAITEMENT DU FORMULAIRE DE SÉJOUR (UNIVERSEL) ---
app.post('/demande/envoyer', isAuthenticated, async (req, res) => {
    try {
        const { tripId, tripTitle, nbPeople, options, customMessage, finalPrice } = req.body;
        const user = req.session.user;

        // 1. Gestion des Options (Si une seule cochée, c'est une string, sinon tableau)
        let optionsChoisies = [];
        if (typeof options === 'string') {
            optionsChoisies = [options];
        } else if (Array.isArray(options)) {
            optionsChoisies = options;
        }

        // 2. Détection du type de demande
        // Si Pro -> DEVIS. Sinon -> SOUHAIT (Réservation)
        let typeDemande = (user.role === 'pro') ? 'devis' : 'reservation';
        
        // Si le client a écrit un message spécial, on force le mode "devis" pour validation manuelle
        if (customMessage && customMessage.trim() !== "") {
            typeDemande = 'devis';
        }

        // 3. Création de la commande
        const newOrder = new Order({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            tripId: tripId,
            tripTitle: tripTitle,
            nbPeople: nbPeople,
            options: optionsChoisies,
            totalPrice: finalPrice, // Le prix calculé par le JS
            customMessage: customMessage,
            type: typeDemande,
            reservationNumber: generateReservationNumber(),
            status: 'En attente'
        });

        // 4. Sauvegarde
        await newOrder.save();

        // 5. Message et Redirection
        if (user.role === 'pro') {
            req.flash('success_msg', 'Votre demande de DEVIS a été envoyée ! Retrouvez-la dans votre espace.');
        } else {
            req.flash('success_msg', 'Voyage ajouté à vos souhaits ! Un conseiller va valider votre dossier.');
        }
        
        res.redirect('/mes-demandes'); // Tout le monde va ici pour voir le résultat

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Une erreur est survenue.');
        res.redirect('/');
    }

});

