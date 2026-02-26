/**
 * Setup script for Google Sheet "02_Suivi_Apprenants"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupSuiviApprenants()
 *
 * Tabs: Apprenants, Inscriptions, Positionnement, Emargement,
 *       Evaluations, Satisfaction, Suivi_Froid, Reclamations
 */

// ─── Constants ──────────────────────────────────────────────────────────────

var ROWS = 300;          // default data rows for most tabs
var ROWS_EMG = 500;      // emargement: more rows (learners x days)
var ROWS_REC = 100;      // reclamations: fewer expected
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

/** Build auto-ID formula array. keyCol = column to check empty (e.g. "B"). */
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

/** Build date-default formula array (shows TODAY when keyCol is not empty). */
function buildDateFormulas_(keyCol, count) {
  var formulas = [];
  for (var i = 0; i < count; i++) {
    formulas.push(['=IF(' + keyCol + (i + 2) + '="","",TODAY())']);
  }
  return formulas;
}

/** Apply survey-status conditional formatting (reused on several tabs). */
function applySurveyStatusFmt_(sheet, colLetter, rows) {
  var range = sheet.getRange(colLetter + "2:" + colLetter + (rows + 1));
  addCondBg_(sheet, range, "a_envoyer",  "#e2e3e5");
  addCondBg_(sheet, range, "envoye",     "#d4edfc");
  addCondBg_(sheet, range, "relance_1",  "#fff3cd");
  addCondBg_(sheet, range, "relance_2",  "#ffc107");
  addCondBg_(sheet, range, "relance_3",  "#f8d7da");
  addCondBg_(sheet, range, "complete",   "#d4edda");
}

/** Create a dropdown validation from a value list. */
function listRule_(values) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
}

/** Create a dropdown validation from a sheet range. */
function rangeRule_(ss, sheetName, rangeA1) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getSheetByName(sheetName).getRange(rangeA1), true)
    .setAllowInvalid(false).build();
}

// ─── Apprenants ─────────────────────────────────────────────────────────────

function setupApprenants_(ss) {
  Logger.log("=== Setting up Apprenants ===");
  var sheet = getOrCreateSheet_(ss, "Apprenants");
  var headers = [
    "apprenant_id", "nom", "prenom", "email", "telephone",
    "entreprise", "poste", "situation_handicap", "besoins_specifiques",
    "commentaires", "date_creation"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id APP-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("B", "APP-", ROWS, "000", false));
  Logger.log("  Apprenant ID formulas set");

  // H: checkbox situation_handicap
  sheet.getRange("H2:H" + (ROWS + 1)).insertCheckboxes();

  // K: date_creation default
  sheet.getRange("K2:K" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("B", ROWS));

  // Widths
  setColWidths_(sheet, [110, 150, 150, 250, 130, 200, 150, 130, 300, 300, 120]);

  // Conditional: handicap flag (blue highlight when TRUE)
  var rangeH = sheet.getRange("H2:H" + (ROWS + 1));
  addBoolRule_(sheet, rangeH, true, "#d4edfc");
  addBoolRule_(sheet, rangeH, false, "#ffffff");

  Logger.log("  Apprenants done");
}

// ─── Inscriptions ───────────────────────────────────────────────────────────

