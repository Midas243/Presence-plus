import User from '#models/user'
import { signupValidator } from '#validators/user'
import { generateAttendanceCode } from '#services/attendance_code'
import { isMaster, LICENCE_PROMOTIONS, MASTER_PROMOTIONS, MASTER_OPTIONS } from '#services/academic'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * NewAccountController handles student registration.
 */
export default class NewAccountController {
  /**
   * Display the signup page
   */
  async create({ view }: HttpContext) {
    // Listes prêtes à l'emploi pour les <select> (placeholder + valeurs)
    const promotionOptions = [
      { value: '', name: 'Choisis ta promotion' },
      ...[...LICENCE_PROMOTIONS, ...MASTER_PROMOTIONS].map((value) => ({ value })),
    ]
    const optionOptions = [
      { value: '', name: 'Choisis ton option' },
      ...MASTER_OPTIONS.map((value) => ({ value })),
    ]

    return view.render('pages/auth/signup', { promotionOptions, optionOptions })
  }

  /**
   * Create a student account and authenticate the user
   */
  async store({ request, response, auth }: HttpContext) {
    const { fullName, email, password, promotion, option } =
      await request.validateUsing(signupValidator)

    const user = await User.create({
      fullName,
      email,
      password,
      promotion,
      // L'option n'existe qu'en Master
      option: isMaster(promotion) ? (option ?? null) : null,
      // Le rôle n'est JAMAIS lu depuis le formulaire : tout compte créé ici est un étudiant
      role: 'student',
      // Code de validation personnel (aussi le contenu de son QR Code)
      attendanceCode: await generateAttendanceCode(),
    })

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }
}
