import { StatsItem } from '@/types/arconic-simulator';
import { cn } from '@/lib/utils';

interface StatsStripProps {
  items: StatsItem[];
  className?: string;
}

export const StatsStrip = ({ items, className }: StatsStripProps) => {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'border-t border-b bg-muted/30 py-4',
        className
      )}
      role="region"
      aria-label="Statistics"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center space-y-1"
            >
              {item.icon && (
                <div className="text-primary mb-1" aria-hidden="true">
                  {item.icon}
                </div>
              )}
              <div className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {item.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
