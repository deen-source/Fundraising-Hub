import { Scenario } from '@/types/arconic-simulator';
import { ScenarioCard } from './ScenarioCard';
import { useEffect, useRef } from 'react';

interface ScenariosGridProps {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ScenariosGrid = ({ scenarios, selectedId, onSelect }: ScenariosGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gridRef.current) return;

      const currentIndex = scenarios.findIndex(s => s.id === selectedId);
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < scenarios.length - 1 ? currentIndex + 1 : currentIndex;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Move down by calculating next row (depends on grid cols)
          const cols = window.innerWidth >= 1025 ? 4 : window.innerWidth >= 481 ? 2 : 1;
          nextIndex = Math.min(currentIndex + cols, scenarios.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Move up by calculating previous row
          const colsUp = window.innerWidth >= 1025 ? 4 : window.innerWidth >= 481 ? 2 : 1;
          nextIndex = Math.max(currentIndex - colsUp, 0);
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex && scenarios[nextIndex]) {
        onSelect(scenarios[nextIndex].id);
        // Focus the card
        const cards = gridRef.current.querySelectorAll('[role="radio"]');
        (cards[nextIndex] as HTMLElement)?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scenarios, selectedId, onSelect]);

  return (
    <div
      ref={gridRef}
      role="radiogroup"
      aria-label="Practice scenarios"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          id={scenario.id}
          title={scenario.title}
          duration={scenario.duration}
          imageSrc={scenario.imageSrc}
          description={scenario.description}
          ctaText={scenario.ctaText}
          selected={scenario.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
