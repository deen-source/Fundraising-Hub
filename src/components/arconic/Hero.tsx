import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle } from 'lucide-react';

interface HeroProps {
  title: string;
  subhead: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export const Hero = ({ title, subhead, onPrimary, onSecondary }: HeroProps) => {
  return (
    <header className="mb-12 md:mb-16 text-center mx-auto">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 md:mb-6">
        {title}
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
        {subhead}
      </p>
    </header>
  );
};
