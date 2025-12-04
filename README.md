Absolument ! Voici un fichier `README.md` complet et professionnel pour votre outil d'ajout de collaborateurs GitHub, intégrant toutes les fonctionnalités que nous avons développées (PAT, Live Polling, Thème Dark/Light).

---

# 🤝 GitHub Collaborator Bulk Inviter

## 🚀 Vue d'ensemble du Projet

Cet outil est une interface web simple et intuitive conçue pour **faciliter l'ajout d'un grand nombre de collaborateurs** à un dépôt GitHub spécifique. Au lieu d'envoyer manuellement des invitations une par une via l'interface GitHub, cet outil utilise l'API GitHub pour automatiser le processus.

Une fois les invitations envoyées, l'outil utilise la technique du **Polling** pour afficher en **direct et en temps réel** (Live Status) le statut de l'invitation pour chaque utilisateur (en attente ou acceptée).

## ✨ Fonctionnalités Clés

* **Ajout en masse :** Invite plusieurs utilisateurs simultanément.
* **Sécurité renforcée :** Utilise des **Tokens à Granularité Fine (PAT)** pour des permissions ciblées.
* **Statut en Direct (Live Polling) :** Met à jour l'état de l'invitation (En attente, Accepté, Déjà collaborateur) sans recharger la page.
* **Design Adaptatif :** Interface épurée, responsive, avec support pour les **Thèmes Clair et Sombre** (Dark/Light).

## 🛠️ Configuration et Démarrage

Ce projet est une application web purement front-end et ne nécessite aucun serveur.

### 1. Structure des Fichiers

Pour lancer l'application, vous avez besoin des trois fichiers suivants dans le même dossier :

* `index.html`
* `style.css`
* `script.js`

### 2. Démarrage

1.  Ouvrez le fichier **`index.html`** dans votre navigateur web.
2.  L'application est immédiatement fonctionnelle.

---

## 🔒 Obtention de votre Token d'Accès Personnel (PAT)

L'utilisation de ce script nécessite un **PAT (Personal Access Token)** valide pour que votre application soit autorisée à effectuer des actions sur GitHub en votre nom.

### ⚠️ Sécurité

Le PAT est l'équivalent de votre mot de passe pour l'API GitHub. Il est traité de manière sécurisée par l'application : **il n'est ni stocké, ni transmis à un serveur tiers.**

### Permissions requises

Pour un dépôt d'organisation (comme `PlateformeProjects/moulinage`), il est fortement recommandé d'utiliser un **Token à Granularité Fine** et de lui accorder uniquement les permissions nécessaires :

| Ressource | Permission requise |
| :--- | :--- |
| **Accès au Dépôt** | Limité au dépôt ciblé (`moulinage`) |
| **Permissions du Dépôt** | **Administration** : `Read and Write` (pour inviter des collaborateurs) |

### Étapes de création du PAT

1.  Accédez à **Settings** sur GitHub.
2.  **Developer settings** > **Personal access tokens** > **Tokens (fine-grained)**.
3.  Cliquez sur **Generate new token** et configurez les accès ci-dessus.

---

## 💻 Utilisation de l'Interface

1.  **Token :** Collez votre **PAT** (Token d'Accès Personnel) dans le champ dédié.
2.  **Propriétaire/Dépôt :** Entrez le nom du propriétaire (utilisateur ou organisation) et le nom exact du dépôt (ex: `PlateformeProjects` et `moulinage`).
3.  **Collaborateurs :** Entrez les pseudos GitHub des personnes à inviter, séparés par des virgules, des espaces ou des sauts de ligne.
4.  **Lancer :** Cliquez sur **`🚀 Lancer les Invitations`**.
5.  **Suivi Live :** La colonne de droite affichera en temps réel le statut de chaque invitation (mise à jour toutes les 10 secondes).

---

## ⚙️ Détails Techniques

L'application communique avec l'API GitHub via la méthode `PUT /repos/{owner}/{repo}/collaborators/{username}`.

Le suivi en temps réel est effectué par une boucle de **Polling JavaScript** qui interroge régulièrement le point de terminaison : `GET /repos/{owner}/{repo}/invitations` pour vérifier si une invitation a été retirée de la liste (signifiant qu'elle a été acceptée).