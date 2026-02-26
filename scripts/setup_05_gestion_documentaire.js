/**
 * Setup script for Google Sheet "05_Gestion_Documentaire"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupGestionDocumentaire()
 *
 * Tabs: Documents, Modeles, Generes, Dossiers_Sessions,
 *       Dossiers_Apprenants, Versions, Archivage
 */

// ─── Constants ──────────────────────────────────────────────────────────────

var ROWS = 200;
var ROWS_SMALL = 50;     // Modeles
var ROWS_LARGE = 500;    // Generes (many generated docs)
var ROWS_DOSSAPP = 300;  // Dossiers_Apprenants
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

// ─── Documents ──────────────────────────────────────────────────────────────

function setupDocuments_(ss) {
  Logger.log("=== Setting up Documents ===");
  var sheet = getOrCreateSheet_(ss, "Documents");

  var headers = [
    "document_id",          // A
    "categorie",            // B
    "titre",                // C
    "description",          // D
    "type_fichier",         // E
    "drive_url",            // F
    "version_actuelle",     // G
    "date_creation",        // H
    "date_derniere_maj",    // I
    "responsable",          // J
    "statut",               // K
    "revision_requise",     // L  (checkbox)
    "prochaine_revision",   // M  (date)
    "indicateurs_qualiopi", // N  (text "1,5,20")
    "commentaires"          // O
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id DOC-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("C", "DOC-", ROWS, "000", false));

  // B: categorie
  sheet.getRange("B2:B" + (ROWS + 1)).setDataValidation(
    listRule_(["administratif", "pedagogique", "qualite", "financier", "rh", "communication"]));

  // E: type_fichier
  sheet.getRange("E2:E" + (ROWS + 1)).setDataValidation(
    listRule_(["pdf", "docx", "xlsx", "formulaire", "template", "image", "autre"]));

  // H-I: dates
  sheet.getRange("H2:I" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // K: statut
  sheet.getRange("K2:K" + (ROWS + 1)).setDataValidation(
    listRule_(["actif", "brouillon", "en_revision", "archive", "obsolete"]));

  // L: checkbox revision_requise
  sheet.getRange("L2:L" + (ROWS + 1)).insertCheckboxes();

  // M: prochaine_revision date
  sheet.getRange("M2:M" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 120, 300, 350, 90, 250, 70, 110, 110, 150, 90, 80, 110, 120, 300]);

  // Conditional: statut K
  var rangeK = sheet.getRange("K2:K" + (ROWS + 1));
  addCondBg_(sheet, rangeK, "actif",       "#d4edda");
  addCondBg_(sheet, rangeK, "brouillon",   "#e2e3e5");
  addCondBg_(sheet, rangeK, "en_revision", "#fff3cd");
  addCondBg_(sheet, rangeK, "archive",     "#d4edfc");
  addCondBg_(sheet, rangeK, "obsolete",    "#f8d7da");

  // Conditional: revision_requise L = TRUE -> yellow
  addBoolRule_(sheet, sheet.getRange("L2:L" + (ROWS + 1)), true, "#fff3cd");

  // Conditional: prochaine_revision M depassee
  addFormulaRule_(sheet, sheet.getRange("M2:M" + (ROWS + 1)),
    '=AND(M2<>"",M2<TODAY())', "#f8d7da", "#721c24");

  Logger.log("  Documents done");
}

// ─── Modeles ────────────────────────────────────────────────────────────────

