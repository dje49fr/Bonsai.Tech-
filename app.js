// --- 1. CONFIGURATION DB ---
const DB_NAME = 'BonsaisDoDB';
const DB_VERSION = 1;
const STORE_NAME = 'bonsais';
let db;

// --- 2. LISTE GÉANTE DES ESPÈCES (300+ Entrées) ---
const rawSpeciesList = [
    "Abricotier du Japon (Prunus mume)", "Acacia", "Acajou", "Agave", "Aulne (Alnus)", "Aulne glutineux", 
    "Amandier", "Amélanchier", "Araucaria", "Arbre à perruque (Cotinus)", "Arbre de Jade (Crassula ovata)", "Arbre de Judée (Cercis)", 
    "Arbre du clergé", "Arbre aux quarante écus (Ginkgo)", "Argousier", "Aubépine (Crataegus)", "Azalée (Rhododendron)", "Azalée Satsuki", 
    "Bambou", "Bambou sacré (Nandina)", "Baobab (Adansonia)", "Berbéris", "Bougainvillier", "Bouleau (Betula)", "Bouleau blanc", "Bouleau verruqueux", 
    "Buis (Buxus)", "Buis de Chine", "Buis des Baléares", "Callicarpa", "Camélia", "Camphrier", "Caraganier", 
    "Carmona (Thé du Fukien)", "Caryer", "Cèdre (Cedrus)", "Cèdre de l'Atlas", "Cèdre du Hymalaya", "Cèdre du Liban", 
    "Celtis (Micocoulier)", "Cerisier (Prunus)", "Cerisier à fleurs", "Cerisier de Sainte-Lucie", "Cerisier du Japon (Sakura)", 
    "Charme (Carpinus)", "Charme commun", "Charme de Corée", "Charme du Japon", "Châtaignier", 
    "Chêne (Quercus)", "Chêne blanc", "Chêne liège", "Chêne rouge", "Chêne vert", "Chèvrefeuille", 
    "Citronnier", "Clématite", "Cognassier de Chine", "Cognassier du Japon", "Coronille", "Cornouiller (Cornus)", "Cornouiller mâle", "Cornouiller sanguin",
    "Cotoneaster", "Cotoneaster horizontalis", "Cyprès (Cupressus)", "Cyprès chauve (Taxodium)", "Cyprès de Hinoki", "Cyprès de Lambert", "Cyprès de Lawson",
    "Desmodium", "Deutzia", "Eleagnus", "Epicea (Picea)", "Epicea commun", "Epicea d'Ezo", "Epicea de Sitka", 
    "Erable (Acer)", "Erable à feuilles de frêne", "Erable buergerianum (Trident)", "Erable campêtre", "Erable de Montpellier", 
    "Erable du Japon (Palmatum)", "Erable Deshojo", "Erable Ginnala", "Erable Kiyohime", "Erable plane", "Erable rouge", "Erable sycomore", 
    "Eucalyptus", "Euonymus (Fusain)", "Faux-Poivrier (Operculicarya)", "Faux-Cyprès", 
    "Ficus", "Ficus Benjamina", "Ficus Ginseng", "Ficus Microcarpa", "Ficus Retusa", "Ficus Tigerbark", 
    "Figuier (Ficus carica)", "Forsythia", "Frêne (Fraxinus)", "Frêne à fleurs", "Frêne commun", "Frêne de Chine", 
    "Fuchsia", "Gardenia", "Genêt", "Genévrier (Juniperus)", "Genévrier commun", "Genévrier de Chine (Itoigawa)", "Genévrier de Phénicie", 
    "Genévrier écailleux", "Genévrier horizontal", "Genévrier rigide", "Genévrier Shimpaku", "Ginkgo Biloba", 
    "Glycine (Wisteria)", "Glycine de Chine", "Glycine du Japon", "Grenadier (Punica granatum)", "Grenadier nain (Nana)", 
    "Groseillier", "Guava (Goyavier)", "Hêtre (Fagus)", "Hêtre commun", "Hêtre crénelé", "Hêtre pourpre", 
    "Hibiscus", "Houx (Ilex)", "Houx crénelé (Ilex crenata)", "If (Taxus)", "If commun (Baccata)", "If du Japon (Cuspidata)", 
    "Jacaranda", "Jasmin", "Jasmin d'hiver", "Jujubier", "Kaki (Plaqueminier)", "Kumquat", 
    "Lagerstroemia (Lilas des Indes)", "Lantana", "Laurier", "Laurier rose", "Lierre (Hedera)", "Lilas", "Liquidambar", 
    "Litchi", "Lonicera (Chèvrefeuille arbustif)", "Loropetalum", "Magnolia", "Magnolia étoilé", 
    "Mélèze (Larix)", "Mélèze d'Europe", "Mélèze du Japon", "Mélèze hybride", "Metasequoia", "Mimosa", "Mûrier (Morus)", "Mûrier platane", 
    "Myrte", "Nandina", "Nflier", "Noyer", "Olivier (Olea europaea)", "Olivier sauvage (Oléastre)", "Oranger", 
    "Orme (Ulmus)", "Orme champêtre", "Orme de Chine (Parvifolia)", "Orme de Sibérie", "Orme du Japon (Nire)", 
    "Osmanthe", "Pamplemoussier", "Passiflore", "Pêcher", "Peuplier", "Peuplier blanc", "Peuplier tremble", 
    "Photinia", "Pin (Pinus)", "Pin à crochets", "Pin blanc du Japon (Pentaphylla)", "Pin Cembro", "Pin d'Alep", 
    "Pin de Monterey", "Pin des montagnes (Mugo)", "Pin maritime", "Pin noir d'Autriche", "Pin noir du Japon (Thunbergii)", 
    "Pin parasol", "Pin ponderosa", "Pin rouge du Japon", "Pin sylvestre", 
    "Pistachier", "Pistachier lentisque", "Pittosporum", "Plaqueminier (Kaki)", "Platane", 
    "Podocarpus", "Pommier (Malus)", "Pommier d'ornement", "Pommier Everest", "Pommier Halliana", "Pommier sauvage", 
    "Portulacaria (Afra)", "Potentille", "Prunellier (Prunus spinosa)", "Prunier", "Pyracantha (Buisson ardent)", 
    "Raisinier bord de mer", "Rhododendron", "Romarin", "Rosier", "Sapin (Abies)", "Sapin blanc", "Sapin de Corée", 
    "Saule (Salix)", "Saule pleureur", "Schefflera", "Séquoia", "Séquoia géant", "Serissa (Neige de Juin)", "Sorbier", "Sorbier des oiseleurs", 
    "Spirée", "Stewartia", "Sureau", "Syzygium", "Tamaris", "Taxodium (Cyprès chauve)", "Théier", "Thuya", 
    "Tilleul (Tilia)", "Tilleul à petites feuilles", "Troène (Ligustrum)", "Troène de Chine", "Tsuga (Pruche)", 
    "Vigne", "Vigne vierge", "Viorne", "Weigelia", "Wisteria (Glycine)", "Yuzu", "Zelkova (Orme du Japon)", "Zelkova Serrata"
];

