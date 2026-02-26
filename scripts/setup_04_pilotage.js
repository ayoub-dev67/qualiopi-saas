/**
 * Setup script for Google Sheet "04_Pilotage_Dashboard"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupPilotage()
 *
 * Tabs: Config, Planning, Financier, Alertes,
 *       Historique_KPIs, Logs, Contacts
 */

// ─── Constants ──────────────────────────────────────────────────────────────

var ROWS = 200;
var ROWS_HIST = 500;    // KPI snapshots: 15 KPIs x 12 months x ~3 years
var ROWS_LOGS = 500;    // automation logs
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

function addNumRule_(sheet, range, op, threshold, color) {
  var rules = sheet.getConditionalFormatRules();
  var builder = SpreadsheetApp.newConditionalFormatRule().setRanges([range]);
  if (op === "lt") builder = builder.whenNumberLessThan(threshold);
  else if (op === "gte") builder = builder.whenNumberGreaterThanOrEqualTo(threshold);
  rules.push(builder.setBackground(color).build());
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

// ─── Config ─────────────────────────────────────────────────────────────────

function setupConfig_(ss) {
  Logger.log("=== Setting up Config ===");
  var sheet = getOrCreateSheet_(ss, "Config");

  var headers = ["parametre", "valeur", "description"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length, "#333333");

  var data = [
    ["sheet_01_id",              "A_CONFIGURER", "ID du sheet 01_Referentiel_Qualiopi"],
    ["sheet_02_id",              "A_CONFIGURER", "ID du sheet 02_Suivi_Apprenants"],
    ["sheet_03_id",              "A_CONFIGURER", "ID du sheet 03_Qualite_KPIs"],
    ["email_expediteur",         "A_CONFIGURER", "Email d'envoi des notifications automatiques"],
    ["email_alertes",            "A_CONFIGURER", "Emails destinataires alertes (separes par virgule)"],
    ["webhook_n8n_url",          "A_CONFIGURER", "URL webhook n8n pour automatisation"],
    ["slack_webhook_url",        "",             "URL webhook Slack (optionnel)"],
    ["drive_templates_id",       "A_CONFIGURER", "ID dossier Drive contenant les templates"],
    ["drive_exports_id",         "A_CONFIGURER", "ID dossier Drive pour les exports PDF"],
    ["frequence_snapshot_kpis",  "mensuel",      "Frequence snapshots KPI (mensuel, trimestriel)"],
    ["devise",                   "EUR",          "Devise pour les montants financiers"],
    ["tva_taux",                 "0",            "Taux TVA applicable (0 si exonere OF)"],
    ["exercice_debut",           "01-01",        "Debut exercice comptable (MM-JJ)"],
    ["retention_logs_jours",     "365",          "Duree conservation logs en jours"],
    ["alerte_echeance_jours",    "7",            "Jours avant echeance pour declenchement alerte"],
    ["alerte_note_seuil",        "5",            "Note satisfaction sous laquelle declenchement alerte"]
  ];
  sheet.getRange(2, 1, data.length, 3).setValues(data);
  Logger.log("  Config data written (" + data.length + " rows)");

  setColWidths_(sheet, [250, 350, 450]);
  sheet.getRange("A2:A" + (data.length + 1)).setBackground("#f0f0f0");
  sheet.getRange("C2:C" + (data.length + 1)).setFontColor("#888888");

  for (var r = 0; r < data.length; r++) {
    if (data[r][1] === "A_CONFIGURER") {
      sheet.getRange(r + 2, 1, 1, 3).setBackground("#fff3cd");
    }
  }

  sheet.protect().setDescription("Config Pilotage - Protected").setWarningOnly(true);
  Logger.log("  Config done");
}

// ─── Planning ───────────────────────────────────────────────────────────────

function setupPlanning_(ss) {
  Logger.log("=== Setting up Planning ===");
  var sheet = getOrCreateSheet_(ss, "Planning");

  var headers = [
    "planning_id",         // A
    "session_id",          // B  (ref 01)
    "formation_id",        // C  (ref 01)
    "intitule_formation",  // D
    "formateur",           // E
    "date_debut",          // F
    "date_fin",            // G
    "modalite",            // H
    "lieu",                // I
    "nb_places",           // J
    "nb_inscrits",         // K
    "taux_remplissage",    // L  (formula)
    "statut",              // M
    "commentaires"         // N
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id PLAN-2026-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("D", "PLAN-", ROWS, "000", true));

  // F-G: dates
  sheet.getRange("F2:G" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // H: modalite dropdown
  sheet.getRange("H2:H" + (ROWS + 1)).setDataValidation(
    listRule_(["presentiel", "distanciel", "mixte"]));

  // J: nb_places > 0
  sheet.getRange("J2:J" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0).setAllowInvalid(false)
      .setHelpText("Nombre de places > 0").build());

  // K: nb_inscrits >= 0
  sheet.getRange("K2:K" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());

  // L: taux_remplissage formula
  var txFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    txFormulas.push(['=IF(OR(J' + r + '="",J' + r + '=0),"",ROUND(K' + r + '/J' + r + '*100,0))']);
  }
  sheet.getRange("L2:L" + (ROWS + 1)).setFormulas(txFormulas);
  sheet.getRange("L2:L" + (ROWS + 1)).setNumberFormat("0\"%\"");

  // M: statut dropdown
  sheet.getRange("M2:M" + (ROWS + 1)).setDataValidation(
    listRule_(["brouillon", "valide", "publie", "complet", "annule"]));

  // Widths
  setColWidths_(sheet, [130, 120, 100, 300, 200, 110, 110, 110, 200, 80, 80, 90, 90, 300]);

  // Conditional: statut M
  var rangeM = sheet.getRange("M2:M" + (ROWS + 1));
  addCondBg_(sheet, rangeM, "brouillon", "#e2e3e5");
  addCondBg_(sheet, rangeM, "valide",    "#d4edfc");
  addCondBg_(sheet, rangeM, "publie",    "#d4edda");
  addCondBg_(sheet, rangeM, "complet",   "#c3e6cb");
  addCondBg_(sheet, rangeM, "annule",    "#f8d7da");

  // Conditional: taux_remplissage L (low = red, medium = yellow, high = green)
  addNumRule_(sheet, sheet.getRange("L2:L" + (ROWS + 1)), "lt",  50,  "#f8d7da");
  addNumRule_(sheet, sheet.getRange("L2:L" + (ROWS + 1)), "gte", 80,  "#d4edda");

  // Conditional: date_debut F passee et statut != complet/annule
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(F2<>"",F2<TODAY(),M2<>"complet",M2<>"annule")')
    .setBackground("#fff3cd").setFontColor("#856404")
    .setRanges([sheet.getRange("F2:F" + (ROWS + 1))]).build());
  sheet.setConditionalFormatRules(rules);

  Logger.log("  Planning done");
}