function setupInscriptions_(ss) {
  Logger.log("=== Setting up Inscriptions ===");
  var sheet = getOrCreateSheet_(ss, "Inscriptions");
  var headers = [
    "inscription_id",         // A
    "session_id",             // B  (manual - ref 01_Referentiel)
    "apprenant_id",           // C  (dropdown from Apprenants)
    "statut",                 // D
    "date_inscription",       // E
    "convention_signee",      // F
    "convocation_envoyee",    // G
    "positionnement_fait",    // H
    "evaluation_pre_faite",   // I
    "evaluation_post_faite",  // J
    "satisfaction_repondue",  // K
    "attestation_generee",    // L
    "suivi_froid_envoye",     // M
    "dossier_complet",        // N  (formula)
    "created_at"              // O
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id INS-2026-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("B", "INS-", ROWS, "000", true));
  Logger.log("  Inscription ID formulas set");

  // C: dropdown from Apprenants!A2:A
  sheet.getRange("C2:C" + (ROWS + 1))
    .setDataValidation(rangeRule_(ss, "Apprenants", "A2:A" + (ROWS + 1)));

  // D: statut dropdown
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(
    listRule_(["inscrit", "confirme", "en_cours", "termine", "abandonne", "annule"]));

  // E: date inscription default
  sheet.getRange("E2:E" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("B", ROWS));

  // F-M: checkboxes (8 columns)
  sheet.getRange("F2:M" + (ROWS + 1)).insertCheckboxes();
  Logger.log("  Workflow checkboxes inserted (F-M)");

  // N: dossier_complet formula = AND of F..L
  var dossierFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    dossierFormulas.push([
      '=IF(B' + r + '="","",AND(F' + r + ',G' + r + ',H' + r + ',I' + r + ',J' + r + ',K' + r + ',L' + r + '))'
    ]);
  }
  sheet.getRange("N2:N" + (ROWS + 1)).setFormulas(dossierFormulas);
  Logger.log("  Dossier complet formulas set");

  // O: created_at
  sheet.getRange("O2:O" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("B", ROWS));

  // Widths: A=140,B=120,C=110,D=100,E=120,F-M=95,N=110,O=120
  setColWidths_(sheet, [140, 120, 110, 100, 120, 95, 95, 95, 95, 95, 95, 95, 95, 110, 120]);

  // Conditional: statut D
  var rangeD = sheet.getRange("D2:D" + (ROWS + 1));
  addCondBg_(sheet, rangeD, "inscrit",   "#d4edfc");
  addCondBg_(sheet, rangeD, "confirme",  "#d4edda");
  addCondBg_(sheet, rangeD, "en_cours",  "#fff3cd");
  addCondBg_(sheet, rangeD, "termine",   "#e2e3e5");
  addCondBg_(sheet, rangeD, "abandonne", "#f8d7da");
  addCondBg_(sheet, rangeD, "annule",    "#f8d7da");

  // Conditional: dossier_complet N
  var rangeN = sheet.getRange("N2:N" + (ROWS + 1));
  addBoolRule_(sheet, rangeN, true,  "#d4edda");
  addBoolRule_(sheet, rangeN, false, "#f8d7da");

  Logger.log("  Inscriptions done");
}

// ─── Positionnement ─────────────────────────────────────────────────────────

function setupPositionnement_(ss) {
  Logger.log("=== Setting up Positionnement ===");
  var sheet = getOrCreateSheet_(ss, "Positionnement");
  var headers = [
    "positionnement_id",  // A
    "session_id",         // B
    "inscription_id",     // C
    "date_envoi",         // D
    "date_reponse",       // E
    "score",              // F  (0-10)
    "besoins_identifies", // G
    "amenagements_prevus",// H
    "statut",             // I
    "commentaires"        // J
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id POS-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("C", "POS-", ROWS, "000", false));

  // C: dropdown from Inscriptions!A2:A
  sheet.getRange("C2:C" + (ROWS + 1))
    .setDataValidation(rangeRule_(ss, "Inscriptions", "A2:A" + (ROWS + 1)));

  // D-E: dates
  sheet.getRange("D2:E" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // F: score 0-10
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberBetween(0, 10).setAllowInvalid(false)
      .setHelpText("Score entre 0 et 10").build());

  // I: survey statut
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["a_envoyer", "envoye", "relance_1", "relance_2", "relance_3", "complete"]));

  // Widths
  setColWidths_(sheet, [110, 120, 130, 120, 120, 80, 300, 300, 110, 300]);

  applySurveyStatusFmt_(sheet, "I", ROWS);
  Logger.log("  Positionnement done");
}

// ─── Emargement ─────────────────────────────────────────────────────────────

