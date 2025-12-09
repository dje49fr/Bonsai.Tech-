// --- 1. CONFIGURATION ---
const DB_NAME = 'BonsaisDoDB';
const DB_VERSION = 1;
const STORE_NAME = 'bonsais';
let db;

// Liste des espèces (Abrégée pour l'exemple, mais vous pouvez remettre la liste géante ici)
const speciesList = ["Abricotier", "Azalée", "Bouleau", "Buis", "Cèdre", "Cerisier", "Charme", "Chêne", "Cyprès", "Erable", "Ficus", "Genévrier", "Ginkgo", "Hêtre", "Mélèze", "Olivier", "Orme", "Pin", "Pommier", "Zelkova"];
const speciesDB = speciesList.map((n, i) => ({ id: n, name: n }));

// --- 2. LOGIQUE CONSEILS AUTOMATIQUES ---
// Fonction qui devine les conseils selon le nom de l'espèce
function getAdvice(speciesName) {
    const name = speciesName.toLowerCase();
    
    // Valeurs par défaut
    let advice = { 
        expo: { icon: '⛅', text: 'Mi-ombre' }, 
        temp: { icon: '❄️', text: '-5°C min' }, 
        water: { icon: '💧', text: 'Modéré' } 
    };

    // Règles simples
    if (name.includes('pin') || name.includes('genevrier') || name.includes('olivier') || name.includes('junip')) {
        advice.expo = { icon: '☀️', text: 'Plein soleil' };
        advice.temp = { icon: '❄️', text: 'Résistant' };
        advice.water = { icon: '🌵', text: 'Laisser sécher' };
    } 
    else if (name.includes('ficus') || name.includes('carmona') || name.includes('jade')) {
        advice.expo = { icon: '🏠', text: 'Intérieur/Lum' };
        advice.temp = { icon: '🌡️', text: '+10°C min' };
        advice.water = { icon: '💧', text: 'Humide' };
    }
    else if (name.includes('erable') || name.includes('azalee')) {
        advice.expo = { icon: '⛅', text: 'Mi-ombre' };
        advice.temp = { icon: '❄️', text: '-10°C' };
        advice.water = { icon: '💦', text: 'Sol frais' };
    }

    return advice;
}

// --- 3. DOM ELEMENTS ---
const bonsaiListEl = document.getElementById('bonsai-list');
const countEl = document.getElementById('compteur-arbres');
const addBtn = document.getElementById('add-btn');
const calendarBtn = document.getElementById('calendar-btn');
const modal = document.getElementById('modal-overlay');
const calendarModal = document.getElementById('calendar-modal');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-btn');
const closeCalBtn = document.getElementById('close-calendar');
const form = document.getElementById('bonsai-form');
const speciesSelect = document.getElementById('input-species');

// --- 4. INITIALISATION ---
function init() {
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
        loadBonsaisFromDB();
    };
    
    // Gestionnaire pour afficher/masquer les dates dans le formulaire
    document.querySelectorAll('.task-check').forEach(check => {
        check.addEventListener('change', (e) => {
            const dateInput = e.target.parentElement.nextElementSibling;
            if (e.target.checked) {
                dateInput.classList.remove('hidden');
                dateInput.valueAsDate = new Date(); // Date du jour par défaut
            } else {
                dateInput.classList.add('hidden');
            }
        });
    });
}

// --- 5. DB FONCTIONS ---
function loadBonsaisFromDB() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = (e) => renderCarousel(e.target.result);
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

// --- 6. RENDER & INTERFACE ---
function populateSpeciesSelect() {
    speciesSelect.innerHTML = '<option value="" disabled selected>Choisir une espèce...</option>';
    speciesDB.sort((a,b) => a.name.localeCompare(b.name)).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name; opt.textContent = s.name;
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
        // Récupération des conseils
        const advice = getAdvice(bonsai.speciesId || '');
        
        // Construction de l'historique HTML
        let historyHTML = '<p style="color:#999; text-align:center;">Aucun historique</p>';
        if (bonsai.tasks && bonsai.tasks.length > 0) {
            historyHTML = bonsai.tasks.map(t => `
                <div class="history-item">
                    <span>${t.type}</span>
                    <span class="history-date">${new Date(t.date).toLocaleDateString('fr-FR')}</span>
                </div>
            `).join('');
        }

        const card = document.createElement('div');
        card.className = 'bonsai-card';
        card.innerHTML = `
            <div class="card-header-strip">
                <button class="action-btn" onclick="editBonsai(${bonsai.id})">✎</button>
                <button class="action-btn btn-delete" onclick="confirmDelete(${bonsai.id})">×</button>
            </div>
            
            <div class="card-body">
                <div class="card-image">
                    <img src="${bonsai.image || 'img/placeholder.png'}" alt="${bonsai.name}">
                </div>
                <div class="card-info">
                    <h2>${bonsai.name}</h2>
                    <p class="species-tag">${bonsai.speciesId}</p>
                    <div class="history-list">
                        ${historyHTML}
                    </div>
                </div>
            </div>

            <div class="card-footer-advice">
                <div class="advice-item">
                    <span class="advice-icon">${advice.expo.icon}</span>
                    <span>${advice.expo.text}</span>
                </div>
                <div class="advice-item">
                    <span class="advice-icon">${advice.temp.icon}</span>
                    <span>${advice.temp.text}</span>
                </div>
                <div class="advice-item">
                    <span class="advice-icon">${advice.water.icon}</span>
                    <span>${advice.water.text}</span>
                </div>
            </div>
        `;
        bonsaiListEl.appendChild(card);
    });
    
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    bonsaiListEl.appendChild(spacer);
}

