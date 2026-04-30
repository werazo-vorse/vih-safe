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

// Convierte el rango de parejas a un número representativo
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

// Puntuación base por frecuencia de condón (sin contexto)
function rawCondomScore(freq: string): number {
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

// Determina si la persona ha tenido actividad sexual en el último año
function hasRecentSexualActivity(
  sexWithMen: string,
  sexWithWomen: string,
): boolean {
  return sexWithMen === "yes" || sexWithWomen === "yes";
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

  // --------------------------------------------------------------
  // 1. DEMOGRÁFICO
  // --------------------------------------------------------------
  const ageRangeRaw = asString(getAnswer(answers, "q2_age"));
  const ageRange = ageRangeRaw || "no_reportado";
  let demoScore = 0;
  if (ageRangeRaw === "18-24" || ageRangeRaw === "25-34") demoScore += 1;
  add("demographic", demoScore, 2);

  const country = asString(getAnswer(answers, "q3_country_birth"));
  const isForeign = country && country.toLowerCase() !== "colombia";

  // --------------------------------------------------------------
  // 2. CONDUCTUAL
  // --------------------------------------------------------------
  const sexWithMen = asString(getAnswer(answers, "q11_sex_with_men"));
  const sexWithWomen = asString(getAnswer(answers, "q12_sex_with_women"));
  const hasSex = hasRecentSexualActivity(sexWithMen, sexWithWomen);

  let menCount = 0,
    womenCount = 0;
  let menCondomRaw = 0,
    womenCondomRaw = 0;

  if (sexWithMen === "yes") {
    const countStr = asString(getAnswer(answers, "q11_men_partners_count"));
    menCount = partnersCountToNumber(countStr);
    menCondomRaw = rawCondomScore(
      asString(getAnswer(answers, "q11_condom_use_men")),
    );
  }
  if (sexWithWomen === "yes") {
    const countStr = asString(getAnswer(answers, "q12_women_partners_count"));
    womenCount = partnersCountToNumber(countStr);
    womenCondomRaw = rawCondomScore(
      asString(getAnswer(answers, "q12_condom_use_women")),
    );
  }

  const totalPartners = menCount + womenCount;

  // Puntuación por número de parejas
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
  } else if (totalPartners === 1) {
    factors.push({
      label:
        "Una sola pareja sexual en el último año (riesgo dependiente de su estado serológico)",
      severity: "low",
    });
  }
  add("behavioral", partnersPoints, 4);

  // Puntuación por uso de condón (contextualizada)
  const worstRawCondom = Math.max(menCondomRaw, womenCondomRaw);
  let condomPoints = 0;
  if (totalPartners === 0) {
    condomPoints = 0;
  } else if (totalPartners === 1) {
    // Pareja única: el no uso de condón es menos riesgoso (se evaluará con clínico)
    if (worstRawCondom === 3) condomPoints = 1;
    else if (worstRawCondom === 2) condomPoints = 1;
    else condomPoints = 0;
  } else {
    // Múltiples parejas: el no uso es muy riesgoso
    if (worstRawCondom === 3) condomPoints = 4;
    else if (worstRawCondom === 2) condomPoints = 3;
    else if (worstRawCondom === 1) condomPoints = 1;
  }
  if (condomPoints >= 2) {
    factors.push({
      label: "Uso inconsistente o nulo de condón con múltiples parejas",
      severity: condomPoints >= 3 ? "high" : "moderate",
    });
  } else if (totalPartners === 1 && worstRawCondom === 3) {
    factors.push({
      label:
        "No usas condón con tu pareja estable. El riesgo real depende del estado de VIH/ITS de tu pareja.",
      severity: "low",
    });
  }
  add("behavioral", Math.min(condomPoints, 4), 4);

  // HSH (hombres que tienen sexo con hombres)
  const gender = asString(getAnswer(answers, "q1_gender"));
  const isMale = gender === "man";
  const isMSM = isMale && sexWithMen === "yes";
  let hshPoints = 0;
  if (isMSM) {
    hshPoints = 3;
    factors.push({
      label:
        "Hombre que tiene sexo con hombres (HSH) — mayor incidencia en Colombia",
      severity: "high",
    });
  }
  add("behavioral", hshPoints, 3);

  // --------------------------------------------------------------
  // 3. EPIDEMIOLÓGICO
  // --------------------------------------------------------------
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

  const injected = asString(getAnswer(answers, "q8_injected_drugs"));
  let injectedPoints = 0;
  if (injected === "yes") {
    const recency = asString(getAnswer(answers, "q8_injected_drugs_last"));
    if (recency === "last_month") injectedPoints = 5;
    else if (recency === "last_year") injectedPoints = 3;
    else injectedPoints = 2;
    factors.push({
      label: "Inyección de drogas no prescritas",
      severity: injectedPoints >= 4 ? "high" : "moderate",
    });
  }
  epiScore += injectedPoints;

  // Contacto reciente con ITS y lógica I=I
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
      factors.push({
        label:
          "Contacto con pareja con VIH indetectable (I=I) – sin riesgo de transmisión",
        severity: "low",
      });
    } else if (contactWithHiv && !partnerUndetectable) {
      recentScore = 5;
      factors.push({
        label: "Contacto reciente con persona con VIH sin tratamiento conocido",
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
  add("epidemiological", Math.min(epiScore, 12), 12);

  // --------------------------------------------------------------
  // 4. CLÍNICO
  // --------------------------------------------------------------
  let clinScore = 0;

  // PrEP
  const prep = asString(getAnswer(answers, "q7_prep_use"));
  if (prep === "yes") {
    clinScore -= 3;
    factors.push({ label: "Uso de PrEP (factor protector)", severity: "low" });
  } else if (prep === "sometimes") clinScore -= 1;

  // ITS previas
  const priorSti = asString(getAnswer(answers, "q5_prior_sti_diagnosis"));
  if (priorSti === "yes") {
    const priorList = asArray(getAnswer(answers, "q5_prior_sti_list"));
    let priorPoints = 2;
    if (priorList.includes("hiv")) priorPoints += 3;
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

  // Estado de la pareja con VIH
  if (partnerHiv === "yes_unknown") {
    clinScore += 5;
    factors.push({
      label: "Pareja con VIH sin tratamiento o carga viral desconocida",
      severity: "high",
    });
  } else if (partnerHiv === "yes_undetectable") {
    factors.push({
      label: "Pareja con VIH indetectable (I=I) – no transmisible",
      severity: "low",
    });
    if (totalPartners === 1 && worstRawCondom === 3) clinScore -= 1;
  } else if (partnerHiv === "dont_know" && hasSex) {
    clinScore += 2;
    factors.push({
      label: "Desconocimiento del estado VIH de las parejas",
      severity: "moderate",
    });
  } else if (
    partnerHiv === "no" &&
    totalPartners === 1 &&
    worstRawCondom === 3
  ) {
    factors.push({
      label: "Pareja estable sin VIH – riesgo bajo",
      severity: "low",
    });
    clinScore -= 1;
  }

  // Última prueba de VIH (solo para puntuación, no para recomendación aún)
  const lastTest = asString(getAnswer(answers, "q13_last_hiv_test"));
  if (lastTest === "never" && hasSex) {
    clinScore += 2;
    factors.push({
      label: "Nunca se ha realizado la prueba de VIH",
      severity: "moderate",
    });
  } else if (lastTest === ">12m" && hasSex) clinScore += 1;
  else if (lastTest === "<3m" && hasSex) clinScore -= 1;

  clinScore = Math.max(0, clinScore);
  add("clinical", Math.min(clinScore, 15), 15);

  // --------------------------------------------------------------
  // 5. PUNTAJE TOTAL Y NIVEL DE RIESGO
  // --------------------------------------------------------------
  const totalScore =
    domainTotals.demographic.score +
    domainTotals.behavioral.score +
    domainTotals.epidemiological.score +
    domainTotals.clinical.score;

  let riskLevel: ScoringResult["riskLevel"];
  let summary: string;

  if (totalScore <= 3) {
    riskLevel = "low";
    summary =
      "Riesgo BAJO. Muy baja probabilidad de exposición al VIH según la evidencia.";
  } else if (totalScore <= 7) {
    riskLevel = "moderate";
    summary =
      "Riesgo MODERADO. Algunas prácticas aumentan la posibilidad de exposición.";
  } else if (totalScore <= 12) {
    riskLevel = "high";
    summary =
      "Riesgo ALTO. Existen factores significativos que requieren intervención preventiva.";
  } else {
    riskLevel = "very_high";
    summary =
      "Riesgo MUY ALTO. Se recomienda acción inmediata para proteger tu salud.";
  }

  // --------------------------------------------------------------
  // 6. RECOMENDACIONES (INTELIGENTES, BASADAS EN MySTIRisk)
  // --------------------------------------------------------------
  const recommendations: string[] = [];

  // Regla para sugerir prueba de VIH (solo si es relevante)
  const shouldSuggestTesting = (() => {
    if (riskLevel === "very_high") return true;
    if (riskLevel === "high") return true;
    if (riskLevel === "moderate" && lastTest !== "<3m") return true;
    if (riskLevel === "moderate" && lastTest === "<3m") return false; // No repetir tan pronto
    if (riskLevel === "low" && (lastTest === "never" || lastTest === ">12m"))
      return true;
    return false;
  })();

  if (shouldSuggestTesting) {
    if (riskLevel === "very_high" || riskLevel === "high") {
      recommendations.push(
        "🩸 Realízate una prueba de VIH y otras ITS lo antes posible (en los próximos días).",
      );
    } else if (riskLevel === "moderate") {
      recommendations.push(
        "🩸 Considera hacerte una prueba de VIH en los próximos 1 a 3 meses.",
      );
    } else if (
      riskLevel === "low" &&
      (lastTest === "never" || lastTest === ">12m")
    ) {
      recommendations.push(
        "🩸 Si nunca te has hecho la prueba o pasó más de un año, es buen momento para hacerla.",
      );
    }
  } else if (
    lastTest === "<3m" &&
    (riskLevel === "low" || riskLevel === "moderate")
  ) {
    recommendations.push(
      "✅ Tu última prueba de VIH fue reciente (<3 meses). No es necesario repetirla ahora, pero mantén las conductas seguras.",
    );
  }

  // Recomendaciones de prevención según nivel
  if (riskLevel === "high" || riskLevel === "very_high") {
    recommendations.push(
      "🛡️ Evalúa la PrEP con un profesional de salud (es altamente efectiva).",
    );
    if (prep === "dont_know") {
      recommendations.push(
        "❓ La PrEP es una pastilla diaria que previene el VIH. Pregunta a tu médico.",
      );
    }
    // PEP solo si exposición reciente (no siempre, pero se puede mencionar condicional)
    const recentExposure =
      (recentContact === "yes" && contactWithHiv && !partnerUndetectable) ||
      (injected === "yes" && injectedPoints >= 4);
    if (recentExposure) {
      recommendations.push(
        "⏱️ Si tuviste una exposición de alto riesgo en las últimas 72 horas, consulta por PEP.",
      );
    }
  } else if (riskLevel === "moderate") {
    recommendations.push(
      "🔁 Refuerza el uso correcto del condón, especialmente si tienes múltiples parejas.",
    );
    if (prep !== "yes" && (isMSM || totalPartners >= 3)) {
      recommendations.push(
        "💬 Habla con un profesional sobre la PrEP como prevención adicional.",
      );
    }
  } else {
    recommendations.push(
      "✅ Mantén el uso de condón o la exclusividad con pruebas recientes si tienes pareja estable.",
    );
    recommendations.push(
      "📚 Infórmate sobre síntomas de ITS y consulta si aparecen.",
    );
  }

  // Recomendaciones específicas por síntomas
  if (asString(getAnswer(answers, "q4_symptoms")) === "yes") {
    recommendations.unshift(
      "🔴 Presentas síntomas compatibles con ITS. ¡Acude a un centro de salud de inmediato!",
    );
  }

  // Recomendaciones por pareja con VIH
  if (partnerHiv === "yes_unknown") {
    recommendations.push(
      "👥 Si tu pareja tiene VIH, es fundamental que reciba tratamiento. Usa condón o PrEP mientras no sea indetectable.",
    );
  } else if (
    partnerHiv === "yes_undetectable" &&
    totalPartners === 1 &&
    worstRawCondom === 3
  ) {
    recommendations.push(
      "ℹ️ Tu pareja con VIH es indetectable (I=I). No hay riesgo de transmisión, incluso sin condón. Sigue con sus controles médicos.",
    );
  }

  // Recomendaciones por drogas inyectables
  if (injected === "yes" && injectedPoints >= 3) {
    recommendations.push(
      "💉 No compartas jeringas. Existen programas de reducción de daños en Manizales (Profamilia, Secretaría de Salud).",
    );
  }

  // Eliminar duplicados (por si acaso)
  const uniqueRecommendations = [
    ...new Map(recommendations.map((r) => [r, r])).values(),
  ];

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
    recommendations: uniqueRecommendations,
    factors,
    domainScores,
    ageRange,
  };
}

export { QUESTION_MAP };
