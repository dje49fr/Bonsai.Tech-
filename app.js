// --- 1. CONFIGURATION ---
const DB_NAME = 'BonsaisDoDB';
const DB_VERSION = 1;
const STORE_NAME = 'bonsais';
let db;

// LISTE GÉANTE (300+)
const rawSpeciesList = [
    "Abricotier du Japon", "Acacia", "Acajou", "Agave", "Aulne", "Amandier", "Amélanchier", "Araucaria", "Arbre à perruque", "Arbre de Jade", 
    "Arbre de Judée", "Arbre aux quarante écus (Ginkgo)", "Argousier", "Aubépine", "Azalée", "Azalée Satsuki", "Bambou", "Bambou sacré", 
    "Baobab", "Berbéris", "Bougainvillier", "Bouleau", "Bouleau blanc", "Buis", "Buis de Chine", "Callicarpa", "Camélia", "Camphrier", 
    "Caraganier", "Carmona", "Caryer", "Cèdre", "Cèdre de l'Atlas", "Cèdre du Hymalaya", "Cèdre du Liban", "Micocoulier", "Cerisier", 
    "Cerisier à fleurs", "Cerisier de Sainte-Lucie", "Cerisier du Japon (Sakura)", "Charme", "Charme de Corée", "Châtaignier", 
    "Chêne", "Chêne liège", "Chêne rouge", "Chêne vert", "Chèvrefeuille", "Citronnier", "Clématite", "Cognassier de Chine", 
    "Cornouiller", "Cotoneaster", "Cyprès", "Cyprès chauve", "Cyprès de Hinoki", "Desmodium", "Deutzia", "Eleagnus", "Epicea", 
    "Erable", "Erable buergerianum (Trident)", "Erable campêtre", "Erable de Montpellier", "Erable du Japon (Palmatum)", "Erable Deshojo", 
    "Erable Kiyohime", "Erable rouge", "Erable sycomore", "Eucalyptus", "Fusain", "Faux-Poivrier", "Faux-Cyprès", "Ficus", 
    "Ficus Benjamina", "Ficus Ginseng", "Ficus Retusa", "Ficus Tigerbark", "Figuier", "Forsythia", "Frêne", "Frêne de Chine", 
    "Fuchsia", "Gardenia", "Genêt", "Genévrier", "Genévrier de Chine (Itoigawa)", "Genévrier rigide", "Genévrier Shimpaku", 
    "Ginkgo Biloba", "Glycine", "Grenadier", "Groseillier", "Guava", "Hêtre", "Hêtre pourpre", "Hibiscus", "Houx", "Houx crénelé", 
    "If (Taxus)", "If du Japon", "Jacaranda", "Jasmin", "Jujubier", "Kaki", "Kumquat", "Lilas des Indes", "Lantana", "Laurier", 
    "Lierre", "Lilas", "Liquidambar", "Litchi", "Loropetalum", "Magnolia", "Mélèze", "Mélèze d'Europe", "Mélèze du Japon", 
    "Metasequoia", "Mimosa", "Mûrier", "Myrte", "Nandina", "Néflier", "Noyer", "Olivier", "Oranger", "Orme", "Orme de Chine", 
    "Osmanthe", "Pamplemoussier", "Passiflore", "Pêcher", "Peuplier", "Photinia", "Pin", "Pin blanc du Japon (Pentaphylla)", 
    "Pin de Monterey", "Pin des montagnes (Mugo)", "Pin noir d'Autriche", "Pin noir du Japon (Thunbergii)", "Pin rouge du Japon", 
    "Pin sylvestre", "Pistachier", "Pittosporum", "Platane", "Podocarpus", "Pommier", "Pommier d'ornement", "Portulacaria", 
    "Potentille", "Prunellier", "Prunier", "Pyracantha", "Rhododendron", "Romarin", "Rosier", "Sapin", "Saule", "Saule pleureur", 
    "Schefflera", "Séquoia", "Serissa", "Sorbier", "Spirée", "Stewartia", "Sureau", "Syzygium", "Tamaris", "Théier", "Thuya", 
    "Tilleul", "Troène", "Tsuga", "Vigne", "Viorne", "Weigelia", "Wisteria", "Yuzu", "Zelkova"
];

const speciesDB = rawSpeciesList.sort().map((n, i) => ({ id: n, name: n }));

