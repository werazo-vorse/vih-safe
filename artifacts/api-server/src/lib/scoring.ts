// frontend/src/utils/computeScore.ts
import type { Question } from "../data/questions.js";
import { QUESTIONS } from "../data/questions.js";

type AnswerValue = string | number | string[];

export type Answer = { questionId: string; value: AnswerValue };

export type DomainScore = { domain: string; score: number; maxScore: number };
export type RiskFactor = {
  label: string;
  severity: "low" | "moderate" | "high";
};

export type ScoringResult = {
  riskLevel: "low" | "moderate" | "high" | "very_high";
  riskScore: number;
  summary: string;
  recommendations: string[];
  factors: RiskFactor[];
  domainScores: DomainScore[];
  ageRange: string;
};

const QUESTION_MAP = new Map<string, Question>(QUESTIONS.map((q) => [q.id, q]));

function getAnswer(
  answers: Answer[],
  questionId: string,
): AnswerValue | undefined {
  return answers.find((a) => a.questionId === questionId)?.value;
}

function asString(v: AnswerValue | undefined): string {
  if (v === undefined) return "";
  if (Array.isArray(v)) return v.join(",");
  return String(v);
}

function asArray(v: AnswerValue | undefined): string[] {
  if (v === undefined) return [];
  if (Array.isArray(v)) return v;
  return [String(v)];
}

function ageBucket(age: number): string {
  if (age < 18) return "<18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  return "45+";
}

// Convertir rango de parejas a número (para puntuación)
function partnersCountToNumber(countStr: string): number {
  switch (countStr) {
    case "0":
      return 0;
    case "1":
      return 1;
    case "2-5":
      return 3;
    case "6-10":
      return 8;
    case "11+":
      return 15;
    default:
      return 0;
  }
}

// Convertir frecuencia de condón a puntuación (0 a 3)
function condomScore(freq: string): number {
  switch (freq) {
    case "never":
      return 3;
    case "sometimes":
      return 2;
    case "almost_always":
      return 1;
    case "always":
      return 0;
    default:
      return 0;
  }
}

