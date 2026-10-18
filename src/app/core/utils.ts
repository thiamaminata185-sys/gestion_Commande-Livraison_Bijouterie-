import { environment } from '../../environments/environment';

/**
 * Transforme l'adresse d'une image stockée en base en adresse utilisable dans <img> :
 *  - « https://… » reste tel quel ;
 *  - « /storage/bijoux/x.jpg » (image téléversée sur l'API) est complété avec l'adresse du serveur ;
 *  - un simple nom de fichier (« bague.jpg ») n'est pas affichable : on renvoie ''.
 */
export function urlImage(src: string | null | undefined): string {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith('/')) return environment.apiOrigin + src;
  return '';
}

export function initiales(prenom?: string, nom?: string): string {
  return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase() || '?';
}

/** Extrait un message lisible d'une erreur HTTP de l'API Laravel. */
export function errorMessage(err: unknown): string {
  const e = err as { status?: number; error?: { message?: string; errors?: Record<string, string[]> }; message?: string };
  if (e?.status === 0) {
    return "Impossible de joindre l'API. Vérifiez qu'elle est lancée (php artisan serve).";
  }
  const errors = e?.error?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first && first.length) return first[0];
  }
  return e?.error?.message || e?.message || 'Une erreur est survenue';
}

/** Télécharge un fichier (blob) dans le navigateur. */
export function telecharger(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toNumber(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