// ─── Financier ──────────────────────────────────────────────────────────────

function setupFinancier_(ss) {
  Logger.log("=== Setting up Financier ===");
  var sheet = getOrCreateSheet_(ss, "Financier");

  var headers = [
    "financier_id",       // A
    "session_id",         // B  (ref 01)
    "formation_intitule", // C
    "nb_inscrits",        // D
    "tarif_unitaire",     // E
    "ca_prevu",           // F  (formula D*E)
    "factures_emises",    // G
    "montant_facture",    // H
    "statut_paiement",    // I
    "date_facturation",   // J
    "date_paiement",      // K
    "opco_financeur",     // L
    "numero_convention",  // M
    "montant_encaisse",   // N
    "ecart",              // O  (formula N-F)
    "commentaires"        // P
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id FIN-2026-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("B", "FIN-", ROWS, "000", true));

  // D: nb_inscrits >= 0
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());

  // E: tarif EUR
  sheet.getRange("E2:E" + (ROWS + 1)).setNumberFormat("#,##0.00 [$EUR]");

  // F: ca_prevu = D * E
  var caFormulas = [];
  for (var i = 0; i < ROWS; i++) {
    var r = i + 2;
    caFormulas.push(['=IF(OR(D' + r + '="",E' + r + '=""),"",D' + r + '*E' + r + ')']);
  }
  sheet.getRange("F2:F" + (ROWS + 1)).setFormulas(caFormulas);
  sheet.getRange("F2:F" + (ROWS + 1)).setNumberFormat("#,##0.00 [$EUR]");

  // G: factures_emises >= 0
  sheet.getRange("G2:G" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());

  // H: montant_facture EUR
  sheet.getRange("H2:H" + (ROWS + 1)).setNumberFormat("#,##0.00 [$EUR]");

  // I: statut_paiement dropdown
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["a_facturer", "facturee", "payee", "relance", "impayee", "avoir"]));

  // J-K: dates
  sheet.getRange("J2:K" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // N: montant_encaisse EUR
  sheet.getRange("N2:N" + (ROWS + 1)).setNumberFormat("#,##0.00 [$EUR]");

  // O: ecart = N - F
  var ecartFormulas = [];
  for (var j = 0; j < ROWS; j++) {
    var r2 = j + 2;
    ecartFormulas.push(['=IF(OR(N' + r2 + '="",F' + r2 + '=""),"",N' + r2 + '-F' + r2 + ')']);
  }
  sheet.getRange("O2:O" + (ROWS + 1)).setFormulas(ecartFormulas);
  sheet.getRange("O2:O" + (ROWS + 1)).setNumberFormat("#,##0.00 [$EUR]");

  // Widths
  setColWidths_(sheet, [120, 120, 250, 80, 110, 110, 80, 110, 100, 110, 110, 150, 150, 110, 100, 300]);

  // Conditional: statut_paiement I
  var rangeI = sheet.getRange("I2:I" + (ROWS + 1));
  addCondBg_(sheet, rangeI, "a_facturer", "#d4edfc");
  addCondBg_(sheet, rangeI, "facturee",   "#fff3cd");
  addCondBg_(sheet, rangeI, "payee",      "#d4edda");
  addCondBg_(sheet, rangeI, "relance",    "#f8d7da");
  addCondBg_(sheet, rangeI, "impayee",    "#f5c6cb");
  addCondBg_(sheet, rangeI, "avoir",      "#e2e3e5");

  // Conditional: ecart O negatif = red, positif = green
  addNumRule_(sheet, sheet.getRange("O2:O" + (ROWS + 1)), "lt",  0, "#f8d7da");
  addNumRule_(sheet, sheet.getRange("O2:O" + (ROWS + 1)), "gte", 0, "#d4edda");

  Logger.log("  Financier done");
}

