import { Component, Pipe, PipeTransform, computed, input, output, signal } from '@angular/core';
import { STATUT_COMMANDE, STATUT_LIVRAISON, STATUT_PAIEMENT } from '../core/labels';
import { ToastService } from '../core/services/toast.service';
import { inject } from '@angular/core';

/** 250000 -> "250 000 FCFA" */
@Pipe({ name: 'fcfa' })
export class FcfaPipe implements PipeTransform {
  transform(valeur: string | number | null | undefined): string {
    return Number(valeur ?? 0).toLocaleString('fr-FR') + ' FCFA';
  }
}

const COULEURS: Record<string, string> = {
  en_attente: 'warn',
  validee: 'info',
  en_production: 'violet',
  prete: 'teal',
  en_livraison: 'blue',
  en_cours: 'blue',
  livree: 'ok',
  valide: 'ok',
  annulee: 'ko',
  annule: 'ko',
  echouee: 'ko',
};

/** Pastille de couleur pour un statut de commande, de paiement ou de livraison. */
@Component({
  selector: 'app-badge',
  template: `<span class="badge" [class]="couleur()">{{ libelle() }}</span>`,
})
export class BadgeComponent {
  statut = input.required<string>();
  type = input<'commande' | 'paiement' | 'livraison'>('commande');

  couleur = computed(() => COULEURS[this.statut()] ?? 'warn');
  libelle = computed(() => {
    const s = this.statut();
    const table: Record<string, string> =
      this.type() === 'paiement' ? STATUT_PAIEMENT : this.type() === 'livraison' ? STATUT_LIVRAISON : STATUT_COMMANDE;
    return table[s] ?? s;
  });
}

@Component({
  selector: 'app-pagination',
  template: `
    @if (last() > 1) {
      <div class="pagination">
        <button class="btn btn-ghost" [disabled]="page() <= 1" (click)="changed.emit(page() - 1)">← Précédent</button>
        <span>Page {{ page() }} / {{ last() }}</span>
        <button class="btn btn-ghost" [disabled]="page() >= last()" (click)="changed.emit(page() + 1)">Suivant →</button>
      </div>
    }
  `,
})
export class PaginationComponent {
  page = input.required<number>();
  last = input.required<number>();
  changed = output<number>();
}

/** Photo d'un bijou, ou un visuel de remplacement si aucune image n'est disponible. */
@Component({
  selector: 'app-bijou-image',
  template: `
    @if (urlValide() && !erreur()) {
      <img [src]="src()" [alt]="alt()" (error)="erreur.set(true)" />
    } @else {
      <div class="img-placeholder">💎</div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
  `],
})
export class BijouImageComponent {
  src = input<string | null | undefined>('');
  alt = input('Bijou');
  erreur = signal(false);
  urlValide = computed(() => {
    const s = this.src();
    return !!s && (s.startsWith('http') || s.startsWith('/') || s.startsWith('data:'));
  });
}

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class]="t.type" (click)="toasts.dismiss(t.id)">{{ t.text }}</div>
      }
    </div>
  `,
})
export class ToastsComponent {
  toasts = inject(ToastService);
}
