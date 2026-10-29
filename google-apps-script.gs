/**
 * Google Apps Script — recolha de respostas Mag-stick.
 * Cria uma Google Sheet, abre Extensões > Apps Script, cola este ficheiro
 * e substitui SHEET_ID pelo ID da folha. Publica como aplicação Web.
 */
const SHEET_ID = '1UHQxjExwkjEIPHhLjXbOjIlQIXLMFjwP38LsRsphtAs';
const TAB_NAME = 'Respostas';
const COMPONENT_IDS = ['Garra','Botão','Interior','Interior_tampa','Exterior_tampa','Corpo'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!e || !e.postData || !e.postData.contents) throw new Error('Pedido vazio');
    const data = JSON.parse(e.postData.contents);
    validate_(data);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(TAB_NAME);
      sheet.appendRow(['Data/hora (servidor)','ID submissão','Participante/protótipo','Avaliação (1–5)',
        ...COMPONENT_IDS.map(id => id + ' HEX'),'Outras cores','Comentários']);
      sheet.setFrozenRows(1);
    }
    // Best-effort duplicate protection: don't append the same submissionId twice.
    const submissionId = String(data.submissionId || '').slice(0,100);
    if (submissionId) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const found = sheet.getRange(2,2,lastRow-1,1).createTextFinder(submissionId).matchEntireCell(true).findNext();
        if (found) return ContentService.createTextOutput(JSON.stringify({ok:true,duplicate:true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    const row = [new Date(), submissionId, clean_(data.participant,60), Number(data.rating),
      ...COMPONENT_IDS.map(id => data.colors[id].toUpperCase()),
      clean_(data.otherColors,250), clean_(data.comments,1200)];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err.message || err)})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
function doGet() {
  return ContentService.createTextOutput('Mag-stick feedback endpoint ativo.').setMimeType(ContentService.MimeType.TEXT);
}
function validate_(d) {
  if (!d || typeof d !== 'object') throw new Error('Dados inválidos');
  if (!d.colors || typeof d.colors !== 'object') throw new Error('Faltam cores');
  COMPONENT_IDS.forEach(id => {
    if (typeof d.colors[id] !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(d.colors[id])) throw new Error('HEX inválido: ' + id);
  });
  if (!Number.isInteger(Number(d.rating)) || Number(d.rating)<1 || Number(d.rating)>5) throw new Error('Avaliação inválida');
  if (d.submissionId && String(d.submissionId).length>100) throw new Error('ID demasiado longo');
}
function clean_(value, max) {
  // Prevent spreadsheet formula injection; store user input as plain text.
  let s = String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').slice(0,max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
