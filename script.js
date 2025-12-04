// =========================================================
// VARIABLES GLOBALES ET CONSTANTES
// =========================================================
let collaboratorStatus = {};
const POLLING_INTERVAL = 10000; // 10 secondes
const THEME_STORAGE_KEY = 'githubThemePreference';

// =========================================================
// LOGIQUE DE GESTION DU THÈME DARK/LIGHT
// =========================================================

const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;

function setTheme(isDark) {
    if (isDark) {
        body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = 'Passer au Thème Clair ☀️';
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
        body.classList.remove('dark-theme');
        themeToggleBtn.innerHTML = 'Passer au Thème Sombre 🌙';
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
}

function initializeTheme() {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    
    // 1. Vérifie la préférence stockée
    if (storedPreference === 'dark') {
        setTheme(true);
    } else if (storedPreference === 'light') {
        setTheme(false);
    } else {
        // 2. Sinon, vérifie la préférence du système d'exploitation
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark);
    }
}

themeToggleBtn.addEventListener('click', () => {
    const isCurrentlyDark = body.classList.contains('dark-theme');
    setTheme(!isCurrentlyDark);
});

// Initialiser le thème au chargement
initializeTheme();

// =========================================================
// LOGIQUE DU FORMULAIRE ET DE L'API GITHUB
// =========================================================

document.getElementById('collaboratorForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // 1. Réinitialisation de l'état
    collaboratorStatus = {};
    document.getElementById('resultsTable').querySelector('tbody').innerHTML = '';
    document.getElementById('dynamicResults').style.display = 'none';

    const token = document.getElementById('token').value;
    const owner = document.getElementById('owner').value;
    const repo = document.getElementById('repo').value;
    const rawCollaborators = document.getElementById('collaborators').value;
    const submitButton = document.getElementById('submitButton');
    const resultsTBody = document.getElementById('resultsTable').querySelector('tbody');

    const collaboratorsArray = rawCollaborators
        .split(/[\s,]+/)
        .map(user => user.trim())
        .filter(user => user.length > 0);

    if (collaboratorsArray.length === 0) {
        displayMessage('error', 'Veuillez entrer au moins un pseudo GitHub.');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Envoi des invitations...';
    document.getElementById('statusMessage').style.display = 'none';
    document.getElementById('dynamicResults').style.display = 'block';

    let successCount = 0;
    let failCount = 0;

    // 2. Boucle d'envoi des invitations (PUT)
    for (const username of collaboratorsArray) {
        const url = `https://api.github.com/repos/${owner}/${repo}/collaborators/${username}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permission: 'push' })
            });

            const newRow = resultsTBody.insertRow();
            
            if (response.status === 201) { 
                successCount++;
                updateCollaboratorRow(newRow, username, 'invited', 'Invitation envoyée (Vérification Live)');
                // Stocker pour le polling
                collaboratorStatus[username] = { status: 'invited', row: newRow };

            } else if (response.status === 204) {
                successCount++;
                updateCollaboratorRow(newRow, username, 'collaborator', 'Déjà collaborateur');

            } else {
                failCount++;
                const errorData = await response.json();
                updateCollaboratorRow(newRow, username, 'failed', `Échec: ${errorData.message || response.statusText}`);
            }

        } catch (error) {
            failCount++;
            const newRow = resultsTBody.insertRow();
            updateCollaboratorRow(newRow, username, 'failed', `Erreur réseau/connexion.`);
            console.error(error);
        }
    }
    
    // 3. Message de Fin et Démarrage du Polling
    const initialMsg = `Terminé : ${successCount} succès (invitations et existants), ${failCount} échec(s).`;
    displayMessage(failCount > 0 ? 'error' : 'success', initialMsg);
    submitButton.disabled = false;
    submitButton.textContent = '🚀 Lancer les Invitations';
    
    const invitedUsers = Object.keys(collaboratorStatus).filter(u => collaboratorStatus[u].status === 'invited');

    if (invitedUsers.length > 0) {
        startPollingForStatus(token, owner, repo);
    } else {
        document.getElementById('lastUpdated').textContent = "Aucune invitation en attente à suivre.";
    }
});


// Fonction pour mettre à jour la ligne du tableau
function updateCollaboratorRow(row, username, type, message) {
    row.innerHTML = ''; 

    const userCell = row.insertCell(0);
    userCell.textContent = username;

    const statusCell = row.insertCell(1);
    const badge = document.createElement('span');
    badge.classList.add('status-badge', `status-${type}`);
    
    let displayMessage = '';
    if (type === 'invited') displayMessage = 'En attente';
    else if (type === 'accepted') displayMessage = 'Accepté !';
    else if (type === 'collaborator') displayMessage = 'Collaborateur';
    else if (type === 'failed') displayMessage = 'Échec';

    badge.textContent = displayMessage;
    statusCell.appendChild(badge);

    const actionCell = row.insertCell(2);
    actionCell.textContent = message;
}

// Logique de Polling pour la vérification dynamique
async function startPollingForStatus(token, owner, repo) {
    const invitedUsers = Object.keys(collaboratorStatus).filter(u => collaboratorStatus[u].status === 'invited');
    const lastUpdatedElement = document.getElementById('lastUpdated');
    
    if (invitedUsers.length === 0) {
        lastUpdatedElement.textContent = `Tous les statuts d'invitation ont été mis à jour. (Terminé)`;
        return; 
    }
    
    lastUpdatedElement.textContent = `Vérification du statut... (Dernière vérification: ${new Date().toLocaleTimeString()})`;

    const url = `https://api.github.com/repos/${owner}/${repo}/invitations`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.statusText}`);
        }

        const pendingInvitations = await response.json();
        const pendingUsernames = pendingInvitations.map(inv => inv.invitee.login);

        invitedUsers.forEach(username => {
            if (!pendingUsernames.includes(username)) {
                // L'invitation a disparu -> statut accepté
                
                const statusData = collaboratorStatus[username];
                if (statusData && statusData.status === 'invited') {
                    statusData.status = 'accepted';
                    updateCollaboratorRow(statusData.row, username, 'accepted', 'Invitation acceptée (Statut Live)');
                }
            }
        });

    } catch (error) {
        console.error("Erreur lors de la vérification des invitations:", error);
        lastUpdatedElement.textContent = `Erreur de vérification: ${error.message}`;
    }

    // Planifier la prochaine vérification
    setTimeout(() => startPollingForStatus(token, owner, repo), POLLING_INTERVAL);
}

// Fonction utilitaire pour afficher les messages généraux
function displayMessage(type, message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.className = `status-box ${type}`;
    statusMessage.innerHTML = message;
    statusMessage.style.display = 'block';
}