export function computeScore(answers: Answer[]): ScoringResult {
  const factors: RiskFactor[] = [];
  const domainTotals: Record<string, { score: number; max: number }> = {
    demographic: { score: 0, max: 0 },
    behavioral: { score: 0, max: 0 },
    epidemiological: { score: 0, max: 0 },
    clinical: { score: 0, max: 0 },
  };

  function add(domain: string, score: number, max: number) {
    domainTotals[domain].score += score;
    domainTotals[domain].max += max;
  }

  // ------------------------------------------------------------
  // DOMINIO DEMOGRÁFICO
  // ------------------------------------------------------------
  const rawAge = getAnswer(answers, "q2_age");
  const ageNum =
    typeof rawAge === "number" ? rawAge : parseInt(asString(rawAge), 10);
  const ageRange = Number.isFinite(ageNum) ? ageBucket(ageNum) : "no_reportada";

  let demoScore = 0;
  if (Number.isFinite(ageNum)) {
    if (ageNum >= 18 && ageNum <= 34) demoScore += 1; // grupo de mayor actividad sexual
    if (ageNum < 18) demoScore += 0; // menor riesgo relativo
  }
  add("demographic", demoScore, 2);

  const country = asString(getAnswer(answers, "q3_country_birth"));
  const isForeign = country && country.toLowerCase() !== "colombia";

  // ------------------------------------------------------------
  // DOMINIO CONDUCTUAL
  // ------------------------------------------------------------
  const sexWithMen = asString(getAnswer(answers, "q11_sex_with_men"));
  const sexWithWomen = asString(getAnswer(answers, "q12_sex_with_women"));
  const hasSex = sexWithMen === "yes" || sexWithWomen === "yes";

  let menCount = 0,
    womenCount = 0;
  let condomMenScore = 0,
    condomWomenScore = 0;

  if (sexWithMen === "yes") {
    const countStr = asString(getAnswer(answers, "q11_men_partners_count"));
    menCount = partnersCountToNumber(countStr);
    const condomFreq = asString(getAnswer(answers, "q11_condom_use_men"));
    condomMenScore = condomScore(condomFreq);
  }
  if (sexWithWomen === "yes") {
    const countStr = asString(getAnswer(answers, "q12_women_partners_count"));
    womenCount = partnersCountToNumber(countStr);
    const condomFreq = asString(getAnswer(answers, "q12_condom_use_women"));
    condomWomenScore = condomScore(condomFreq);
  }

  // Número total de parejas (categorizado y con peso logarítmico)
  const totalPartners = menCount + womenCount;
  let partnersPoints = 0;
  if (totalPartners >= 11) partnersPoints = 4;
  else if (totalPartners >= 6) partnersPoints = 3;
  else if (totalPartners >= 3) partnersPoints = 2;
  else if (totalPartners === 2) partnersPoints = 1;
  if (partnersPoints >= 2) {
    factors.push({
      label: "Múltiples parejas sexuales en los últimos 12 meses",
      severity: partnersPoints >= 3 ? "high" : "moderate",
    });
  }
  add("behavioral", partnersPoints, 4);

  // Uso de condón (peor escenario, pero ponderado por número de parejas)
  let worstCondom = Math.max(condomMenScore, condomWomenScore);
  // Si no hay parejas de un género, no se penaliza por ese género
  if (sexWithMen !== "yes") condomMenScore = 0;
  if (sexWithWomen !== "yes") condomWomenScore = 0;
  worstCondom = Math.max(condomMenScore, condomWomenScore);
  let condomPoints = worstCondom;
  if (totalPartners > 1 && worstCondom >= 2) condomPoints += 1; // extra si muchas parejas y mal uso
  if (condomPoints >= 2) {
    factors.push({
      label: "Uso inconsistente o nulo de condón",
      severity: condomPoints >= 3 ? "high" : "moderate",
    });
  }
  add("behavioral", Math.min(condomPoints, 4), 4);

  // HSH (hombres que tienen sexo con hombres) - factor de alto riesgo en Colombia
  const gender = asString(getAnswer(answers, "q1_gender"));
  const isMale = gender === "man";
  const isMSM = isMale && sexWithMen === "yes";
  let hshPoints = 0;
  if (isMSM) {
    hshPoints = 3;
    factors.push({
      label:
        "Hombre que tiene sexo con hombres (HSH) — alta incidencia en Colombia",
      severity: "high",
    });
  }
  add("behavioral", hshPoints, 3);

  // ------------------------------------------------------------
  // DOMINIO EPIDEMIOLÓGICO
  // ------------------------------------------------------------
  let epiScore = 0;
  if (isForeign) {
    epiScore += 1;
    factors.push({ label: "Nacido fuera de Colombia", severity: "low" });
  }
  if (asString(getAnswer(answers, "q9_sex_abroad")) === "yes") {
    epiScore += 2;
    factors.push({
      label: "Relaciones sexuales con personas fuera de Colombia",
      severity: "moderate",
    });
  }
  if (asString(getAnswer(answers, "q10_sex_worker")) === "yes") {
    epiScore += 3;
    factors.push({
      label: "Recibir dinero o bienes a cambio de sexo",
      severity: "high",
    });
  }

  // Inyección de drogas (con recencia)
  const injected = asString(getAnswer(answers, "q8_injected_drugs"));
  let injectedPoints = 0;
  if (injected === "yes") {
    const recency = asString(getAnswer(answers, "q8_injected_drugs_last"));
    if (recency === "last_month") injectedPoints = 5;
    else if (recency === "last_year") injectedPoints = 3;
    else injectedPoints = 2;
    factors.push({
      label: "Inyección de drogas no prescritas (riesgo alto de VIH/ITS)",
      severity: injectedPoints >= 4 ? "high" : "moderate",
    });
  }
  epiScore += injectedPoints;
  add("epidemiological", Math.min(epiScore, 10), 10);

  // Contacto reciente con ITS y relación con pareja VIH (lógica I=I)
  const recentContact = asString(getAnswer(answers, "q6_recent_contact_sti"));
  const recentWhich = asArray(
    getAnswer(answers, "q6_recent_contact_sti_which"),
  );
  const partnerHiv = asString(getAnswer(answers, "q14_partner_hiv"));
  const contactWithHiv = recentContact === "yes" && recentWhich.includes("hiv");
  const partnerUndetectable = partnerHiv === "yes_undetectable";

  let recentScore = 0;
  if (recentContact === "yes") {
    if (contactWithHiv && partnerUndetectable) {
      // Sin riesgo por I=I
      factors.push({
        label:
          "Contacto con pareja con VIH indetectable (I=I) – sin riesgo de transmisión",
        severity: "low",
      });
    } else if (contactWithHiv && !partnerUndetectable) {
      recentScore = 5;
      factors.push({
        label:
          "Contacto reciente con persona con VIH (tratamiento desconocido o no indetectable)",
        severity: "high",
      });
    } else if (recentWhich.includes("unknown")) {
      recentScore = 2;
      factors.push({
        label: "Contacto con persona con ITS de tipo no especificado",
        severity: "moderate",
      });
    } else if (recentWhich.length > 0) {
      recentScore = 3;
      factors.push({
        label: "Contacto reciente con persona con ITS (no VIH)",
        severity: "high",
      });
    }
  } else if (recentContact === "unsure") {
    recentScore = 1;
    factors.push({
      label: "No está seguro/a de haber tenido contacto con ITS",
      severity: "moderate",
    });
  }
  epiScore += recentScore;
  add("epidemiological", Math.min(epiScore, 10), 10); // ya sumamos, pero el máximo lo ajustamos después

  // ------------------------------------------------------------
  // DOMINIO CLÍNICO
  // ------------------------------------------------------------
  let clinScore = 0;

  // PrEP (protector)
  const prep = asString(getAnswer(answers, "q7_prep_use"));
  if (prep === "yes") {
    clinScore -= 3;
    factors.push({
      label: "Uso de PrEP (factor protector contra VIH)",
      severity: "low",
    });
  } else if (prep === "sometimes") {
    clinScore -= 1;
  }

  // Diagnóstico previo de ITS (incluye especificidad)
  const priorSti = asString(getAnswer(answers, "q5_prior_sti_diagnosis"));
  if (priorSti === "yes") {
    const priorList = asArray(getAnswer(answers, "q5_prior_sti_list"));
    let priorPoints = 2; // base
    if (priorList.includes("hiv")) priorPoints += 2;
    if (priorList.includes("syphilis")) priorPoints += 1;
    if (priorList.includes("other")) priorPoints += 1;
    clinScore += priorPoints;
    factors.push({
      label: "Diagnóstico previo de ITS (aumenta vulnerabilidad al VIH)",
      severity: priorPoints >= 3 ? "high" : "moderate",
    });
  }

  // Síntomas actuales
  if (asString(getAnswer(answers, "q4_symptoms")) === "yes") {
    clinScore += 3;
    factors.push({
      label: "Síntomas actuales compatibles con ITS",
      severity: "high",
    });
  }

  // Pareja con VIH (solo si no fue ya considerado como contacto reciente con VIH indetectable)
  if (
    partnerHiv === "yes_unknown" &&
    !(contactWithHiv && partnerUndetectable)
  ) {
    clinScore += 4;
    factors.push({
      label: "Pareja con VIH sin tratamiento o carga viral desconocida",
      severity: "high",
    });
  } else if (partnerHiv === "yes_undetectable") {
    // No puntúa, ya es factor protector
    factors.push({
      label: "Pareja con VIH indetectable (I=I) – no transmisible",
      severity: "low",
    });
  } else if (partnerHiv === "dont_know" && hasSex) {
    clinScore += 1;
    factors.push({
      label: "Desconocimiento del estado VIH de las parejas",
      severity: "moderate",
    });
  }

  // Última prueba de VIH
  const lastTest = asString(getAnswer(answers, "q13_last_hiv_test"));
  if (lastTest === "never" && hasSex) {
    clinScore += 2;
    factors.push({
      label: "Nunca se ha realizado la prueba de VIH",
      severity: "moderate",
    });
  } else if (lastTest === ">12m" && hasSex) {
    clinScore += 1;
  } else if (lastTest === "<3m" && hasSex) {
    clinScore -= 1;
  }

  // Límites clínicos
  clinScore = Math.max(0, clinScore);
  add("clinical", Math.min(clinScore, 12), 12);

  // ------------------------------------------------------------
  // PUNTAJE TOTAL Y NIVEL DE RIESGO
  // ------------------------------------------------------------
  const totalScore =
    domainTotals.demographic.score +
    domainTotals.behavioral.score +
    domainTotals.epidemiological.score +
    domainTotals.clinical.score;

  let riskLevel: ScoringResult["riskLevel"];
  let summary: string;
  let recommendations: string[];

  if (totalScore <= 3) {
    riskLevel = "low";
    summary =
      "Riesgo BAJO. Las prácticas reportadas se asocian con baja probabilidad de exposición al VIH.";
    recommendations = [
      "✅ Mantén el uso de condón en todas tus relaciones sexuales.",
      "🩺 Realízate una prueba de VIH al menos una vez al año si tienes vida sexual activa.",
      "📚 Infórmate sobre síntomas de ITS y consulta si aparecen.",
    ];
  } else if (totalScore <= 7) {
    riskLevel = "moderate";
    summary =
      "Riesgo MODERADO. Se identifican algunos factores que requieren atención preventiva.";
    recommendations = [
      "🩸 Realízate una prueba de VIH y otras ITS en los próximos 1 a 3 meses.",
      "🔁 Refuerza el uso correcto y consistente del condón.",
      "💊 Conversa con un profesional de salud sobre la PrEP si tienes prácticas de riesgo frecuentes.",
    ];
  } else if (totalScore <= 11) {
    riskLevel = "high";
    summary =
      "Riesgo ALTO. Es importante que actúes pronto para cuidar tu salud y la de tus parejas.";
    recommendations = [
      "🏥 Acude a un centro de salud en Manizales para una prueba de VIH y otras ITS lo antes posible.",
      "🛡️ Pregunta por la PrEP — es altamente eficaz para prevenir el VIH.",
      "⏱️ Si tuviste una exposición de alto riesgo en las últimas 72 horas, consulta por PEP (profilaxis post-exposición).",
    ];
  } else {
    riskLevel = "very_high";
    summary =
      "Riesgo MUY ALTO. Te recomendamos hacer una prueba de VIH cuanto antes y buscar asesoría profesional.";
    recommendations = [
      "⚠️ Realízate una prueba de VIH en los próximos días (muchas son gratuitas en Manizales).",
      "🚨 Si tuviste una exposición de riesgo en las últimas 72 horas, acude a urgencias por PEP.",
      "💊 Considera iniciar PrEP de manera estable.",
      "❤️ Recuerda: el diagnóstico temprano permite vivir con VIH una vida plena y saludable.",
    ];
  }

  if (asString(getAnswer(answers, "q4_symptoms")) === "yes") {
    recommendations.unshift(
      "🔴 Presentas síntomas compatibles con ITS. ¡Acude a un centro de salud de inmediato!",
    );
  }

  if (
    partnerHiv === "yes_unknown" &&
    !(contactWithHiv && partnerUndetectable)
  ) {
    recommendations.push(
      "👥 Si tu pareja vive con VIH, es fundamental que reciba tratamiento. Usa condón y consulta por PrEP.",
    );
  }

  if (injected === "yes" && injectedPoints >= 3) {
    recommendations.push(
      "💉 Evita compartir jeringas. En Manizales existen programas de reducción de daños (por ejemplo, Profamilia y la Secretaría de Salud).",
    );
  }

  const domainScores: DomainScore[] = [
    {
      domain: "Conductual",
      score: domainTotals.behavioral.score,
      maxScore: domainTotals.behavioral.max,
    },
    {
      domain: "Epidemiológico",
      score: domainTotals.epidemiological.score,
      maxScore: domainTotals.epidemiological.max,
    },
    {
      domain: "Clínico",
      score: domainTotals.clinical.score,
      maxScore: domainTotals.clinical.max,
    },
    {
      domain: "Demográfico",
      score: domainTotals.demographic.score,
      maxScore: domainTotals.demographic.max,
    },
  ];

  return {
    riskLevel,
    riskScore: totalScore,
    summary,
    recommendations,
    factors,
    domainScores,
    ageRange,
  };
}

export { QUESTION_MAP };