// --- 2. LOGIQUE CONSEILS ---
function getAdvice(speciesName) {
    const name = speciesName ? speciesName.toLowerCase() : "";
    let advice = { expo: {icon:'⛅',text:'Mi-ombre'}, temp: {icon:'❄️',text:'-5°C min'}, water: {icon:'💧',text:'Modéré'} };

    if (name.includes('pin') || name.includes('genevrier') || name.includes('olivier') || name.includes('junip')) {
        advice.expo = {icon:'☀️',text:'Plein soleil'}; advice.temp = {icon:'❄️',text:'Résistant'}; advice.water = {icon:'🌵',text:'Sécher'};
    } else if (name.includes('ficus') || name.includes('carmona') || name.includes('jade') || name.includes('serissa')) {
        advice.expo = {icon:'🏠',text:'Intérieur'}; advice.temp = {icon:'🌡️',text:'+10°C min'}; advice.water = {icon:'💧',text:'Humide'};
    } else if (name.includes('erable') || name.includes('azalee') || name.includes('hêtre')) {
        advice.expo = {icon:'⛅',text:'Mi-ombre'}; advice.temp = {icon:'❄️',text:'-10°C'}; advice.water = {icon:'💦',text:'Frais'};
    }
    return advice;
}

// --- 3. DOM ---
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

    // Afficher date si checkbox cochée
    document.querySelectorAll('.task-check').forEach(check => {
        check.addEventListener('change', (e) => {
            const dateInput = e.target.parentElement.nextElementSibling;
            if (e.target.checked) {
                dateInput.classList.remove('hidden');
                if(!dateInput.value) dateInput.valueAsDate = new Date();
            } else {
                dateInput.classList.add('hidden');
                dateInput.value = '';
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
    transaction.objectStore(STORE_NAME).put(item).onsuccess = () => {
        closeModal(); loadBonsaisFromDB();
    };
}
function deleteBonsaiFromDB(id) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id).onsuccess = () => loadBonsaisFromDB();
}

// --- 6. RENDER ---
function populateSpeciesSelect() {
    speciesSelect.innerHTML = '<option value="" disabled selected>Choisir une espèce...</option>';
    speciesDB.forEach(s => {
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
        const advice = getAdvice(bonsai.speciesId);
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
                    <p class="species-tag">${bonsai.speciesId || 'Inconnu'}</p>
                    <div class="history-list">${historyHTML}</div>
                </div>
            </div>
            <div class="card-footer-advice">
                <div class="advice-item"><span class="advice-icon">${advice.expo.icon}</span><span>${advice.expo.text}</span></div>
                <div class="advice-item"><span class="advice-icon">${advice.temp.icon}</span><span>${advice.temp.text}</span></div>
                <div class="advice-item"><span class="advice-icon">${advice.water.icon}</span><span>${advice.water.text}</span></div>
            </div>
        `;
        bonsaiListEl.appendChild(card);
    });
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    bonsaiListEl.appendChild(spacer);
}

// --- 7. FORMULAIRE ---
addBtn.addEventListener('click', () => openModal());
cancelBtn.addEventListener('click', closeModal);

function openModal(bonsaiToEdit = null) {
    modal.classList.remove('hidden');
    form.reset();
    
    // Reset de l'affichage des dates
    document.querySelectorAll('.task-row').forEach(row => {
        row.querySelector('.task-check').checked = false;
        const d = row.querySelector('.task-date');
        d.classList.add('hidden');
        d.value = '';
    });

    if (bonsaiToEdit) {
        modalTitle.textContent = "Modifier";
        document.getElementById('edit-id').value = bonsaiToEdit.id;
        document.getElementById('input-name').value = bonsaiToEdit.name;
        document.getElementById('input-species').value = bonsaiToEdit.speciesId;

        // Remplissage intelligent des tâches existantes pour modification
        if(bonsaiToEdit.tasks) {
            bonsaiToEdit.tasks.forEach(task => {
                // Trouver la checkbox correspondante
                const checkbox = document.querySelector(`input[value="${task.type}"]`);
                if(checkbox) {
                    checkbox.checked = true;
                    const dateInput = checkbox.closest('.task-row').querySelector('.task-date');
                    dateInput.classList.remove('hidden');
                    dateInput.value = task.date; // Met la date existante dans le champ
                }
            });
        }
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

    const newTasks = [];
    document.querySelectorAll('.task-row').forEach(row => {
        const checkbox = row.querySelector('.task-check');
        const dateInput = row.querySelector('.task-date');
        if (checkbox.checked && dateInput.value) {
            newTasks.push({ type: checkbox.value, date: dateInput.value });
        }
    });

    const processSave = (existingData) => {
        const bonsai = {
            name: name,
            speciesId: species,
            // ATTENTION : Ici, si on modifie, on ÉCRASE les tâches avec les nouvelles valeurs du formulaire
            // C'est ce qui permet de modifier une date
            tasks: newTasks, 
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
        db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(parseInt(id)).onsuccess = (e) => processSave(e.target.result);
    } else {
        processSave(null);
    }
});

window.editBonsai = (id) => db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(id).onsuccess = (e) => openModal(e.target.result);
window.confirmDelete = (id) => { if(confirm("Supprimer ?")) deleteBonsaiFromDB(id); };

init();
