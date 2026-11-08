import ExcelJS from 'exceljs'
import type { DateTime } from 'luxon'

/**
 * Export Excel de la liste des étudiants présents à une session.
 * Ce fichier ne dépend d'aucun modèle : il reçoit des données simples,
 * ce qui le rend facile à tester.
 */

/** Fuseau d'affichage des dates dans le fichier (indépendant du fuseau du serveur) */
const ZONE = 'Africa/Kinshasa'

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type SessionInfo = {
  course: string
  day: string
  hour: string
  promotion: string
  option: string | null
  createdAt: DateTime
}

type StudentInfo = {
  fullName: string | null
  email: string
  promotion: string | null
  option: string | null
}

/**
 * Découpe « TEPA TOKO GEORGES » en Nom / Post-nom / Prénom.
 * Le 1er mot est le nom, le 2e le post-nom, le reste le prénom.
 */
export function splitName(fullName: string) {
  const [nom = '', postnom = '', ...rest] = fullName.trim().split(/\s+/).filter(Boolean)
  return { nom, postnom, prenom: rest.join(' ') }
}

/** Ex : presence-comptabilite-generale-2026-11-07.xlsx (uniquement des caractères sûrs) */
export function exportFileName(session: Pick<SessionInfo, 'course' | 'createdAt'>) {
  const slug = session.course
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .slice(0, 50)
    .replace(/^-+|-+$/g, '')
  const date = session.createdAt.setZone(ZONE).toFormat('yyyy-MM-dd')
  return `presence-${slug || 'session'}-${date}.xlsx`
}

/**
 * Construit le classeur Excel : un en-tête (cours, jour, heure, promotion)
 * puis un tableau N° / Nom / Post-nom / Prénom / Promotion / Option,
 * trié par ordre alphabétique.
 */
export async function buildAttendanceWorkbook(session: SessionInfo, students: StudentInfo[]) {
  const rows = students
    .map((student) => ({
      ...splitName(student.fullName ?? student.email),
      promotion: (student.promotion ?? '').trim(),
      option: student.option ?? '',
    }))
    .sort(
      (a, b) =>
        a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }) ||
        a.postnom.localeCompare(b.postnom, 'fr', { sensitivity: 'base' }) ||
        a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
    )

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Présents')

  const columns = [
    { title: 'N°', width: 6 },
    { title: 'Nom', width: 22 },
    { title: 'Post-nom', width: 22 },
    { title: 'Prénom', width: 22 },
    { title: 'Promotion', width: 16 },
    { title: 'Option', width: 42 },
  ]
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width
  })

  // En-tête : cours, puis détails de la session
  const date = session.createdAt.setZone(ZONE).toFormat('dd/MM/yyyy')
  const details = [
    `${session.day} ${session.hour}`,
    session.promotion.trim(),
    session.option,
    date,
  ].filter(Boolean)

  sheet.addRow([session.course])
  sheet.mergeCells(1, 1, 1, columns.length)
  sheet.getRow(1).font = { bold: true, size: 14 }

  sheet.addRow([details.join(' · ')])
  sheet.mergeCells(2, 1, 2, columns.length)

  sheet.addRow([`Présents : ${rows.length}`])
  sheet.mergeCells(3, 1, 3, columns.length)

  sheet.addRow([])

  // Tableau
  const headerRow = sheet.addRow(columns.map((column) => column.title))
  headerRow.font = { bold: true }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEF7' } }
    cell.border = { bottom: { style: 'thin' } }
  })
  sheet.views = [{ state: 'frozen', ySplit: headerRow.number }]

  rows.forEach((row, index) => {
    sheet.addRow([index + 1, row.nom, row.postnom, row.prenom, row.promotion, row.option])
  })

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  return { fileName: exportFileName(session), buffer }
}
