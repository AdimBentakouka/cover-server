# CoverJS-server

Application expressJS & Typescript pour gérer une bibliothèques
d'e-book au format (.zip, .rar, .cbz, .cbr)

---

## Routes

---

## TODO

-   [ ] Créer une documentation des routes
-   [ ] Optimisation
    -   [ ] Rendre cohérent les réponse des routes

---

## Patch notes

---

## v1.1.0

-   [x] Services metadata

    -   [x] Optimisation du service metadata
    -   [x] Si cover.jpg présent dans le repertoire prendre cette image comme couverture pour tous les volumes

-   [x] Optimisation
    -   [x] Avoir un fichier séparer pour les types
-   [x] Route utilisateur
    -   [x] Récupérer les volumes en cours de lecture / le prochain tome à lire

---

## v1.0.5

-   [x] Correction des chemins des templates pour les mails

-   [x] Gestion des utilisateurs
    -   [x] Créer un compte
    -   [x] Créer un compte admin par defaut
    -   [x] Connexion token & refreshToken
    -   [x] middleware auth
    -   [x] etre authentifié pour accéder au routes de l'api sauf création & login

---

## V1.0.0

-   [x] Utilitaire Metadata :

    -   [x] Analyser un volume :
        -   [x] Nom du volume sous la forme TXX | CHAP XXX | XXX
        -   [x] Nom de la collection
        -   [x] Nombre de page
        -   [x] Générer la Couverture
        -   [x] Listes des éléments analysés
        -   [x] Faire une queue des elements analysés
        -   [x] Clear les volumes qui ne sont plus présents dans le repertoire à lancer au démarrage du serveur

-   [x] Route metadata

    -   [x] Retourner la liste des collections avec son nombre de volume
    -   [x] Retourner la liste des volumes
    -   [x] Retourner l'image du volume

-   [x] Route reader

    -   [x] Retourner l'image de la page souhaité

-   [x] Utilitaire watchdir :
    -   [x] Lancement du serveur une première sur les fichiers ajoutés
            supprimer en fonction de la présence sur le disque ou de leur taille
    -   [x] Lancer une analyse lorsqu'un fichier est ajouté
    -   [x] Supprimer un volume lorsqu'un fichier est supprimé
    -   [x] Mettre à jour un volume lorsqu'un fichier est mis à jour