// On transforme la liste simple en objets triés alphabétiquement
const speciesDB = rawSpeciesList.sort().map((name, index) => {
    return { id: 'sp_' + index, name: name };
});


// --- 3. DOM ELEMENTS ---
const bonsaiListEl = document.getElementById('bonsai-list');
const countEl = document.getElementById('compteur-arbres');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('bonsai-form');
const speciesSelect = document.getElementById('input-species');

// --- 4. INITIALISATION ---
function init() {
    console.log("Initialisation de l'application...");
    
    // Remplir le select tout de suite
    populateSpeciesSelect();

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = (e) => {
        db = e.target.result;
        console.log("DB Connectée.");
        loadBonsaisFromDB();
    };

    request.onerror = (e) => {
        console.error("Erreur DB:", e);
    };
}

// --- 5. CRUD FONCTIONS ---
function loadBonsaisFromDB() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    
    request.onsuccess = (e) => {
        const bonsais = e.target.result;
        renderCarousel(bonsais);
    };
}

function saveBonsaiToDB(item) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(item); 
    
    request.onsuccess = () => {
        closeModal();
        loadBonsaisFromDB();
    };
}

function deleteBonsaiFromDB(id) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const request = transaction.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => loadBonsaisFromDB();
}

// --- 6. INTERFACE ---
function populateSpeciesSelect() {
    speciesSelect.innerHTML = '<option value="" disabled selected>Choisir une espèce...</option>';
    
    speciesDB.forEach(s => {
        const opt = document.createElement('option');
        // On utilise le nom comme valeur aussi pour simplifier la lecture plus tard
        opt.value = s.name; 
        opt.textContent = s.name;
        speciesSelect.appendChild(opt);
    });
}

