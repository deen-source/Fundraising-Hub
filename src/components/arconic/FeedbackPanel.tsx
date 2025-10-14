import { SessionFeedback } from '@/types/arconic-simulator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, AlertTriangle, TrendingUp, RotateCcw, ArrowRight, Clock } from 'lucide-react';
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
  const getDecisionConfig = (decision: SessionFeedback['decision']) => {
    switch (decision) {
      case 'term-sheet':
        return {
          label: 'Term Sheet Ready',
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <Check className="w-5 h-5 text-green-600" />,
        };
      case 'next-meeting':
        return {
          label: 'Next Meeting',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
        };
      case 'pass':
        return {
          label: 'Pass',
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <X className="w-5 h-5 text-red-600" />,
        };
      default:
        return {
          label: 'Under Review',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        };
    }
  };

  const decisionConfig = getDecisionConfig(feedback.decision);
  const overallScore = Math.round(
    feedback.items.reduce((sum, item) => sum + item.score, 0) / feedback.items.length
  );

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const content = (
    <div className="space-y-6">
      {/* Decision badge */}
      <div className="text-center space-y-3">
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full border-2', decisionConfig.color)}>
          {decisionConfig.icon}
          <span className="font-semibold">{decisionConfig.label}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Session duration: {formatDuration(feedback.duration)}</span>
        </div>
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

      {/* Detailed scores */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Detailed Breakdown</h4>
        {feedback.items.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">{item.category}</span>
              <Badge variant={item.score >= 4 ? 'default' : item.score >= 3 ? 'secondary' : 'destructive'}>
                {item.score}/5
              </Badge>
            </div>
            <Progress value={(item.score / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">{item.comment}</p>
            {item.highlight && (
              <p className="text-xs text-primary italic">"{item.highlight}"</p>
            )}
          </div>
        ))}
      </div>

      {/* Overall score */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Overall Score</span>
          <div className="flex items-center gap-2">
            <Progress value={overallScore * 20} className="w-24 h-2" />
            <span className="text-lg font-bold text-primary">{overallScore}/5</span>
          </div>
        </div>
      </Card>

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
          <SheetHeader>
            <SheetTitle>Session Feedback: {scenarioTitle}</SheetTitle>
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
        <DialogHeader>
          <DialogTitle>Session Feedback: {scenarioTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
