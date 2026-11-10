import User from '#models/user'
import { randomInt } from 'node:crypto'

// Sans I, O, 0, 1 pour éviter les confusions quand le CP tape un code
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Génère un code de validation unique à 6 caractères (ex : 7K3M9Q).
 * C'est aussi le contenu du QR Code personnel de l'étudiant.
 */
export async function generateAttendanceCode() {
  while (true) {
    const code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
    const exists = await User.findBy('attendanceCode', code)
    if (!exists) return code
  }
}
