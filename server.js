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


// Page d'Accueil
app.get('/', async (req, res) => {
    try {
        const voyages = await Trip.find(); // On récupère TOUT depuis MongoDB
        res.render('index', { voyages: voyages });
    } catch (err) {
        console.error(err);
        res.render('index', { voyages: [] });
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
app.get('/mes-demandes', isAuthenticated, async (req, res) => {
    try {
        // On récupère les commandes de l'utilisateur connecté
        const myOrders = await Order.find({ userId: req.session.user._id }).sort({ createdAt: -1 });

        res.render('mes-demandes', { orders: myOrders, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.redirect('/mon-compte');
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

// VALIDER UN PAIEMENT (Admin)
app.post('/admin/paiement', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { orderId, method, status } = req.body;
        await Order.findByIdAndUpdate(orderId, {
            paymentMethod: method,
            paymentStatus: status,
            status: (status === 'Soldé') ? 'Payée' : 'Validée' // Si soldé, la commande passe en Payée
        });
        req.flash('success_msg', 'Paiement mis à jour.');
        res.redirect('/admin');
    } catch (err) {
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
// --- ROUTES ADMINISTRATEUR ---

// 1. Le Tableau de Bord
// --- TABLEAU DE BORD ADMIN ---
app.get('/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const pendingPros = await User.find({ role: 'pro', isValidated: false });
        const allUsers = await User.find();
        const allOrders = await Order.find().sort({ createdAt: -1 });
        
        // NOUVEAU : On récupère les voyages pour les stats de vues
        const tripsStats = await Trip.find().sort({ vues: -1 }); // Trié par popularité

        res.render('admin', { 
            pendingPros: pendingPros,
            totalUsers: allUsers.length,
            users: allUsers,
            orders: allOrders,
            tripsStats: tripsStats // <-- On envoie ça à la vue
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
