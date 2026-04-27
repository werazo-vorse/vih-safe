import { useGetClinics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Clinics() {
  const { data, isLoading } = useGetClinics();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Centros de Prueba en Manizales</h1>
        <p className="text-lg text-muted-foreground">
          Encuentra lugares seguros y confiables para realizarte la prueba de VIH y recibir asesoría presencial en nuestra ciudad.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-10">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4">
          <AlertCircle className="w-6 h-6 text-primary shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-primary-foreground/90 mb-1">Importante</p>
            <p className="text-muted-foreground">
              La mayoría de EPS están obligadas a realizar la prueba de VIH de forma gratuita si la solicitas. Los lugares listados a continuación ofrecen servicios adicionales especializados o atención sin barreras administrativas.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {data?.clinics.map((clinic) => (
            <Card key={clinic.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="md:flex">
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-foreground">{clinic.name}</h2>
                    {clinic.free && (
                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 ml-2 shrink-0">
                        Gratuito
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start text-muted-foreground">
                      <MapPin className="w-5 h-5 mr-3 shrink-0 text-muted-foreground/50" />
                      <span>{clinic.address}</span>
                    </div>
                    <div className="flex items-start text-muted-foreground">
                      <Clock className="w-5 h-5 mr-3 shrink-0 text-muted-foreground/50" />
                      <span>{clinic.hours}</span>
                    </div>
                    <div className="flex items-start text-muted-foreground">
                      <Phone className="w-5 h-5 mr-3 shrink-0 text-muted-foreground/50" />
                      <a href={`tel:${clinic.phone.replace(/\D/g,'')}`} className="hover:text-primary hover:underline">
                        {clinic.phone}
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {clinic.services.map((service, idx) => (
                      <Badge key={idx} variant="secondary" className="font-normal bg-secondary/50">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/30 md:w-1/3 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l">
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    Recomendamos llamar antes para confirmar disponibilidad y requisitos.
                  </p>
                  <Button asChild className="w-full">
                    <a href={`tel:${clinic.phone.replace(/\D/g,'')}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar ahora
                    </a>
                  </Button>
                  <Button variant="outline" asChild className="w-full mt-2">
                     <a href={`https://maps.google.com/?q=${encodeURIComponent(clinic.name + " Manizales")}`} target="_blank" rel="noopener noreferrer">
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver en mapa
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {(!data?.clinics || data.clinics.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron centros de prueba en este momento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
