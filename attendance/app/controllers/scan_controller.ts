import Attendance from '#models/attendance'
import ClassSession from '#models/class_session'
import type User from '#models/user'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Vérifie si l'étudiant a le droit de marquer sa présence.
 * Retourne un message d'erreur, ou null si tout est correct.
 */
function accessProblem(user: User, classSession: ClassSession) {
  if (classSession.expiresAt < DateTime.now()) {
    return 'Cette session est expirée : le QR Code n’est plus valide.'
  }
  if (user.promotion !== classSession.promotion) {
    return `Cette session est réservée à la promotion ${classSession.promotion}.`
  }
  if (classSession.option && user.option !== classSession.option) {
    return `Cette session est réservée à l’option ${classSession.option}.`
  }
  return null
}

export default class ScanController {
  /**
   * Page ouverte quand l'étudiant scanne le QR Code.
   * On affiche d'abord un écran de confirmation : rien n'est enregistré sur un simple GET.
   */
  async show({ params, auth, session, request, response, view }: HttpContext) {
    // Pas connecté : on retient le lien du QR, puis on renvoie vers la connexion
    if (!(await auth.check())) {
      session.put('scan_redirect', request.url())
      session.flash('error', 'Connecte-toi (ou crée un compte) pour marquer ta présence.')
      return response.redirect().toRoute('session.create')
    }

    const user = auth.getUserOrFail()
    const classSession = await ClassSession.findBy('qrToken', params.token)

    if (!classSession) {
      return view.render('pages/scan/show', {
        status: 'problem',
        message: 'Ce QR Code est invalide.',
      })
    }

    const problem = accessProblem(user, classSession)
    if (problem) {
      return view.render('pages/scan/show', { status: 'problem', message: problem, classSession })
    }

    const already = await Attendance.query()
      .where('userId', user.id)
      .where('sessionId', classSession.id)
      .first()

    return view.render('pages/scan/show', {
      status: already ? 'already' : 'ok',
      message: already ? 'Ta présence est déjà enregistrée pour cette session.' : null,
      classSession,
    })
  }

  /**
   * Enregistre la présence après confirmation.
   */
  async store({ params, auth, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const classSession = await ClassSession.findBy('qrToken', params.token)

    if (!classSession) {
      session.flash('error', 'Ce QR Code est invalide.')
      return response.redirect().toRoute('dashboard')
    }

    // Le problème est affiché par la page de scan elle-même
    if (accessProblem(user, classSession)) {
      return response.redirect().toRoute('scan.show', { token: params.token })
    }

    try {
      await Attendance.create({
        userId: user.id,
        sessionId: classSession.id,
        scannedAt: DateTime.now(),
        status: 'present',
      })
    } catch (error) {
      // 23505 = contrainte unique PostgreSQL : un deuxième scan est refusé
      if ((error as { code?: string }).code === '23505') {
        session.flash('error', 'Ta présence est déjà enregistrée pour cette session.')
        return response.redirect().toRoute('dashboard')
      }
      throw error
    }

    session.flash('success', `Présence enregistrée : ${classSession.course}`)
    return response.redirect().toRoute('dashboard')
  }
}
