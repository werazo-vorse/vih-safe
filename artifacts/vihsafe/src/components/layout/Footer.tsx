import { Link } from "wouter";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-muted py-12 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start max-w-sm">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-4">
              <Shield className="h-6 w-6" />
              <span>VIHSafe Manizales</span>
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Un compañero de salud confiable y sin prejuicios para la evaluación temprana del riesgo de VIH y educación en Manizales, Colombia.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-4 text-foreground">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground text-center md:text-left">
              <li><Link href="/evaluacion" className="hover:text-primary transition-colors">Evaluación de Riesgo</Link></li>
              <li><Link href="/chatbot" className="hover:text-primary transition-colors">Chatbot IA</Link></li>
              <li><Link href="/educacion" className="hover:text-primary transition-colors">Módulos Educativos</Link></li>
              <li><Link href="/recursos" className="hover:text-primary transition-colors">Centros de Prueba Locales</Link></li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-semibold mb-4 text-foreground">Aviso Legal</h3>
            <p className="text-xs text-muted-foreground max-w-xs text-center md:text-left">
              Esta plataforma es únicamente para fines educativos y de evaluación preliminar. No reemplaza el consejo médico profesional, el diagnóstico ni las pruebas clínicas de laboratorio.
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} VIHSafe. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Desarrollado con ❤️ por Semillero SINGBIO - Manizales
          </p>
        </div>
      </div>
    </footer>
  );
}