// ─── Alertes ────────────────────────────────────────────────────────────────

function setupAlertes_(ss) {
  Logger.log("=== Setting up Alertes ===");
  var sheet = getOrCreateSheet_(ss, "Alertes");

  var headers = [
    "alerte_id",       // A
    "date_creation",   // B
    "type",            // C
    "priorite",        // D
    "source_sheet",    // E
    "reference_id",    // F
    "description",     // G
    "assignee",        // H
    "statut",          // I
    "date_resolution", // J
    "commentaires"     // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id ALR-0001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("G", "ALR-", ROWS, "0000", false));

  // B: date_creation default
  sheet.getRange("B2:B" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("G", ROWS));

  // C: type dropdown
  sheet.getRange("C2:C" + (ROWS + 1)).setDataValidation(
    listRule_([
      "echeance_depassee", "document_manquant", "note_basse",
      "reclamation", "non_conformite", "relance_echec",
      "remplissage_faible", "paiement_retard", "autre"
    ]));

  // D: priorite dropdown
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(
    listRule_(["critique", "haute", "moyenne", "basse"]));

  // E: source_sheet dropdown
  sheet.getRange("E2:E" + (ROWS + 1)).setDataValidation(
    listRule_(["01_Referentiel", "02_Suivi", "03_Qualite", "04_Pilotage", "n8n", "manuel"]));

  // I: statut dropdown
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["nouvelle", "en_cours", "resolue", "ignoree"]));

  // J: date_resolution
  sheet.getRange("J2:J" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [110, 110, 150, 90, 110, 120, 400, 150, 90, 110, 300]);

  // Conditional: priorite D
  var rangeD = sheet.getRange("D2:D" + (ROWS + 1));
  addCondBg_(sheet, rangeD, "critique", "#f5c6cb");
  addCondBg_(sheet, rangeD, "haute",    "#f8d7da");
  addCondBg_(sheet, rangeD, "moyenne",  "#fff3cd");
  addCondBg_(sheet, rangeD, "basse",    "#d4edda");

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (ROWS + 1));
  addCondBg_(sheet, rangeI, "nouvelle", "#f8d7da");
  addCondBg_(sheet, rangeI, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeI, "resolue",  "#d4edda");
  addCondBg_(sheet, rangeI, "ignoree",  "#e2e3e5");

  // Conditional: alertes non resolues vieilles de + 7 jours
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(B2<>"",TODAY()-B2>7,I2<>"resolue",I2<>"ignoree")')
    .setBackground("#f5c6cb").setFontColor("#721c24")
    .setRanges([sheet.getRange("A2:K" + (ROWS + 1))]).build());
  sheet.setConditionalFormatRules(rules);
  Logger.log("  Stale alert highlight set");

  Logger.log("  Alertes done");
}

