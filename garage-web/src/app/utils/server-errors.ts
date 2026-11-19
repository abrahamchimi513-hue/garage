import { HttpErrorResponse } from '@angular/common/http';

export interface ParsedError {
  status: number;
  message: string;
  /** champ -> message, pour les erreurs de validation (400). */
  fieldErrors: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Certaines données sont invalides.';
    case 404:
      return 'Élément introuvable.';
    case 409:
      return 'Cette opération est en conflit avec les données existantes.';
    case 500:
      return 'Erreur interne du serveur. Réessayez plus tard.';
    default:
      return 'Une erreur est survenue.';
  }
}

/** Accepte { champ: message } ou [{ champ|field, message }] sous plusieurs noms de clé. */
function extractFields(body: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of ['erreurs', 'errors', 'champs', 'details', 'fieldErrors']) {
    const raw = body[key];
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (isRecord(item)) {
          const name = item['champ'] ?? item['field'];
          const msg = item['message'];
          if (typeof name === 'string' && typeof msg === 'string') {
            result[name] = msg;
          }
        }
      }
    } else if (isRecord(raw)) {
      for (const [name, msg] of Object.entries(raw)) {
        if (typeof msg === 'string') {
          result[name] = msg;
        }
      }
    }
  }
  return result;
}

export function parseApiError(err: unknown): ParsedError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return {
        status: 0,
        message: 'Impossible de joindre le serveur. Vérifiez que le back-end est démarré.',
        fieldErrors: {},
      };
    }
    const body: unknown = err.error;
    if (isRecord(body)) {
      const msg = body['message'];
      return {
        status: err.status,
        message: typeof msg === 'string' && msg.length > 0 ? msg : defaultMessage(err.status),
        fieldErrors: extractFields(body),
      };
    }
    return { status: err.status, message: defaultMessage(err.status), fieldErrors: {} };
  }
  return { status: -1, message: 'Une erreur inattendue est survenue.', fieldErrors: {} };
}
