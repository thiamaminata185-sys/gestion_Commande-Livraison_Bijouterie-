<?php

/*
 * Paiement en ligne (Wave, Orange Money, carte) via PayTech : https://paytech.sn
 * Les clés se trouvent dans le tableau de bord PayTech : Paramètres > API.
 * Elles sont lues dans le fichier .env (en production : variables d'environnement de Render).
 */
return [
    'api_key'    => env('PAYTECH_API_KEY'),
    'api_secret' => env('PAYTECH_API_SECRET'),

    // « test » : essais (PayTech ne débite que 100 à 150 FCFA, quel que soit le montant)
    // « prod »  : vrais paiements (compte PayTech activé par leur équipe)
    'env'        => env('PAYTECH_ENV', 'test'),

    'base_url'   => env('PAYTECH_BASE_URL', 'https://paytech.sn/api'),

    // Adresse du site Angular (Vercel) : le client y est renvoyé après le paiement
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:4200'), '/'),
];
