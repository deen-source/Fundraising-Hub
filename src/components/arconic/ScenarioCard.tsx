import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioCardProps {
  id: string;
  title: string;
  duration: string;
  imageSrc: string;
  description: string;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ScenarioCard = ({
  id,
  title,
  duration,
  imageSrc,
  description,
  selected,
  onSelect,
}: ScenarioCardProps) => {
  const handleClick = () => {
    onSelect(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative cursor-pointer transition-all duration-300 overflow-hidden rounded-xl',
        'border-[#E5E7EB] hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected && 'border-primary border-2 bg-primary/5',
        'motion-safe:transition-transform motion-reduce:transition-none'
      )}
    >
      {/* Selection indicator - top right */}
      {selected && (
        <div className="absolute top-3 right-3 z-10 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-primary-foreground" aria-hidden="true" />
        </div>
      )}

      <div className="p-6">
        {/* Image container - square with overlay */}
        <div className="relative mb-4 aspect-square w-20 h-20 mx-auto">
          <div className="w-full h-full rounded-lg overflow-hidden ring-1 ring-gray-200 transition-all">
            <div className="relative w-full h-full">
              <img
                src={imageSrc}
                alt={`${title} scenario`}
                className="w-full h-full object-cover saturate-50 opacity-90"
                loading="lazy"
                srcSet={`${imageSrc} 1x, ${imageSrc.replace('.', '@2x.')} 2x`}
              />
              <div className="absolute inset-0 bg-primary/5" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg text-foreground transition-colors">
            {title}
          </h3>

          {/* Duration badge - low contrast */}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/70">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span className="leading-none">{duration}</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed pt-1">
            {description}
          </p>
        </div>
      </div>

      {/* Screen reader text */}
      <span className="sr-only">
        {selected ? 'Selected' : 'Not selected'}. Press Enter or Space to select.
      </span>
    </Card>
  );
};
