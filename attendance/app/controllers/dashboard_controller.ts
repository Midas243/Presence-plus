import Attendance from '#models/attendance'
import ClassSession from '#models/class_session'
import { generateAttendanceCode } from '#services/attendance_code'
import { computeAttendanceRate } from '#services/attendance_rate'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import QRCode from 'qrcode'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Sécurité : un ancien compte sans code en reçoit un ici
    if (!user.attendanceCode) {
      user.attendanceCode = await generateAttendanceCode()
      await user.save()
    }

    // QR Code personnel : il contient simplement le code de validation de l'étudiant
    const qrCode = await QRCode.toDataURL(user.attendanceCode, { width: 560, margin: 2 })

    const rows = await db
      .from('attendances')
      .join('sessions', 'sessions.id', 'attendances.session_id')
      .where('attendances.user_id', user.id)
      .orderBy('attendances.scanned_at', 'desc')
      .limit(30)
      .select('sessions.course', 'sessions.day', 'sessions.hour', 'attendances.scanned_at')

    const attendances = rows.map((row) => ({
      course: row.course as string,
      day: row.day as string,
      hour: row.hour as string,
      scannedAt: DateTime.fromJSDate(row.scanned_at as Date)
        .setLocale('fr')
        .toFormat("dd/MM/yyyy 'à' HH:mm"),
    }))

    return view.render('pages/dashboard', { user, attendances, qrCode })
  }

  /**
   * Taux de présence de l'étudiant : global, puis cours par cours
   */
  async rate({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()

    // Séances qui le concernent : même promotion, et même option si la séance en a une
    const sessions = user.promotion
      ? await ClassSession.query()
          .where('promotion', user.promotion)
          .where((query) => {
            query.whereNull('option')
            if (user.option) query.orWhere('option', user.option)
          })
          .orderBy('createdAt', 'asc')
      : []

    const attendances = await Attendance.query().where('userId', user.id)
    const attendedIds = new Set(attendances.map((attendance) => attendance.sessionId))

    const stats = computeAttendanceRate(sessions, attendedIds, user.createdAt, DateTime.now())

    return view.render('pages/attendance_rate', { user, stats })
  }
}
