/**
 * Données académiques partagées entre les formulaires et les validateurs.
 */


export const LICENCE_PROMOTIONS = ['L1 FASE A', 'L1 FASE B', 'L2 FASE A', 'L2 FASE B', 'L3 FASE', 'L3 Gestion'] as const


export const MASTER_PROMOTIONS = [
  'Master 1',
  'Master 2',
] as const


export const PROMOTIONS = [...LICENCE_PROMOTIONS, ...MASTER_PROMOTIONS] as const


export const MASTER_OPTIONS = [
  'Gestion Financière',
  'Comptabilité et Audit',
  'Management des Organisations',
  'Gestion Marketing',
  'Gestion Bancaire, Microfinance et Assurances',
  'Economie monetaire',
  'Economie regionale et internationale',
  'Economie Rurale',
  'Economie Quantitative',
  'Economie Publique',
] as const


/** Jours de cours et créneaux horaires (espace CP) */
export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const
export const HOURS = ['8h', '10h', '13h', '15h'] as const


/** Durée pendant laquelle le QR Code d'une session reste valide */
export const SESSION_VALIDITY_HOURS = 3


export function isMaster(promotion: string | null | undefined) {
  return !!promotion && (MASTER_PROMOTIONS as readonly string[]).includes(promotion)
}



