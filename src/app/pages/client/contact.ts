import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <section class="page-banner">
      <div>
        <span class="eyebrow">Contact</span>
        <h1>Parlons de votre bijou</h1>
        <p>Une question, un conseil, une création sur mesure ? Écrivez-nous, nous répondons rapidement.</p>
      </div>
      <img src="images/PIERRE.jfif" alt="Pierre précieuse" />
    </section>

    <div class="contact-grid">
      <!-- Coordonnées -->
      <div>
        <div class="card info-cards">
          <div class="info"><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
</span><div><strong>Boutique</strong><p class="muted">Plateau, Dakar, Sénégal</p></div></div>
          <div class="info"><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
  <path d="M12 18h.01"/>
</svg>
</span><div><strong>Téléphone</strong><p class="muted">+221 77 632 10 98</p></div></div>
          <div class="info"><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="20" height="16" x="2" y="4" rx="2"/>
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
</svg>
</span><div><strong>Email</strong><p class="muted">bijouterieetoiledor&#64;gmail.com</p></div></div>
          <div class="info"><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>
</span><div><strong>Horaires</strong>
            <p class="muted">Lundi - Vendredi : 9h - 19h<br />Samedi : 10h - 18h<br />Dimanche : fermé</p></div></div>
        </div>

        <div class="card map-card">
          <iframe class="map-frame" title="Plan d'accès à la boutique" loading="lazy" [src]="carte"></iframe>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="card">
        @if (envoye()) {
          <div class="sent">
            <div class="sent-icon">M</div>
            <h2>Message envoyé !</h2>
            <p class="muted">Merci {{ auth.user()?.prenom }}, nous avons bien reçu votre message et vous répondrons très vite.</p>
            <button class="btn btn-gold" (click)="envoye.set(false)">Envoyer un autre message</button>
          </div>
        } @else {
          <h2>Écrivez-nous</h2>
          <p class="muted">Vous écrivez en tant que <strong>{{ auth.user()?.prenom }} {{ auth.user()?.nom }}</strong> ({{ auth.user()?.email }}).</p>
          <form (ngSubmit)="envoyer()">
            <label>Sujet
              <select name="sujet" [(ngModel)]="sujet" required>
                @for (s of sujets; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </label>
            <label>Votre message
              <textarea name="message" rows="7" required minlength="10" maxlength="1500" [(ngModel)]="message"
                        placeholder="Décrivez votre demande…"></textarea>
            </label>
            <small class="muted">{{ message.length }} / 1500 caractères (10 minimum)</small>
            <button class="btn btn-gold block" [disabled]="envoi() || message.trim().length < 10">
              {{ envoi() ? 'Envoi…' : 'Envoyer le message' }}
            </button>
          </form>
        }
      </div>
    </div>

    <!-- FAQ -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">FAQ</span>
        <h2 class="serif">Questions fréquentes</h2>
      </div>
      <div class="faq">
        @for (q of faq; track q.question) {
          <details class="card">
            <summary>{{ q.question }}</summary>
            <p class="muted">{{ q.reponse }}</p>
          </details>
        }
      </div>
    </section>
  `,
})
export class ContactComponent {
  auth = inject(AuthService);
  private service = inject(ContactService);
  private toast = inject(ToastService);

  envoi = signal(false);
  envoye = signal(false);

  sujets = ['Question sur un bijou', 'Suivi de commande', 'Création sur mesure', 'Retouche ou entretien', 'Autre demande'];
  sujet = this.sujets[0];
  message = '';

  carte = inject(DomSanitizer).bypassSecurityTrustResourceUrl(
    'https://www.openstreetmap.org/export/embed.html?bbox=-17.4600%2C14.6600%2C-17.4160%2C14.6820&layer=mapnik&marker=14.6708%2C-17.4380',
  );

  faq = [
    { question: 'Comment suivre ma commande ?', reponse: 'Dans « Mes commandes », ouvrez la commande : une frise vous montre son avancement (validée, en production, prête, en livraison, livrée). Vous recevez aussi une notification à chaque étape.' },
    { question: 'Quels moyens de paiement acceptez-vous ?', reponse: 'Wave, Orange Money, carte bancaire et espèces. Votre paiement est validé par la boutique, puis votre facture PDF est disponible dans la commande.' },
    { question: 'Puis-je annuler une commande ?', reponse: "Oui, tant qu'elle est en attente de paiement : ouvrez la commande et cliquez sur « Annuler la commande ». Les bijoux sont alors remis en stock." },
    { question: 'Faites-vous des créations sur mesure ?', reponse: "Oui ! Choisissez le sujet « Création sur mesure » ci-dessus et décrivez votre projet : un de nos artisans vous recontacte pour un devis." },
    { question: 'Comment entretenir mes bijoux ?', reponse: "Rangez-les séparément dans leur écrin, évitez les parfums et produits ménagers, et nettoyez-les avec un chiffon doux. Nous proposons aussi un nettoyage en boutique." },
  ];

  envoyer() {
    if (this.message.trim().length < 10) {
      this.toast.error('Votre message est trop court (10 caractères minimum)');
      return;
    }
    this.envoi.set(true);
    this.service.envoyer(this.sujet, this.message.trim()).subscribe({
      next: () => {
        this.message = '';
        this.envoi.set(false);
        this.envoye.set(true);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
      },
    });
  }
}
