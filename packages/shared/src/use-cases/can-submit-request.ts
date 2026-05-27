import type { PersonRequestStatus } from '../schemas/access-request';

export type CanSubmitResult =
  | { ok: true }
  | { ok: false; reason: 'sin_personas' | 'docs_pendientes' };

export function canSubmitRequest(input: {
  people: { estado_individual: PersonRequestStatus }[];
}): CanSubmitResult {
  if (input.people.length === 0) {
    return { ok: false, reason: 'sin_personas' };
  }
  const allOk = input.people.every(
    (p) =>
      p.estado_individual === 'aprobada' || p.estado_individual === 'en_revision',
  );
  if (!allOk) {
    return { ok: false, reason: 'docs_pendientes' };
  }
  return { ok: true };
}
