import type { Question } from "../data/questions.js";
import { QUESTIONS } from "../data/questions.js";

type AnswerValue = string | number | string[];

export type Answer = { questionId: string; value: AnswerValue };

export type DomainScore = { domain: string; score: number; maxScore: number };
export type RiskFactor = { label: string; severity: "low" | "moderate" | "high" };

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

function getAnswer(answers: Answer[], questionId: string): AnswerValue | undefined {
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

  // q1 age — used only for ageRange and minor weighting
  const age = asString(getAnswer(answers, "q1_age"));
  const ageRange = age || "no_reportada";
  let demoScore = 0;
  if (age === "18-24" || age === "25-34") demoScore += 1;
  add("demographic", demoScore, 2);

  // q5 partner genders
  const partners = asArray(getAnswer(answers, "q5_partner_genders"));
  const hasSex = partners.length > 0 && !partners.includes("none");

  // q3 gender + q5 — MSM
  const gender = asString(getAnswer(answers, "q3_gender"));
  const isMale = gender === "man" || gender === "trans_woman";
  const isMSM = isMale && partners.includes("men");
  if (isMSM) {
    factors.push({
      label: "Relaciones sexuales entre hombres (HSH) — categoría con mayor incidencia en Colombia",
      severity: "high",
    });
    add("behavioral", 3, 3);
  }

  // q6 partner count
  const partnerCount = asString(getAnswer(answers, "q6_partners_count"));
  let pcScore = 0;
  if (partnerCount === "2-5") pcScore = 1;
  else if (partnerCount === "6-10") pcScore = 2;
  else if (partnerCount === "11+") pcScore = 3;
  if (pcScore >= 2)
    factors.push({
      label: "Múltiples parejas sexuales en los últimos 12 meses",
      severity: pcScore === 3 ? "high" : "moderate",
    });
  add("behavioral", pcScore, 3);

  // q7 condom with men, q8 with women
  const condomMen = asString(getAnswer(answers, "q7_condom_men"));
  const condomWomen = asString(getAnswer(answers, "q8_condom_women"));
  function condomScore(v: string): number {
    if (v === "never") return 3;
    if (v === "sometimes") return 2;
    if (v === "almost_always") return 1;
    return 0;
  }
  const cMen = condomScore(condomMen);
  const cWomen = condomScore(condomWomen);
  const cTotal = Math.max(cMen, cWomen);
  if (cTotal >= 2)
    factors.push({
      label: "Uso inconsistente de condón en los últimos 12 meses",
      severity: cTotal === 3 ? "high" : "moderate",
    });
  add("behavioral", cTotal, 3);

  // q9 anal sex
  const anal = asString(getAnswer(answers, "q9_anal_sex"));
  let analScore = 0;
  if (anal === "yes_receptive" || anal === "yes_both") analScore = 2;
  else if (anal === "yes_insertive") analScore = 1;
  if (analScore >= 2)
    factors.push({
      label: "Relaciones anales receptivas (mayor probabilidad biológica de transmisión)",
      severity: "moderate",
    });
  add("behavioral", analScore, 2);

  // q10 partner from high-prev country
  const partnerCountry = asString(getAnswer(answers, "q10_partner_country"));
  let epiScore = 0;
  if (partnerCountry === "yes") {
    epiScore += 2;
    factors.push({ label: "Pareja sexual de zona con alta prevalencia de VIH", severity: "moderate" });
  }
  // q11 sex abroad
  if (asString(getAnswer(answers, "q11_sex_abroad")) === "yes") {
    epiScore += 1;
  }
  // q12 received exchange
  if (asString(getAnswer(answers, "q12_exchange")) === "yes") {
    epiScore += 2;
    factors.push({ label: "Intercambio sexual por dinero, bienes o servicios", severity: "moderate" });
  }
  // q13 paid for sex
  if (asString(getAnswer(answers, "q13_paid_for_sex")) === "yes") {
    epiScore += 1;
  }
  // q14 IV drugs
  const iv = asString(getAnswer(answers, "q14_iv_drugs"));
  if (iv === "yes") {
    epiScore += 3;
    factors.push({ label: "Inyección de sustancias compartiendo agujas", severity: "high" });
  }
  add("epidemiological", epiScore, 9);

  // Clinical
  let clinScore = 0;
  // q15 PrEP — protective
  const prep = asString(getAnswer(answers, "q15_prep"));
  if (prep === "yes") {
    clinScore -= 2;
    factors.push({ label: "Uso de PrEP (factor protector contra VIH)", severity: "low" });
  } else if (prep === "sometimes") {
    clinScore -= 1;
  }
  // q16 prior STI
  const prior = asString(getAnswer(answers, "q16_prior_sti"));
  if (prior === "last_12m") {
    clinScore += 3;
    factors.push({ label: "ITS diagnosticada en el último año (facilita transmisión del VIH)", severity: "high" });
  } else if (prior === "more_than_12m") {
    clinScore += 1;
  }
  // q17 symptoms
  if (asString(getAnswer(answers, "q17_symptoms")) === "yes") {
    clinScore += 2;
    factors.push({ label: "Síntomas compatibles con ITS", severity: "moderate" });
  }
  // q18 partner with HIV
  const partnerHiv = asString(getAnswer(answers, "q18_partner_hiv"));
  if (partnerHiv === "yes_unknown") {
    clinScore += 4;
    factors.push({ label: "Pareja con VIH sin tratamiento o estado desconocido", severity: "high" });
  } else if (partnerHiv === "yes_undetectable") {
    clinScore += 0;
    factors.push({ label: "Pareja con VIH en tratamiento (carga indetectable, no transmisible)", severity: "low" });
  }
  // q19 last test
  const test = asString(getAnswer(answers, "q19_last_test"));
  if (test === "never") {
    clinScore += 1;
    factors.push({ label: "Nunca te has hecho la prueba de VIH", severity: "moderate" });
  } else if (test === ">12m" && hasSex) {
    clinScore += 1;
  }
  add("clinical", Math.max(0, clinScore), 10);

  const totalScore =
    domainTotals.demographic.score +
    domainTotals.behavioral.score +
    domainTotals.epidemiological.score +
    domainTotals.clinical.score;

  let riskLevel: ScoringResult["riskLevel"];
  let summary: string;
  let recommendations: string[];

  if (totalScore <= 2) {
    riskLevel = "low";
    summary =
      "Tu nivel de riesgo estimado es BAJO. Las prácticas que reportaste se asocian con baja probabilidad de exposición al VIH.";
    recommendations = [
      "Mantén el uso de condón en todas tus relaciones sexuales.",
      "Realízate una prueba de VIH al menos una vez al año si tienes vida sexual activa.",
      "Conoce y reconoce los síntomas de ITS y consulta si aparecen.",
    ];
  } else if (totalScore <= 5) {
    riskLevel = "moderate";
    summary =
      "Tu nivel de riesgo estimado es MODERADO. Identificamos algunas situaciones que conviene atender de forma preventiva.";
    recommendations = [
      "Realízate una prueba de VIH y de otras ITS en los próximos 1 a 3 meses.",
      "Refuerza el uso correcto y consistente del condón.",
      "Conversa con un profesional de salud sobre la PrEP como medida preventiva.",
    ];
  } else if (totalScore <= 9) {
    riskLevel = "high";
    summary =
      "Tu nivel de riesgo estimado es ALTO. Es muy importante que actúes pronto para cuidar tu salud.";
    recommendations = [
      "Acude a un centro de salud en Manizales para una prueba de VIH y de otras ITS lo antes posible.",
      "Pregunta a tu médico/a por la PrEP — es altamente eficaz para prevenir el VIH.",
      "Si tu pareja vive con VIH y no está en tratamiento, evalúa también la PEP en caso de exposición reciente.",
    ];
  } else {
    riskLevel = "very_high";
    summary =
      "Tu nivel de riesgo estimado es MUY ALTO. Te recomendamos hacer una prueba de VIH cuanto antes y conversar con un profesional de salud.";
    recommendations = [
      "Realízate una prueba de VIH en los próximos días — muchas son gratuitas en Manizales.",
      "Si tuviste una exposición de riesgo en las últimas 72 horas, consulta urgentemente por PEP (profilaxis post-exposición).",
      "Considera iniciar PrEP como estrategia preventiva continua.",
      "Recuerda: el diagnóstico temprano permite vivir con VIH una vida plena y saludable.",
    ];
  }

  const domainScores: DomainScore[] = [
    { domain: "Conductual", score: domainTotals.behavioral.score, maxScore: domainTotals.behavioral.max },
    { domain: "Epidemiológico", score: domainTotals.epidemiological.score, maxScore: domainTotals.epidemiological.max },
    { domain: "Clínico", score: domainTotals.clinical.score, maxScore: domainTotals.clinical.max },
    { domain: "Demográfico", score: domainTotals.demographic.score, maxScore: domainTotals.demographic.max },
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