// ─── Historique KPIs ────────────────────────────────────────────────────────

function setupHistoriqueKPIs_(ss) {
  Logger.log("=== Setting up Historique_KPIs ===");
  var sheet = getOrCreateSheet_(ss, "Historique_KPIs");

  var headers = [
    "snapshot_id",   // A
    "date_snapshot", // B
    "periode",       // C  (2026-01, 2026-Q1, etc.)
    "kpi_code",      // D  (KPI-001, etc.)
    "kpi_intitule",  // E
    "valeur",        // F
    "objectif",      // G
    "ecart",         // H  (formula F-G)
    "statut",        // I
    "tendance",      // J
    "commentaires"   // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id SNAP-0001
  sheet.getRange("A2:A" + (ROWS_HIST + 1))
    .setFormulas(buildIdFormulas_("D", "SNAP-", ROWS_HIST, "0000", false));

  // B: date
  sheet.getRange("B2:B" + (ROWS_HIST + 1)).setNumberFormat("yyyy-MM-dd");

  // F-G: number format
  sheet.getRange("F2:G" + (ROWS_HIST + 1)).setNumberFormat("#,##0.00");

  // H: ecart formula = F - G
  var ecartFormulas = [];
  for (var i = 0; i < ROWS_HIST; i++) {
    var r = i + 2;
    ecartFormulas.push(['=IF(OR(F' + r + '="",G' + r + '=""),"",F' + r + '-G' + r + ')']);
  }
  sheet.getRange("H2:H" + (ROWS_HIST + 1)).setFormulas(ecartFormulas);
  sheet.getRange("H2:H" + (ROWS_HIST + 1)).setNumberFormat("+#,##0.00;-#,##0.00;0");

  // I: statut dropdown
  sheet.getRange("I2:I" + (ROWS_HIST + 1)).setDataValidation(
    listRule_(["atteint", "en_cours", "non_atteint"]));

  // J: tendance dropdown
  sheet.getRange("J2:J" + (ROWS_HIST + 1)).setDataValidation(
    listRule_(["hausse", "stable", "baisse"]));

  // Widths
  setColWidths_(sheet, [110, 110, 100, 90, 300, 90, 90, 90, 100, 80, 300]);

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (ROWS_HIST + 1));
  addCondBg_(sheet, rangeI, "atteint",     "#d4edda");
  addCondBg_(sheet, rangeI, "en_cours",    "#fff3cd");
  addCondBg_(sheet, rangeI, "non_atteint", "#f8d7da");

  // Conditional: tendance J
  var rangeJ = sheet.getRange("J2:J" + (ROWS_HIST + 1));
  addCondBg_(sheet, rangeJ, "hausse", "#d4edda");
  addCondBg_(sheet, rangeJ, "stable", "#fff3cd");
  addCondBg_(sheet, rangeJ, "baisse", "#f8d7da");

  // Conditional: ecart H negatif
  addNumRule_(sheet, sheet.getRange("H2:H" + (ROWS_HIST + 1)), "lt",  0, "#f8d7da");
  addNumRule_(sheet, sheet.getRange("H2:H" + (ROWS_HIST + 1)), "gte", 0, "#d4edda");

  // Freeze col A-E for scrolling through history
  sheet.setFrozenColumns(5);

  Logger.log("  Historique_KPIs done");
}

// ─── Logs ───────────────────────────────────────────────────────────────────

