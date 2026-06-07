# SP SERVICES — Document de Vision Produit V2
**Version** : 2.0 | **Date** : Juin 2026 | **Auteur** : Équipe SP Services  
**Statut** : Proposition — En cours de discussion

---

## Table des matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [État Actuel — Version 1](#2-état-actuel--version-1)
3. [Objectifs de la Version 2](#3-objectifs-de-la-version-2)
4. [Nouvelles Fonctionnalités Détaillées](#4-nouvelles-fonctionnalités-détaillées)
5. [Architecture Technique V2](#5-architecture-technique-v2)
6. [Expérience Utilisateur](#6-expérience-utilisateur)
7. [Roadmap & Planning](#7-roadmap--planning)
8. [Modèle Économique](#8-modèle-économique)
9. [Équipe & Rôles](#9-équipe--rôles)

---

## 1. Résumé Exécutif

**SP Services** est une plateforme de gestion commerciale multi-boutiques conçue pour les commerces africains (épiceries, superettes, quincailleries). La Version 1 couvre la gestion des ventes, des stocks, des clients et des bons de commande avec un mode hors-ligne natif.

La **Version 2** vise à transformer SP Services d'un outil de gestion en une **plateforme commerciale complète** : paiements intégrés, intelligence sur les ventes, application mobile native et ouverture à d'autres types de commerces.

> **Vision V2** : Permettre à n'importe quel commerçant africain de gérer son activité entièrement depuis son téléphone, même sans connexion internet stable, avec des outils jusqu'ici réservés aux grandes entreprises.

---

## 2. État Actuel — Version 1

### Ce qui existe et fonctionne

| Module | Fonctionnalités |
|--------|----------------|
| **Dashboard Admin** | Analytics ventes, KPIs multi-boutiques, bilan financier, journal d'activité |
| **Caisse (POS)** | Vente produits, panier, paiements cash/mobile money/carte/crédit |
| **Gestion Stock** | Produits, catégories, transferts inter-boutiques, bons de commande fournisseurs |
| **Clients & Crédits** | Fichier client, suivi des dettes, programme fidélité |
| **Fournisseurs** | Annuaire, bons de commande, réception de marchandises |
| **Multi-rôles** | Admin, Super Admin, Caissier, Gérant, Auditeur |
| **Mode Hors-ligne** | File d'attente locale, sync automatique à la reconnexion |
| **PWA** | Installable sur mobile, service worker actif |

### Modules couverts
- `/admin` — Interface super administrateur
- `/super` — Interface caissier superette
- `/quinc` — Interface gérant quincaillerie

### Points forts actuels
- Architecture offline-first robuste
- Interface responsive desktop et mobile
- Système de cache intelligent (TTL 24h)
- Auth multi-rôles avec tokens offline dédiés

---

## 3. Objectifs de la Version 2

### Objectif 1 — Productivité terrain
Réduire le temps de traitement d'une vente de **45 secondes à moins de 15 secondes** grâce au scanner code-barres et aux raccourcis caisse.

### Objectif 2 — Paiements intégrés
Ne plus saisir manuellement les paiements Mobile Money. Déclencher la demande directement depuis la caisse et confirmer automatiquement.

### Objectif 3 — Intelligence commerciale
Passer de l'affichage de données historiques à des **recommandations actionnables** : "ce produit sera en rupture dans 5 jours", "cette boutique sous-performe ce mois".

### Objectif 4 — Application mobile native
Publier SP Services sur le **Google Play Store** et **l'App Store** pour une expérience mobile optimale (notifications OS, accès caméra, biométrie).

### Objectif 5 — Scalabilité multi-secteur
Adapter la plateforme à d'autres types de commerces : pharmacies, restaurants, salons de coiffure, tout en gardant le même backend.

---

## 4. Nouvelles Fonctionnalités Détaillées

---

### 4.1 Scanner Code-barres

**Problème actuel** : La caissière cherche les produits par texte → lent, erreurs possibles.

**Solution V2** : Scanner via la caméra du téléphone ou un lecteur USB/Bluetooth.

**Fonctionnement** :
- Sur mobile : appuyer sur l'icône scanner → caméra s'ouvre → produit ajouté au panier automatiquement
- Sur desktop : compatibilité avec les scanners USB (émulation clavier)
- Si le code-barres n'existe pas : proposer de créer le produit avec ce code

**Impact** : ×3 sur la vitesse de caisse, zéro erreur de saisie.

**Technologies** : `@zxing/browser` (open source, fonctionne hors-ligne)

---

### 4.2 Export PDF & Excel

**Problème actuel** : Les rapports ne peuvent pas être partagés ou archivés.

**Solution V2** : Bouton "Exporter" sur chaque rapport, liste et tableau.

**Documents exportables** :
- Bon de commande fournisseur (PDF avec logo boutique)
- Rapport de ventes journalier / mensuel (PDF + Excel)
- Inventaire produits (Excel)
- Historique des ventes client (PDF)
- Bilan financier période (PDF)
- Ticket de caisse (PDF thermique)

**Technologies** : `jsPDF` + `jspdf-autotable` pour PDF, `xlsx` pour Excel

---

### 4.3 Notifications Push Intelligentes

**Problème actuel** : L'admin doit vérifier manuellement les alertes.

**Solution V2** : Alertes automatiques envoyées sur le téléphone.

**Types de notifications** :

| Déclencheur | Destinataire | Message |
|-------------|-------------|---------|
| Stock < seuil minimum | Admin + Gérant | "Ciment Portland : 3 sacs restants. Seuil : 10" |
| Session caisse non fermée à 22h | Caissier | "N'oubliez pas de clôturer votre caisse" |
| Transfert stock en attente | Admin | "Transfert de Boutique A → B en attente de validation" |
| Bon de commande livré | Gérant | "Livraison fournisseur Kouamé & Fils confirmée" |
| Vente crédit > 30 jours | Admin | "Client Jean Dupont doit 45 000 FCFA depuis 32 jours" |

**Technologies** : Web Push API (déjà supporté par le service worker existant) + Firebase Cloud Messaging pour mobile natif

---

### 4.4 Intégration Mobile Money

**Problème actuel** : Le caissier saisit "Mobile Money" mais doit vérifier le paiement manuellement sur son téléphone.

**Solution V2** : Paiement déclenché et confirmé directement depuis la caisse.

**Fonctionnement** :
1. Caissier choisit "Mobile Money" → saisit le numéro du client
2. L'app envoie une demande de paiement au téléphone du client (USSD push)
3. Client entre son PIN sur son téléphone
4. Confirmation automatique en 5-10 secondes → vente validée, reçu imprimé

**Opérateurs cibles** :
- MTN Mobile Money (Côte d'Ivoire, Cameroun, Ghana...)
- Orange Money (Côte d'Ivoire, Sénégal, Mali...)
- Wave (Sénégal, Côte d'Ivoire)
- Moov Money

**Technologies** : APIs officielles des opérateurs + fallback manuel si API indisponible

---

### 4.5 Prévisions de Réapprovisionnement (IA Légère)

**Problème actuel** : Les ruptures de stock sont découvertes trop tard.

**Solution V2** : Système de prédiction basé sur l'historique de ventes.

**Fonctionnement** :
- Analyse de la vitesse de vente de chaque produit (moyenne mobile sur 30 jours)
- Calcul du nombre de jours avant rupture estimée
- Suggestion automatique des quantités à commander dans les bons de commande
- Alerte préventive 7 jours avant la rupture estimée

**Affichage dans le dashboard** :
```
⚠️  Produits à risque cette semaine
────────────────────────────────────
Sucre 1kg       → Rupture estimée dans 4 jours  [Commander]
Huile Palme 5L  → Rupture estimée dans 6 jours  [Commander]
Farine 25kg     → Rupture estimée dans 9 jours  [Commander]
```

**Technologies** : Calcul côté backend (Node.js), aucune dépendance ML externe requise

---

### 4.6 Module Retours & Remboursements

**Problème actuel** : Aucun workflow pour gérer un retour client ou une erreur de caisse.

**Solution V2** : Module complet de gestion des retours.

**Cas couverts** :
- Produit défectueux retourné → remboursement ou échange
- Erreur de scan en caisse → annulation partielle de la vente
- Retour crédit client → déduction de la dette

**Workflow** :
1. Recherche de la vente originale (par numéro de ticket)
2. Sélection des articles retournés et quantités
3. Choix : remboursement cash / avoir / échange produit
4. Réintégration automatique du stock
5. Mise à jour du bilan financier

---

### 4.7 Inventaire Physique Guidé

**Problème actuel** : Les pages inventaire existent mais le processus de comptage n'est pas structuré.

**Solution V2** : Workflow complet de stocktake.

**Étapes** :
1. **Lancement** : Admin crée une session d'inventaire (bloque les ventes optionnellement)
2. **Comptage** : Caissier scanne chaque produit et saisit la quantité physique comptée
3. **Écarts** : Système affiche les différences (quantité système vs comptée)
4. **Validation** : Gérant/Admin valide ou ajuste les écarts avec justification
5. **Clôture** : Stock mis à jour, rapport d'inventaire généré en PDF

---

### 4.8 Tableau de Bord Temps Réel

**Problème actuel** : Le dashboard nécessite un rechargement manuel pour voir les nouvelles données.

**Solution V2** : Mise à jour en direct pendant la journée de vente.

**Éléments en temps réel** :
- Chiffre d'affaires du jour (s'incrémente à chaque vente validée)
- Nombre de transactions
- File d'attente caisse (si plusieurs caisses)
- Alertes stock instantanées

**Technologies** : WebSockets (Socket.io) ou Server-Sent Events (SSE) — SSE recommandé car plus simple et suffisant pour ce cas

---

### 4.9 Application Mobile Native

**Problème actuel** : L'app est PWA (installable) mais reste une app web.

**Solution V2** : Application native iOS + Android.

**Avantages du natif vs PWA** :

| Fonctionnalité | PWA (V1) | Native (V2) |
|---------------|----------|-------------|
| Notifications push | Limité sur iOS | ✅ Complet |
| Accès caméra | Partiel | ✅ Natif |
| Biométrie (empreinte/Face ID) | ❌ | ✅ |
| Icon sur l'écran d'accueil | Partiel | ✅ Store officiel |
| Impression Bluetooth | ❌ | ✅ |
| Offline complet | Partiel | ✅ Complet |

**Technologies** : Capacitor (déjà partiellement intégré dans le projet) → compilation du code existant vers iOS/Android sans réécriture

---

### 4.10 Rapports Automatiques par Email

**Problème actuel** : L'admin doit se connecter pour voir les performances.

**Solution V2** : Rapports automatiques envoyés sans action requise.

**Rapports disponibles** :
- **Rapport journalier** (envoyé à 22h) : CA du jour, nombre de ventes, top 5 produits, alertes stock
- **Rapport hebdomadaire** (lundi 8h) : comparaison semaine précédente, tendances
- **Rapport mensuel** : bilan complet, évolution mois sur mois

**Configuration** : L'admin choisit quels rapports recevoir et à quelle fréquence depuis les paramètres.

---

### 4.11 Gestion des Promotions & Remises

**Problème actuel** : Les remises sont appliquées manuellement sans règles centralisées.

**Solution V2** : Moteur de promotions complet.

**Types de promotions** :
- Remise pourcentage sur un produit (`-20% sur le sucre`)
- Remise sur une catégorie (`-10% sur tous les produits alimentaires`)
- Prix lot (`3 pour le prix de 2`)
- Code promo (pour clients fidèles)
- Promotion temporelle (valable du 01/07 au 15/07)
- Prix client groupe (tarif grossiste vs détail)

---

### 4.12 Multi-secteur — Nouveaux Modules Métier

**Problème actuel** : L'app couvre épiceries et quincailleries uniquement.

**Solution V2** : Extension à d'autres secteurs sans refonte.

| Secteur | Fonctionnalités spécifiques |
|---------|---------------------------|
| **Pharmacie** | DCI médicaments, péremption critique, ordonnances, stock BPCS |
| **Restaurant/Snack** | Menu digitale, commandes table, cuisine séparée, additions partagées |
| **Salon de coiffure** | Rendez-vous, prestations, suivi client, produits utilisés |
| **Station service** | Gestion par pompe, carburants, lubrifiants |

---

## 5. Architecture Technique V2

### Backend (NestJS — Railway)
```
V1                          V2 (ajouts)
──────────────────────      ──────────────────────────────
REST API                →  + WebSockets (Socket.io)
Prisma + PostgreSQL     →  (inchangé)
Auth JWT                →  + Refresh Token rotation + 2FA
─                       →  + Module Notifications (FCM)
─                       →  + Module Prévisions (calculs async)
─                       →  + Webhooks Mobile Money
─                       →  + Cron Jobs (rapports email)
```

### Frontend (Next.js — actuel)
```
V1                          V2 (ajouts)
──────────────────────      ──────────────────────────────
React + Tailwind        →  (inchangé)
Recharts                →  + Graphiques temps réel
Offline queue           →  + Sync bidirectionnel amélioré
PWA                     →  + Capacitor (iOS/Android natif)
─                       →  + @zxing/browser (scanner)
─                       →  + jsPDF + xlsx (exports)
```

### Infrastructure
```
Actuel                      V2
──────────────────────      ──────────────────────────────
Railway (backend)       →  (inchangé ou migration VPS)
─                       →  + Redis (sessions, temps réel)
─                       →  + Stockage fichiers (exports PDF)
─                       →  + Queue système (Bull/BullMQ)
```

---

## 6. Expérience Utilisateur

### Caissier V2 — Journée type
```
08h00 — Ouvre l'app → notification "Ouvrir la session caisse ?"
08h01 — Scanne le premier produit (caméra)
08h45 — Client paie Mobile Money → validation automatique en 8 secondes
12h00 — Notification "Faible stock : Sucre 1kg (3 restants)"
17h30 — Retour client : scan du ticket, remboursement en 30 secondes
21h55 — Notification "Pensez à clôturer votre caisse"
22h00 — Clôture → rapport automatique envoyé à l'admin
```

### Admin V2 — Suivi sans connexion requise
```
08h00 — Reçoit l'email du rapport journalier d'hier (CA, alertes)
10h00 — Notification push "Rupture imminente : Ciment (4 jours)"
10h01 — Crée un bon de commande depuis l'app → quantités pré-remplies par l'IA
15h00 — Vérifie le dashboard temps réel depuis son téléphone
```

---

## 7. Roadmap & Planning

### Phase 1 — Fondations (Mois 1-2)
**Objectif : Fonctionnalités à impact immédiat**

- [ ] Scanner code-barres dans le POS
- [ ] Export PDF (bons de commande, tickets)
- [ ] Export Excel (inventaire, ventes)
- [ ] Module retours/remboursements
- [ ] Notifications push basiques (stock bas, session ouverte)

### Phase 2 — Intelligence (Mois 3-4)
**Objectif : Valeur ajoutée sur les données**

- [ ] Prévisions de réapprovisionnement
- [ ] Dashboard temps réel (WebSockets)
- [ ] Rapport journalier automatique par email
- [ ] Gestion des promotions & remises
- [ ] Inventaire physique guidé complet

### Phase 3 — Mobile & Paiements (Mois 5-6)
**Objectif : Expérience native et paiements intégrés**

- [ ] Application Capacitor (Android d'abord, iOS ensuite)
- [ ] Publication Google Play Store
- [ ] Intégration MTN Mobile Money
- [ ] Intégration Orange Money
- [ ] Authentification biométrique (empreinte)

### Phase 4 — Expansion (Mois 7-9)
**Objectif : Nouveaux marchés**

- [ ] Module Pharmacie
- [ ] Module Restaurant/Snack
- [ ] API publique (webhooks, intégrations externes)
- [ ] Multi-devise (FCFA, EUR, USD)
- [ ] Tableau de bord comparatif multi-boutiques avancé

---

## 8. Modèle Économique

### Proposition de valeur
SP Services résout un problème réel : les commerçants africains gèrent encore leurs stocks sur des cahiers ou des tableurs Excel, sans visibilité en temps réel et sans outil adapté à leurs réalités (Mobile Money, offline, multi-boutiques).

### Modèle d'abonnement suggéré

| Formule | Prix/mois | Boutiques | Utilisateurs | Fonctionnalités |
|---------|-----------|-----------|-------------|----------------|
| **Starter** | 5 000 FCFA | 1 | 3 | Caisse + Stock + Rapports |
| **Business** | 15 000 FCFA | 3 | 10 | + Mobile Money + Export + Notifs |
| **Enterprise** | 35 000 FCFA | Illimité | Illimité | + Tout V2 + Support prioritaire |

### Revenus projetés (estimation conservatrice)
- 50 boutiques Starter → 250 000 FCFA/mois
- 20 boutiques Business → 300 000 FCFA/mois
- 5 boutiques Enterprise → 175 000 FCFA/mois
- **Total mois 12 : ~725 000 FCFA (~1 100 €)**

---

## 9. Équipe & Rôles

### Rôles nécessaires pour la V2

| Rôle | Responsabilités | Compétences |
|------|----------------|-------------|
| **Lead Dev Frontend** | Next.js, mobile Capacitor, scanner | React, TypeScript, Capacitor |
| **Lead Dev Backend** | NestJS, WebSockets, intégrations API | Node.js, Prisma, Redis |
| **Dev Mobile** | Build iOS/Android, Store | Capacitor, Xcode/Android Studio |
| **Designer UX** | Nouvelles interfaces V2 | Figma, design mobile-first |
| **Chargé Partenariats** | Négociation API Mobile Money, commercialisation | Business développement |

### Ce dont le projet a besoin maintenant
1. **Définir les priorités** parmi les 12 fonctionnalités proposées
2. **Valider le modèle économique** avec de potentiels clients pilotes
3. **Constituer l'équipe** ou trouver les collaborateurs pour les parties manquantes
4. **Planifier un MVP V2** avec les 3-4 fonctionnalités les plus demandées

---

## Conclusion

SP Services V1 est une base solide et fonctionnelle. La V2 n'est pas une réécriture — c'est une **extension stratégique** qui capitalise sur l'architecture existante (offline-first, multi-rôles, Capacitor déjà intégré) pour devenir une plateforme complète.

Les deux premières fonctionnalités à implémenter sont claires :
1. **Scanner code-barres** — impact terrain immédiat, 1 semaine de dev
2. **Export PDF/Excel** — demande universelle des utilisateurs, 1 semaine de dev

Ces deux livraisons rapides permettent de garder l'élan et de montrer de la valeur concrète pendant que les fonctionnalités plus complexes (Mobile Money, IA, natif) sont développées.

---

*Document rédigé par l'équipe SP Services — Juin 2026*  
*Contact : kouamenelson47@gmail.com*