// --- 7. CALENDRIER ---
calendarBtn.addEventListener('click', () => {
    calendarModal.classList.remove('hidden');
    generateCalendarList();
});

closeCalBtn.addEventListener('click', () => calendarModal.classList.add('hidden'));

function generateCalendarList() {
    const listEl = document.getElementById('calendar-list');
    listEl.innerHTML = 'Chargement...';
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    
    request.onsuccess = (e) => {
        const bonsais = e.target.result;
        listEl.innerHTML = '';
        
        if(bonsais.length === 0) {
            listEl.innerHTML = '<p>Aucun arbre pour prévoir des travaux.</p>';
            return;
        }

        // Simulation simple : Prochain travail = Dernier travail + 6 mois
        // Dans une vraie app, on utiliserait les règles de l'espèce
        bonsais.forEach(b => {
            let nextAction = "Inspection";
            let nextDate = new Date();
            
            if (b.tasks && b.tasks.length > 0) {
                // Prendre la dernière tâche
                const lastTask = b.tasks[b.tasks.length - 1];
                const lastDate = new Date(lastTask.date);
                nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + 6)); // +6 mois
                nextAction = "Suivi " + lastTask.type;
            } else {
                nextDate.setDate(nextDate.getDate() + 7); // Dans 1 semaine
            }

            const item = document.createElement('div');
            item.className = 'cal-item';
            item.innerHTML = `
                <span class="cal-tree">${b.name} (${b.speciesId})</span>
                <span class="cal-action">📅 ${nextDate.toLocaleDateString('fr-FR')} - ${nextAction}</span>
            `;
            listEl.appendChild(item);
        });
    };
}

// --- 8. FORMULAIRE ---
addBtn.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);

function openModal(bonsaiToEdit = null) {
    modal.classList.remove('hidden');
    form.reset();
    document.querySelectorAll('.task-date').forEach(el => el.classList.add('hidden'));

    if (bonsaiToEdit) {
        modalTitle.textContent = "Modifier";
        document.getElementById('edit-id').value = bonsaiToEdit.id;
        document.getElementById('input-name').value = bonsaiToEdit.name;
        document.getElementById('input-species').value = bonsaiToEdit.speciesId;
        
        // On ne remplit pas l'historique complet dans le formulaire pour simplifier
        // On permet juste d'ajouter de nouveaux travaux
    } else {
        modalTitle.textContent = "Nouveau Bonsaï";
        document.getElementById('edit-id').value = "";
    }
}

function closeModal() {
    modal.classList.add('hidden');
    form.reset();
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('input-name').value;
    const species = document.getElementById('input-species').value;
    const photoInput = document.getElementById('input-photo');

    // Récupérer les nouvelles tâches
    const newTasks = [];
    document.querySelectorAll('.task-row').forEach(row => {
        const checkbox = row.querySelector('.task-check');
        const dateInput = row.querySelector('.task-date');
        
        if (checkbox.checked && dateInput.value) {
            newTasks.push({
                type: checkbox.value,
                date: dateInput.value
            });
        }
    });

    const processSave = (existingData = null) => {
        const bonsai = {
            name: name,
            speciesId: species,
            // Si on édite, on garde les anciennes tâches et on ajoute les nouvelles
            tasks: existingData ? [...(existingData.tasks || []), ...newTasks] : newTasks,
            image: existingData ? existingData.image : null
        };
        if (id) bonsai.id = parseInt(id);

        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                bonsai.image = evt.target.result;
                saveBonsaiToDB(bonsai);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            saveBonsaiToDB(bonsai);
        }
    };

    if (id) {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        transaction.objectStore(STORE_NAME).get(parseInt(id)).onsuccess = (e) => processSave(e.target.result);
    } else {
        processSave();
    }
});

window.editBonsai = (id) => {
    db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(id).onsuccess = (e) => openModal(e.target.result);
};
window.confirmDelete = (id) => {
    if(confirm("Supprimer ?")) deleteBonsaiFromDB(id);
};

init();
