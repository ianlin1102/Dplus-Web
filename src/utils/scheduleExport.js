/**
 * Schedule Export Utilities
 * - buildCalendarGrid: 构建日历网格 (Sun→Sat, 35 or 42 cells)
 * - exportToExcel: 导出 .xlsx 文件 (使用 ExcelJS，支持单元格样式)
 *
 * ExcelJS is loaded via dynamic import() to avoid bundling ~600KB into the main chunk.
 * It only loads when the user clicks "Export Excel".
 */

/**
 * 构建日历网格数据
 * @param {number} year
 * @param {number} month - 1-12
 * @param {Array} scheduleData - [{date: 'YYYY-MM-DD', classes: [{start, end, title, instructorName}]}]
 * @returns {Array} cells - 35 or 42 个格子, 每 7 个一行 (Sun→Sat)
 */
export function buildCalendarGrid(year, month, scheduleData) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = (firstDay + daysInMonth > 35) ? 42 : 35

  const classMap = {}
  for (const day of scheduleData) {
    classMap[day.date] = day.classes
  }

  const startDate = new Date(year, month - 1, 1 - firstDay)

  const cells = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const isCurrentMonth = d.getMonth() === month - 1 && d.getFullYear() === year

    cells.push({
      date: dateStr,
      day: d.getDate(),
      dayOfWeek: d.getDay(),
      isCurrentMonth,
      classes: isCurrentMonth ? (classMap[dateStr] || []) : []
    })
  }

  return cells
}

/**
 * 导出月课表为 Excel (ExcelJS)
 * @param {number} year
 * @param {number} month
 * @param {Array} cells - buildCalendarGrid 返回的格子数组
 * @param {string} lang - 'en' or 'zh'
 */
export async function exportToExcel(year, month, cells, lang = 'en') {
  const { default: ExcelJS } = await import('exceljs')

  const weekHeaders = lang === 'zh'
    ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // 按 7 个一行分组
  const rows = []
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7))
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(lang === 'zh' ? '月课程表' : 'Schedule')

  // 设置列宽
  ws.columns = weekHeaders.map(() => ({ width: 26 }))

  // Row 1: 标题 (合并 A1:G1)
  const titleText = lang === 'zh'
    ? `Dplus Dance Studio — ${year}年${month}月课程表`
    : `Dplus Dance Studio — ${new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} Schedule`

  ws.mergeCells('A1:G1')
  const titleCell = ws.getCell('A1')
  titleCell.value = titleText
  titleCell.font = { size: 14, bold: true }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  // Row 2: 空行
  ws.getRow(2).height = 8

  // Row 3: 星期标题
  const headerRow = ws.getRow(3)
  weekHeaders.forEach((header, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = header
    cell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder()
  })
  headerRow.height = 22

  // 数据行
  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const excelRow = ws.getRow(4 + rowIdx)
    const weekCells = rows[rowIdx]

    // 计算该行最多课程数来设置行高
    const maxClasses = Math.max(...weekCells.map(c => c.classes.length), 0)
    excelRow.height = Math.max(50, 24 + maxClasses * 18)

    for (let colIdx = 0; colIdx < 7; colIdx++) {
      const cellData = weekCells[colIdx]
      const excelCell = excelRow.getCell(colIdx + 1)

      if (!cellData.isCurrentMonth) {
        // 非当月：灰色背景
        excelCell.value = ''
        excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      } else {
        // 当月：日期号 + 课程
        const lines = [String(cellData.day)]
        for (const cls of cellData.classes) {
          lines.push(`${cls.start} ${cls.title} - ${cls.instructorName}`)
        }
        excelCell.value = lines.join('\n')

        if (cellData.classes.length > 0) {
          // 有课的格子：浅色背景
          excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
        } else {
          // 无课 rest day：淡灰
          excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
        }
      }

      excelCell.alignment = { wrapText: true, vertical: 'top' }
      excelCell.font = { size: 10 }
      excelCell.border = thinBorder()
    }
  }

  // 生成并下载
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Schedule_${year}-${String(month).padStart(2, '0')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

function thinBorder() {
  const side = { style: 'thin', color: { argb: 'FFD0D0D0' } }
  return { top: side, bottom: side, left: side, right: side }
}
