/**
 * Setup script for Google Sheet "01_Referentiel_Qualiopi"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupReferentiel()
 */

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
  var defaults = ["Sheet1", "Feuille 1", "Feuille de calcul1"];
  defaults.forEach(function (n) {
    var s = ss.getSheetByName(n);
    if (s) {
      ss.deleteSheet(s);
      Logger.log("Removed default sheet: " + n);
    }
  });
}

function applyHeaderStyle_(sheet, nbCols, bgColor) {
  var bg = bgColor || "#1a365d";
  var range = sheet.getRange(1, 1, 1, nbCols);
  range.setBackground(bg)
       .setFontColor("#ffffff")
       .setFontWeight("bold")
       .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
  Logger.log("  Header styled & row frozen");
}

function setColWidths_(sheet, widths) {
  widths.forEach(function (w, i) {
    sheet.setColumnWidth(i + 1, w);
  });
}

function addConditionalBgRule_(sheet, range, value, color) {
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(value)
    .setBackground(color)
    .setRanges([range])
    .build();
  var rules = sheet.getConditionalFormatRules();
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
}

function addBooleanRule_(sheet, range, isTrue, color) {
  var builder = SpreadsheetApp.newConditionalFormatRule().setRanges([range]);
  if (isTrue) {
    builder = builder.whenTextEqualTo("TRUE").setBackground(color);
  } else {
    builder = builder.whenTextEqualTo("FALSE").setBackground(color);
  }
  var rules = sheet.getConditionalFormatRules();
  rules.push(builder.build());
  sheet.setConditionalFormatRules(rules);
}

// ─── Organisme ──────────────────────────────────────────────────────────────

