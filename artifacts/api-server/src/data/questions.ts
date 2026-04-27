export type Question = {
  id: string;
  order: number;
  text: string;
  helpText?: string;
  type: "single" | "multi" | "number" | "country";
  domain: "demographic" | "behavioral" | "epidemiological" | "clinical";
  conditional: boolean;
  showIf?: { questionId: string; equals: string[] };
  options?: { value: string; label: string }[];
  defaultValue?: string;
};

const FREQ = [
  { value: "always", label: "Siempre" },
  { value: "almost_always", label: "Casi siempre" },
  { value: "sometimes", label: "A veces" },
  { value: "never", label: "Nunca" },
  { value: "na", label: "No aplica" },
];

const COUNT_OPTS = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2-5", label: "2 a 5" },
  { value: "6-10", label: "6 a 10" },
  { value: "11+", label: "Más de 10" },
];

export const QUESTIONS: Question[] = [
  {
    id: "q1_age",
    order: 1,
    text: "¿Cuál es tu edad?",
    type: "single",
    domain: "demographic",
    conditional: false,
    options: [
      { value: "<18", label: "Menor de 18" },
      { value: "18-24", label: "18 a 24" },
      { value: "25-34", label: "25 a 34" },
      { value: "35-44", label: "35 a 44" },
      { value: "45+", label: "45 o más" },
    ],
  },
  {
    id: "q2_sex_at_birth",
    order: 2,
    text: "¿Cuál fue el sexo asignado al nacer?",
    type: "single",
    domain: "demographic",
    conditional: false,
    options: [
      { value: "male", label: "Masculino" },
      { value: "female", label: "Femenino" },
      { value: "intersex", label: "Intersexual" },
    ],
  },
  {
    id: "q3_gender",
    order: 3,
    text: "¿Con qué género te identificas actualmente?",
    type: "single",
    domain: "demographic",
    conditional: false,
    options: [
      { value: "man", label: "Hombre" },
      { value: "woman", label: "Mujer" },
      { value: "trans_woman", label: "Mujer trans" },
      { value: "trans_man", label: "Hombre trans" },
      { value: "non_binary", label: "No binarie" },
      { value: "other", label: "Prefiero no responder" },
    ],
  },
  {
    id: "q4_country",
    order: 4,
    text: "¿En qué país naciste?",
    helpText: "Esta información ayuda a identificar exposiciones epidemiológicas. Por defecto: Colombia.",
    type: "country",
    domain: "demographic",
    conditional: false,
    defaultValue: "Colombia",
  },
  {
    id: "q5_partner_genders",
    order: 5,
    text: "En los últimos 12 meses, ¿con qué géneros tuviste relaciones sexuales?",
    helpText: "Puedes seleccionar más de una opción.",
    type: "multi",
    domain: "behavioral",
    conditional: false,
    options: [
      { value: "men", label: "Hombres" },
      { value: "women", label: "Mujeres" },
      { value: "trans", label: "Personas trans" },
      { value: "none", label: "No tuve relaciones sexuales" },
    ],
  },
  {
    id: "q6_partners_count",
    order: 6,
    text: "En los últimos 12 meses, ¿con cuántas parejas sexuales diferentes tuviste relaciones?",
    type: "single",
    domain: "behavioral",
    conditional: true,
    showIf: { questionId: "q5_partner_genders", equals: ["men", "women", "trans"] },
    options: COUNT_OPTS,
  },
  {
    id: "q7_condom_men",
    order: 7,
    text: "En los últimos 12 meses, en tus relaciones sexuales (anales o vaginales) con hombres, ¿con qué frecuencia usaste condón?",
    type: "single",
    domain: "behavioral",
    conditional: true,
    showIf: { questionId: "q5_partner_genders", equals: ["men"] },
    options: FREQ,
  },
  {
    id: "q8_condom_women",
    order: 8,
    text: "En los últimos 12 meses, en tus relaciones sexuales vaginales con mujeres, ¿con qué frecuencia usaste condón?",
    type: "single",
    domain: "behavioral",
    conditional: true,
    showIf: { questionId: "q5_partner_genders", equals: ["women"] },
    options: FREQ,
  },
  {
    id: "q9_anal_sex",
    order: 9,
    text: "En los últimos 12 meses, ¿tuviste relaciones sexuales anales?",
    type: "single",
    domain: "behavioral",
    conditional: false,
    options: [
      { value: "yes_insertive", label: "Sí, como pareja activa (penetrante)" },
      { value: "yes_receptive", label: "Sí, como pareja receptiva" },
      { value: "yes_both", label: "Sí, ambos roles" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q10_partner_country",
    order: 10,
    text: "En los últimos 12 meses, ¿tuviste relaciones sexuales con alguien que viva o haya vivido recientemente en un país con alta prevalencia de VIH (por ejemplo: ciertas regiones de África subsahariana, el Caribe o Asia)?",
    type: "single",
    domain: "epidemiological",
    conditional: false,
    options: [
      { value: "yes", label: "Sí" },
      { value: "no", label: "No" },
      { value: "unsure", label: "No estoy seguro/a" },
    ],
  },
  {
    id: "q11_sex_abroad",
    order: 11,
    text: "En los últimos 12 meses, ¿tuviste relaciones sexuales fuera de Colombia?",
    type: "single",
    domain: "epidemiological",
    conditional: false,
    options: [
      { value: "yes", label: "Sí" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q12_exchange",
    order: 12,
    text: "En los últimos 12 meses, ¿has recibido dinero, bienes o servicios a cambio de tener relaciones sexuales?",
    helpText: "Esta pregunta busca entender exposiciones específicas. La información es totalmente confidencial.",
    type: "single",
    domain: "epidemiological",
    conditional: false,
    options: [
      { value: "yes", label: "Sí" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q13_paid_for_sex",
    order: 13,
    text: "En los últimos 12 meses, ¿has pagado dinero, bienes o servicios a cambio de tener relaciones sexuales?",
    type: "single",
    domain: "epidemiological",
    conditional: false,
    options: [
      { value: "yes", label: "Sí" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q14_iv_drugs",
    order: 14,
    text: "En los últimos 12 meses, ¿te has inyectado alguna sustancia (incluyendo drogas, hormonas o esteroides) compartiendo agujas o jeringas?",
    type: "single",
    domain: "epidemiological",
    conditional: false,
    options: [
      { value: "yes", label: "Sí" },
      { value: "no_own_needles", label: "Me inyecté pero usé material propio" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q15_prep",
    order: 15,
    text: "¿Estás usando actualmente PrEP (profilaxis pre-exposición para VIH)?",
    helpText: "La PrEP es un medicamento que se toma para prevenir el VIH antes de la exposición.",
    type: "single",
    domain: "clinical",
    conditional: false,
    options: [
      { value: "yes", label: "Sí, la tomo regularmente" },
      { value: "sometimes", label: "La tomo a veces" },
      { value: "no", label: "No" },
      { value: "dont_know", label: "No sé qué es" },
    ],
  },
  {
    id: "q16_prior_sti",
    order: 16,
    text: "¿Alguna vez te han diagnosticado una infección de transmisión sexual (sífilis, gonorrea, clamidia, herpes genital u otra)?",
    type: "single",
    domain: "clinical",
    conditional: false,
    options: [
      { value: "last_12m", label: "Sí, en los últimos 12 meses" },
      { value: "more_than_12m", label: "Sí, hace más de 12 meses" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "q17_symptoms",
    order: 17,
    text: "¿En las últimas semanas has tenido alguno de estos síntomas en tus genitales, ano o boca?",
    helpText: "Por ejemplo: ardor al orinar, flujo inusual, llagas, verrugas, dolor o picazón.",
    type: "single",
    domain: "clinical",
    conditional: true,
    showIf: { questionId: "q5_partner_genders", equals: ["men", "women", "trans"] },
    options: [
      { value: "yes", label: "Sí" },
      { value: "no", label: "No" },
      { value: "unsure", label: "No estoy seguro/a" },
    ],
  },
  {
    id: "q18_partner_hiv",
    order: 18,
    text: "¿Alguna de tus parejas sexuales en los últimos 12 meses vive con VIH?",
    type: "single",
    domain: "clinical",
    conditional: true,
    showIf: { questionId: "q5_partner_genders", equals: ["men", "women", "trans"] },
    options: [
      { value: "yes_undetectable", label: "Sí, y tiene carga viral indetectable" },
      { value: "yes_unknown", label: "Sí, no sé su estado de tratamiento" },
      { value: "no", label: "No" },
      { value: "dont_know", label: "No conozco el estado de mis parejas" },
    ],
  },
  {
    id: "q19_last_test",
    order: 19,
    text: "¿Cuándo fue tu última prueba de VIH?",
    type: "single",
    domain: "clinical",
    conditional: false,
    options: [
      { value: "<3m", label: "Hace menos de 3 meses" },
      { value: "3-12m", label: "Entre 3 y 12 meses" },
      { value: ">12m", label: "Hace más de 12 meses" },
      { value: "never", label: "Nunca me he hecho la prueba" },
    ],
  },
];