function setupEmargement_(ss) {
  Logger.log("=== Setting up Emargement ===");
  var sheet = getOrCreateSheet_(ss, "Emargement");
  var headers = [
    "emargement_id",        // A
    "session_id",           // B
    "inscription_id",       // C
    "date_seance",          // D
    "creneau",              // E
    "present",              // F
    "signature_horodatage", // G
    "justificatif_absence", // H
    "commentaire"           // I
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id EMG-0001
  sheet.getRange("A2:A" + (ROWS_EMG + 1))
    .setFormulas(buildIdFormulas_("C", "EMG-", ROWS_EMG, "0000", false));

  // C: dropdown from Inscriptions
  sheet.getRange("C2:C" + (ROWS_EMG + 1))
    .setDataValidation(rangeRule_(ss, "Inscriptions", "A2:A" + (ROWS + 1)));

  // D: date
  sheet.getRange("D2:D" + (ROWS_EMG + 1)).setNumberFormat("yyyy-MM-dd");

  // E: creneau dropdown
  sheet.getRange("E2:E" + (ROWS_EMG + 1)).setDataValidation(
    listRule_(["matin", "apres_midi", "journee_complete"]));

  // F: present checkbox
  sheet.getRange("F2:F" + (ROWS_EMG + 1)).insertCheckboxes();

  // G: datetime format
  sheet.getRange("G2:G" + (ROWS_EMG + 1)).setNumberFormat("yyyy-MM-dd HH:mm");

  // Widths
  setColWidths_(sheet, [120, 120, 130, 110, 130, 80, 170, 250, 300]);

  // Conditional: present F
  var rangeF = sheet.getRange("F2:F" + (ROWS_EMG + 1));
  addBoolRule_(sheet, rangeF, true,  "#d4edda");
  addBoolRule_(sheet, rangeF, false, "#f8d7da");

  // Conditional: creneau E
  var rangeE = sheet.getRange("E2:E" + (ROWS_EMG + 1));
  addCondBg_(sheet, rangeE, "matin",            "#d4edfc");
  addCondBg_(sheet, rangeE, "apres_midi",       "#e8daef");
  addCondBg_(sheet, rangeE, "journee_complete", "#d4edda");

  Logger.log("  Emargement done");
}

// ─── Evaluations ────────────────────────────────────────────────────────────

function setupEvaluations_(ss) {
  Logger.log("=== Setting up Evaluations ===");
  var sheet = getOrCreateSheet_(ss, "Evaluations");
  var headers = [
    "evaluation_id",  // A
    "session_id",     // B
    "inscription_id", // C
    "type",           // D  (pre / post)
    "date_evaluation",// E
    "score",          // F
    "score_max",      // G
    "pourcentage",    // H  (formula)
    "acquis",         // I
    "commentaires",   // J
    "created_at"      // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id EVAL-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("C", "EVAL-", ROWS, "000", false));

  // C: dropdown from Inscriptions
  sheet.getRange("C2:C" + (ROWS + 1))
    .setDataValidation(rangeRule_(ss, "Inscriptions", "A2:A" + (ROWS + 1)));

  // D: type pre/post
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(listRule_(["pre", "post"]));

  // E: date
  sheet.getRange("E2:E" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // F: score >= 0
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false)
      .setHelpText("Score >= 0").build());

  // G: score_max > 0
  sheet.getRange("G2:G" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0).setAllowInvalid(false)
      .setHelpText("Score max > 0").build());

  // H: pourcentage formula
  var pctFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    pctFormulas.push(['=IF(OR(F' + r + '="",G' + r + '=""),"",ROUND(F' + r + '/G' + r + '*100,1))']);
  }
  sheet.getRange("H2:H" + (ROWS + 1)).setFormulas(pctFormulas);
  sheet.getRange("H2:H" + (ROWS + 1)).setNumberFormat("0.0\"%\"");
  Logger.log("  Pourcentage formulas set");

  // I: acquis dropdown
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["non_acquis", "en_cours_acquisition", "acquis", "maitrise"]));

  // K: created_at
  sheet.getRange("K2:K" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("C", ROWS));

  // Widths
  setColWidths_(sheet, [110, 120, 130, 80, 120, 80, 80, 90, 160, 300, 120]);

  // Conditional: type D
  var rangeD = sheet.getRange("D2:D" + (ROWS + 1));
  addCondBg_(sheet, rangeD, "pre",  "#d4edfc");
  addCondBg_(sheet, rangeD, "post", "#d4edda");

  // Conditional: acquis I
  var rangeI = sheet.getRange("I2:I" + (ROWS + 1));
  addCondBg_(sheet, rangeI, "non_acquis",            "#f8d7da");
  addCondBg_(sheet, rangeI, "en_cours_acquisition",  "#fff3cd");
  addCondBg_(sheet, rangeI, "acquis",                "#d4edda");
  addCondBg_(sheet, rangeI, "maitrise",              "#c3e6cb");

  Logger.log("  Evaluations done");
}

