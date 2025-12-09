// --- 1. CONFIGURATION DB ---
const DB_NAME = 'BonsaisDoDB';
const DB_VERSION = 1;
const STORE_NAME = 'bonsais';
let db;

// Espèces (Simplifié pour l'exemple)
const speciesDB = [
    { id: 'pin_blanc', name: 'Pin Blanc' },
    { id: 'erable', name: 'Érable Japon' },
    { id: 'genevrier', name: 'Genévrier' },
    { id: 'orme', name: 'Orme de Chine' },
    { id: 'ficus', name: 'Ficus' },
    { id: 'azalee', name: 'Azalée' },
    { id: 'olivier', name: 'Olivier' }
];

// --- 2. DOM ELEMENTS ---
const bonsaiListEl = document.getElementById('bonsai-list');
const countEl = document.getElementById('compteur-arbres');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('bonsai-form');
const speciesSelect = document.getElementById('input-species');

// --- 3. INITIALISATION ---
function init() {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    };
    request.onsuccess = (e) => {
        db = e.target.result;
        populateSpeciesSelect();
        loadBonsaisFromDB();
    };
}

// --- 4. CRUD FONCTIONS ---
function loadBonsaisFromDB() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = (e) => renderCarousel(e.target.result);
}

function saveBonsaiToDB(item) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    // 'put' permet de créer OU de mettre à jour si l'id existe
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

// --- 5. INTERFACE ---
function populateSpeciesSelect() {
    speciesSelect.innerHTML = '<option value="" disabled selected>Choisir une espèce...</option>';
    speciesDB.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = s.name;
        speciesSelect.appendChild(opt);
    });
}

function renderCarousel(bonsais) {
    bonsaiListEl.innerHTML = '';
    countEl.textContent = bonsais.length ? `${bonsais.length} Arbres` : "Aucun arbre";

    if (bonsais.length === 0) {
        bonsaiListEl.innerHTML = '<div class="empty-msg">Votre collection est vide.</div>';
        return;
    }

    bonsais.forEach(bonsai => {
        const species = speciesDB.find(s => s.id === bonsai.speciesId)?.name || 'Inconnu';
        
        // Affichage des travaux
        const workList = bonsai.tasks && bonsai.tasks.length > 0 ? bonsai.tasks.join(', ') : 'Aucun travaux';
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
                <p class="species-tag">${species}</p>
                
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

// --- 6. FORMULAIRE & ÉDITION ---

// Ouvre le modal en mode "Création"
addBtn.addEventListener('click', () => {
    openModal();
});

function openModal(bonsaiToEdit = null) {
    modal.classList.remove('hidden');
    form.reset();
    
    if (bonsaiToEdit) {
        // Mode ÉDITION
        modalTitle.textContent = "Modifier l'arbre";
        document.getElementById('edit-id').value = bonsaiToEdit.id;
        document.getElementById('input-name').value = bonsaiToEdit.name;
        document.getElementById('input-species').value = bonsaiToEdit.speciesId;
        document.getElementById('input-date').value = bonsaiToEdit.date;
        
        // Cocher les cases
        const checkboxes = document.querySelectorAll('input[name="travaux"]');
        if (bonsaiToEdit.tasks) {
            checkboxes.forEach(cb => {
                if (bonsaiToEdit.tasks.includes(cb.value)) cb.checked = true;
            });
        }
    } else {
        // Mode CRÉATION
        modalTitle.textContent = "Nouveau Bonsaï";
        document.getElementById('edit-id').value = ""; // Pas d'ID
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

    const id = document.getElementById('edit-id').value; // Vide si création, rempli si modif
    const name = document.getElementById('input-name').value;
    const speciesId = document.getElementById('input-species').value;
    const date = document.getElementById('input-date').value;
    const photoInput = document.getElementById('input-photo');

    // Récupérer les travaux cochés
    const checkedTasks = [];
    document.querySelectorAll('input[name="travaux"]:checked').forEach(cb => {
        checkedTasks.push(cb.value);
    });

    const bonsaiData = {
        name: name,
        speciesId: speciesId,
        date: date,
        tasks: checkedTasks
    };

    // Si on a un ID, on l'ajoute à l'objet pour qu'IndexedDB sache qu'on modifie
    if (id) {
        bonsaiData.id = parseInt(id); // Important : convertir en nombre
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
        // Si on modifie sans changer la photo, il faut garder l'ancienne
        if (id) {
            // Récupérer l'ancienne image depuis la DB
             const transaction = db.transaction([STORE_NAME], 'readonly');
             const req = transaction.objectStore(STORE_NAME).get(parseInt(id));
             req.onsuccess = (e) => {
                 const oldData = e.target.result;
                 bonsaiData.image = oldData.image; // On garde l'image existante
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
    if(confirm("Supprimer ?")) deleteBonsaiFromDB(id);
};

init();
