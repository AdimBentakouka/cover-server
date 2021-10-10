# CoverJS-server
Application expressJS & Typescript pour gérer une bibliothèques 
d'e-book au format (.zip, .rar, .cbz, .cbr)

---
## Routes
---
* hostname:port/metadata/ => affiche toutes la collections
* hostname:port/metadata/getAnalyze => affiche les elements à traiter
* hostname:port/metadata/getCover/:covername => affiche la couverture :covername
* hostname:port/metadata/:nameCollection => affiche les volumes de la collection :nameCollection 

* hostname:port/reader/:id/:page => affiche la page numéro :page du volume :id


---
## Patch notes
---
## V0.1

* [x] Utilitaire Metadata :
  
  * [x] Analyser un volume :
    * [x] Nom du volume sous la forme TXX | CHAP XXX | XXX
    * [x] Nom de la collection
    * [x] Nombre de la page
    * [x] Générer la Couverture
    * [x] Listes des éléments analysés
    * [x] Faire une queue des elements analysés
    * [x] Clear les volumes qui ne sont plus présents dans le repertoire à lancer au démarrage du serveur

* [x] Route metadata
  * [x] Retourner la liste des collections avec son nombre de volume
  * [x] Retourner la liste des volumes
  * [x] Retourner l'image du volume

* [x] Route reader
  * [x] Retourner l'image de la page souhaité

* [x] Utilitaire watchdir :
  * [x] Lancement du serveur une première sur les fichiers ajoutés 
        supprimer en fonction de la présence sur le disque ou de leur taille
        
  * [x] Lancer une analyse lorsqu'un fichier est ajouté
  * [x] Supprimer un volume lorsqu'un fichier est supprimé
  * [x] Mettre à jour un volume lorsqu'un fichier est mis à jour