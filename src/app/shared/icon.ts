import { Component, computed, input } from '@angular/core';

/** Chemins SVG (style « trait », 24 × 24) : une icône = un seul tracé. */
const ICONES: Record<string, string> = {
  edit: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  trash: 'M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  package: 'M16.5 9.4L7.5 4.21 M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
  plus: 'M12 5v14 M5 12h14',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18 M6 6l12 12',
  'user-check': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M17 11l2 2 4-4',
  'user-x': 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M18 8l5 5 M23 8l-5 5',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  cart: 'M10 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0z M21 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0z M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  truck: 'M1 3h15v13H1z M16 8h4l3 3v5h-7z M8 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z M21 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  play: 'M5 3l14 9-14 9V3z',
  search: 'M21 21l-4.35-4.35 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
};

/** Utilisation : <app-icon nom="edit" />  ou  <app-icon nom="trash" [taille]="20" /> */
@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         [attr.width]="taille()" [attr.height]="taille()" aria-hidden="true">
      <path [attr.d]="chemin()" />
    </svg>
  `,
  styles: [`:host { display: inline-flex; vertical-align: middle; }`],
})
export class IconComponent {
  nom = input.required<string>();
  taille = input(18);
  chemin = computed(() => ICONES[this.nom()] ?? '');
}