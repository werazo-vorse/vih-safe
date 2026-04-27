export type EducationModule = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: "prevention" | "transmission" | "testing" | "treatment" | "stigma";
  icon: string;
};

export type EducationSection = { heading: string; body: string };
export type EducationFact = { statement: string; isMyth: boolean; explanation?: string };
export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOption: number;
  explanation?: string;
};

export type EducationModuleDetail = EducationModule & {
  sections: EducationSection[];
  facts: EducationFact[];
  quiz: QuizQuestion[];
};

export const EDUCATION_MODULES: EducationModuleDetail[] = [
  {
    id: "transmision",
    title: "Cómo se transmite (y cómo no se transmite) el VIH",
    description:
      "Aprende cuáles son las verdaderas vías de transmisión del VIH y derriba los mitos más comunes que aún persisten.",
    durationMinutes: 6,
    category: "transmission",
    icon: "Activity",
    sections: [
      {
        heading: "¿Qué es el VIH?",
        body: "El Virus de Inmunodeficiencia Humana (VIH) es un virus que afecta el sistema inmunológico, debilitándolo progresivamente si no recibe tratamiento. Cuando el sistema inmune se deteriora gravemente, hablamos de SIDA (Síndrome de Inmunodeficiencia Adquirida). Hoy, gracias al tratamiento antirretroviral, una persona con VIH puede vivir una vida larga y saludable.",
      },
      {
        heading: "Vías reales de transmisión",
        body: "El VIH se transmite a través de fluidos corporales específicos: sangre, semen, fluidos vaginales y leche materna. Las principales formas son: relaciones sexuales (anales, vaginales u orales) sin condón, compartir agujas o jeringas y de madre a hijo durante el embarazo, parto o lactancia (cuando no hay tratamiento).",
      },
      {
        heading: "Cómo NO se transmite",
        body: "El VIH NO se transmite por abrazos, besos, dar la mano, compartir cubiertos o vasos, picaduras de mosquitos, lágrimas, sudor, ni por usar el mismo baño. Convivir con una persona con VIH es completamente seguro.",
      },
    ],
    facts: [
      {
        statement: "Puedo contagiarme de VIH al compartir un vaso con alguien que vive con VIH.",
        isMyth: true,
        explanation: "El VIH no se transmite por saliva, ni por compartir utensilios. Es completamente seguro.",
      },
      {
        statement: "Una persona con VIH en tratamiento y carga viral indetectable no transmite el virus sexualmente.",
        isMyth: false,
        explanation: "Esto se conoce como I=I (Indetectable = Intransmisible) y está respaldado por evidencia científica internacional.",
      },
      {
        statement: "Los mosquitos pueden transmitir el VIH.",
        isMyth: true,
        explanation: "El VIH no sobrevive ni se replica dentro de los mosquitos. No hay registro de transmisión por picaduras.",
      },
    ],
    quiz: [
      {
        id: "t1",
        prompt: "¿Cuál de las siguientes NO es una vía de transmisión del VIH?",
        options: ["Relaciones sexuales sin condón", "Compartir agujas", "Compartir cubiertos", "De madre a hijo sin tratamiento"],
        correctOption: 2,
        explanation: "El VIH no se transmite por compartir cubiertos ni por contacto cotidiano.",
      },
      {
        id: "t2",
        prompt: "¿Qué significa 'I=I'?",
        options: [
          "Indetectable = Intransmisible",
          "Inmunidad = Infección",
          "Inyectable = Inhalable",
          "Indeterminado = Inicial",
        ],
        correctOption: 0,
        explanation: "Una persona con VIH y carga viral indetectable no transmite el virus por vía sexual.",
      },
    ],
  },
  {
    id: "prevencion",
    title: "Prevención: condón, PrEP y PEP",
    description: "Conoce las herramientas modernas y eficaces para prevenir la transmisión del VIH.",
    durationMinutes: 7,
    category: "prevention",
    icon: "Shield",
    sections: [
      {
        heading: "El condón sigue siendo clave",
        body: "El uso correcto y consistente del condón en todas las relaciones sexuales (anales, vaginales y orales) reduce drásticamente el riesgo de VIH y otras ITS. En Colombia, los condones se distribuyen gratuitamente en muchos centros de salud.",
      },
      {
        heading: "PrEP: profilaxis pre-exposición",
        body: "La PrEP es un medicamento (generalmente una pastilla diaria) que toman personas VIH-negativas para prevenir la infección antes de exponerse. Tiene una eficacia superior al 99% cuando se toma correctamente. Está disponible en Colombia para poblaciones de mayor riesgo.",
      },
      {
        heading: "PEP: profilaxis post-exposición",
        body: "Si tuviste una exposición de riesgo (relación sexual sin protección con alguien con estado desconocido, agresión sexual, accidente con aguja), la PEP es un tratamiento de 28 días que debe iniciarse en las primeras 72 horas. Es una emergencia médica.",
      },
    ],
    facts: [
      {
        statement: "La PrEP es un tratamiento para personas que ya tienen VIH.",
        isMyth: true,
        explanation: "La PrEP es para personas SIN VIH que quieren prevenir la infección. El tratamiento para VIH es la TAR (terapia antirretroviral).",
      },
      {
        statement: "Si me expuse al VIH hoy, puedo tomar PEP en los próximos 3 días para reducir el riesgo.",
        isMyth: false,
        explanation: "Sí, la PEP es eficaz si se inicia dentro de las primeras 72 horas tras la exposición.",
      },
      {
        statement: "El condón también protege contra otras ITS, no solo contra el VIH.",
        isMyth: false,
        explanation: "El condón previene también gonorrea, clamidia, sífilis y reduce el riesgo de herpes y VPH.",
      },
    ],
    quiz: [
      {
        id: "p1",
        prompt: "La PrEP es eficaz cuando:",
        options: [
          "Se toma después de una exposición",
          "Se toma de forma consistente, antes de exposiciones",
          "Solo si la pareja tiene VIH",
          "Solo en hombres",
        ],
        correctOption: 1,
        explanation: "La PrEP requiere uso consistente para alcanzar su eficacia mayor al 99%.",
      },
      {
        id: "p2",
        prompt: "¿Cuál es la ventana de tiempo para iniciar la PEP tras una exposición de riesgo?",
        options: ["Hasta 72 horas", "Hasta 7 días", "Hasta 1 mes", "No hay ventana"],
        correctOption: 0,
        explanation: "La PEP debe iniciarse en las primeras 72 horas; cuanto antes, mejor.",
      },
    ],
  },
  {
    id: "prueba",
    title: "Hacerse la prueba: por qué, cuándo y dónde",
    description: "La prueba de VIH es rápida, confidencial y muchas veces gratuita. Aquí te contamos lo esencial.",
    durationMinutes: 5,
    category: "testing",
    icon: "TestTube",
    sections: [
      {
        heading: "¿Por qué hacerse la prueba?",
        body: "Conocer tu estado de VIH es un acto de cuidado contigo y con tus parejas. El diagnóstico temprano permite iniciar tratamiento a tiempo y vivir con buena calidad de vida. Además, sabiendo tu estado puedes tomar decisiones informadas sobre prevención.",
      },
      {
        heading: "Tipos de pruebas",
        body: "Existen pruebas rápidas (resultado en 15-30 minutos a partir de una gota de sangre o saliva) y pruebas convencionales (sangre venosa, resultado en 1-3 días). Una prueba positiva siempre se confirma con una prueba adicional antes del diagnóstico definitivo.",
      },
      {
        heading: "Frecuencia recomendada",
        body: "Si tienes vida sexual activa, hazte la prueba al menos una vez al año. Si perteneces a una población de mayor exposición (HSH, personas trans, trabajadoras sexuales) o tuviste una exposición de riesgo, hazla cada 3 a 6 meses.",
      },
    ],
    facts: [
      {
        statement: "El resultado de la prueba siempre es confidencial por ley en Colombia.",
        isMyth: false,
        explanation: "La Ley 972 de 2005 protege la confidencialidad del diagnóstico y prohíbe la discriminación.",
      },
      {
        statement: "Si la prueba sale negativa, ya no necesito repetirla nunca más.",
        isMyth: true,
        explanation: "El estado puede cambiar tras nuevas exposiciones. Repite la prueba periódicamente si tienes vida sexual activa.",
      },
    ],
    quiz: [
      {
        id: "test1",
        prompt: "Una prueba rápida de VIH:",
        options: [
          "Da el resultado en menos de 30 minutos",
          "Tarda una semana",
          "Solo se hace en hospitales privados",
          "Es dolorosa y peligrosa",
        ],
        correctOption: 0,
        explanation: "Las pruebas rápidas dan resultado en 15-30 minutos.",
      },
    ],
  },
  {
    id: "vivir-con-vih",
    title: "Vivir con VIH hoy: tratamiento y calidad de vida",
    description: "El VIH ya no es una sentencia. Conoce cómo es vivir con VIH en 2026.",
    durationMinutes: 6,
    category: "treatment",
    icon: "HeartPulse",
    sections: [
      {
        heading: "Tratamiento antirretroviral (TAR)",
        body: "El TAR es un esquema de medicamentos que mantiene el VIH controlado. La mayoría de las personas hoy toman una sola pastilla al día. Cuando el tratamiento es exitoso, la carga viral se vuelve indetectable, lo que significa que la persona no transmite el virus sexualmente.",
      },
      {
        heading: "Esperanza de vida",
        body: "Una persona que inicia tratamiento a tiempo puede tener una expectativa de vida similar a la de una persona sin VIH. El acceso al TAR está garantizado por el sistema de salud colombiano.",
      },
      {
        heading: "Salud mental y red de apoyo",
        body: "Recibir un diagnóstico de VIH puede ser difícil emocionalmente. En Manizales y en Colombia hay grupos de apoyo, organizaciones comunitarias y profesionales de salud mental especializados.",
      },
    ],
    facts: [
      {
        statement: "Una persona con VIH en tratamiento puede tener hijos sin transmitirles el virus.",
        isMyth: false,
        explanation: "Con tratamiento adecuado y seguimiento médico, la transmisión madre-hijo se previene en más del 99% de los casos.",
      },
      {
        statement: "Las personas con VIH no pueden tener relaciones sexuales sin riesgo.",
        isMyth: true,
        explanation: "Con carga viral indetectable, no hay transmisión sexual del VIH.",
      },
    ],
    quiz: [
      {
        id: "v1",
        prompt: "El TAR (terapia antirretroviral) sirve para:",
        options: [
          "Curar el VIH",
          "Mantener controlado el VIH y volverlo indetectable",
          "Prevenir el contagio antes de la exposición",
          "Diagnosticar el VIH",
        ],
        correctOption: 1,
        explanation: "El TAR no cura, pero permite a la persona vivir con buena salud y no transmitir el virus.",
      },
    ],
  },
  {
    id: "estigma",
    title: "Estigma y discriminación: lo que debes saber",
    description: "El estigma sigue siendo una de las mayores barreras para la prevención y el tratamiento del VIH.",
    durationMinutes: 5,
    category: "stigma",
    icon: "Users",
    sections: [
      {
        heading: "¿Qué es el estigma asociado al VIH?",
        body: "El estigma es el conjunto de prejuicios, creencias erróneas y actitudes negativas hacia las personas con VIH. La discriminación es cuando esos prejuicios se traducen en actos: rechazo laboral, exclusión social, violencia o trato desigual en servicios de salud.",
      },
      {
        heading: "Por qué importa",
        body: "El miedo al estigma hace que muchas personas no se hagan la prueba ni accedan a tratamiento, lo que aumenta la transmisión y empeora la salud de quienes viven con VIH. Combatir el estigma es parte fundamental de la prevención.",
      },
      {
        heading: "Tus derechos en Colombia",
        body: "La Ley 972 de 2005 prohíbe cualquier forma de discriminación por VIH en Colombia. Ninguna persona puede ser despedida, expulsada de un servicio o tratada de forma diferente por su estado serológico.",
      },
    ],
    facts: [
      {
        statement: "Un empleador puede pedirme una prueba de VIH como requisito para contratarme.",
        isMyth: true,
        explanation: "En Colombia es ilegal exigir pruebas de VIH como requisito laboral. La Ley 972 lo prohíbe.",
      },
      {
        statement: "Hablar abiertamente sobre VIH ayuda a reducir el estigma.",
        isMyth: false,
        explanation: "La información clara y libre de juicios es la principal herramienta contra el estigma.",
      },
    ],
    quiz: [
      {
        id: "e1",
        prompt: "En Colombia, exigir una prueba de VIH como requisito laboral es:",
        options: ["Permitido", "Obligatorio", "Ilegal", "Recomendado"],
        correctOption: 2,
        explanation: "La Ley 972 de 2005 lo prohíbe explícitamente.",
      },
    ],
  },
];
