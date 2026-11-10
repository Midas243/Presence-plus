import env from '#start/env'
import { cpLoginValidator } from '#validators/cp'
import type { HttpContext } from '@adonisjs/core/http'

export default class CpAuthController {
  async create({ view, session, response }: HttpContext) {
    if (session.get('cp_authenticated')) {
      return response.redirect().toRoute('cp.dashboard')
    }
    return view.render('pages/cp/login')
  }

  async store({ request, session, response }: HttpContext) {
    const { code } = await request.validateUsing(cpLoginValidator)

    if (code !== (env.get('CP_CODE') ?? '2027')) {
      session.flash('error', 'Code incorrect.')
      return response.redirect().back()
    }

    session.put('cp_authenticated', true)
    return response.redirect().toRoute('cp.dashboard')
  }

  async destroy({ session, response }: HttpContext) {
    session.forget('cp_authenticated')
    return response.redirect().toRoute('cp.login')
  }
}
