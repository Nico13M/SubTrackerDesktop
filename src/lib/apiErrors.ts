const GENERIC_API_ERROR = 'Une erreur est survenue.';

export async function extractApiErrorMessage(res: Response, fallback = GENERIC_API_ERROR): Promise<string> {
  let raw = '';

  try {
    raw = await res.text();
  } catch {
    return fallback;
  }

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed === 'string' && parsed.trim()) {
      return parsed.trim();
    }

    if (typeof parsed?.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim();
    }

    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      return parsed.message.trim();
    }

    if (Array.isArray(parsed?.errors) && parsed.errors.length > 0) {
      const firstError = parsed.errors[0];
      if (typeof firstError === 'string' && firstError.trim()) return firstError.trim();
      if (typeof firstError?.message === 'string' && firstError.message.trim()) return firstError.message.trim();
    }
  } catch {
    // Not JSON, fall back to the raw body.
  }

  return raw.trim() || fallback;
}

export function toFriendlyApiError(message: string, status?: number, fallback = GENERIC_API_ERROR): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }

  if (normalized.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  if (status === 401) {
    return 'Session expirée. Reconnectez-vous.';
  }

  if (status === 403) {
    return 'Vous n’avez pas les droits pour effectuer cette action.';
  }

  if (status === 404) {
    return 'La ressource demandée est introuvable.';
  }

  return message || fallback;
}

export function formatApiError(message: string, status?: number, fallback = GENERIC_API_ERROR): string {
  return toFriendlyApiError(message, status, fallback);
}