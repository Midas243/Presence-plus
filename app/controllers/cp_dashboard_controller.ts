import ClassSession from '#models/class_session'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

export default class CpDashboardController {
  async index({ view }: HttpContext) {
    const sessions = await ClassSession.query().orderBy('createdAt', 'desc').limit(30)
    const now = DateTime.now()

    const items = sessions.map((s) => ({
      id: s.id,
      course: s.course,
      day: s.day,
      hour: s.hour,
      promotion: s.promotion,
      option: s.option,
      active: s.expiresAt > now,
    }))

    return view.render('pages/cp/dashboard', { sessions: items })
  }
}
