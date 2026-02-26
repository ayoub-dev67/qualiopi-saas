/**
 * Setup script for Google Sheet "03_Qualite_KPIs"
 * Runtime: Google Apps Script V8
 * Idempotent: deletes and recreates all tabs on each run.
 * Entry point: setupQualiteKPIs()
 *
 * Tabs: Indicateurs_Qualiopi, KPIs, Audits, Actions_Amelioration,
 *       Non_Conformites, Revue_Direction, Veille
 */

// ─── Constants ──────────────────────────────────────────────────────────────

var ROWS = 100;
var ROWS_SMALL = 50;
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
  else if (op === "between") builder = builder.whenNumberBetween(threshold[0], threshold[1]);
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

// ─── Indicateurs Qualiopi ───────────────────────────────────────────────────

function setupIndicateursQualiopi_(ss) {
  Logger.log("=== Setting up Indicateurs_Qualiopi ===");
  var sheet = getOrCreateSheet_(ss, "Indicateurs_Qualiopi");

  var headers = [
    "indicateur_num",     // A
    "critere_num",        // B
    "critere_intitule",   // C
    "intitule",           // D
    "statut_conformite",  // E
    "preuves_fournies",   // F
    "commentaires",       // G
    "responsable",        // H
    "date_derniere_revue" // I
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // Criteria names
  var CRIT = [
    "",
    "1 - Information du public",
    "2 - Objectifs et adaptation des prestations",
    "3 - Accompagnement et suivi des apprenants",
    "4 - Moyens pedagogiques et techniques",
    "5 - Qualification des personnels",
    "6 - Environnement professionnel",
    "7 - Appreciations et amelioration continue"
  ];

  // 32 official Qualiopi indicators [num, critere, intitule]
  var IND = [
    [1,  1, "Information accessible sur l'offre, delais d'acces et resultats"],
    [2,  1, "Indicateurs de resultats adaptes a la nature des prestations"],
    [3,  1, "Obtention et prise en compte des certifications et labels"],
    [4,  2, "Analyse du besoin du beneficiaire en lien avec l'entreprise/financeur"],
    [5,  2, "Objectifs de la prestation definis et adaptes"],
    [6,  2, "Contenus et modalites de mise en oeuvre de la prestation"],
    [7,  2, "Adequation des contenus aux exigences de la certification visee"],
    [8,  2, "Procedures de positionnement et d'evaluation des acquis a l'entree"],
    [9,  3, "Information des publics sur les conditions de deroulement"],
    [10, 3, "Adaptation de la prestation, accompagnement et suivi du beneficiaire"],
    [11, 3, "Evaluation de l'atteinte des objectifs par les beneficiaires"],
    [12, 3, "Engagement des beneficiaires et prevention des ruptures de parcours"],
    [13, 3, "Coordination des apprentissages en alternance (si applicable CFA)"],
    [14, 3, "Exercice de la citoyennete en apprentissage (si applicable CFA)"],
    [15, 3, "Promotion de la formation par apprentissage (si applicable CFA)"],
    [16, 3, "Conformite de la mise en oeuvre de la prestation a la certification"],
    [17, 4, "Moyens humains et techniques adaptes aux prestations"],
    [18, 4, "Coordination des intervenants internes et/ou externes"],
    [19, 4, "Ressources pedagogiques mises a disposition des apprenants"],
    [20, 4, "Accessibilite des personnes en situation de handicap"],
    [21, 5, "Determination des competences des intervenants"],
    [22, 5, "Entretien et developpement des competences des salaries"],
    [23, 6, "Veille legale et reglementaire sur le champ de la formation"],
    [24, 6, "Veille sur les innovations pedagogiques et technologiques"],
    [25, 6, "Veille sur les evolutions des competences, metiers et emplois"],
    [26, 6, "Mobilisation des expertises, outils et reseaux necessaires"],
    [27, 7, "Recueil des appreciations des parties prenantes"],
    [28, 7, "Traitement des difficultes rencontrees par les parties prenantes"],
    [29, 7, "Mesures d'amelioration a partir de l'analyse des appreciations"],
    [30, 7, "Traitement des reclamations formulees par les parties prenantes"],
    [31, 7, "Mise en oeuvre d'actions d'amelioration (sous-traitance le cas echeant)"],
    [32, 7, "Suivi des actions correctives suite aux non-conformites soulevees"]
  ];

  // Build full rows: num, critere, critere_intitule, intitule, statut, preuves, comment, resp, date
  var rows = IND.map(function (ind) {
    return [ind[0], ind[1], CRIT[ind[1]], ind[2], "a_evaluer", "", "", "", ""];
  });
  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log("  32 indicators pre-filled");

  // A-B: number format (no decimals)
  sheet.getRange("A2:B33").setNumberFormat("0");

  // E: dropdown statut_conformite
  sheet.getRange("E2:E33").setDataValidation(
    listRule_(["conforme", "partiel", "non_conforme", "non_applicable", "a_evaluer"]));

  // I: date format
  sheet.getRange("I2:I33").setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [60, 60, 280, 450, 130, 350, 300, 150, 130]);

  // Conditional: statut E
  var rangeE = sheet.getRange("E2:E33");
  addCondBg_(sheet, rangeE, "conforme",       "#d4edda");
  addCondBg_(sheet, rangeE, "partiel",        "#fff3cd");
  addCondBg_(sheet, rangeE, "non_conforme",   "#f8d7da");
  addCondBg_(sheet, rangeE, "non_applicable", "#e2e3e5");
  addCondBg_(sheet, rangeE, "a_evaluer",      "#d4edfc");

  // Alternate row background for readability (criteria groups)
  var currentCrit = 0;
  var bgToggle = false;
  for (var r = 0; r < rows.length; r++) {
    if (rows[r][1] !== currentCrit) {
      currentCrit = rows[r][1];
      bgToggle = !bgToggle;
    }
    if (bgToggle) {
      sheet.getRange(r + 2, 1, 1, 4).setBackground("#f7f9fc");
    }
  }

  // Protect sheet (warning only)
  sheet.protect().setDescription("Indicateurs Qualiopi - Protected").setWarningOnly(true);
  Logger.log("  Indicateurs_Qualiopi done");
}

