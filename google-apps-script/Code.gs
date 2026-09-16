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
 * Guarda el ID de la planilla vinculada y crea la hoja/encabezados.
 */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abrí Apps Script desde Extensiones > Apps Script dentro de la planilla.');

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  const sheet = getOrCreateSheet_(ss);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
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

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);

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
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }

  return sheet;
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
