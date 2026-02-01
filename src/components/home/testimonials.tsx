import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

function Testimonial({ quote, author, role, rating }: TestimonialProps) {
  return (
    <Card className="h-full">
      <CardContent className="pt-6 pb-6 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Quote className="h-8 w-8 text-primary/20 mb-2" />
        <p className="text-muted-foreground flex-1 italic">{quote}</p>
        <div className="mt-4 pt-4 border-t">
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function Testimonials() {
  const testimonials: TestimonialProps[] = [
    {
      quote:
        "Une expérience incroyable ! Le groupe était parfait pour notre soirée. L'intimité d'un concert à la maison, c'est incomparable.",
      author: "Marie D.",
      role: "Organisatrice à Paris",
      rating: 5,
    },
    {
      quote:
        "Grâce à Concert Chaussettes, on a trouvé des dizaines de dates. Le contact direct avec les organisateurs change tout.",
      author: "Jazz Trio Parisien",
      role: "Groupe inscrit depuis 2024",
      rating: 5,
    },
    {
      quote:
        "Simple, efficace, et la jauge automatique m'évite de gérer les inscriptions à la main. Je recommande !",
      author: "Thomas L.",
      role: "Organisateur à Lyon",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez ce que nos utilisateurs pensent de Concert Chaussettes
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
