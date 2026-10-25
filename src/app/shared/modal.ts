import { Component, HostListener, OnDestroy, OnInit, input, output } from '@angular/core';

/** Fenêtre popup : le contenu du formulaire se place entre <app-modal> et </app-modal>. */
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-backdrop" (mousedown)="clicFond($event)">
      <div class="modal" [class.modal-sm]="petit()" role="dialog" aria-modal="true" [attr.aria-label]="titre()">
        <div class="modal-head">
          <h2>{{ titre() }}</h2>
          <button type="button" class="modal-close" (click)="fermer.emit()" aria-label="Fermer">✕</button>
        </div>
        <div class="modal-body"><ng-content /></div>
      </div>
    </div>
  `,
})
export class ModalComponent implements OnInit, OnDestroy {
  titre = input.required<string>();
  petit = input(false);
  fermer = output<void>();

  @HostListener('document:keydown.escape')
  echap() {
    this.fermer.emit();
  }

  clicFond(event: MouseEvent) {
    if (event.target === event.currentTarget) this.fermer.emit();
  }

  ngOnInit() {
    document.body.classList.add('modal-open'); // empêche la page de défiler derrière
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }
}