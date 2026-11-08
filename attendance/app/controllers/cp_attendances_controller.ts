import Attendance from '#models/attendance'
import ClassSession from '#models/class_session'
import User from '#models/user'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Enregistre la présence d'un étudiant à partir de son code.
 * Utilisé par le scan du QR Code (la caméra lit le code) ET par la saisie manuelle.
 * Répond toujours en JSON : { status: 'ok' | 'already' | 'error', message, student? }
 */
export default class CpAttendancesController {
  async store({ params, request, response }: HttpContext) {
    const classSession = await ClassSession.find(params.id)
    if (!classSession) {
      return response.status(404).send({ status: 'error', message: 'Session introuvable.' })
    }

    if (classSession.expiresAt < DateTime.now()) {
      return response.status(422).send({ status: 'error', message: 'Cette session est clôturée.' })
    }

    const code = String(request.input('code', '')).trim().toUpperCase()
    const student = code
      ? await User.query().where('attendanceCode', code).where('role', 'student').first()
      : null

    if (!student) {
      return response.status(404).send({ status: 'error', message: 'Code inconnu.' })
    }

    const name = student.fullName ?? student.email

    // L'étudiant doit appartenir à la promotion (et à l'option) de la session
    if (
      student.promotion !== classSession.promotion ||
      (classSession.option && student.option !== classSession.option)
    ) {
      return response.status(422).send({
        status: 'error',
        message: `${name} n’appartient pas à cette session (${student.promotion ?? 'promotion inconnue'}).`,
      })
    }

    const info = (scannedAt: DateTime) => ({
      id: student.id,
      name,
      time: scannedAt.setLocale('fr').toFormat('HH:mm'),
    })

    const existing = await Attendance.query()
      .where('userId', student.id)
      .where('sessionId', classSession.id)
      .first()
    if (existing) {
      return response.send({
        status: 'already',
        message: `${name} est déjà marqué(e) présent(e).`,
        student: info(existing.scannedAt),
      })
    }

    const scannedAt = DateTime.now()
    try {
      await Attendance.create({
        userId: student.id,
        sessionId: classSession.id,
        scannedAt,
        status: 'present',
      })
    } catch (error) {
      // 23505 = contrainte unique PostgreSQL (double scan simultané)
      if ((error as { code?: string }).code === '23505') {
        return response.send({
          status: 'already',
          message: `${name} est déjà marqué(e) présent(e).`,
          student: info(scannedAt),
        })
      }
      throw error
    }

    return response.send({
      status: 'ok',
      message: `${name} : présent(e)`,
      student: info(scannedAt),
    })
  }
}
