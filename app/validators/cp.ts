import vine from '@vinejs/vine'
import { DAYS, HOURS, PROMOTIONS, MASTER_OPTIONS } from '#services/academic'

export const cpLoginValidator = vine.create({
  code: vine.string().trim().minLength(1).maxLength(50),
})

export const sessionValidator = vine.create({
  course: vine.string().trim().minLength(2).maxLength(120),
  day: vine.enum(DAYS),
  hour: vine.enum(HOURS),
  promotion: vine.enum(PROMOTIONS),
  // Facultative (Master) : sans option, la session concerne toute la promotion
  option: vine.enum(MASTER_OPTIONS).optional(),
})
