import vine from '@vinejs/vine'
import { PROMOTIONS, MASTER_PROMOTIONS, MASTER_OPTIONS } from '#services/academic'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().trim().toLowerCase().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().trim().minLength(3).maxLength(100),
  promotion: vine.enum(PROMOTIONS),
  // Obligatoire uniquement pour les promotions de Master
  option: vine
    .enum(MASTER_OPTIONS)
    .optional()
    .requiredWhen('promotion', 'in', [...MASTER_PROMOTIONS]),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