// ─── Satisfaction ───────────────────────────────────────────────────────────

function setupSatisfaction_(ss) {
  Logger.log("=== Setting up Satisfaction ===");
  var sheet = getOrCreateSheet_(ss, "Satisfaction");
  var headers = [
    "satisfaction_id",   // A
    "session_id",        // B
    "inscription_id",    // C
    "date_envoi",        // D
    "date_reponse",      // E
    "note_globale",      // F  (1-10)
    "note_contenu",      // G
    "note_pedagogie",    // H
    "note_organisation", // I
    "note_supports",     // J
    "recommande",        // K  (checkbox)
    "commentaires",      // L
    "axes_amelioration", // M
    "statut"             // N
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id SAT-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("C", "SAT-", ROWS, "000", false));

  // C: dropdown from Inscriptions
  sheet.getRange("C2:C" + (ROWS + 1))
    .setDataValidation(rangeRule_(ss, "Inscriptions", "A2:A" + (ROWS + 1)));

  // D-E: dates
  sheet.getRange("D2:E" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // F-J: notes 1-10
  var noteRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 10).setAllowInvalid(false)
    .setHelpText("Note entre 1 et 10").build();
  ["F", "G", "H", "I", "J"].forEach(function (col) {
    sheet.getRange(col + "2:" + col + (ROWS + 1)).setDataValidation(noteRule);
  });

  // K: recommande checkbox
  sheet.getRange("K2:K" + (ROWS + 1)).insertCheckboxes();

  // N: survey statut
  sheet.getRange("N2:N" + (ROWS + 1)).setDataValidation(
    listRule_(["a_envoyer", "envoye", "relance_1", "relance_2", "relance_3", "complete"]));

  // Widths
  setColWidths_(sheet, [110, 120, 130, 110, 110, 90, 90, 90, 90, 90, 100, 300, 300, 110]);

  applySurveyStatusFmt_(sheet, "N", ROWS);

  // Conditional: note_globale F (color scale via rules)
  var rangeF = sheet.getRange("F2:F" + (ROWS + 1));
  var rulesF = sheet.getConditionalFormatRules();
  rulesF.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(4).setBackground("#f8d7da").setRanges([rangeF]).build());
  rulesF.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(4, 5).setBackground("#fff3cd").setRanges([rangeF]).build());
  rulesF.push(SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(6).setBackground("#d4edda").setRanges([rangeF]).build());
  sheet.setConditionalFormatRules(rulesF);

  Logger.log("  Satisfaction done");
}

// ─── Suivi Froid ────────────────────────────────────────────────────────────

function setupSuiviFroid_(ss) {
  Logger.log("=== Setting up Suivi_Froid ===");
  var sheet = getOrCreateSheet_(ss, "Suivi_Froid");
  var headers = [
    "suivi_froid_id",       // A
    "session_id",           // B
    "inscription_id",       // C
    "date_envoi",           // D
    "date_reponse",         // E
    "impact_professionnel", // F  (1-10)
    "competences_utilisees",// G  (checkbox)
    "objectifs_atteints",   // H  (oui/partiellement/non)
    "commentaires",         // I
    "besoins_complementaires", // J
    "statut",               // K
    "created_at"            // L
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id SF-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("C", "SF-", ROWS, "000", false));

  // C: dropdown from Inscriptions
  sheet.getRange("C2:C" + (ROWS + 1))
    .setDataValidation(rangeRule_(ss, "Inscriptions", "A2:A" + (ROWS + 1)));

  // D-E: dates
  sheet.getRange("D2:E" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // F: impact 1-10
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberBetween(1, 10).setAllowInvalid(false)
      .setHelpText("Impact entre 1 et 10").build());

  // G: checkbox
  sheet.getRange("G2:G" + (ROWS + 1)).insertCheckboxes();

  // H: objectifs_atteints
  sheet.getRange("H2:H" + (ROWS + 1)).setDataValidation(
    listRule_(["oui", "partiellement", "non"]));

  // K: survey statut
  sheet.getRange("K2:K" + (ROWS + 1)).setDataValidation(
    listRule_(["a_envoyer", "envoye", "relance_1", "relance_2", "relance_3", "complete"]));

  // L: created_at
  sheet.getRange("L2:L" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("C", ROWS));

  // Widths
  setColWidths_(sheet, [110, 120, 130, 110, 110, 120, 130, 130, 300, 300, 110, 120]);

  applySurveyStatusFmt_(sheet, "K", ROWS);

  // Conditional: objectifs H
  var rangeH = sheet.getRange("H2:H" + (ROWS + 1));
  addCondBg_(sheet, rangeH, "oui",            "#d4edda");
  addCondBg_(sheet, rangeH, "partiellement",  "#fff3cd");
  addCondBg_(sheet, rangeH, "non",            "#f8d7da");

  Logger.log("  Suivi_Froid done");
}

