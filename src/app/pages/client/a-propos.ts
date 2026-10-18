import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-a-propos',
  imports: [RouterLink],
  template: `
    <section class="page-banner">
      <div>
        <span class="eyebrow">À propos</span>
        <h1>Une passion pour l'or et les belles pièces</h1>
        <p>Étoile d'Or, c'est une maison de bijouterie dakaroise où le geste de l'artisan rencontre l'exigence du détail.</p>
      </div>
      <img src="images/collier2.jfif" alt="Collier de perles" />
    </section>

    <!-- Histoire -->
    <section class="section about-grid">
      <div>
        <span class="eyebrow-dark">Notre histoire</span>
        <h2 class="serif">Née d'un atelier, grandie par la confiance</h2>
        <p>Étoile d'Or est née de l'envie de proposer à Dakar des bijoux d'une qualité irréprochable, à des prix justes, sans jamais renoncer à l'élégance. Ce qui n'était qu'un petit atelier est devenu une maison reconnue pour la finesse de son travail.</p>
        <p>Chaque pièce naît d'un dessin, passe entre les mains de nos artisans qui la fondent, la polissent et la sertissent, puis est contrôlée avant de vous être remise dans son écrin.</p>
        <p>Aujourd'hui, vous pouvez parcourir toute la collection, commander et suivre votre livraison depuis chez vous, avec le même soin qu'en boutique.</p>
        <div class="slide-actions">
          <a class="btn btn-gold" routerLink="/catalogue">Découvrir la collection</a>
          <a class="btn btn-ghost" routerLink="/contact">Nous écrire</a>
        </div>
      </div>
      <div class="about-visual"><img src="images/bague.jfif" alt="Bague en or avec diamant" /></div>
    </section>

    <!-- Valeurs -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">Nos valeurs</span>
        <h2 class="serif">Ce qui guide chacune de nos créations</h2>
      </div>
      <div class="features four">
        <div class="feature card"><span class="feature-icon">E</span><h3>Excellence</h3><p class="muted">Un contrôle qualité à chaque étape, de la matière brute au poli final.</p></div>
        <div class="feature card"><span class="feature-icon">A</span><h3>Authenticité</h3><p class="muted">Or, argent et pierres certifiés, avec un certificat remis pour chaque bijou.</p></div>
        <div class="feature card"><span class="feature-icon">P</span><h3>Proximité</h3><p class="muted">Une équipe à l'écoute, qui vous conseille avec honnêteté et sans pression.</p></div>
        <div class="feature card"><span class="feature-icon">C</span><h3>Créativité</h3><p class="muted">Des modèles uniques et la possibilité de créer le bijou de vos rêves.</p></div>
      </div>
    </section>

    <!-- Parcours -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">Notre parcours</span>
        <h2 class="serif">Les grandes étapes</h2>
        <p class="muted">Dates d'exemple, à adapter à l'histoire réelle de la boutique.</p>
      </div>
      <div class="timeline">
        @for (e of etapes; track e.annee) {
          <div class="tl-item">
            <div class="tl-year">{{ e.annee }}</div>
            <div class="tl-card card"><h3>{{ e.titre }}</h3><p class="muted">{{ e.texte }}</p></div>
          </div>
        }
      </div>
    </section>

    <!-- Équipe -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">L'équipe</span>
        <h2 class="serif">Des métiers au service de votre bijou</h2>
      </div>
      <div class="features four">
        @for (m of equipe; track m.role) {
          <div class="feature card team">
            <span class="team-avatar">{{ m.icone }}</span>
            <h3>{{ m.role }}</h3>
            <p class="muted">{{ m.texte }}</p>
          </div>
        }
      </div>
    </section>

    <section class="cta-band">
      <div>
        <h2>Envie de voir nos créations ?</h2>
        <p>Parcourez le catalogue et passez commande en quelques clics.</p>
      </div>
      <div class="slide-actions">
        <a class="btn btn-dark" routerLink="/catalogue">Voir le catalogue</a>
        <a class="btn btn-outline-dark" routerLink="/contact">Prendre contact</a>
      </div>
    </section>
  `,
})
export class AProposComponent {
  etapes = [
    { annee: '2010', titre: "Ouverture de l'atelier", texte: 'Les premières pièces sont façonnées dans un petit atelier du Plateau.' },
    { annee: '2015', titre: 'Les créations sur mesure', texte: 'Lancement du service de bijoux personnalisés, gravure et retouches.' },
    { annee: '2020', titre: 'La collection s\'agrandit', texte: 'Arrivée des perles de Tahiti, des pierres précieuses et de la ligne argent massif.' },
    { annee: '2026', titre: 'La boutique en ligne', texte: 'Commande, paiement mobile, suivi de livraison : toute la bijouterie à portée de clic.' },
  ];

  equipe = [
    { icone: 'M', role: 'Maîtres artisans', texte: 'Ils fondent, sertissent et polissent chaque pièce.' },
    { icone: 'G', role: 'Gemmologue', texte: 'Il sélectionne et certifie les pierres et les perles.' },
    { icone: 'C', role: 'Conseillers clientèle', texte: 'Ils vous guident dans votre choix et suivent votre commande.' },
    { icone: 'L', role: 'Livreurs', texte: 'Ils vous remettent votre bijou en main propre, en toute sécurité.' },
  ];
}
