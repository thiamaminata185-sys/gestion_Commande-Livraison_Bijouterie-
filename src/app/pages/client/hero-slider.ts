import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

interface Slide {
  image: string;
  surtitre: string;
  titre: string;
  texte: string;
  cta: string;
  lien: string;
  params?: Record<string, string>;
  cta2: string;
  lien2: string;
}

/** Grand diaporama de la page d'accueil : image + texte, défilement automatique, flèches et pastilles. */
@Component({
  selector: 'app-hero-slider',
  imports: [RouterLink],
  template: `
    <section class="hero" (mouseenter)="pause.set(true)" (mouseleave)="pause.set(false)" aria-label="Nos collections">
      @for (s of slides; track s.titre; let i = $index) {
        <div class="slide" [class.active]="i === index()" [attr.aria-hidden]="i !== index()">
          <div class="slide-text">
            <span class="eyebrow">{{ s.surtitre }}</span>
            <h2>{{ s.titre }}</h2>
            <p>{{ s.texte }}</p>
            <div class="slide-actions">
              <a class="btn btn-gold" [routerLink]="s.lien" [queryParams]="s.params">{{ s.cta }}</a>
              <a class="btn btn-outline-light" [routerLink]="s.lien2">{{ s.cta2 }}</a>
            </div>
          </div>
          <div class="slide-img"><img [src]="s.image" [alt]="s.surtitre" /></div>
        </div>
      }

      <button class="hero-nav prev" type="button" (click)="precedent()" aria-label="Diapositive précédente">‹</button>
      <button class="hero-nav next" type="button" (click)="suivant()" aria-label="Diapositive suivante">›</button>

      <div class="hero-dots">
        @for (s of slides; track s.titre; let i = $index) {
          <button type="button" [class.on]="i === index()" (click)="aller(i)" [attr.aria-label]="'Aller à la diapositive ' + (i + 1)"></button>
        }
      </div>
    </section>
  `,
})
export class HeroSliderComponent {
  index = signal(0);
  pause = signal(false);

  slides: Slide[] = [
    {
      image: 'images/bague.jfif',
      surtitre: 'Collection Or 18K',
      titre: "L'éclat de l'or, la précision de l'artisan",
      texte: 'Bagues, alliances et solitaires façonnés à la main dans notre atelier de Dakar.',
      cta: 'Découvrir les bagues',
      lien: '/catalogue',
      params: { search: 'bague' },
      cta2: 'Notre histoire',
      lien2: '/a-propos',
    },
    {
      image: 'images/collier2.jfif',
      surtitre: 'Perles de Tahiti',
      titre: 'Des colliers choisis perle après perle',
      texte: 'Une sélection rare de perles nacrées, montées sur or pour un éclat qui traverse le temps.',
      cta: 'Voir les colliers',
      lien: '/catalogue',
      params: { search: 'collier' },
      cta2: 'Toute la collection',
      lien2: '/catalogue',
    },
    {
      image: 'images/BRACELET.jfif',
      surtitre: 'Argent massif',
      titre: 'Des bracelets intemporels, faits pour durer',
      texte: "Manchettes et joncs en argent massif, des pièces élégantes qui s'accordent à toutes vos tenues.",
      cta: 'Voir les bracelets',
      lien: '/catalogue',
      params: { search: 'bracelet' },
      cta2: 'Nos catégories',
      lien2: '/catalogue',
    },
    {
      image: 'images/PIERRE.jfif',
      surtitre: 'Pierres précieuses & sur-mesure',
      titre: 'Une pierre, une histoire, votre création unique',
      texte: 'Un projet particulier ? Nos artisans dessinent et réalisent le bijou qui vous ressemble.',
      cta: 'Parlons de votre projet',
      lien: '/contact',
      cta2: 'Découvrir nos pierres',
      lien2: '/catalogue',
    },
  ];

  constructor() {
    interval(6000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.pause()) this.suivant();
      });
  }

  suivant() {
    this.index.update((i) => (i + 1) % this.slides.length);
  }

  precedent() {
    this.index.update((i) => (i - 1 + this.slides.length) % this.slides.length);
  }

  aller(i: number) {
    this.index.set(i);
  }
}
