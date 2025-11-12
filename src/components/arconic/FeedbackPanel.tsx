import { SessionFeedback } from '@/types/arconic-simulator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, AlertTriangle, RotateCcw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackPanelProps {
  feedback: SessionFeedback;
  scenarioTitle: string;
  isOpen: boolean;
  isMobile: boolean;
  onRerun: () => void;
  onSwitch: () => void;
  onClose: () => void;
}

export const FeedbackPanel = ({
  feedback,
  scenarioTitle,
  isOpen,
  isMobile,
  onRerun,
  onSwitch,
  onClose,
}: FeedbackPanelProps) => {
  const getScoreLabel = (score: number): string => {
    if (score >= 5) return 'Excellent';
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Adequate';
    if (score >= 2) return 'Needs Work';
    return 'Poor';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 5) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 4) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 2) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const content = (
    <div className="space-y-6">
      {/* Centered header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Session Feedback</h2>
      </div>

      {/* Overall summary */}
      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-foreground leading-relaxed">{feedback.overall}</p>
      </Card>

      {/* What Landed */}
      {feedback.landed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            What Landed
          </h4>
          <ul className="space-y-2">
            {feedback.landed.map((item, index) => (
              <li key={index} className="flex gap-2 items-start text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {feedback.gaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Gaps to Address
          </h4>
          <ul className="space-y-2">
            {feedback.gaps.map((item, index) => (
              <li key={index} className="flex gap-2 items-start text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 mt-2 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Detailed Breakdown</h4>
        {feedback.items.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm font-medium text-foreground">{item.category}</span>
              <Badge className={cn('border', getScoreColor(item.score))}>
                {getScoreLabel(item.score)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{item.comment}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button onClick={onRerun} variant="outline" className="flex-1 gap-2">
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Button onClick={onSwitch} className="flex-1 gap-2">
          <ArrowRight className="w-4 h-4" />
          New Scenario
        </Button>
      </div>
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto"
          aria-label="Session feedback"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Session Feedback</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-label="Session feedback"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Session Feedback</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
