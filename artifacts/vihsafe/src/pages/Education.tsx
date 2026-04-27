import { Link } from "wouter";
import { useGetEducationModules } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Activity, TestTube, HeartPulse, Users, BookOpen, ArrowRight } from "lucide-react";

const getIcon = (name: string) => {
  switch (name) {
    case 'Shield': return Shield;
    case 'Activity': return Activity;
    case 'TestTube': return TestTube;
    case 'HeartPulse': return HeartPulse;
    case 'Users': return Users;
    default: return BookOpen;
  }
};

export default function Education() {
  const { data, isLoading } = useGetEducationModules();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const categoryColors: Record<string, string> = {
    prevention: "bg-emerald-100 text-emerald-800 border-emerald-200",
    transmission: "bg-orange-100 text-orange-800 border-orange-200",
    testing: "bg-blue-100 text-blue-800 border-blue-200",
    treatment: "bg-purple-100 text-purple-800 border-purple-200",
    stigma: "bg-pink-100 text-pink-800 border-pink-200",
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Aprende con hechos, no con miedo</h1>
        <p className="text-lg text-muted-foreground">
          Módulos cortos e interactivos para entender la prevención, la transmisión y romper estigmas sobre el VIH.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data?.modules.map((mod) => {
            const Icon = getIcon(mod.icon);
            const badgeClass = categoryColors[mod.category] || "bg-secondary text-secondary-foreground border-secondary";

            return (
              <motion.div key={mod.id} variants={item}>
                <Link href={`/educacion/${mod.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className={badgeClass}>
                          {mod.category}
                        </Badge>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                      <p className="text-muted-foreground text-sm flex-grow mb-6 line-clamp-3">
                        {mod.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t">
                        <span className="flex items-center text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1.5" />
                          {mod.durationMinutes} min
                        </span>
                        <span className="flex items-center font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                          Leer más <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
