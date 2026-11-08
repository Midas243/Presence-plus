import type { DateTime } from 'luxon'

/**
 * Calcul du taux de présence d'un étudiant.
 * Ce fichier ne dépend d'aucun modèle : il reçoit des données simples,
 * ce qui le rend facile à tester.
 */

type SessionInfo = {
  id: number
  course: string
  createdAt: DateTime
  expiresAt: DateTime
}

export type CourseRate = {
  course: string
  total: number
  present: number
  rate: number
}

export type AttendanceRate = {
  total: number
  present: number
  /** Pourcentage entier (0 à 100), ou null s'il n'y a encore aucune séance */
  rate: number | null
  courses: CourseRate[]
}

const toPercent = (present: number, total: number) => Math.round((present / total) * 100)

/** « Compta  Générale » et « compta générale » sont le même cours */
const courseKey = (course: string) => course.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Une séance compte dans le taux si l'étudiant y était présent, ou si :
 *  - elle est terminée (le QR n'est plus valide) : une séance en cours n'est pas une absence ;
 *  - elle a eu lieu après l'inscription de l'étudiant : on ne lui reproche pas
 *    les séances d'avant la création de son compte.
 */
export function computeAttendanceRate(
  sessions: SessionInfo[],
  attendedIds: Set<number>,
  registeredAt: DateTime,
  now: DateTime
): AttendanceRate {
  const byCourse = new Map<string, CourseRate>()
  let total = 0
  let present = 0

  for (const session of sessions) {
    const attended = attendedIds.has(session.id)
    const finished = session.expiresAt.toMillis() <= now.toMillis()
    const afterRegistration = session.createdAt.toMillis() >= registeredAt.toMillis()
    if (!attended && !(finished && afterRegistration)) continue

    const key = courseKey(session.course)
    const entry = byCourse.get(key) ?? {
      course: session.course.trim(),
      total: 0,
      present: 0,
      rate: 0,
    }
    entry.total += 1
    total += 1
    if (attended) {
      entry.present += 1
      present += 1
    }
    byCourse.set(key, entry)
  }

  const courses = [...byCourse.values()]
    .map((entry) => ({ ...entry, rate: toPercent(entry.present, entry.total) }))
    .sort((a, b) => a.course.localeCompare(b.course, 'fr', { sensitivity: 'base' }))

  return { total, present, rate: total > 0 ? toPercent(present, total) : null, courses }
}
