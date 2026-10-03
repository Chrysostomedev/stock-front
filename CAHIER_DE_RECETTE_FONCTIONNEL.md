# 📘 Cahier de Recette Fonctionnel & Guide de Validation Client
**Système GestShop Cloud POS — Version 2.4.0**  
**Date :** 03 Octobre 2026  
**Branche Git :** `branch_askcustomer`  
**Document officiel de livraison technique & recette d'acceptation utilisateur (UAT)**

---

## 🎯 1. Contexte & Objectifs de la Livraison

Cette livraison majeure finalise les demandes formulées par le client pour moderniser et fiabiliser la chaîne complète de vente, d'inventaire et de gestion financière multi-boutiques :

1. **Suppression définitive des erreurs de saisie en caisse** grâce au scan automatique de codes-barres (via smartphone, webcam ou douchette USB/Bluetooth).
2. **Accélération des encaissements (×3)** avec ajout instantané au panier et décompte direct des stocks.
3. **Traçabilité totale des dates de péremption (DLC)** et mise en place d'une procédure comptable de mise au rebut avec calcul de la valeur financière perdue.
4. **Comptage physique d'inventaire en rayon** avec réconciliation automatique des surplus et des manquants.
5. **Visibilité financière sur la rentabilité réelle par produit** (Marge brute en XOF et taux de marge %).
6. **Ergonomie multi-boutiques sans couture** : élimination de tous les identifiants techniques `UUID/shopId` au profit des vrais noms de boutiques.

---

## 📊 2. Matrice Récapitulative des Nouvelles Fonctionnalités

| Chantier | Fonctionnalité Livrée | Écrans / Composants | Statut |
| :--- | :--- | :--- | :---: |
| **Chantier 1** | **Codes-barres GS1 & Dates d'Expiration (DLC)**<br>Génération automatique GS1/EAN-13 par boutique, calcul clé de contrôle, saisie DLC et statuts d'alerte. | `app/admin/produits/page.tsx`<br>`ProductService.generateBarcode` | ✅ Livré & Testé |
| **Chantier 2** | **Vente par Scanner Vidéo Caméra (Smartphone & PC)**<br>Modal vidéo haute performance (`@zxing/browser`), viseur laser, torche flash, bip sonore Web Audio, scan continu anti-rebond. | `components/ui/BarcodeScannerModal.tsx`<br>`app/admin/caisse`<br>`app/super/caisse`<br>`app/quinc/caisse` | ✅ Livré & Testé |
| **Chantier 3** | **Vente par Douchette Physique (USB / Bluetooth)**<br>Écoute en tâche de fond des frappes clavier haute vitesse (<50ms) + Enter sans focus requis. | `hooks/useBarcodeScanner.ts`<br>Toutes les caisses | ✅ Livré & Testé |
| **Chantier 4** | **Inventaire Physique & Réconciliation des Écarts**<br>Comptage réel en rayon, calcul des écarts (surplus / manque), valeur financière et ajustement automatique en base. | `app/admin/inventory/physique/page.tsx`<br>`InventoryService.adjustDiscrepancy` | ✅ Livré & Testé |
| **Chantier 5** | **Surveillance des DLC & Mise au Rebut (Write-off)**<br>Alertes par badge de couleur (Périmé, Critique <7j, Vigilance <30j) et sortie de stock au rebut avec motif. | `app/admin/inventory/perimes/page.tsx`<br>`InventoryService.writeOff` | ✅ Livré & Testé |
| **Chantier 6** | **Rapports Financiers des Pertes & Rebuts**<br>Bilan financier consolidé des pertes, ventilation par motif de rebut et exports officiels PDF / Excel. | `export.service.ts`<br>`app/dashboard/reports/losses` | ✅ Livré & Testé |
| **Chantier 7** | **Analyse Approfondie des Ventes & Marges COGS**<br>Tableau analytique : CA, Quantités, Coût d'achat, Marge brute (XOF) et Taux de marge (%) avec exports PDF/Excel. | `app/dashboard/reports/products/page.tsx`<br>`reports.service.ts` | ✅ Livré & Testé |
| **Chantier 8** | **Sélecteur Multi-Boutiques Global (Zéro UUID)**<br>Résolution automatique des noms de boutiques dans la Navbar, la barre d'onglets et les sous-titres. | `contexts/DashboardShopContext.tsx`<br>`components/ui/ShopSelector.tsx`<br>`app/dashboard/layout.tsx` | ✅ Livré & Testé |

