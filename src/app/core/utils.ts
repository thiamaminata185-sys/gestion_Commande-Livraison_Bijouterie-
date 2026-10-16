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
