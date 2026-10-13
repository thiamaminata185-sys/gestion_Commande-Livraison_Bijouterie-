<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #1e40af; margin: 0; }
        .info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #1e40af; color: #fff; padding: 8px; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; }
        .totaux { text-align: right; margin-top: 20px; }
        .totaux p { margin: 4px 0; }
        .total-ttc { font-size: 16px; font-weight: bold; color: #1e40af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BIJOUTERIE ÉTOILE D'OR</h1>
        <p>63 rue Félix Faure - Dakar | Tél : +221 33 800 00 00</p>
        <h2>FACTURE N° {{ $facture->numero }}</h2>
    </div>

    <div class="info">
        <p><strong>Date :</strong> {{ $facture->date->format('d/m/Y H:i') }}</p>
        <p><strong>Client :</strong> {{ $facture->commande->client->prenom }} {{ $facture->commande->client->nom }}</p>
        <p><strong>Adresse :</strong> {{ $facture->commande->adresseLivraison }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Article</th>
                <th>Qté</th>
                <th>Prix unitaire</th>
                <th>Sous-total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($facture->commande->lignes as $ligne)
            <tr>
                <td>{{ $ligne->bijou->nomBijou }}</td>
                <td>{{ $ligne->quantite }}</td>
                <td>{{ number_format($ligne->prixUnitaire, 0, ',', ' ') }} FCFA</td>
                <td>{{ number_format($ligne->sousTotal, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totaux">
        <p><strong>Montant HT :</strong> {{ number_format($facture->montantHT, 0, ',', ' ') }} FCFA</p>
        <p><strong>TVA (18%) :</strong> {{ number_format($facture->tva, 0, ',', ' ') }} FCFA</p>
        <p class="total-ttc">TOTAL TTC : {{ number_format($facture->montantTTC, 0, ',', ' ') }} FCFA</p>
    </div>

    <p style="text-align: center; margin-top: 40px; font-size: 10px; color: #888;">
        Merci de votre confiance — Bijouterie Étoile d'Or depuis 1992
    </p>
</body>
</html>