function renderCarousel(bonsais) {
    bonsaiListEl.innerHTML = '';
    countEl.textContent = bonsais.length ? `${bonsais.length} Arbres` : "Aucun arbre";

    if (bonsais.length === 0) {
        bonsaiListEl.innerHTML = '<div class="empty-msg">Votre collection est vide.<br>Ajoutez votre premier arbre !</div>';
        return;
    }

    bonsais.forEach(bonsai => {
        // Affichage des travaux
        const workList = bonsai.tasks && bonsai.tasks.length > 0 ? bonsai.tasks.join(', ') : 'Aucun travaux récents';
        const dateDisplay = bonsai.date ? new Date(bonsai.date).toLocaleDateString('fr-FR') : '--/--/----';

        const card = document.createElement('div');
        card.className = 'bonsai-card';
        card.innerHTML = `
            <div class="card-actions-top">
                <button class="action-icon-btn btn-edit" onclick="editBonsai(${bonsai.id})">✎</button>
                <button class="action-icon-btn btn-delete" onclick="confirmDelete(${bonsai.id})">×</button>
            </div>
            
            <div class="card-image">
                <img src="${bonsai.image || 'img/placeholder.png'}" alt="${bonsai.name}">
            </div>
            
            <div class="card-details">
                <h2>${bonsai.name}</h2>
                <p class="species-tag">${bonsai.speciesId || 'Espèce inconnue'}</p>
                
                <div class="work-list">
                    <p class="work-date">📅 ${dateDisplay}</p>
                    <p class="work-items">${workList}</p>
                </div>
            </div>
        `;
        bonsaiListEl.appendChild(card);
    });
    
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    bonsaiListEl.appendChild(spacer);
}

// --- 7. FORMULAIRE & ÉDITION ---

addBtn.addEventListener('click', () => {
    openModal();
});

function openModal(bonsaiToEdit = null) {
    modal.classList.remove('hidden');
    form.reset();
    
    if (bonsaiToEdit) {
        // Mode ÉDITION
        modalTitle.textContent = "Modifier la fiche";
        document.getElementById('edit-id').value = bonsaiToEdit.id;
        document.getElementById('input-name').value = bonsaiToEdit.name;
        // Ici, speciesId contient directement le nom de l'espèce
        document.getElementById('input-species').value = bonsaiToEdit.speciesId; 
        document.getElementById('input-date').value = bonsaiToEdit.date;
        
        // Cocher les cases
        const checkboxes = document.querySelectorAll('input[name="travaux"]');
        if (bonsaiToEdit.tasks) {
            checkboxes.forEach(cb => {
                if (bonsaiToEdit.tasks.includes(cb.value)) cb.checked = true;
                else cb.checked = false;
            });
        }
    } else {
        // Mode CRÉATION
        modalTitle.textContent = "Nouveau Bonsaï";
        document.getElementById('edit-id').value = ""; 
        // Décocher tout
        document.querySelectorAll('input[name="travaux"]').forEach(cb => cb.checked = false);
    }
}

function closeModal() {
    modal.classList.add('hidden');
    form.reset();
}

cancelBtn.addEventListener('click', closeModal);

// Soumission (Création ou Modif)
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('input-name').value;
    const speciesName = document.getElementById('input-species').value; // On récupère le nom
    const date = document.getElementById('input-date').value;
    const photoInput = document.getElementById('input-photo');

    // Récupérer les travaux cochés
    const checkedTasks = [];
    document.querySelectorAll('input[name="travaux"]:checked').forEach(cb => {
        checkedTasks.push(cb.value);
    });

    const bonsaiData = {
        name: name,
        speciesId: speciesName, // On stocke le nom de l'espèce directement
        date: date,
        tasks: checkedTasks
    };

    if (id) {
        bonsaiData.id = parseInt(id);
    }

    // Gestion Image
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            bonsaiData.image = evt.target.result;
            saveBonsaiToDB(bonsaiData);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        if (id) {
             const transaction = db.transaction([STORE_NAME], 'readonly');
             const req = transaction.objectStore(STORE_NAME).get(parseInt(id));
             req.onsuccess = (e) => {
                 const oldData = e.target.result;
                 bonsaiData.image = oldData.image; 
                 saveBonsaiToDB(bonsaiData);
             };
        } else {
            bonsaiData.image = null;
            saveBonsaiToDB(bonsaiData);
        }
    }
});

// Fonctions Globales pour le HTML
window.editBonsai = function(id) {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(id);
    request.onsuccess = (e) => {
        openModal(e.target.result);
    };
};

window.confirmDelete = function(id) {
    if(confirm("Supprimer cet arbre définitivement ?")) {
        deleteBonsaiFromDB(id);
    }
};

// Lancer l'application
init();