// ─── KPIs ───────────────────────────────────────────────────────────────────

function setupKPIs_(ss) {
  Logger.log("=== Setting up KPIs ===");
  var sheet = getOrCreateSheet_(ss, "KPIs");

  var headers = [
    "kpi_id",          // A
    "categorie",       // B
    "intitule",        // C
    "unite",           // D
    "valeur_actuelle", // E  (formula or manual)
    "objectif_cible",  // F
    "source",          // G
    "tendance",        // H
    "statut",          // I
    "date_maj",        // J
    "commentaires"     // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // Pre-filled KPI definitions (col E left blank – formulas set later for auto rows)
  var data = [
    ["KPI-001","conformite",  "Taux de conformite Qualiopi",       "%",      "",">=80", "Indicateurs_Qualiopi","","","",""],
    ["KPI-002","conformite",  "Indicateurs non conformes",         "nombre", "","0",    "Indicateurs_Qualiopi","","","",""],
    ["KPI-003","amelioration","Actions correctives ouvertes",      "nombre", "","0",    "Actions_Amelioration","","","",""],
    ["KPI-004","amelioration","Non-conformites ouvertes",          "nombre", "","0",    "Non_Conformites",     "","","",""],
    ["KPI-005","veille",      "Veilles a analyser",                "nombre", "","0",    "Veille",              "","","",""],
    ["KPI-006","satisfaction","Note satisfaction moyenne",          "/10",    "",">=7",  "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-007","satisfaction","Taux de reponse satisfaction",       "%",      "",">=80", "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-008","formation",   "Taux de completion formations",     "%",      "",">=90", "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-009","formation",   "Taux d'assiduite moyen",            "%",      "",">=90", "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-010","evaluation",  "Taux d'acquis post-formation",      "%",      "",">=75", "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-011","reclamation", "Reclamations ouvertes",             "nombre", "","0",    "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-012","reclamation", "Delai moyen resolution reclamations","jours", "","<15",  "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-013","suivi",       "Taux retour suivi a froid",         "%",      "",">=50", "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-014","suivi",       "Impact professionnel moyen",        "/10",    "",">=6",  "02_Suivi (IMPORTRANGE)","","","","A configurer"],
    ["KPI-015","handicap",    "Taux amenagement handicap realise", "%",      "","100",  "02_Suivi (IMPORTRANGE)","","","","A configurer"]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  Logger.log("  15 KPI definitions pre-filled");

  // H: tendance dropdown
  sheet.getRange("H2:H" + (data.length + 1)).setDataValidation(
    listRule_(["hausse", "stable", "baisse"]));

  // I: statut dropdown
  sheet.getRange("I2:I" + (data.length + 1)).setDataValidation(
    listRule_(["atteint", "en_cours", "non_atteint"]));

  // J: date
  sheet.getRange("J2:J" + (data.length + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 110, 350, 80, 110, 90, 180, 90, 100, 110, 300]);

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (data.length + 1));
  addCondBg_(sheet, rangeI, "atteint",     "#d4edda");
  addCondBg_(sheet, rangeI, "en_cours",    "#fff3cd");
  addCondBg_(sheet, rangeI, "non_atteint", "#f8d7da");

  // Conditional: tendance H
  var rangeH = sheet.getRange("H2:H" + (data.length + 1));
  addCondBg_(sheet, rangeH, "hausse", "#d4edda");
  addCondBg_(sheet, rangeH, "stable", "#fff3cd");
  addCondBg_(sheet, rangeH, "baisse", "#f8d7da");

  // Highlight "A configurer" rows (KPI-006 to KPI-015 = rows 7-16)
  for (var r = 5; r < data.length; r++) {
    sheet.getRange(r + 2, 5, 1, 1).setBackground("#fff3cd");
  }

  Logger.log("  KPIs done");
}

/** Set auto-calculated formulas on KPIs (called after all sheets exist). */
function setKPIAutoFormulas_(ss) {
  Logger.log("=== Setting KPI auto-formulas ===");
  var sheet = ss.getSheetByName("KPIs");

  // E2: Taux conformite = conforme / total * 100
  sheet.getRange("E2").setFormula(
    '=IFERROR(ROUND(COUNTIF(Indicateurs_Qualiopi!E2:E33,"conforme")/COUNTA(Indicateurs_Qualiopi!E2:E33)*100,1),0)');

  // E3: Nb indicateurs non conformes
  sheet.getRange("E3").setFormula(
    '=COUNTIF(Indicateurs_Qualiopi!E2:E33,"non_conforme")');

  // E4: Actions ouvertes + en_cours
  sheet.getRange("E4").setFormula(
    '=COUNTIF(Actions_Amelioration!J2:J101,"ouverte")+COUNTIF(Actions_Amelioration!J2:J101,"en_cours")');

  // E5: NC ouvertes + en_cours
  sheet.getRange("E5").setFormula(
    '=COUNTIF(Non_Conformites!I2:I101,"ouverte")+COUNTIF(Non_Conformites!I2:I101,"en_cours")');

  // E6: Veilles a_analyser
  sheet.getRange("E6").setFormula(
    '=COUNTIF(Veille!I2:I101,"a_analyser")');

  Logger.log("  5 auto-formulas set");
}

// ─── Audits ─────────────────────────────────────────────────────────────────

function setupAudits_(ss) {
  Logger.log("=== Setting up Audits ===");
  var sheet = getOrCreateSheet_(ss, "Audits");

  var headers = [
    "audit_id",              // A
    "type",                  // B
    "date_planifiee",        // C
    "date_realisation",      // D
    "auditeur",              // E
    "perimetre",             // F
    "indicateurs_concernes", // G
    "constats",              // H
    "nb_conformites",        // I
    "nb_non_conformites",    // J
    "nb_observations",       // K
    "statut",                // L
    "rapport_drive_url"      // M
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id AUD-001
  sheet.getRange("A2:A" + (ROWS_SMALL + 1))
    .setFormulas(buildIdFormulas_("B", "AUD-", ROWS_SMALL, "000", false));

  // B: type dropdown
  sheet.getRange("B2:B" + (ROWS_SMALL + 1)).setDataValidation(
    listRule_(["interne", "blanc", "surveillance", "certification"]));

  // C-D: dates
  sheet.getRange("C2:D" + (ROWS_SMALL + 1)).setNumberFormat("yyyy-MM-dd");

  // I-K: number >= 0
  var numRule = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  ["I", "J", "K"].forEach(function (col) {
    sheet.getRange(col + "2:" + col + (ROWS_SMALL + 1)).setDataValidation(numRule);
  });

  // L: statut dropdown
  sheet.getRange("L2:L" + (ROWS_SMALL + 1)).setDataValidation(
    listRule_(["planifie", "en_cours", "termine", "cloture"]));

  // Widths
  setColWidths_(sheet, [100, 110, 120, 120, 150, 250, 200, 400, 80, 80, 80, 90, 250]);

  // Conditional: statut L
  var rangeL = sheet.getRange("L2:L" + (ROWS_SMALL + 1));
  addCondBg_(sheet, rangeL, "planifie", "#d4edfc");
  addCondBg_(sheet, rangeL, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeL, "termine",  "#d4edda");
  addCondBg_(sheet, rangeL, "cloture",  "#e2e3e5");

  // Conditional: nb_non_conformites J > 0 = red
  addNumRule_(sheet, sheet.getRange("J2:J" + (ROWS_SMALL + 1)), "gte", 1, "#f8d7da");

  Logger.log("  Audits done");
}

// ─── Actions Amelioration ───────────────────────────────────────────────────

function setupActionsAmelioration_(ss) {
  Logger.log("=== Setting up Actions_Amelioration ===");
  var sheet = getOrCreateSheet_(ss, "Actions_Amelioration");

  var headers = [
    "action_id",        // A
    "source",           // B
    "reference_source", // C
    "description",      // D
    "type",             // E
    "priorite",         // F
    "responsable",      // G
    "date_ouverture",   // H
    "echeance",         // I
    "statut",           // J
    "resultat",         // K
    "date_cloture"      // L
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id ACT-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("D", "ACT-", ROWS, "000", false));

  // B: source dropdown
  sheet.getRange("B2:B" + (ROWS + 1)).setDataValidation(
    listRule_(["audit", "reclamation", "revue_direction", "veille", "auto_evaluation"]));

  // E: type dropdown
  sheet.getRange("E2:E" + (ROWS + 1)).setDataValidation(
    listRule_(["corrective", "preventive", "amelioration"]));

  // F: priorite dropdown
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    listRule_(["haute", "moyenne", "basse"]));

  // H-I: dates
  sheet.getRange("H2:I" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // J: statut dropdown
  sheet.getRange("J2:J" + (ROWS + 1)).setDataValidation(
    listRule_(["ouverte", "en_cours", "verifiee", "cloturee"]));

  // L: date_cloture
  sheet.getRange("L2:L" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [100, 120, 130, 400, 100, 90, 150, 120, 120, 90, 400, 120]);

  // Conditional: priorite F
  var rangeF = sheet.getRange("F2:F" + (ROWS + 1));
  addCondBg_(sheet, rangeF, "haute",   "#f8d7da");
  addCondBg_(sheet, rangeF, "moyenne", "#fff3cd");
  addCondBg_(sheet, rangeF, "basse",   "#d4edda");

  // Conditional: statut J
  var rangeJ = sheet.getRange("J2:J" + (ROWS + 1));
  addCondBg_(sheet, rangeJ, "ouverte",  "#f8d7da");
  addCondBg_(sheet, rangeJ, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeJ, "verifiee", "#d4edda");
  addCondBg_(sheet, rangeJ, "cloturee", "#e2e3e5");

  // Conditional: echeance I depassee (custom formula)
  var rules = sheet.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(I2<>"",I2<TODAY(),J2<>"cloturee",J2<>"verifiee")')
    .setBackground("#f5c6cb").setFontColor("#721c24")
    .setRanges([sheet.getRange("I2:I" + (ROWS + 1))]).build());
  sheet.setConditionalFormatRules(rules);
  Logger.log("  Overdue deadline highlight set");

  Logger.log("  Actions_Amelioration done");
}

// ─── Non-Conformites ────────────────────────────────────────────────────────

function setupNonConformites_(ss) {
  Logger.log("=== Setting up Non_Conformites ===");
  var sheet = getOrCreateSheet_(ss, "Non_Conformites");

  var headers = [
    "nc_id",                // A
    "date_detection",       // B
    "source",               // C
    "indicateur_concerne",  // D
    "description",          // E
    "gravite",              // F
    "cause_racine",         // G
    "action_corrective_id", // H  (ref Actions_Amelioration)
    "statut",               // I
    "date_cloture",         // J
    "verification"          // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id NC-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("E", "NC-", ROWS, "000", false));

  // B: date
  sheet.getRange("B2:B" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // C: source dropdown
  sheet.getRange("C2:C" + (ROWS + 1)).setDataValidation(
    listRule_(["audit", "reclamation", "auto_evaluation", "apprenant", "autre"]));

  // D: indicateur concerne (1-32)
  sheet.getRange("D2:D" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberBetween(1, 32).setAllowInvalid(true)
      .setHelpText("Numero indicateur Qualiopi (1-32)").build());

  // F: gravite dropdown
  sheet.getRange("F2:F" + (ROWS + 1)).setDataValidation(
    listRule_(["mineure", "majeure", "critique"]));

  // H: dropdown from Actions_Amelioration!A (optional)
  sheet.getRange("H2:H" + (ROWS + 1)).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(ss.getSheetByName("Actions_Amelioration").getRange("A2:A" + (ROWS + 1)), true)
      .setAllowInvalid(true)  // optional – NC may not yet have an action
      .build());

  // I: statut dropdown
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["ouverte", "en_cours", "soldee"]));

  // J: date_cloture
  sheet.getRange("J2:J" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 120, 120, 100, 400, 90, 350, 130, 90, 120, 350]);

  // Conditional: gravite F
  var rangeF = sheet.getRange("F2:F" + (ROWS + 1));
  addCondBg_(sheet, rangeF, "mineure",  "#fff3cd");
  addCondBg_(sheet, rangeF, "majeure",  "#f8d7da");
  addCondBg_(sheet, rangeF, "critique", "#f5c6cb");

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (ROWS + 1));
  addCondBg_(sheet, rangeI, "ouverte",  "#f8d7da");
  addCondBg_(sheet, rangeI, "en_cours", "#fff3cd");
  addCondBg_(sheet, rangeI, "soldee",   "#d4edda");

  Logger.log("  Non_Conformites done");
}