function setupLogs_(ss) {
  Logger.log("=== Setting up Logs ===");
  var sheet = getOrCreateSheet_(ss, "Logs");

  var headers = [
    "log_id",    // A
    "timestamp", // B
    "action",    // C
    "source",    // D
    "cible",     // E  (session_id, inscription_id, etc.)
    "statut",    // F
    "details",   // G
    "duree_ms",  // H
    "erreur"     // I
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length, "#2d3748");

  // A: auto-id LOG-00001
  sheet.getRange("A2:A" + (ROWS_LOGS + 1))
    .setFormulas(buildIdFormulas_("C", "LOG-", ROWS_LOGS, "00000", false));

  // B: timestamp format
  sheet.getRange("B2:B" + (ROWS_LOGS + 1)).setNumberFormat("yyyy-MM-dd HH:mm:ss");

  // C: action dropdown
  sheet.getRange("C2:C" + (ROWS_LOGS + 1)).setDataValidation(
    listRule_([
      "envoi_email", "generation_pdf", "relance_auto",
      "webhook_recu", "webhook_envoye", "snapshot_kpi",
      "archivage_drive", "import_donnees", "alerte_creee", "autre"
    ]));

  // D: source dropdown
  sheet.getRange("D2:D" + (ROWS_LOGS + 1)).setDataValidation(
    listRule_(["apps_script", "n8n", "tally", "manuel", "cron"]));

  // F: statut dropdown
  sheet.getRange("F2:F" + (ROWS_LOGS + 1)).setDataValidation(
    listRule_(["succes", "echec", "en_cours", "partiel"]));

  // H: duree_ms number format
  sheet.getRange("H2:H" + (ROWS_LOGS + 1)).setNumberFormat("#,##0");

  // Widths
  setColWidths_(sheet, [110, 160, 140, 100, 150, 80, 400, 80, 350]);

  // Conditional: statut F
  var rangeF = sheet.getRange("F2:F" + (ROWS_LOGS + 1));
  addCondBg_(sheet, rangeF, "succes",   "#d4edda");
  addCondBg_(sheet, rangeF, "echec",    "#f8d7da");
  addCondBg_(sheet, rangeF, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeF, "partiel",  "#ffeeba");

  // Conditional: erreur non vide = red row highlight
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$I2<>""')
    .setBackground("#fff5f5").setFontColor("#c53030")
    .setRanges([sheet.getRange("A2:I" + (ROWS_LOGS + 1))]).build());
  sheet.setConditionalFormatRules(rules);
  Logger.log("  Error row highlight set");

  // Sort by timestamp descending (newest first) – initial empty sheet, no-op
  sheet.getRange("A1:I" + (ROWS_LOGS + 1)).setVerticalAlignment("top");

  Logger.log("  Logs done");
}

// ─── Contacts ───────────────────────────────────────────────────────────────

function setupContacts_(ss) {
  Logger.log("=== Setting up Contacts ===");
  var sheet = getOrCreateSheet_(ss, "Contacts");

  var headers = [
    "contact_id",    // A
    "type",          // B
    "organisme",     // C
    "nom",           // D
    "prenom",        // E
    "email",         // F
    "telephone",     // G
    "role",          // H
    "notes",         // I
    "date_creation"  // J
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id CTT-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("D", "CTT-", ROWS, "000", false));

  // B: type dropdown
  sheet.getRange("B2:B" + (ROWS + 1)).setDataValidation(
    listRule_(["opco", "financeur", "partenaire", "entreprise", "institutionnel", "prestataire", "autre"]));

  // J: date_creation default
  sheet.getRange("J2:J" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd")
    .setFormulas(buildDateFormulas_("D", ROWS));

  // Widths
  setColWidths_(sheet, [100, 110, 200, 150, 150, 250, 130, 200, 350, 120]);

  // Conditional: type B
  var rangeB = sheet.getRange("B2:B" + (ROWS + 1));
  addCondBg_(sheet, rangeB, "opco",           "#d4edfc");
  addCondBg_(sheet, rangeB, "financeur",      "#d4edda");
  addCondBg_(sheet, rangeB, "partenaire",     "#fff3cd");
  addCondBg_(sheet, rangeB, "entreprise",     "#e8daef");
  addCondBg_(sheet, rangeB, "institutionnel", "#fce4ec");
  addCondBg_(sheet, rangeB, "prestataire",    "#e2e3e5");
  addCondBg_(sheet, rangeB, "autre",          "#ffffff");

  Logger.log("  Contacts done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupPilotage() {
  Logger.log("========================================");
  Logger.log("  setupPilotage() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  setupConfig_(ss);
  setupPlanning_(ss);
  setupFinancier_(ss);
  setupAlertes_(ss);
  setupHistoriqueKPIs_(ss);
  setupLogs_(ss);
  setupContacts_(ss);

  removeDefaultSheets_(ss);
  ss.setActiveSheet(ss.getSheetByName("Planning"));

  Logger.log("========================================");
  Logger.log("  setupPilotage() - DONE");
  Logger.log("========================================");
}
