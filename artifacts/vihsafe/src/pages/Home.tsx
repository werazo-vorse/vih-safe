import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Shield, 
  Activity, 
  MessageSquare, 
  BookOpen, 
  MapPin,
  ArrowRight,
  CheckCircle2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetStatsSummary } from "@workspace/api-client-react";

export default function Home() {
  const { data: stats } = useGetStatsSummary();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary/5 py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[length:32px_32px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center p-2 mb-8 rounded-full bg-primary/10 text-primary"
            >
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Tu salud, tu privacidad.</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
              {...fadeIn}
            >
              Conoce tu estado. <br/>
              <span className="text-primary">Toma el control.</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Un espacio seguro, anónimo y sin prejuicios para evaluar tu riesgo de VIH, aprender sobre prevención y encontrar centros de prueba en Manizales.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/evaluacion">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
                  Evaluar mi riesgo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/chatbot">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base">
                  Hablar con un experto IA
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-12 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.totalAssessments}+</div>
                <div className="text-sm text-muted-foreground">Evaluaciones Completadas</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.modulesCompleted}+</div>
                <div className="text-sm text-muted-foreground">Módulos Educativos Vistos</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary mb-2">{stats.chatMessages}+</div>
                <div className="text-sm text-muted-foreground">Consultas Resueltas</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Anónimo y Confidencial</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features/Pillars Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas saber</h2>
            <p className="text-muted-foreground text-lg">
              Diseñado específicamente para jóvenes universitarios de Manizales. Sin tabúes, solo respuestas claras y basadas en ciencia.
            </p>
          </div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Pillar 1 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Evaluación de Riesgo</h3>
              <p className="text-muted-foreground mb-6">
                Responde un cuestionario rápido y confidencial basado en guías clínicas internacionales adaptadas a nuestro contexto local.
              </p>
              <ul className="space-y-2 mb-6">
                {['Menos de 3 minutos', 'Resultados inmediatos', 'Recomendaciones personalizadas'].map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/evaluacion" className="inline-flex items-center text-primary font-medium hover:underline">
                Empezar evaluación <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="w-14 h-14 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chatbot IA</h3>
              <p className="text-muted-foreground mb-6">
                ¿Tienes dudas específicas? Nuestro asistente virtual está entrenado con información médica verificada para responder 24/7.
              </p>
              <ul className="space-y-2 mb-6">
                {['Respuestas al instante', 'Sin juicios', 'Disponible en todo momento'].map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-secondary-foreground mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/chatbot" className="inline-flex items-center text-secondary-foreground font-medium hover:underline">
                Hacer una pregunta <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div variants={fadeIn} className="bg-card p-8 rounded-2xl shadow-sm border">
              <div className="w-14 h-14 bg-chart-3/10 text-chart-3 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Educación Interactiva</h3>
              <p className="text-muted-foreground mb-6">
                Aprende a separar mitos de realidades sobre prevención, transmisión y tratamiento mediante módulos cortos y quizzes.
              </p>
              <ul className="space-y-2 mb-6">
                {['Mitos vs Realidades', 'Lecturas cortas', 'Ponte a prueba'].map((item, i) => (
                  <li key={i} className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-chart-3 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/educacion" className="inline-flex items-center text-chart-3 font-medium hover:underline">
                Explorar módulos <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Local Context Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="bg-primary text-primary-foreground rounded-3xl overflow-hidden shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="p-10 lg:p-16 flex flex-col justify-center">
                <div className="inline-flex items-center mb-6 opacity-80">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="font-medium tracking-wide uppercase text-sm">Enfoque Local</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-6">Hecho para la juventud de Manizales</h2>
                <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
                  Conectamos a la comunidad universitaria con recursos reales y accesibles en nuestra ciudad. Si necesitas una prueba presencial, te mostramos exactamente a dónde ir, sus horarios y si son gratuitos.
                </p>
                <div>
                  <Link href="/recursos">
                    <Button variant="secondary" size="lg" className="h-12 px-6">
                      Ver Centros de Prueba en Manizales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-primary-foreground/5 relative min-h-[300px] flex items-center justify-center p-10">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                <Users className="w-48 h-48 text-primary-foreground/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