function setupModeles_(ss) {
  Logger.log("=== Setting up Modeles ===");
  var sheet = getOrCreateSheet_(ss, "Modeles");

  var headers = [
    "modele_id",          // A
    "titre",              // B
    "description",        // C
    "categorie",          // D
    "drive_template_id",  // E
    "variables_requises", // F  (merge fields comma-separated)
    "format_sortie",      // G
    "actif",              // H  (checkbox)
    "version",            // I
    "date_derniere_maj",  // J
    "commentaires"        // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id TPL-001
  sheet.getRange("A2:A" + (ROWS_SMALL + 1))
    .setFormulas(buildIdFormulas_("B", "TPL-", ROWS_SMALL, "000", false));

  // D: categorie
  sheet.getRange("D2:D" + (ROWS_SMALL + 1)).setDataValidation(
    listRule_([
      "convention", "convocation", "attestation", "emargement",
      "pv_positionnement", "certificat", "bilan_formateur",
      "rapport", "devis", "programme", "autre"
    ]));

  // G: format_sortie
  sheet.getRange("G2:G" + (ROWS_SMALL + 1)).setDataValidation(
    listRule_(["pdf", "docx", "xlsx"]));

  // H: actif checkbox
  sheet.getRange("H2:H" + (ROWS_SMALL + 1)).insertCheckboxes();

  // J: date
  sheet.getRange("J2:J" + (ROWS_SMALL + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 250, 350, 140, 280, 350, 80, 60, 60, 110, 300]);

  // Conditional: actif H
  addBoolRule_(sheet, sheet.getRange("H2:H" + (ROWS_SMALL + 1)), true, "#d4edda");
  addBoolRule_(sheet, sheet.getRange("H2:H" + (ROWS_SMALL + 1)), false, "#f8d7da");

  // Pre-fill common templates
  var templates = [
    ["", "Convention de formation",       "Convention inter/intra entreprise",     "convention",         "", "organisme,formation,apprenant,dates,tarif,duree",   "pdf", true, "1.0", "", ""],
    ["", "Convocation",                   "Convocation a une session",             "convocation",        "", "apprenant,formation,date_debut,lieu,horaires",      "pdf", true, "1.0", "", ""],
    ["", "Attestation de fin de formation","Attestation remise a l'apprenant",     "attestation",        "", "apprenant,formation,dates,objectifs,resultats",     "pdf", true, "1.0", "", ""],
    ["", "Feuille d'emargement",          "Emargement journalier par session",     "emargement",         "", "session,date,apprenants,creneaux",                  "pdf", true, "1.0", "", ""],
    ["", "PV de positionnement",          "Compte-rendu du positionnement",        "pv_positionnement",  "", "apprenant,formation,besoins,amenagements",          "pdf", true, "1.0", "", ""],
    ["", "Certificat de realisation",     "Certificat pour le financeur/OPCO",     "certificat",         "", "apprenant,formation,dates,duree,assiduite",         "pdf", true, "1.0", "", ""],
    ["", "Bilan formateur",               "Bilan de fin de session par formateur", "bilan_formateur",    "", "formateur,session,objectifs,constats,ameliorations", "pdf", true, "1.0", "", ""],
    ["", "Programme de formation",        "Programme detaille de la formation",    "programme",          "", "formation,objectifs,contenu,modalites,evaluation",   "pdf", true, "1.0", "", ""],
    ["", "Devis de formation",            "Proposition commerciale",               "devis",              "", "organisme,client,formation,tarif,conditions",        "pdf", true, "1.0", "", ""]
  ];
  sheet.getRange(2, 1, templates.length, templates[0].length).setValues(templates);
  Logger.log("  9 templates pre-filled");

  Logger.log("  Modeles done");
}

// ─── Generes ────────────────────────────────────────────────────────────────

function setupGeneres_(ss) {
  Logger.log("=== Setting up Generes ===");
  var sheet = getOrCreateSheet_(ss, "Generes");

  var headers = [
    "genere_id",       // A
    "modele_id",       // B  (dropdown from Modeles)
    "session_id",      // C  (text, ref 01)
    "inscription_id",  // D  (text, ref 02, optional)
    "titre_document",  // E
    "date_generation", // F
    "genere_par",      // G
    "drive_url",       // H
    "taille_ko",       // I
    "statut",          // J
    "date_envoi",      // K
    "date_signature",  // L
    "commentaires"     // M
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id GEN-2026-00001
  sheet.getRange("A2:A" + (ROWS_LARGE + 1))
    .setFormulas(buildIdFormulas_("E", "GEN-", ROWS_LARGE, "00000", true));

  // B: dropdown from Modeles!A
  sheet.getRange("B2:B" + (ROWS_LARGE + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Modeles").getRange("A2:A" + (ROWS_SMALL + 1)), true)
      .setAllowInvalid(true)  // allow manual entry too
      .build());

  // F: date_generation default
  sheet.getRange("F2:F" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("E", ROWS_LARGE));

  // G: genere_par
  sheet.getRange("G2:G" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["apps_script", "n8n", "gotenberg", "manuel"]));

  // I: taille_ko number
  sheet.getRange("I2:I" + (ROWS_LARGE + 1)).setNumberFormat("#,##0");

  // J: statut
  sheet.getRange("J2:J" + (ROWS_LARGE + 1)).setDataValidation(
    listRule_(["genere", "envoye", "signe", "archive", "erreur"]));

  // K-L: dates
  sheet.getRange("K2:L" + (ROWS_LARGE + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [140, 90, 120, 120, 300, 110, 100, 280, 70, 80, 110, 110, 300]);

  // Conditional: statut J
  var rangeJ = sheet.getRange("J2:J" + (ROWS_LARGE + 1));
  addCondBg_(sheet, rangeJ, "genere",  "#d4edfc");
  addCondBg_(sheet, rangeJ, "envoye",  "#fff3cd");
  addCondBg_(sheet, rangeJ, "signe",   "#d4edda");
  addCondBg_(sheet, rangeJ, "archive", "#e2e3e5");
  addCondBg_(sheet, rangeJ, "erreur",  "#f8d7da");

  Logger.log("  Generes done");
}

// ─── Dossiers Sessions ──────────────────────────────────────────────────────

function setupDossiersSessions_(ss) {
  Logger.log("=== Setting up Dossiers_Sessions ===");
  var sheet = getOrCreateSheet_(ss, "Dossiers_Sessions");

  var headers = [
    "session_id",          // A  (text, ref 01)
    "formation_intitule",  // B
    "date_debut",          // C
    "programme_ok",        // D  (checkbox)
    "convention_ok",       // E
    "convocations_ok",     // F
    "supports_ok",         // G
    "emargement_ok",       // H
    "eval_pre_ok",         // I
    "eval_post_ok",        // J
    "bilan_formateur_ok",  // K
    "satisfaction_ok",     // L
    "attestations_ok",     // M
    "certificats_ok",      // N
    "completude",          // O  (formula)
    "drive_dossier_url",   // P
    "commentaires"         // Q
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // C: date
  sheet.getRange("C2:C" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // D-N: checkboxes (11 columns)
  sheet.getRange("D2:N" + (ROWS + 1)).insertCheckboxes();
  Logger.log("  11 checklist checkboxes inserted");

  // O: completude formula = COUNTIF(D:N, TRUE) / 11 * 100
  var compFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    compFormulas.push(['=IF(A' + r + '="","",ROUND(COUNTIF(D' + r + ':N' + r + ',TRUE)/11*100,0))']);
  }
  sheet.getRange("O2:O" + (ROWS + 1)).setFormulas(compFormulas);
  sheet.getRange("O2:O" + (ROWS + 1)).setNumberFormat("0\"%\"");
  Logger.log("  Completude formulas set");

  // Widths
  setColWidths_(sheet, [120, 250, 110, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 280, 300]);

  // Conditional: completude O
  var rangeO = sheet.getRange("O2:O" + (ROWS + 1));
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(100).setBackground("#c3e6cb")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(70).setBackground("#d4edda")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(40, 69).setBackground("#fff3cd")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(40).setBackground("#f8d7da")
    .setRanges([rangeO]).build());
  sheet.setConditionalFormatRules(rules);

  // Freeze A-C
  sheet.setFrozenColumns(3);

  Logger.log("  Dossiers_Sessions done");
}

// ─── Dossiers Apprenants ────────────────────────────────────────────────────

function setupDossiersApprenants_(ss) {
  Logger.log("=== Setting up Dossiers_Apprenants ===");
  var sheet = getOrCreateSheet_(ss, "Dossiers_Apprenants");

  var headers = [
    "inscription_id",    // A  (text, ref 02)
    "apprenant_nom",     // B
    "session_id",        // C  (text, ref 01)
    "devis_ok",          // D  (checkbox)
    "convention_ok",     // E
    "convocation_ok",    // F
    "positionnement_ok", // G
    "emargements_ok",    // H
    "eval_pre_ok",       // I
    "eval_post_ok",      // J
    "attestation_ok",    // K
    "certificat_ok",     // L
    "satisfaction_ok",   // M
    "suivi_froid_ok",    // N
    "completude",        // O  (formula)
    "drive_dossier_url", // P
    "commentaires",      // Q
    "date_maj"           // R
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // D-N: checkboxes (11 columns)
  sheet.getRange("D2:N" + (ROWS_DOSSAPP + 1)).insertCheckboxes();
  Logger.log("  11 checklist checkboxes inserted");

  // O: completude formula
  var compFormulas = [];
  for (var i = 0; i < ROWS_DOSSAPP; i++) {
    var r = i + 2;
    compFormulas.push(['=IF(A' + r + '="","",ROUND(COUNTIF(D' + r + ':N' + r + ',TRUE)/11*100,0))']);
  }
  sheet.getRange("O2:O" + (ROWS_DOSSAPP + 1)).setFormulas(compFormulas);
  sheet.getRange("O2:O" + (ROWS_DOSSAPP + 1)).setNumberFormat("0\"%\"");

  // R: date_maj
  sheet.getRange("R2:R" + (ROWS_DOSSAPP + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [120, 180, 120, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 80, 280, 300, 110]);

  // Conditional: completude O (same scale as Sessions)
  var rangeO = sheet.getRange("O2:O" + (ROWS_DOSSAPP + 1));
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(100).setBackground("#c3e6cb")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(70).setBackground("#d4edda")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(40, 69).setBackground("#fff3cd")
    .setRanges([rangeO]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(40).setBackground("#f8d7da")
    .setRanges([rangeO]).build());
  sheet.setConditionalFormatRules(rules);

  // Freeze A-C
  sheet.setFrozenColumns(3);

  Logger.log("  Dossiers_Apprenants done");
}

// ─── Versions ───────────────────────────────────────────────────────────────

function setupVersions_(ss) {
  Logger.log("=== Setting up Versions ===");
  var sheet = getOrCreateSheet_(ss, "Versions");

  var headers = [
    "version_id",       // A
    "document_id",      // B  (dropdown from Documents)
    "numero_version",   // C  (e.g. "1.0", "2.1")
    "date_revision",    // D
    "auteur",           // E
    "modifications",    // F
    "drive_url_version",// G
    "statut"            // H
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id VER-0001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("B", "VER-", ROWS, "0000", false));

  // B: dropdown from Documents!A
  sheet.getRange("B2:B" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Documents").getRange("A2:A" + (ROWS + 1)), true)
      .setAllowInvalid(true)
      .build());

  // D: date_revision
  sheet.getRange("D2:D" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // H: statut
  sheet.getRange("H2:H" + (ROWS + 1)).setDataValidation(
    listRule_(["brouillon", "valide", "publie", "obsolete"]));

  // Widths
  setColWidths_(sheet, [100, 90, 80, 110, 150, 450, 280, 90]);

  // Conditional: statut H
  var rangeH = sheet.getRange("H2:H" + (ROWS + 1));
  addCondBg_(sheet, rangeH, "brouillon", "#e2e3e5");
  addCondBg_(sheet, rangeH, "valide",    "#d4edfc");
  addCondBg_(sheet, rangeH, "publie",    "#d4edda");
  addCondBg_(sheet, rangeH, "obsolete",  "#f8d7da");

  // Wrap text on modifications column
  sheet.getRange("F2:F" + (ROWS + 1)).setWrap(true);

  Logger.log("  Versions done");
}

// ─── Archivage ──────────────────────────────────────────────────────────────

function setupArchivage_(ss) {
  Logger.log("=== Setting up Archivage ===");
  var sheet = getOrCreateSheet_(ss, "Archivage");

  var headers = [
    "archivage_id",       // A
    "type_document",      // B
    "reference_id",       // C  (DOC-/GEN-/session/inscription ID)
    "titre",              // D
    "categorie",          // E
    "date_archivage",     // F
    "duree_retention_ans",// G
    "date_expiration",    // H  (formula)
    "drive_archive_url",  // I
    "statut",             // J
    "responsable",        // K
    "commentaires"        // L
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id ARC-0001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("D", "ARC-", ROWS, "0000", false));

  // B: type_document
  sheet.getRange("B2:B" + (ROWS + 1)).setDataValidation(
    listRule_(["document", "genere", "dossier_session", "dossier_apprenant", "autre"]));

  // E: categorie
  sheet.getRange("E2:E" + (ROWS + 1)).setDataValidation(
    listRule_(["administratif", "pedagogique", "qualite", "financier", "rh"]));

  // F: date_archivage
  sheet.getRange("F2:F" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // G: duree_retention_ans > 0
  sheet.getRange("G2:G" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0).setAllowInvalid(false)
      .setHelpText("Duree de retention en annees > 0").build());

  // H: date_expiration = EDATE(F, G*12)
  var expFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    expFormulas.push(['=IF(OR(F' + r + '="",G' + r + '=""),"",EDATE(F' + r + ',G' + r + '*12))']);
  }
  sheet.getRange("H2:H" + (ROWS + 1)).setFormulas(expFormulas);
  sheet.getRange("H2:H" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");
  Logger.log("  Expiration date formulas set");

  // J: statut
  sheet.getRange("J2:J" + (ROWS + 1)).setDataValidation(
    listRule_(["archive", "a_purger", "purge"]));

  // Widths
  setColWidths_(sheet, [110, 130, 130, 280, 110, 110, 80, 110, 280, 80, 150, 300]);

  // Conditional: statut J
  var rangeJ = sheet.getRange("J2:J" + (ROWS + 1));
  addCondBg_(sheet, rangeJ, "archive",  "#d4edda");
  addCondBg_(sheet, rangeJ, "a_purger", "#fff3cd");
  addCondBg_(sheet, rangeJ, "purge",    "#e2e3e5");

  // Conditional: date_expiration H depassee -> highlight
  addFormulaRule_(sheet, sheet.getRange("H2:H" + (ROWS + 1)),
    '=AND(H2<>"",H2<TODAY())', "#f8d7da", "#721c24");

  // Pre-fill retention guidelines (row 2-6 as examples)
  var examples = [
    ["", "document",  "",  "Conventions de formation",       "administratif", "", 5, "", "", "archive", "", "Obligation legale 5 ans"],
    ["", "document",  "",  "Feuilles d'emargement",          "pedagogique",   "", 5, "", "", "archive", "", "Obligation legale 5 ans"],
    ["", "document",  "",  "Attestations de formation",      "pedagogique",   "", 5, "", "", "archive", "", "Obligation legale 5 ans"],
    ["", "document",  "",  "Factures et justificatifs",      "financier",     "", 10,"", "", "archive", "", "Obligation comptable 10 ans"],
    ["", "document",  "",  "Contrats formateurs",            "rh",            "", 5, "", "", "archive", "", "Obligation sociale 5 ans"]
  ];
  sheet.getRange(2, 1, examples.length, examples[0].length).setValues(examples);
  Logger.log("  5 retention guidelines pre-filled");

  Logger.log("  Archivage done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupGestionDocumentaire() {
  Logger.log("========================================");
  Logger.log("  setupGestionDocumentaire() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Order: Documents first (ref by Versions), Modeles before Generes
  setupDocuments_(ss);
  setupModeles_(ss);
  setupGeneres_(ss);
  setupDossiersSessions_(ss);
  setupDossiersApprenants_(ss);
  setupVersions_(ss);
  setupArchivage_(ss);

  removeDefaultSheets_(ss);
  ss.setActiveSheet(ss.getSheetByName("Documents"));

  Logger.log("========================================");
  Logger.log("  setupGestionDocumentaire() - DONE");
  Logger.log("========================================");
}
