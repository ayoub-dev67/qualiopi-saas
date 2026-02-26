/**
 * Setup script for Google Sheet "06_Communication_Notifications"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupCommunication()
 *
 * Tabs: Modeles_Email, Envois, Campagnes, Destinataires,
 *       Relances, Notifications, Calendrier
 */

// ─── Constants ──────────────────────────────────────────────────────────────

var ROWS = 200;
var ROWS_SMALL = 50;
var ROWS_LARGE = 500;
var ROWS_ENVOIS = 1000;
var HEADER_BG = "#1a365d";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOrCreateSheet_(ss, name) {
  var existing = ss.getSheetByName(name);
  if (existing) {
    ss.deleteSheet(existing);
    Logger.log("Deleted existing sheet: " + name);
  }
  var sheet = ss.insertSheet(name);
  Logger.log("Created sheet: " + name);
  return sheet;
}

function removeDefaultSheets_(ss) {
  ["Sheet1", "Feuille 1", "Feuille de calcul1"].forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s) { ss.deleteSheet(s); Logger.log("Removed default sheet: " + n); }
  });
}

function applyHeaderStyle_(sheet, nbCols, bgColor) {
  sheet.getRange(1, 1, 1, nbCols)
    .setBackground(bgColor || HEADER_BG)
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
  Logger.log("  Header styled & row frozen");
}

function setColWidths_(sheet, widths) {
  widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
}

function addCondBg_(sheet, range, value, color) {
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(value).setBackground(color)
    .setRanges([range]).build());
  sheet.setConditionalFormatRules(rules);
}

function addBoolRule_(sheet, range, isTrue, color) {
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(isTrue ? "TRUE" : "FALSE").setBackground(color)
    .setRanges([range]).build());
  sheet.setConditionalFormatRules(rules);
}

function addFormulaRule_(sheet, range, formula, bg, fontColor) {
  var rules = sheet.getConditionalFormatRules();
  var builder = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula).setBackground(bg).setRanges([range]);
  if (fontColor) builder = builder.setFontColor(fontColor);
  rules.push(builder.build());
  sheet.setConditionalFormatRules(rules);
}

function buildIdFormulas_(keyCol, prefix, count, pad, withYear) {
  var formulas = [];
  for (var i = 0; i < count; i++) {
    var r = i + 2;
    var f = withYear
      ? '=IF(' + keyCol + r + '="","",CONCATENATE("' + prefix + '",TEXT(YEAR(TODAY()),"0000"),"-",TEXT(ROW()-1,"' + pad + '")))'
      : '=IF(' + keyCol + r + '="","",CONCATENATE("' + prefix + '",TEXT(ROW()-1,"' + pad + '")))';
    formulas.push([f]);
  }
  return formulas;
}

function buildDateFormulas_(keyCol, count) {
  var formulas = [];
  for (var i = 0; i < count; i++) {
    formulas.push(['=IF(' + keyCol + (i + 2) + '="","",TODAY())']);
  }
  return formulas;
}

function listRule_(values) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
}

// ─── Modeles Email ──────────────────────────────────────────────────────────