function setupOrganisme_(ss) {
  Logger.log("=== Setting up Organisme ===");
  var sheet = getOrCreateSheet_(ss, "Organisme");
  var headers = [
    "nom", "siret", "adresse", "email_contact", "telephone",
    "nda", "referent_handicap_nom", "referent_handicap_email",
    "responsable_qualite_email", "direction_email", "logo_url"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // Row 2 styling
  sheet.setRowHeight(2, 30);
  sheet.getRange(2, 1, 1, headers.length).setBackground("#f7f7f7");

  // Column widths: A=250,B=150,C=300,D-E=200,F=180,G-H=200,I-J=250,K=300
  setColWidths_(sheet, [250, 150, 300, 200, 200, 180, 200, 200, 250, 250, 300]);
  Logger.log("  Organisme done");
}

// ─── Formations ─────────────────────────────────────────────────────────────

function setupFormations_(ss) {
  Logger.log("=== Setting up Formations ===");
  var sheet = getOrCreateSheet_(ss, "Formations");
  var headers = [
    "formation_id", "intitule", "description", "duree_heures", "objectifs",
    "prerequis", "modalite", "public_vise", "tarif", "date_creation"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id formula
  var formulas = [];
  for (var i = 0; i < 99; i++) {
    formulas.push(['=IF(B' + (i + 2) + '="","",CONCATENATE("FOR-",TEXT(ROW()-1,"000")))']);
  }
  sheet.getRange("A2:A100").setFormulas(formulas);
  Logger.log("  Formation ID formulas set");

  // D: integer > 0
  var ruleD = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThan(0)
    .setAllowInvalid(false)
    .setHelpText("Entrez un nombre entier > 0")
    .build();
  sheet.getRange("D2:D100").setDataValidation(ruleD);

  // G: dropdown modalite
  var ruleG = SpreadsheetApp.newDataValidation()
    .requireValueInList(["presentiel", "distanciel", "mixte"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("G2:G100").setDataValidation(ruleG);

  // I: currency EUR
  sheet.getRange("I2:I100").setNumberFormat("#,##0.00 [$EUR]");

  // J: date + default
  sheet.getRange("J2:J100").setNumberFormat("yyyy-MM-dd");
  var dateFormulas = [];
  for (var j = 0; j < 99; j++) {
    dateFormulas.push(['=IF(B' + (j + 2) + '="","",TODAY())']);
  }
  sheet.getRange("J2:J100").setFormulas(dateFormulas);
  Logger.log("  Date defaults set");

  // Widths: A=100,B=300,C=400,D=100,E=400,F=300,G=120,H=200,I=100,J=120
  setColWidths_(sheet, [100, 300, 400, 100, 400, 300, 120, 200, 100, 120]);

  // Conditional formatting G: presentiel/distanciel/mixte
  var rangeG = sheet.getRange("G2:G100");
  addConditionalBgRule_(sheet, rangeG, "presentiel", "#d4edda");
  addConditionalBgRule_(sheet, rangeG, "distanciel", "#d4edfc");
  addConditionalBgRule_(sheet, rangeG, "mixte", "#fff3cd");
  Logger.log("  Formations done");
}

// ─── Formateurs ─────────────────────────────────────────────────────────────

function setupFormateurs_(ss) {
  Logger.log("=== Setting up Formateurs ===");
  var sheet = getOrCreateSheet_(ss, "Formateurs");
  var headers = [
    "formateur_id", "nom", "prenom", "email", "telephone",
    "specialite", "qualifications", "cv_drive_url", "diplomes_drive_url",
    "dossier_complet", "date_creation"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id
  var formulas = [];
  for (var i = 0; i < 99; i++) {
    formulas.push(['=IF(B' + (i + 2) + '="","",CONCATENATE("FORM-",TEXT(ROW()-1,"000")))']);
  }
  sheet.getRange("A2:A100").setFormulas(formulas);
  Logger.log("  Formateur ID formulas set");

  // J: checkbox
  sheet.getRange("J2:J100").insertCheckboxes();
  Logger.log("  Checkboxes inserted col J");

  // K: date default
  sheet.getRange("K2:K100").setNumberFormat("yyyy-MM-dd");
  var dateFormulas = [];
  for (var j = 0; j < 99; j++) {
    dateFormulas.push(['=IF(B' + (j + 2) + '="","",TODAY())']);
  }
  sheet.getRange("K2:K100").setFormulas(dateFormulas);

  // Widths: A=110,B=150,C=150,D=250,E=130,F=200,G=300,H=250,I=250,J=120,K=120
  setColWidths_(sheet, [110, 150, 150, 250, 130, 200, 300, 250, 250, 120, 120]);

  // Conditional formatting J: TRUE/FALSE
  var rangeJ = sheet.getRange("J2:J100");
  addBooleanRule_(sheet, rangeJ, true, "#d4edda");
  addBooleanRule_(sheet, rangeJ, false, "#f8d7da");
  Logger.log("  Formateurs done");
}

// ─── Sessions ───────────────────────────────────────────────────────────────

function setupSessions_(ss) {
  Logger.log("=== Setting up Sessions ===");
  var sheet = getOrCreateSheet_(ss, "Sessions");
  var headers = [
    "session_id", "formation_id", "formateur_id", "date_debut", "date_fin",
    "lieu", "modalite", "statut", "nombre_places", "nb_inscrits",
    "workflow_0_ok", "workflow_1_ok", "workflow_2_ok", "workflow_3_ok", "created_at"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id with year
  var formulas = [];
  for (var i = 0; i < 99; i++) {
    formulas.push([
      '=IF(B' + (i + 2) + '="","",CONCATENATE("SES-",TEXT(YEAR(TODAY()),"0000"),"-",TEXT(ROW()-1,"000")))'
    ]);
  }
  sheet.getRange("A2:A100").setFormulas(formulas);
  Logger.log("  Session ID formulas set");

  // B: dropdown from Formations!A2:A100
  var ruleB = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getSheetByName("Formations").getRange("A2:A100"), true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("B2:B100").setDataValidation(ruleB);

  // C: dropdown from Formateurs!A2:A100
  var ruleC = SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getSheetByName("Formateurs").getRange("A2:A100"), true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("C2:C100").setDataValidation(ruleC);

  // D-E: date format
  sheet.getRange("D2:E100").setNumberFormat("yyyy-MM-dd");

  // G: modalite dropdown
  var ruleG = SpreadsheetApp.newDataValidation()
    .requireValueInList(["presentiel", "distanciel", "mixte"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("G2:G100").setDataValidation(ruleG);

  // H: statut dropdown
  var ruleH = SpreadsheetApp.newDataValidation()
    .requireValueInList(["planifiee", "en_cours", "terminee", "annulee", "reportee"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange("H2:H100").setDataValidation(ruleH);

  // I: nombre_places > 0
  var ruleI = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThan(0)
    .setAllowInvalid(false)
    .setHelpText("Nombre de places > 0")
    .build();
  sheet.getRange("I2:I100").setDataValidation(ruleI);

  // J: nb_inscrits >= 0, default 0
  var ruleJ = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText("Nombre >= 0")
    .build();
  sheet.getRange("J2:J100").setDataValidation(ruleJ);
  var zeros = [];
  for (var z = 0; z < 99; z++) {
    zeros.push(['=IF(B' + (z + 2) + '="","",0)']);
  }
  sheet.getRange("J2:J100").setFormulas(zeros);

  // K-N: checkboxes (workflow_0 to workflow_3)
  sheet.getRange("K2:N100").insertCheckboxes();
  Logger.log("  Workflow checkboxes inserted");

  // O: created_at date default
  sheet.getRange("O2:O100").setNumberFormat("yyyy-MM-dd");
  var dateFormulas = [];
  for (var d = 0; d < 99; d++) {
    dateFormulas.push(['=IF(B' + (d + 2) + '="","",TODAY())']);
  }
  sheet.getRange("O2:O100").setFormulas(dateFormulas);

  // Widths: A=130,B=100,C=110,D-E=110,F=250,G=120,H=100,I-J=90,K-N=90,O=120
  setColWidths_(sheet, [130, 100, 110, 110, 110, 250, 120, 100, 90, 90, 90, 90, 90, 90, 120]);

  // Conditional formatting H: statut colors
  var rangeH = sheet.getRange("H2:H100");
  addConditionalBgRule_(sheet, rangeH, "planifiee", "#d4edfc");
  addConditionalBgRule_(sheet, rangeH, "en_cours", "#d4edda");
  addConditionalBgRule_(sheet, rangeH, "terminee", "#e2e3e5");
  addConditionalBgRule_(sheet, rangeH, "annulee", "#f8d7da");
  addConditionalBgRule_(sheet, rangeH, "reportee", "#fff3cd");
  Logger.log("  Sessions done");
}

// ─── Config ─────────────────────────────────────────────────────────────────

function setupConfig_(ss) {
  Logger.log("=== Setting up Config ===");
  var sheet = getOrCreateSheet_(ss, "Config");
  var headers = ["parametre", "valeur", "description"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length, "#333333");

  var data = [
    ["delai_positionnement",  "3",                                        "Jours avant session pour positionnement"],
    ["delai_relance_1",       "2",                                        "Jours apres envoi pour 1ere relance"],
    ["delai_relance_2",       "5",                                        "Jours apres envoi pour 2eme relance"],
    ["delai_relance_3",       "10",                                       "Jours apres envoi pour 3eme relance"],
    ["delai_suivi_froid",     "180",                                      "Jours apres fin pour suivi a froid"],
    ["seuil_alerte_orange",   "5",                                        "Note sous laquelle alerte orange"],
    ["seuil_alerte_rouge",    "4",                                        "Note sous laquelle alerte rouge"],
    ["ia_model",              "claude-sonnet-4-20250514",                  "Modele IA Anthropic"],
    ["ia_api_url",            "https://api.anthropic.com/v1/messages",     "URL API Anthropic"],
    ["gotenberg_url",         "http://gotenberg:3000",                     "URL Gotenberg"],
    ["forms_positionnement_id", "A_CONFIGURER",                           "ID Forms positionnement"],
    ["forms_emargement_id",     "A_CONFIGURER",                           "ID Forms emargement"],
    ["forms_suivi_id",          "A_CONFIGURER",                           "ID Forms suivi intermediaire"],
    ["forms_satisfaction_id",   "A_CONFIGURER",                           "ID Forms satisfaction"],
    ["forms_evaluation_id",     "A_CONFIGURER",                           "ID Forms evaluation acquis"],
    ["forms_suivi_froid_id",    "A_CONFIGURER",                           "ID Forms suivi a froid"],
    ["forms_reclamation_id",    "A_CONFIGURER",                           "ID Forms reclamation"],
    ["drive_root_id",           "A_CONFIGURER",                           "ID dossier Drive racine QUALIOPI"],
    ["sheets_02_id",            "A_CONFIGURER",                           "ID Sheets 02_Suivi_Apprenants"],
    ["sheets_03_id",            "A_CONFIGURER",                           "ID Sheets 03_Qualite_KPIs"]
  ];
  sheet.getRange(2, 1, data.length, 3).setValues(data);
  Logger.log("  Config data written (" + data.length + " rows)");

  // Column widths: A=250, B=350, C=500
  setColWidths_(sheet, [250, 350, 500]);

  // Column A: light grey background
  sheet.getRange("A2:A" + (data.length + 1)).setBackground("#f0f0f0");

  // Column C: grey text
  sheet.getRange("C2:C" + (data.length + 1)).setFontColor("#888888");

  // Highlight rows with "A_CONFIGURER"
  for (var r = 0; r < data.length; r++) {
    if (data[r][1] === "A_CONFIGURER") {
      sheet.getRange(r + 2, 1, 1, 3).setBackground("#fff3cd");
    }
  }
  Logger.log("  A_CONFIGURER rows highlighted");

  // Protect sheet
  var protection = sheet.protect().setDescription("Config - Protected");
  protection.setWarningOnly(true);
  Logger.log("  Config sheet protected (warning only)");
  Logger.log("  Config done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupReferentiel() {
  Logger.log("========================================");
  Logger.log("  setupReferentiel() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create sheets in order (Formations & Formateurs before Sessions for refs)
  setupOrganisme_(ss);
  setupFormations_(ss);
  setupFormateurs_(ss);
  setupSessions_(ss);
  setupConfig_(ss);

  // Remove default sheets
  removeDefaultSheets_(ss);

  // Set first sheet as active
  ss.setActiveSheet(ss.getSheetByName("Organisme"));

  Logger.log("========================================");
  Logger.log("  setupReferentiel() - DONE");
  Logger.log("========================================");
}
