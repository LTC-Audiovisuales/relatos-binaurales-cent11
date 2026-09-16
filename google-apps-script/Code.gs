const SHEET_NAME = 'Respuestas';
const HEADERS = [
  'Fecha de recepción',
  'Fecha enviada por la web',
  'Sesión',
  'ID relato',
  'Relato',
  'Autor/a',
  'Aspectos destacados',
  'Inmersión (1-5)',
  'Comentario del relato',
  'Favorito',
  'Comentario general'
];

/**
 * Ejecutar UNA sola vez desde el editor de Apps Script.
 * Guarda el ID de la planilla vinculada, crea encabezados y aplica formato.
 */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abrí Apps Script desde Extensiones > Apps Script dentro de la planilla.');

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  const sheet = getOrCreateSheet_(ss);
  aplicarDiseno_(sheet);
}

/**
 * Ejecutá esta función cuando quieras volver a aplicar el diseño
 * sin tocar ni borrar ninguna respuesta existente.
 */
function mejorarDiseno() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abrí Apps Script desde Extensiones > Apps Script dentro de la planilla.');
  const sheet = getOrCreateSheet_(ss);
  aplicarDiseno_(sheet);
}

/** Prueba rápida: al abrir la URL del Web App debe responder OK. */
function doGet() {
  return ContentService
    .createTextOutput('OK · Relatos Binaurales CENT 11')
    .setMimeType(ContentService.MimeType.TEXT);
}

/** Recibe las devoluciones enviadas desde GitHub Pages. */
function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos.');
    }

    const payload = JSON.parse(e.postData.contents);
    const respuestas = Array.isArray(payload.respuestas) ? payload.respuestas.slice(0, 20) : [];

    if (!respuestas.length) {
      throw new Error('La devolución no contiene relatos.');
    }

    const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!spreadsheetId) {
      throw new Error('Primero ejecutá la función configurar().');
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = getOrCreateSheet_(ss);
    const recibido = new Date();
    const favorito = clean_(payload.favorito, 120);
    const comentarioGeneral = clean_(payload.comentarioGeneral, 1500);
    const sessionId = clean_(payload.sessionId, 80);
    const fechaWeb = clean_(payload.fecha, 80);

    const rows = respuestas.map(r => {
      const relatoId = clean_(r.relatoId, 120);
      const aspectos = Array.isArray(r.aspectos)
        ? r.aspectos.slice(0, 12).map(v => clean_(v, 100)).join(', ')
        : '';

      let inmersion = Number(r.inmersion);
      inmersion = Number.isFinite(inmersion) && inmersion >= 1 && inmersion <= 5 ? inmersion : '';

      return [
        recibido,
        fechaWeb,
        sessionId,
        relatoId,
        clean_(r.titulo, 200),
        clean_(r.autor, 200),
        aspectos,
        inmersion,
        clean_(r.comentario, 2000),
        favorito && relatoId === favorito ? 'Sí' : 'No',
        comentarioGeneral
      ];
    });

    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, HEADERS.length).setValues(rows);

    // Formato ligero para las nuevas filas.
    sheet.getRange(startRow, 1, rows.length, HEADERS.length)
      .setVerticalAlignment('top')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    sheet.getRange(startRow, 8, rows.length, 1).setHorizontalAlignment('center');
    sheet.getRange(startRow, 10, rows.length, 1).setHorizontalAlignment('center');

    return json_({ ok: true, filas: rows.length });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getOrCreateSheet_(ss) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
}

function aplicarDiseno_(sheet) {
  const maxRows = Math.max(sheet.getMaxRows(), 1000);
  if (sheet.getMaxRows() < maxRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), maxRows - sheet.getMaxRows());
  }

  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);

  const header = sheet.getRange(1, 1, 1, HEADERS.length);
  header
    .setValues([HEADERS])
    .setBackground('#111827')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('left')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sheet.setRowHeight(1, 42);

  // Anchos pensados para lectura, no para comprimir todo en una pantalla.
  const widths = [115, 155, 80, 100, 180, 155, 250, 95, 320, 80, 320];
  widths.forEach((width, i) => sheet.setColumnWidth(i + 1, width));

  const dataRows = Math.max(sheet.getLastRow() - 1, 1);
  const dataRange = sheet.getRange(2, 1, dataRows, HEADERS.length);
  dataRange
    .setFontSize(10)
    .setFontColor('#1F2937')
    .setVerticalAlignment('top')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  // Columnas técnicas más compactas; contenido creativo más ancho.
  sheet.getRange(2, 8, dataRows, 1).setHorizontalAlignment('center');
  sheet.getRange(2, 10, dataRows, 1).setHorizontalAlignment('center');

  // Fechas más limpias.
  sheet.getRange(2, 1, Math.max(dataRows, 1), 1).setNumberFormat('dd/MM/yyyy HH:mm');

  // Filas cómodas de leer, sin alturas gigantes.
  if (sheet.getLastRow() > 1) {
    sheet.setRowHeights(2, sheet.getLastRow() - 1, 56);
  }

  // Bandas suaves para separar respuestas.
  sheet.getBandings().forEach(b => b.remove());
  const bandRange = sheet.getRange(1, 1, Math.min(maxRows, 1000), HEADERS.length);
  const banding = bandRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  banding.setHeaderRowColor('#111827');
  banding.setFirstRowColor('#FFFFFF');
  banding.setSecondRowColor('#F3F4F6');

  // Filtro permanente en encabezados.
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), HEADERS.length).createFilter();

  // Resaltar inmersión y favorito.
  const immersionRange = sheet.getRange(2, 8, Math.max(maxRows - 1, 1), 1);
  const favoriteRange = sheet.getRange(2, 10, Math.max(maxRows - 1, 1), 1);
  sheet.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(4)
      .setBackground('#DCFCE7')
      .setRanges([immersionRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Sí')
      .setBackground('#FEF3C7')
      .setRanges([favoriteRange])
      .build()
  ]);

  sheet.getRange('A1:K1').setNote('Hoja de respuestas de la muestra Relatos Binaurales · Producción de Sonido y Música III');
}

/** Evita fórmulas accidentales/maliciosas al escribir texto en Sheets. */
function clean_(value, maxLength) {
  let text = value == null ? '' : String(value);
  text = text.replace(/\u0000/g, '').trim().slice(0, maxLength || 1000);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
