// --- 1. CONFIGURATION DE LA BASE DE DONNÉES (IndexedDB) ---
const DB_NAME = 'BonsaisDoDB';
const DB_VERSION = 1;
const STORE_NAME = 'bonsais';
let db;

// --- 2. DONNÉES STATIQUES (Espèces) ---
const speciesDB = [
    { id: 'pin_blanc', name: 'Pin Blanc du Japon', waterFreq: 3, pruning: 'Octobre' },
    { id: 'erable', name: 'Érable du Japon', waterFreq: 2, pruning: 'Juin' },
    { id: 'genevrier', name: 'Genévrier', waterFreq: 4, pruning: 'Toute l\'année' },
    { id: 'orme', name: 'Orme de Chine', waterFreq: 2, pruning: 'Mars' },
    { id: 'ficus', name: 'Ficus', waterFreq: 3, pruning: 'Mai' },
    { id: 'azalee', name: 'Azalée', waterFreq: 1, pruning: 'Après floraison' },
    { id: 'olivier', name: 'Olivier', waterFreq: 5, pruning: 'Printemps' }
];

// --- 3. DOM ELEMENTS ---
const bonsaiListEl = document.getElementById('bonsai-list');
const countEl = document.getElementById('compteur-arbres');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal-overlay');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('bonsai-form');
const speciesSelect = document.getElementById('input-species');

// --- 4. INITIALISATION DE LA DB ET DE L'APP ---
function init() {
    console.log("Ouverture de la base de données...");
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Création de la structure si c'est la première fois (ou mise à jour)
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            // On crée une "table" 'bonsais' avec un ID automatique
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log("Base de données connectée ! Stockage illimité activé.");
        populateSpeciesSelect();
        loadBonsaisFromDB(); // Charger les arbres
    };

    request.onerror = (event) => {
        console.error("Erreur DB:", event.target.errorCode);
        countEl.textContent = "Erreur de chargement de la base de données.";
    };
}

// --- 5. FONCTIONS DATABASE (CRUD) ---

// A. Charger tous les arbres
function loadBonsaisFromDB() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const allBonsais = event.target.result;
        renderCarousel(allBonsais);
    };
}

// B. Ajouter un arbre
function addBonsaiToDB(newBonsai) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(newBonsai);

    request.onsuccess = () => {
        form.reset();
        modal.classList.add('hidden');
        loadBonsaisFromDB(); // Recharger l'affichage
        console.log("Arbre sauvegardé dans IndexedDB");
    };

    request.onerror = () => {
        alert("Erreur lors de la sauvegarde.");
    };
}

// C. Supprimer un arbre
function deleteBonsaiFromDB(id) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
        loadBonsaisFromDB(); // Recharger après suppression
    };
}

// --- 6. INTERFACE UTILISATEUR ---

function populateSpeciesSelect() {
    speciesSelect.innerHTML = '<option value="" disabled selected>Choisir une espèce...</option>';
    speciesDB.forEach(species => {
        const option = document.createElement('option');
        option.value = species.id;
        option.textContent = species.name;
        speciesSelect.appendChild(option);
    });
}

function renderCarousel(bonsais) {
    bonsaiListEl.innerHTML = ''; 

    if (bonsais.length === 0) {
        countEl.textContent = "Aucun arbre. Cliquez sur +";
        bonsaiListEl.innerHTML = '<div class="empty-msg" style="width:100%; text-align:center;">Votre collection est vide.<br>Ajoutez votre premier arbre !</div>';
        return;
    } else {
        countEl.textContent = `Vos ${bonsais.length} arbres se portent bien.`;
    }

    bonsais.forEach((bonsai) => {
        const speciesInfo = speciesDB.find(s => s.id === bonsai.speciesId) || { name: 'Inconnu', waterFreq: 3, pruning: '?' };
        
        // Calcul date
        const lastWater = new Date(bonsai.lastWatered);
        const today = new Date();
        const diffTime = Math.abs(today - lastWater);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const nextWaterIn = speciesInfo.waterFreq - diffDays;

        let waterLabel = nextWaterIn <= 0 ? "⚠️ Arroser !" : `💧 J-${nextWaterIn}`;
        let statusClass = nextWaterIn <= 0 ? "info-pill urgent" : "info-pill";

        // Carte HTML
        const card = document.createElement('div');
        card.className = 'bonsai-card';
        // Note importante : on passe l'ID unique de la DB à la fonction delete
        card.innerHTML = `
            <button class="delete-btn" onclick="confirmDelete(${bonsai.id})">×</button>
            <div class="card-image">
                <img src="${bonsai.image || 'img/placeholder.png'}" alt="${bonsai.name}">
            </div>
            <div class="card-details">
                <h2>${bonsai.name}</h2>
                <p class="species-tag">${speciesInfo.name}</p>
                <div class="actions">
                    <span class="${statusClass}">${waterLabel}</span>
                    <span class="info-pill">✂️ ${speciesInfo.pruning}</span>
                </div>
            </div>
        `;
        bonsaiListEl.appendChild(card);
    });
    
    // Espaceur
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    bonsaiListEl.appendChild(spacer);
}

// --- 7. GESTION DES CLICS ET FORMULAIRE ---

addBtn.addEventListener('click', () => modal.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('input-name').value;
    const speciesId = document.getElementById('input-species').value;
    const date = document.getElementById('input-water').value;
    const photoInput = document.getElementById('input-photo');

    // Lecture de l'image
    if (photoInput.files && photoInput.files[0]) {
        const file = photoInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(evt) {
            // On crée l'objet à sauvegarder
            const newBonsai = {
                name: name,
                speciesId: speciesId,
                lastWatered: date,
                image: evt.target.result // Base64 stocké dans IndexedDB (OK pour gros fichiers)
            };
            addBonsaiToDB(newBonsai);
        };
        reader.readAsDataURL(file);
    } else {
        const newBonsai = {
            name: name,
            speciesId: speciesId,
            lastWatered: date,
            image: null
        };
        addBonsaiToDB(newBonsai);
    }
});

// Fonction globale pour la suppression
window.confirmDelete = function(id) {
    if(confirm("Supprimer cet arbre définitivement ?")) {
        deleteBonsaiFromDB(id);
    }
};

// --- 8. INSTALLATION PWA ---
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if(installBtn) installBtn.style.display = 'block';
});

if(installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    });
}

// Lancement
init();