// ─── Reclamations ───────────────────────────────────────────────────────────

function setupReclamations_(ss) {
  Logger.log("=== Setting up Reclamations ===");
  var sheet = getOrCreateSheet_(ss, "Reclamations");
  var headers = [
    "reclamation_id",    // A
    "date_reclamation",  // B
    "source",            // C
    "session_id",        // D  (optional)
    "apprenant_id",      // E  (optional)
    "objet",             // F
    "description",       // G
    "gravite",           // H
    "statut",            // I
    "action_corrective", // J
    "responsable",       // K
    "date_resolution",   // L
    "resultat",          // M
    "created_at"         // N
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id REC-001
  sheet.getRange("A2:A" + (ROWS_REC + 1))
    .setFormulas(buildIdFormulas_("F", "REC-", ROWS_REC, "000", false));

  // B: date_reclamation
  sheet.getRange("B2:B" + (ROWS_REC + 1)).setNumberFormat("yyyy-MM-dd");

  // C: source
  sheet.getRange("C2:C" + (ROWS_REC + 1)).setDataValidation(
    listRule_(["apprenant", "formateur", "entreprise", "financeur", "autre"]));

  // E: dropdown from Apprenants (optional)
  sheet.getRange("E2:E" + (ROWS_REC + 1))
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Apprenants").getRange("A2:A" + (ROWS + 1)), true)
      .setAllowInvalid(true)  // optional field
      .build());

  // H: gravite
  sheet.getRange("H2:H" + (ROWS_REC + 1)).setDataValidation(
    listRule_(["faible", "moyenne", "haute", "critique"]));

  // I: statut
  sheet.getRange("I2:I" + (ROWS_REC + 1)).setDataValidation(
    listRule_(["ouverte", "en_cours", "resolue", "cloturee"]));

  // L: date_resolution
  sheet.getRange("L2:L" + (ROWS_REC + 1)).setNumberFormat("yyyy-MM-dd");

  // N: created_at
  sheet.getRange("N2:N" + (ROWS_REC + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("F", ROWS_REC));

  // Widths
  setColWidths_(sheet, [110, 120, 110, 120, 110, 200, 400, 90, 90, 400, 150, 120, 300, 120]);

  // Conditional: gravite H
  var rangeH = sheet.getRange("H2:H" + (ROWS_REC + 1));
  addCondBg_(sheet, rangeH, "faible",   "#d4edda");
  addCondBg_(sheet, rangeH, "moyenne",  "#fff3cd");
  addCondBg_(sheet, rangeH, "haute",    "#f8d7da");
  addCondBg_(sheet, rangeH, "critique", "#f5c6cb");

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (ROWS_REC + 1));
  addCondBg_(sheet, rangeI, "ouverte",  "#f8d7da");
  addCondBg_(sheet, rangeI, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeI, "resolue",  "#d4edda");
  addCondBg_(sheet, rangeI, "cloturee", "#e2e3e5");

  Logger.log("  Reclamations done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupSuiviApprenants() {
  Logger.log("========================================");
  Logger.log("  setupSuiviApprenants() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Order matters: Apprenants first (referenced by Inscriptions),
  // then Inscriptions (referenced by all survey tabs).
  setupApprenants_(ss);
  setupInscriptions_(ss);
  setupPositionnement_(ss);
  setupEmargement_(ss);
  setupEvaluations_(ss);
  setupSatisfaction_(ss);
  setupSuiviFroid_(ss);
  setupReclamations_(ss);

  removeDefaultSheets_(ss);

  ss.setActiveSheet(ss.getSheetByName("Apprenants"));

  Logger.log("========================================");
  Logger.log("  setupSuiviApprenants() - DONE");
  Logger.log("========================================");
}
