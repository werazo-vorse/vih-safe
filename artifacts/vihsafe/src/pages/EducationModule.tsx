import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetEducationModule, useSubmitQuiz } from "@workspace/api-client-react";
import { getGetEducationModuleQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";
import type { QuizResult } from "@workspace/api-client-react";

function FactCard({ fact }: { fact: any }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 h-[220px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <Card className="absolute w-full h-full backface-hidden border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
            <div className="text-sm font-semibold tracking-wider text-muted-foreground mb-4 uppercase">¿Mito o Verdad?</div>
            <p className="text-lg font-medium">{fact.statement}</p>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              Toca para revelar <RotateCcw className="w-3 h-3 ml-1" />
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <Card className="absolute w-full h-full backface-hidden border-2 rotate-y-180" style={{ borderColor: fact.isMyth ? 'hsl(var(--destructive)/0.5)' : 'hsl(var(--primary)/0.5)' }}>
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center overflow-y-auto">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mb-3 ${fact.isMyth ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {fact.isMyth ? 'Mito' : 'Verdad'}
            </div>
            <p className="text-sm text-muted-foreground">{fact.explanation}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function EducationModule() {
  const params = useParams();
  const moduleId = params.moduleId as string;

  const { data: module, isLoading } = useGetEducationModule(moduleId, {
    query: { enabled: !!moduleId, queryKey: getGetEducationModuleQueryKey(moduleId) }
  });

  const submitQuiz = useSubmitQuiz();
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-20 text-center">Cargando módulo...</div>;
  }

  if (!module) {
    return <div className="container mx-auto px-4 py-20 text-center">Módulo no encontrado.</div>;
  }

  const handleQuizSubmit = async () => {
    const answersArray = Object.entries(quizAnswers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    try {
      const result = await submitQuiz.mutateAsync({
        data: {
          moduleId,
          answers: answersArray
        }
      });
      setQuizResult(result);
    } catch (e) {
      console.error(e);
    }
  };

  const allQuestionsAnswered = module.quiz?.length > 0 && Object.keys(quizAnswers).length === module.quiz.length;

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header */}
      <header className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/educacion">
            <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Módulos
            </Button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{module.title}</h1>
          <p className="text-xl text-muted-foreground">{module.description}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-4xl py-12 space-y-16">
        
        {/* Sections */}
        <section className="space-y-12">
          {module.sections.map((section, idx) => (
            <div key={idx} className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {section.body}
              </div>
            </div>
          ))}
        </section>

        {/* Facts / Myths */}
        {module.facts && module.facts.length > 0 && (
          <section className="pt-8 border-t">
            <h2 className="text-2xl font-bold mb-8 text-center">Mitos vs Verdades</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {module.facts.map((fact, idx) => (
                <FactCard key={idx} fact={fact} />
              ))}
            </div>
          </section>
        )}

        {/* Quiz */}
        {module.quiz && module.quiz.length > 0 && (
          <section className="pt-12 border-t mt-12">
            <div className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold mb-2">Comprueba lo que aprendiste</h2>
                <p className="text-muted-foreground">Responde estas rápidas preguntas para evaluar tu comprensión.</p>
              </div>

              {!quizResult ? (
                <div className="space-y-10">
                  {module.quiz.map((q, qIdx) => (
                    <div key={q.id}>
                      <h3 className="font-medium text-lg mb-4">{qIdx + 1}. {q.prompt}</h3>
                      <RadioGroup 
                        value={quizAnswers[q.id]?.toString()} 
                        onValueChange={(val) => setQuizAnswers(prev => ({...prev, [q.id]: parseInt(val)}))}
                        className="space-y-3"
                      >
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <RadioGroupItem value={optIdx.toString()} id={`${q.id}-${optIdx}`} className="peer sr-only" />
                            <Label
                              htmlFor={`${q.id}-${optIdx}`}
                              className="flex flex-1 items-center rounded-xl border p-4 hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer font-normal text-base transition-colors"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  <div className="pt-6 border-t flex justify-end">
                    <Button 
                      size="lg" 
                      onClick={handleQuizSubmit} 
                      disabled={!allQuestionsAnswered || submitQuiz.isPending}
                    >
                      {submitQuiz.isPending ? "Calificando..." : "Revisar Respuestas"}
                    </Button>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-8"
                  >
                    <div className={`p-6 rounded-xl border text-center ${quizResult.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="text-4xl font-bold mb-2">
                        {quizResult.score} / {quizResult.total}
                      </div>
                      <div className="font-medium">
                        {quizResult.passed ? '¡Excelente trabajo! Has comprendido los conceptos clave.' : 'Buen intento. Revisa las explicaciones abajo para fortalecer tu conocimiento.'}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {module.quiz.map((q) => {
                        const feedback = quizResult.feedback.find(f => f.questionId === q.id);
                        if (!feedback) return null;
                        
                        return (
                          <div key={q.id} className="border-l-4 pl-4" style={{ borderColor: feedback.correct ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                            <h3 className="font-medium mb-2">{q.prompt}</h3>
                            <div className="flex items-start mb-3">
                              {feedback.correct ? (
                                <CheckCircle2 className="w-5 h-5 text-primary mr-2 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-destructive mr-2 shrink-0 mt-0.5" />
                              )}
                              <span className="text-muted-foreground">
                                Respuesta correcta: <span className="font-medium text-foreground">{q.options[q.correctOption]}</span>
                              </span>
                            </div>
                            {feedback.explanation && (
                              <div className="bg-muted p-4 rounded-lg text-sm">
                                {feedback.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-6 flex justify-center">
                      <Link href="/educacion">
                        <Button variant="outline">
                          Volver a Módulos
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