function setupModelesEmail_(ss) {
  Logger.log("=== Setting up Modeles_Email ===");
  var sheet = getOrCreateSheet_(ss, "Modeles_Email");

  var headers = [
    "modele_id",              // A
    "code",                   // B  (unique key)
    "objet_template",         // C
    "corps_apercu",           // D
    "variables_disponibles",  // E
    "type_envoi",             // F
    "declencheur",            // G
    "delai",                  // H  (J-7, J+2, immediat)
    "actif",                  // I  (checkbox)
    "date_derniere_maj",      // J
    "commentaires"            // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id MLE-001
  sheet.getRange("A2:A" + (ROWS_SMALL + 1))
    .setFormulas(buildIdFormulas_("B", "MLE-", ROWS_SMALL, "000", false));

  // F: type_envoi
  sheet.getRange("F2:F" + (ROWS_SMALL + 1)).setDataValidation(
    listRule_(["automatique", "manuel", "campagne"]));

  // I: actif checkbox
  sheet.getRange("I2:I" + (ROWS_SMALL + 1)).insertCheckboxes();

  // J: date
  sheet.getRange("J2:J" + (ROWS_SMALL + 1)).setNumberFormat("yyyy-MM-dd");

  // Pre-fill 15 standard Qualiopi email templates
  var tpl = [
    ["","convocation",
     "Convocation - {{formation}} du {{date_debut}}",
     "Vous etes convoque(e) a la session {{formation}}...",
     "apprenant_nom,formation,date_debut,lieu,horaires,formateur",
     "automatique","Session confirmee","J-7",true,"",""],
    ["","rappel_session",
     "Rappel : votre formation {{formation}} demain",
     "Nous vous rappelons votre session de formation...",
     "apprenant_nom,formation,date_debut,lieu,horaires",
     "automatique","Veille de session","J-1",true,"",""],
    ["","positionnement",
     "Questionnaire de positionnement - {{formation}}",
     "Afin de personnaliser votre parcours, merci de completer...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Session planifiee","J-3",true,"",""],
    ["","positionnement_relance_1",
     "Rappel : questionnaire de positionnement en attente",
     "Nous n'avons pas encore recu votre positionnement...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Pas de reponse","J+2 apres envoi",true,"",""],
    ["","positionnement_relance_2",
     "Dernier rappel : positionnement a completer",
     "Il est important de completer votre positionnement avant...",
     "apprenant_nom,formation,lien_formulaire,date_limite",
     "automatique","Pas de reponse relance 1","J+5 apres envoi",true,"",""],
    ["","satisfaction",
     "Votre avis compte - Enquete satisfaction {{formation}}",
     "Vous venez de terminer la formation {{formation}}. Votre retour...",
     "apprenant_nom,formation,formateur,lien_formulaire",
     "automatique","Fin de session","J+1",true,"",""],
    ["","satisfaction_relance_1",
     "Rappel : enquete de satisfaction en attente",
     "Votre avis est essentiel pour ameliorer nos formations...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Pas de reponse","J+2 apres envoi",true,"",""],
    ["","satisfaction_relance_2",
     "Dernier rappel : votre avis sur {{formation}}",
     "Nous n'avons pas encore recu votre retour...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Pas de reponse relance 1","J+5 apres envoi",true,"",""],
    ["","evaluation_pre",
     "Evaluation pre-formation - {{formation}}",
     "Avant le debut de votre formation, merci de completer cette evaluation...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Session confirmee","J-2",true,"",""],
    ["","evaluation_post",
     "Evaluation post-formation - {{formation}}",
     "Merci de completer cette evaluation de fin de formation...",
     "apprenant_nom,formation,lien_formulaire,formateur",
     "automatique","Fin de session","J+1",true,"",""],
    ["","attestation",
     "Votre attestation de formation - {{formation}}",
     "Veuillez trouver ci-joint votre attestation de fin de formation...",
     "apprenant_nom,formation,dates,lien_attestation",
     "automatique","Attestation generee","J+3",true,"",""],
    ["","certificat_realisation",
     "Certificat de realisation - {{formation}} - {{apprenant_nom}}",
     "Veuillez trouver ci-joint le certificat de realisation...",
     "apprenant_nom,formation,dates,duree,lien_certificat",
     "automatique","Fin de session","J+5",true,"",""],
    ["","suivi_froid",
     "Votre retour 6 mois apres - {{formation}}",
     "Il y a 6 mois vous avez suivi la formation {{formation}}...",
     "apprenant_nom,formation,date_formation,lien_formulaire",
     "automatique","6 mois apres session","J+180",true,"",""],
    ["","suivi_froid_relance",
     "Rappel : enquete de suivi a froid",
     "Nous n'avons pas encore recu votre retour post-formation...",
     "apprenant_nom,formation,lien_formulaire",
     "automatique","Pas de reponse suivi froid","J+5 apres envoi",true,"",""],
    ["","bilan_formateur",
     "Bilan formateur a completer - Session {{session_id}}",
     "La session {{formation}} est terminee. Merci de completer votre bilan...",
     "formateur_nom,formation,session_id,dates,lien_formulaire",
     "automatique","Fin de session","J+1",true,"",""]
  ];
  sheet.getRange(2, 1, tpl.length, tpl[0].length).setValues(tpl);
  Logger.log("  15 email templates pre-filled");

  // Widths
  setColWidths_(sheet, [90, 180, 350, 400, 350, 100, 180, 110, 50, 110, 250]);

  // Conditional: actif I
  addBoolRule_(sheet, sheet.getRange("I2:I" + (ROWS_SMALL + 1)), true, "#d4edda");
  addBoolRule_(sheet, sheet.getRange("I2:I" + (ROWS_SMALL + 1)), false, "#f8d7da");

  // Wrap corps_apercu
  sheet.getRange("D2:D" + (ROWS_SMALL + 1)).setWrap(true);

  Logger.log("  Modeles_Email done");
}

// ─── Envois ─────────────────────────────────────────────────────────────────

function setupEnvois_(ss) {
  Logger.log("=== Setting up Envois ===");
  var sheet = getOrCreateSheet_(ss, "Envois");

  var headers = [
    "envoi_id",           // A
    "date_envoi",         // B
    "type",               // C
    "modele_email_id",    // D  (dropdown from Modeles_Email)
    "campagne_id",        // E  (text, optional)
    "destinataire_email", // F
    "destinataire_nom",   // G
    "objet",              // H
    "session_id",         // I  (text, ref 01)
    "inscription_id",     // J  (text, ref 02)
    "statut",             // K
    "erreur_details",     // L
    "relance_numero",     // M  (0-3)
    "created_at"          // N
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length, "#2d3748");

  // A: auto-id ENV-2026-00001
  sheet.getRange("A2:A" + (ROWS_ENVOIS + 1))
    .setFormulas(buildIdFormulas_("F", "ENV-", ROWS_ENVOIS, "00000", true));

  // B: datetime
  sheet.getRange("B2:B" + (ROWS_ENVOIS + 1)).setNumberFormat("yyyy-MM-dd HH:mm");

  // C: type
  sheet.getRange("C2:C" + (ROWS_ENVOIS + 1)).setDataValidation(
    listRule_(["email", "sms", "notification_interne"]));

  // D: dropdown from Modeles_Email!A
  sheet.getRange("D2:D" + (ROWS_ENVOIS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Modeles_Email").getRange("A2:A" + (ROWS_SMALL + 1)), true)
      .setAllowInvalid(true)
      .build());

  // K: statut
  sheet.getRange("K2:K" + (ROWS_ENVOIS + 1)).setDataValidation(
    listRule_(["envoye", "delivre", "ouvert", "clique", "erreur", "rebond"]));

  // M: relance_numero 0-3
  sheet.getRange("M2:M" + (ROWS_ENVOIS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberBetween(0, 3).setAllowInvalid(false).build());

  // N: created_at
  sheet.getRange("N2:N" + (ROWS_ENVOIS + 1)).setNumberFormat("yyyy-MM-dd HH:mm");

  // Widths
  setColWidths_(sheet, [140, 130, 80, 90, 90, 220, 150, 300, 120, 120, 80, 300, 50, 130]);

  // Conditional: statut K
  var rangeK = sheet.getRange("K2:K" + (ROWS_ENVOIS + 1));
  addCondBg_(sheet, rangeK, "envoye",  "#d4edfc");
  addCondBg_(sheet, rangeK, "delivre", "#d4edda");
  addCondBg_(sheet, rangeK, "ouvert",  "#c3e6cb");
  addCondBg_(sheet, rangeK, "clique",  "#c3e6cb");
  addCondBg_(sheet, rangeK, "erreur",  "#f8d7da");
  addCondBg_(sheet, rangeK, "rebond",  "#f5c6cb");

  // Conditional: erreur non vide -> highlight row
  addFormulaRule_(sheet, sheet.getRange("A2:N" + (ROWS_ENVOIS + 1)),
    '=$L2<>""', "#fff5f5", "#c53030");

  Logger.log("  Envois done");
}

// ─── Campagnes ──────────────────────────────────────────────────────────────

function setupCampagnes_(ss) {
  Logger.log("=== Setting up Campagnes ===");
  var sheet = getOrCreateSheet_(ss, "Campagnes");

  var headers = [
    "campagne_id",     // A
    "titre",           // B
    "description",     // C
    "modele_email_id", // D
    "session_id",      // E  (optional)
    "cible",           // F
    "date_planifiee",  // G
    "date_execution",  // H
    "nb_destinataires",// I
    "nb_envoyes",      // J
    "nb_erreurs",      // K
    "taux_envoi",      // L  (formula)
    "statut",          // M
    "commentaires"     // N
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id CMP-2026-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("B", "CMP-", ROWS, "000", true));

  // D: dropdown from Modeles_Email
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Modeles_Email").getRange("A2:A" + (ROWS_SMALL + 1)), true)
      .setAllowInvalid(true)
      .build());

  // F: cible
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    listRule_(["apprenants_session", "tous_apprenants", "formateurs", "entreprises", "financeurs", "custom"]));

  // G-H: dates
  sheet.getRange("G2:H" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // I-K: numbers >= 0
  var numRule = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  ["I", "J", "K"].forEach(function (col) {
    sheet.getRange(col + "2:" + col + (ROWS + 1)).setDataValidation(numRule);
  });

  // L: taux_envoi formula = J / I * 100
  var txFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    txFormulas.push(['=IF(OR(I' + r + '="",I' + r + '=0),"",ROUND(J' + r + '/I' + r + '*100,0))']);
  }
  sheet.getRange("L2:L" + (ROWS + 1)).setFormulas(txFormulas);
  sheet.getRange("L2:L" + (ROWS + 1)).setNumberFormat("0\"%\"");

  // M: statut
  sheet.getRange("M2:M" + (ROWS + 1)).setDataValidation(
    listRule_(["brouillon", "planifiee", "en_cours", "terminee", "annulee"]));

  // Widths
  setColWidths_(sheet, [130, 250, 350, 90, 120, 140, 110, 110, 80, 80, 80, 80, 90, 300]);

  // Conditional: statut M
  var rangeM = sheet.getRange("M2:M" + (ROWS + 1));
  addCondBg_(sheet, rangeM, "brouillon", "#e2e3e5");
  addCondBg_(sheet, rangeM, "planifiee", "#d4edfc");
  addCondBg_(sheet, rangeM, "en_cours",  "#fff3cd");
  addCondBg_(sheet, rangeM, "terminee",  "#d4edda");
  addCondBg_(sheet, rangeM, "annulee",   "#f8d7da");

  Logger.log("  Campagnes done");
}

// ─── Destinataires ──────────────────────────────────────────────────────────

function setupDestinataires_(ss) {
  Logger.log("=== Setting up Destinataires ===");
  var sheet = getOrCreateSheet_(ss, "Destinataires");

  var headers = [
    "destinataire_id", // A
    "liste",           // B
    "nom",             // C
    "prenom",          // D
    "email",           // E
    "telephone",       // F
    "session_id",      // G  (optional)
    "inscription_id",  // H  (optional)
    "opt_out",         // I  (checkbox - desabonne)
    "date_ajout",      // J
    "commentaires"     // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id DEST-001
  sheet.getRange("A2:A" + (ROWS_LARGE + 1))
    .setFormulas(buildIdFormulas_("E", "DEST-", ROWS_LARGE, "000", false));

  // B: liste
  sheet.getRange("B2:B" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["apprenants", "formateurs", "entreprises", "financeurs", "partenaires", "interne"]));

  // I: opt_out checkbox
  sheet.getRange("I2:I" + (ROWS_LARGE + 1)).insertCheckboxes();

  // J: date_ajout default
  sheet.getRange("J2:J" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("E", ROWS_LARGE));

  // Widths
  setColWidths_(sheet, [100, 110, 150, 150, 250, 130, 120, 120, 70, 110, 300]);

  // Conditional: opt_out I -> grey out row
  addFormulaRule_(sheet, sheet.getRange("A2:K" + (ROWS_LARGE + 1)),
    '=$I2=TRUE', "#f0f0f0", "#999999");

  // Conditional: liste B
  var rangeB = sheet.getRange("B2:B" + (ROWS_LARGE + 1));
  addCondBg_(sheet, rangeB, "apprenants",  "#d4edfc");
  addCondBg_(sheet, rangeB, "formateurs",  "#d4edda");
  addCondBg_(sheet, rangeB, "entreprises", "#e8daef");
  addCondBg_(sheet, rangeB, "financeurs",  "#fff3cd");
  addCondBg_(sheet, rangeB, "partenaires", "#fce4ec");
  addCondBg_(sheet, rangeB, "interne",     "#e2e3e5");

  Logger.log("  Destinataires done");
}

// ─── Relances ───────────────────────────────────────────────────────────────

function setupRelances_(ss) {
  Logger.log("=== Setting up Relances ===");
  var sheet = getOrCreateSheet_(ss, "Relances");

  var headers = [
    "relance_id",        // A
    "type_relance",      // B
    "inscription_id",    // C  (text, ref 02)
    "session_id",        // D  (text, ref 01)
    "destinataire_email",// E
    "relance_numero",    // F  (1, 2, 3)
    "date_prevue",       // G
    "date_envoi",        // H
    "date_reponse",      // I
    "statut",            // J
    "envoi_id",          // K  (text, ref Envois)
    "commentaires"       // L
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id REL-2026-0001
  sheet.getRange("A2:A" + (ROWS_LARGE + 1))
    .setFormulas(buildIdFormulas_("E", "REL-", ROWS_LARGE, "0000", true));

  // B: type_relance
  sheet.getRange("B2:B" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_([
      "positionnement", "satisfaction", "evaluation",
      "suivi_froid", "emargement", "paiement", "document_manquant"
    ]));

  // F: relance_numero 1-3
  sheet.getRange("F2:F" + (ROWS_LARGE + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberBetween(1, 3).setAllowInvalid(false).build());

  // G-I: dates
  sheet.getRange("G2:I" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd");

  // J: statut
  sheet.getRange("J2:J" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["planifiee", "envoyee", "repondue", "expiree", "annulee"]));

  // Widths
  setColWidths_(sheet, [130, 140, 120, 120, 220, 50, 110, 110, 110, 90, 130, 300]);

  // Conditional: statut J
  var rangeJ = sheet.getRange("J2:J" + (ROWS_LARGE + 1));
  addCondBg_(sheet, rangeJ, "planifiee", "#d4edfc");
  addCondBg_(sheet, rangeJ, "envoyee",   "#fff3cd");
  addCondBg_(sheet, rangeJ, "repondue",  "#d4edda");
  addCondBg_(sheet, rangeJ, "expiree",   "#f8d7da");
  addCondBg_(sheet, rangeJ, "annulee",   "#e2e3e5");

  // Conditional: relance_numero F color (higher = more urgent)
  var rangeF = sheet.getRange("F2:F" + (ROWS_LARGE + 1));
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(3).setBackground("#f8d7da")
    .setRanges([rangeF]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(2).setBackground("#fff3cd")
    .setRanges([rangeF]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(1).setBackground("#d4edfc")
    .setRanges([rangeF]).build());
  sheet.setConditionalFormatRules(rules);

  // Conditional: date_prevue G depassee et non repondue/annulee
  addFormulaRule_(sheet, sheet.getRange("G2:G" + (ROWS_LARGE + 1)),
    '=AND(G2<>"",G2<TODAY(),J2<>"repondue",J2<>"annulee")',
    "#f5c6cb", "#721c24");

  Logger.log("  Relances done");
}

// ─── Notifications ──────────────────────────────────────────────────────────

function setupNotifications_(ss) {
  Logger.log("=== Setting up Notifications ===");
  var sheet = getOrCreateSheet_(ss, "Notifications");

  var headers = [
    "notification_id", // A
    "date_creation",   // B
    "type",            // C
    "destinataire",    // D  (email interne)
    "titre",           // E
    "message",         // F
    "source",          // G
    "reference_id",    // H
    "lue",             // I  (checkbox)
    "date_lecture",    // J
    "commentaires"     // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id NOT-0001
  sheet.getRange("A2:A" + (ROWS_LARGE + 1))
    .setFormulas(buildIdFormulas_("E", "NOT-", ROWS_LARGE, "0000", false));

  // B: datetime
  sheet.getRange("B2:B" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd HH:mm");

  // C: type
  sheet.getRange("C2:C" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["info", "alerte", "rappel", "erreur", "succes"]));

  // G: source
  sheet.getRange("G2:G" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["apps_script", "n8n", "systeme", "cron", "manuel"]));

  // I: lue checkbox
  sheet.getRange("I2:I" + (ROWS_LARGE + 1)).insertCheckboxes();

  // J: datetime
  sheet.getRange("J2:J" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd HH:mm");

  // Widths
  setColWidths_(sheet, [100, 140, 70, 200, 250, 400, 100, 130, 40, 140, 300]);

  // Conditional: type C
  var rangeC = sheet.getRange("C2:C" + (ROWS_LARGE + 1));
  addCondBg_(sheet, rangeC, "info",    "#d4edfc");
  addCondBg_(sheet, rangeC, "alerte",  "#fff3cd");
  addCondBg_(sheet, rangeC, "rappel",  "#e8daef");
  addCondBg_(sheet, rangeC, "erreur",  "#f8d7da");
  addCondBg_(sheet, rangeC, "succes",  "#d4edda");

  // Conditional: non lue -> bold row
  addFormulaRule_(sheet, sheet.getRange("A2:K" + (ROWS_LARGE + 1)),
    '=AND($E2<>"",$I2=FALSE)', "#fffbea", null);

  Logger.log("  Notifications done");
}

// ─── Calendrier ─────────────────────────────────────────────────────────────

function setupCalendrier_(ss) {
  Logger.log("=== Setting up Calendrier ===");
  var sheet = getOrCreateSheet_(ss, "Calendrier");

  var headers = [
    "calendrier_id",   // A
    "date_prevue",     // B
    "type_comm",       // C
    "objet",           // D
    "session_id",      // E  (optional)
    "cible",           // F
    "modele_email_id", // G  (optional)
    "automatique",     // H  (checkbox)
    "declencheur",     // I  (J-7, J+1, etc.)
    "statut",          // J
    "date_execution",  // K
    "commentaires"     // L
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id CAL-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("D", "CAL-", ROWS, "000", false));

  // B: date_prevue
  sheet.getRange("B2:B" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // C: type_comm
  sheet.getRange("C2:C" + (ROWS + 1)).setDataValidation(
    listRule_(["email", "sms", "notification", "rappel", "campagne"]));

  // F: cible
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    listRule_(["apprenants", "formateurs", "entreprises", "direction", "tous"]));

  // G: dropdown from Modeles_Email (optional)
  sheet.getRange("G2:G" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Modeles_Email").getRange("A2:A" + (ROWS_SMALL + 1)), true)
      .setAllowInvalid(true)
      .build());

  // H: automatique checkbox
  sheet.getRange("H2:H" + (ROWS + 1)).insertCheckboxes();

  // J: statut
  sheet.getRange("J2:J" + (ROWS + 1)).setDataValidation(
    listRule_(["planifie", "execute", "annule", "reporte"]));

  // K: date_execution
  sheet.getRange("K2:K" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 110, 90, 300, 120, 110, 90, 70, 180, 80, 110, 300]);

  // Conditional: statut J
  var rangeJ = sheet.getRange("J2:J" + (ROWS + 1));
  addCondBg_(sheet, rangeJ, "planifie", "#d4edfc");
  addCondBg_(sheet, rangeJ, "execute",  "#d4edda");
  addCondBg_(sheet, rangeJ, "annule",   "#f8d7da");
  addCondBg_(sheet, rangeJ, "reporte",  "#fff3cd");

  // Conditional: date_prevue B depassee et non execute/annule
  addFormulaRule_(sheet, sheet.getRange("B2:B" + (ROWS + 1)),
    '=AND(B2<>"",B2<TODAY(),J2<>"execute",J2<>"annule")',
    "#f5c6cb", "#721c24");

  Logger.log("  Calendrier done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupCommunication() {
  Logger.log("========================================");
  Logger.log("  setupCommunication() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Modeles_Email first (referenced by Envois, Campagnes, Calendrier)
  setupModelesEmail_(ss);
  setupEnvois_(ss);
  setupCampagnes_(ss);
  setupDestinataires_(ss);
  setupRelances_(ss);
  setupNotifications_(ss);
  setupCalendrier_(ss);

  removeDefaultSheets_(ss);
  ss.setActiveSheet(ss.getSheetByName("Modeles_Email"));

  Logger.log("========================================");
  Logger.log("  setupCommunication() - DONE");
  Logger.log("========================================");
}
