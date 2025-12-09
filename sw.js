// --- 1. BASE DE DONNÉES DES ESPÈCES (Exemple réduit des 300) ---
const speciesDB = [
    { id: 'pin_blanc', name: 'Pin Blanc du Japon', waterFreq: 3, pruning: 'Octobre - Novembre' },
    { id: 'erable', name: 'Érable du Japon', waterFreq: 2, pruning: 'Juin (Effeuillage)' },
    { id: 'genevrier', name: 'Genévrier (Juniperus)', waterFreq: 4, pruning: 'Toute l\'année' },
    { id: 'orme', name: 'Orme de Chine', waterFreq: 2, pruning: 'Mars - Avril' },
    { id: 'ficus', name: 'Ficus Retusa', waterFreq: 3, pruning: 'Mai' },
    { id: 'azalee', name: 'Azalée Satsuki', waterFreq: 1, pruning: 'Après floraison' },
    { id: 'olivier', name: 'Olivier Sauvage', waterFreq: 5, pruning: 'Printemps' },
    // ... Imaginez ici vos 300 autres entrées
];

// --- 2. ÉTAT DE L'APPLICATION ---
let myBonsais = JSON.parse(localStorage.getItem('bonsaisDoData')) || [];

// --- 3. DOM ELEMENTS ---
const bonsaiListEl = document.getElementById('bonsai-list');
const countEl = document.getElementById('compteur-arbres');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal-overlay');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('bonsai-form');
const speciesSelect = document.getElementById('input-species');

// --- 4. INITIALISATION ---
function init() {
    populateSpeciesSelect();
    renderCarousel();
}

// Remplir la liste déroulante avec la DB
function populateSpeciesSelect() {
    speciesDB.forEach(species => {
        const option = document.createElement('option');
        option.value = species.id;
        option.textContent = species.name;
        speciesSelect.appendChild(option);
    });
}

// --- 5. RENDU DU CAROUSEL ---
function renderCarousel() {
    bonsaiListEl.innerHTML = ''; // Nettoyer

    // Mise à jour du compteur
    const count = myBonsais.length;
    countEl.textContent = count > 0 ? `Vos ${count} arbres se portent bien.` : "Aucun arbre. Ajoutez-en un !";

    if (count === 0) {
        bonsaiListEl.innerHTML = '<div class="empty-msg">Appuyez sur + pour commencer</div>';
        return;
    }

    myBonsais.forEach((bonsai, index) => {
        // Trouver les infos de l'espèce dans la DB
        const speciesInfo = speciesDB.find(s => s.id === bonsai.speciesId) || { name: 'Inconnu', waterFreq: 3, pruning: '?' };
        
        // Calcul arrosage (Simplifié)
        const lastWater = new Date(bonsai.lastWatered);
        const nextWater = new Date(lastWater);
        nextWater.setDate(lastWater.getDate() + speciesInfo.waterFreq);
        
        const today = new Date();
        const diffTime = nextWater - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        let waterStatusHTML = '';
        if (diffDays <= 0) {
            waterStatusHTML = `<span class="info-pill urgent">💧 Arroser !</span>`;
        } else {
            waterStatusHTML = `<span class="info-pill">💧 J-${diffDays}</span>`;
        }

        // Création de la carte HTML
        const card = document.createElement('div');
        card.className = 'bonsai-card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteBonsai(${index})">&times;</button>
            <div class="card-image">
                <img src="${bonsai.image || 'https://via.placeholder.com/300x350/E0D6C8/333?text=Bonsai'}" alt="${bonsai.name}">
            </div>
            <div class="card-details">
                <h2>${bonsai.name}</h2>
                <p class="species-tag">${speciesInfo.name}</p>
                <div class="actions">
                    ${waterStatusHTML}
                    <span class="info-pill">✂️ ${speciesInfo.pruning}</span>
                </div>
            </div>
        `;
        bonsaiListEl.appendChild(card);
    });

    // Ajouter l'espaceur final
    const spacer = document.createElement('div');
    spacer.className = 'spacer';
    bonsaiListEl.appendChild(spacer);
}

// --- 6. GESTION DES ÉVÉNEMENTS ---

// Ouvrir/Fermer Modal
addBtn.addEventListener('click', () => modal.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

// Sauvegarder un nouveau bonsaï
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('input-name').value;
    const speciesId = document.getElementById('input-species').value;
    const date = document.getElementById('input-water').value;
    const photoInput = document.getElementById('input-photo');

    // Gestion simple de l'image (File Reader pour afficher en local)
    let imageBase64 = null;
    
    if (photoInput.files && photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageBase64 = e.target.result;
            saveBonsaiData(name, speciesId, date, imageBase64);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveBonsaiData(name, speciesId, date, null);
    }
});

function saveBonsaiData(name, speciesId, date, image) {
    const newBonsai = {
        name: name,
        speciesId: speciesId,
        lastWatered: date,
        image: image // Attention : localStorage a une limite de taille, pour une vraie app il faudrait IndexedDB
    };

    myBonsais.push(newBonsai);
    localStorage.setItem('bonsaisDoData', JSON.stringify(myBonsais));
    
    form.reset();
    modal.classList.add('hidden');
    renderCarousel();
}

// Supprimer un bonsaï (Fonction globale pour être accessible dans le HTML)
window.deleteBonsai = function(index) {
    if(confirm('Voulez-vous supprimer cet arbre ?')) {
        myBonsais.splice(index, 1);
        localStorage.setItem('bonsaisDoData', JSON.stringify(myBonsais));
        renderCarousel();
    }
};

// Lancer l'app
init();
