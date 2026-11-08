import Attendance from '#models/attendance'
import ClassSession from '#models/class_session'
import User from '#models/user'
import { sessionValidator } from '#validators/cp'
import { buildAttendanceWorkbook, XLSX_MIME } from '#services/attendance_export'
import {
  DAYS,
  HOURS,
  LICENCE_PROMOTIONS,
  MASTER_PROMOTIONS,
  MASTER_OPTIONS,
  SESSION_VALIDITY_HOURS,
  isMaster,
} from '#services/academic'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

const toOptions = (placeholder: string, values: readonly string[]) => [
  { value: '', name: placeholder },
  ...values.map((value) => ({ value })),
]

export default class CpSessionsController {
  /**
   * Formulaire de création d'une session
   */
  async create({ view }: HttpContext) {
    return view.render('pages/cp/sessions/create', {
      dayOptions: toOptions('Choisis le jour', DAYS),
      hourOptions: toOptions("Choisis l'heure", HOURS),
      promotionOptions: toOptions('Choisis la promotion', [
        ...LICENCE_PROMOTIONS,
        ...MASTER_PROMOTIONS,
      ]),
      optionOptions: toOptions('Toutes les options', MASTER_OPTIONS),
    })
  }

  /**
   * Enregistre la session, puis ouvre la page de scan
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(sessionValidator)

    const classSession = await ClassSession.create({
      course: data.course,
      day: data.day,
      hour: data.hour,
      promotion: data.promotion,
      option: isMaster(data.promotion) ? (data.option ?? null) : null,
      expiresAt: DateTime.now().plus({ hours: SESSION_VALIDITY_HOURS }),
    })

    return response.redirect().toRoute('cp.sessions.show', { id: classSession.id })
  }

  /**
   * Page de scan : caméra, saisie du code, listes des présents et des absents
   */
  async show({ params, view }: HttpContext) {
    const classSession = await ClassSession.findOrFail(params.id)

    // Étudiants concernés : même promotion (et même option pour un Master)
    const students = await User.query()
      .where('role', 'student')
      .where('promotion', classSession.promotion)
      .if(classSession.option, (query) => query.where('option', classSession.option!))
      .orderBy('fullName', 'asc')

    const attendances = await Attendance.query()
      .where('sessionId', classSession.id)
      .orderBy('scannedAt', 'desc')
    const scannedAt = new Map(attendances.map((a) => [a.userId, a.scannedAt]))
    const byId = new Map(students.map((s) => [s.id, s]))

    const present = attendances
      .filter((a) => byId.has(a.userId))
      .map((a) => ({
        id: a.userId,
        name: byId.get(a.userId)!.fullName ?? byId.get(a.userId)!.email,
        time: a.scannedAt.setLocale('fr').toFormat('HH:mm'),
      }))
    const absent = students
      .filter((s) => !scannedAt.has(s.id))
      .map((s) => ({ id: s.id, name: s.fullName ?? s.email }))

    return view.render('pages/cp/sessions/show', {
      classSession,
      // Les listes sont données à Alpine.js en JSON
      presentJson: JSON.stringify(present),
      absentJson: JSON.stringify(absent),
      expired: classSession.expiresAt < DateTime.now(),
      expiresAt: classSession.expiresAt.setLocale('fr').toFormat("dd/MM/yyyy 'à' HH:mm"),
    })
  }

  /**
   * Télécharge le fichier Excel des étudiants présents à cette session
   */
  async download({ params, response }: HttpContext) {
    const classSession = await ClassSession.findOrFail(params.id)

    const attendances = await Attendance.query().where('sessionId', classSession.id)
    const userIds = attendances.map((attendance) => attendance.userId)
    const students = userIds.length
      ? await User.query().where('role', 'student').whereIn('id', userIds)
      : []

    const { fileName, buffer } = await buildAttendanceWorkbook(classSession, students)

    response.header('Content-Type', XLSX_MIME)
    response.header('Content-Disposition', `attachment; filename="${fileName}"`)
    return response.send(buffer)
  }
}