// ─── Revue Direction ────────────────────────────────────────────────────────

function setupRevueDirection_(ss) {
  Logger.log("=== Setting up Revue_Direction ===");
  var sheet = getOrCreateSheet_(ss, "Revue_Direction");

  var headers = [
    "revue_id",              // A
    "date_revue",            // B
    "participants",          // C
    "ordre_du_jour",         // D
    "synthese_kpis",         // E
    "synthese_reclamations", // F
    "synthese_audits",       // G
    "decisions",             // H
    "actions_definies",      // I
    "pv_drive_url",          // J
    "prochaine_revue"        // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id REV-001
  sheet.getRange("A2:A" + (ROWS_SMALL + 1))
    .setFormulas(buildIdFormulas_("B", "REV-", ROWS_SMALL, "000", false));

  // B: date_revue
  sheet.getRange("B2:B" + (ROWS_SMALL + 1)).setNumberFormat("yyyy-MM-dd");

  // K: prochaine_revue
  sheet.getRange("K2:K" + (ROWS_SMALL + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 120, 250, 350, 350, 350, 350, 400, 400, 250, 120]);

  // Row height for content rows (more space for text)
  for (var r = 2; r <= ROWS_SMALL + 1; r++) {
    sheet.setRowHeight(r, 60);
  }

  // Wrap text on long columns (D-I)
  sheet.getRange("D2:I" + (ROWS_SMALL + 1)).setWrap(true);

  Logger.log("  Revue_Direction done");
}

// ─── Veille ─────────────────────────────────────────────────────────────────

function setupVeille_(ss) {
  Logger.log("=== Setting up Veille ===");
  var sheet = getOrCreateSheet_(ss, "Veille");

  var headers = [
    "veille_id",       // A
    "date_detection",  // B
    "type",            // C
    "source_info",     // D
    "titre",           // E
    "description",     // F
    "impact",          // G
    "action_requise",  // H
    "statut",          // I
    "responsable",     // J
    "date_traitement"  // K
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  applyHeaderStyle_(sheet, headers.length);

  // A: auto-id VEI-001
  sheet.getRange("A2:A" + (ROWS + 1))
    .setFormulas(buildIdFormulas_("E", "VEI-", ROWS, "000", false));

  // B: date
  sheet.getRange("B2:B" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // C: type dropdown
  sheet.getRange("C2:C" + (ROWS + 1)).setDataValidation(
    listRule_(["reglementaire", "pedagogique", "technologique", "sectorielle"]));

  // G: impact dropdown
  sheet.getRange("G2:G" + (ROWS + 1)).setDataValidation(
    listRule_(["fort", "moyen", "faible"]));

  // I: statut dropdown
  sheet.getRange("I2:I" + (ROWS + 1)).setDataValidation(
    listRule_(["a_analyser", "en_cours", "traitee", "sans_suite"]));

  // K: date
  sheet.getRange("K2:K" + (ROWS + 1)).setNumberFormat("yyyy-MM-dd");

  // Widths
  setColWidths_(sheet, [90, 120, 120, 200, 250, 400, 80, 350, 100, 150, 120]);

  // Conditional: impact G
  var rangeG = sheet.getRange("G2:G" + (ROWS + 1));
  addCondBg_(sheet, rangeG, "fort",   "#f8d7da");
  addCondBg_(sheet, rangeG, "moyen",  "#fff3cd");
  addCondBg_(sheet, rangeG, "faible", "#d4edda");

  // Conditional: statut I
  var rangeI = sheet.getRange("I2:I" + (ROWS + 1));
  addCondBg_(sheet, rangeI, "a_analyser", "#d4edfc");
  addCondBg_(sheet, rangeI, "en_cours",   "#fff3cd");
  addCondBg_(sheet, rangeI, "traitee",    "#d4edda");
  addCondBg_(sheet, rangeI, "sans_suite", "#e2e3e5");

  Logger.log("  Veille done");
}

// ─── Main ───────────────────────────────────────────────────────────────────

function setupQualiteKPIs() {
  Logger.log("========================================");
  Logger.log("  setupQualiteKPIs() - START");
  Logger.log("========================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create sheets in dependency order:
  // Indicateurs first (referenced by KPI formulas)
  // Actions before Non_Conformites (dropdown ref)
  // KPIs early in tab order, formulas set last
  setupIndicateursQualiopi_(ss);
  setupKPIs_(ss);
  setupAudits_(ss);
  setupActionsAmelioration_(ss);
  setupNonConformites_(ss);
  setupRevueDirection_(ss);
  setupVeille_(ss);

  // Set KPI auto-formulas now that all referenced sheets exist
  setKPIAutoFormulas_(ss);

  removeDefaultSheets_(ss);
  ss.setActiveSheet(ss.getSheetByName("Indicateurs_Qualiopi"));

  Logger.log("========================================");
  Logger.log("  setupQualiteKPIs() - DONE");
  Logger.log("========================================");
}
