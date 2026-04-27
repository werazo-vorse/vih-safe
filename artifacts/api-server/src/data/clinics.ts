export type Clinic = {
  id: string;
  name: string;
  address: string;
  phone: string;
  services: string[];
  hours: string;
  free: boolean;
};

export const CLINICS: Clinic[] = [
  {
    id: "assbasalud",
    name: "Assbasalud E.S.E. — Sede Central",
    address: "Calle 19 No. 21-44, Manizales",
    phone: "+57 606 879 7777",
    services: ["Prueba rápida de VIH", "Asesoría pre y post prueba", "Detección de ITS"],
    hours: "Lunes a viernes, 7:00 AM – 5:00 PM",
    free: true,
  },
  {
    id: "secretaria-salud",
    name: "Secretaría de Salud Pública de Manizales",
    address: "Carrera 22 No. 18-69, Manizales",
    phone: "+57 606 879 7700",
    services: ["Prueba gratuita de VIH", "Programas de prevención", "Distribución de preservativos"],
    hours: "Lunes a viernes, 8:00 AM – 4:00 PM",
    free: true,
  },
  {
    id: "profamilia-manizales",
    name: "Profamilia Manizales",
    address: "Carrera 23 No. 62-16, Manizales",
    phone: "+57 606 885 5800",
    services: ["Prueba de VIH y ITS", "Anticoncepción", "PrEP y PEP", "Asesoría confidencial"],
    hours: "Lunes a sábado, 8:00 AM – 6:00 PM",
    free: false,
  },
  {
    id: "hospital-de-caldas",
    name: "Hospital Departamental Universitario Santa Sofía",
    address: "Calle 18 No. 21-71, Manizales",
    phone: "+57 606 887 9300",
    services: ["Prueba de VIH", "Atención integral a personas con VIH", "PEP de urgencia"],
    hours: "24 horas",
    free: true,
  },
  {
    id: "cruz-roja",
    name: "Cruz Roja Colombiana — Seccional Caldas",
    address: "Avenida Santander No. 60-37, Manizales",
    phone: "+57 606 884 2901",
    services: ["Prueba rápida de VIH", "Educación en salud sexual"],
    hours: "Lunes a viernes, 8:00 AM – 12:00 PM y 2:00 PM – 5:00 PM",
    free: true,
  },
];