---

## 🧪 3. Protocoles de Test Pas-à-Pas (User Acceptance Testing)

### 📌 Protocole 1 : Création de Produit & Génération Code-barres GS1 / DLC
- **URL à tester :** [http://localhost:3000/admin/produits](http://localhost:3000/admin/produits)
- **Étapes à exécuter :**
  1. Cliquez sur **« + Nouveau Produit »**.
  2. Renseignez le nom (ex : *« Yaourt Fraise 125g »*), le prix d'achat (*300*) et le prix de vente (*500*).
  3. Dans le champ Code-barres, cliquez sur le bouton bleu **« Générer GS1 »**.
     - **Constat attendu :** Un code EAN-13 valide débutant par `200` apparaît immédiatement.
  4. Dans le champ Date de péremption, sélectionnez une date dans 12 jours.
  5. Enregistrez le produit.
- **Résultat attendu :** Le produit est créé avec son code-barres et son badge d'expiration dynamique (ex: *« Dans 12 jours »*).

---

### 📌 Protocole 2 : Vente en Caisse avec la Caméra (Smartphone, Tablette ou PC)
- **URL à tester :** [http://localhost:3000/admin/caisse](http://localhost:3000/admin/caisse) (ou `/super/caisse`)
- **Étapes à exécuter :**
  1. Ouvrez votre session de caisse avec un fond de caisse initial (ex : *10 000 XOF*).
  2. À côté de la barre de recherche des articles, cliquez sur le bouton vert **« Scanner Caméra »**.
  3. Autorisez l'accès à la caméra dans le navigateur.
  4. Visez le code-barres généré au Protocole 1 (sur une étiquette ou affiché sur l'écran d'un smartphone).
  5. Observez la détection :
     - Émission d'un **bip sonore de caisse** (Web Audio API synthétique).
     - **Flash lumineux vert** sur le viseur laser.
     - Notification toast : *« Yaourt Fraise 125g ajouté au panier »*.
     - Le produit est ajouté au panier avec une quantité de 1 (ou incrémenté de +1 s'il y était déjà).
  6. Testez les commandes de la caméra :
     - Bouton **Lampe torche / Flash** pour éclairer les environnements sombres.
     - Bouton **Changer de caméra** pour basculer entre objectifs.
     - Interrupteur **Scan continu** : scannez 3 articles d'affilée sans refermer le modal.
- **Résultat attendu :** Ajout instantané sans toucher au clavier, calcul automatique du total de vente.

---

### 📌 Protocole 3 : Vente en Caisse avec Douchette Physique (USB / Bluetooth)
- **URL à tester :** [http://localhost:3000/admin/caisse](http://localhost:3000/admin/caisse)
- **Étapes à exécuter :**
  1. Branchez votre douchette USB ou associez une douchette Bluetooth.
  2. Gardez les mains libres, **sans cliquer dans la barre de recherche**.
  3. Scannez un article.
- **Résultat attendu :** Le hook d'écoute globale intercepte la frappe haute-vitesse et ajoute l'article au panier de vente automatiquement.

---

### 📌 Protocole 4 : Inventaire Physique & Réconciliation des Écarts
- **URL à tester :** [http://localhost:3000/admin/inventory/physique](http://localhost:3000/admin/inventory/physique)
- **Étapes à exécuter :**
  1. Sélectionnez votre boutique active.
  2. Sur la ligne d'un premier produit (stock théorique = 15), saisissez un comptage physique de *13* (écart : -2).
  3. Sur un second produit (stock théorique = 10), saisissez un comptage de *12* (écart : +2).
  4. Observez la bannière d'écarts en haut : elle affiche immédiatement la valeur financière nette de la différence en XOF.
  5. Cliquez sur le bouton de validation de l'inventaire.
- **Résultat attendu :** Les stocks réels sont mis à jour en base et un mouvement d'ajustement est tracé.

---

### 📌 Protocole 5 : Surveillance des Péremptions & Mise au Rebut (Write-off)
- **URL à tester :** [http://localhost:3000/admin/inventory/perimes](http://localhost:3000/admin/inventory/perimes)
- **Étapes à exécuter :**
  1. Observez la classification visuelle : badges *« Périmé »* (rouge), *« Critique <7j »* (orange), *« Vigilance <30j »* (jaune).
  2. Cliquez sur le bouton **« Mettre au rebut »** en face d'un produit périmé.
  3. Dans la modale, saisissez la quantité à détruire et sélectionnez le motif (ex: *« Périmé »* ou *« Avarié »*).
  4. Validez l'opération.
- **Résultat attendu :** Le stock est décompté et la perte financière est enregistrée dans le compte de perte de la boutique.

---

### 📌 Protocole 6 : Analyse Approfondie des Ventes & Marges par Produit
- **URL à tester :** [http://localhost:3000/dashboard/reports/products](http://localhost:3000/dashboard/reports/products)
- **Étapes à exécuter :**
  1. Sélectionnez la période souhaitée (ex: Mois en cours).
  2. Examinez les indicateurs de chaque produit :
     - Quantités vendues
     - Chiffre d'Affaires (XOF)
     - Coût des marchandises vendues (COGS en XOF)
     - Marge brute (XOF)
     - Taux de marge (%)
  3. Cliquez sur l'en-tête de colonne **« Marge »** pour trier par rentabilité décroissante.
  4. Cliquez sur **« Exporter PDF »** et **« Exporter Excel »**.
- **Résultat attendu :** Téléchargement instantané des rapports aux formats PDF et Excel tabulaire.

---

### 📌 Protocole 7 : Vérification du Sélecteur Multi-Boutiques (Zéro UUID)
- **URL à tester :** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Étapes à exécuter :**
  1. Observez la barre supérieure :
     - Le bouton affiche le nom en clair de votre boutique (ex : *« Boutique Cocody »* ou *« Boutique Plateau »*), **sans aucun identifiant technique** `cm8abc...`.
     - La liste déroulante et les onglets présentent les noms officiels et devises.
  2. Le sous-titre de la page d'accueil indique : *« Vue d'ensemble — [Nom de votre Boutique] »*.
  3. Basculez d'une boutique à l'autre : les chiffres, CA et alertes se rafraîchissent automatiquement.
- **Résultat attendu :** Interface 100% orientée utilisateur et débarrassée des données brutes de base de données.

---

## 📄 4. Comment générer le Document PDF Officiel ?

Pour fournir le document au format PDF imprimé ou prêt à être envoyé par email :

1. **Option 1 (Directe dans l'application) :**
   - Rendez-vous sur la page dédiée : [http://localhost:3000/docs/recette](http://localhost:3000/docs/recette)
   - Cliquez sur le bouton bleu **« Télécharger le PDF A4 »** ou **« Imprimer en PDF »**.

2. **Option 2 (Page HTML autonome) :**
   - Ouvrez directement : [http://localhost:3000/docs/cahier-recette-client.html](http://localhost:3000/docs/cahier-recette-client.html)
   - Cliquez sur le bouton d'impression en haut ou pressez `Ctrl + P` sur votre clavier.
   - Choisissez l'imprimante **« Enregistrer au format PDF »** avec mise en page A4.
   - Le document sera mis en page automatiquement avec saut de page élégant et feuille de signatures.

---

## ✍️ 5. Fiche de Signature de Recette Client

- **Pour l'équipe de développement :**
  - Statut : *Développé, testé et validé sur la branche `branch_askcustomer`*
  - Date : 03 / 10 / 2026

- **Pour le client / Responsable d'exploitation :**
  - Date de recette : ____ / ____ / 2026
  - Décision : [ ] Validé sans réserve &nbsp;&nbsp;&nbsp;&nbsp; [ ] Validé avec observations
  - Signature :
