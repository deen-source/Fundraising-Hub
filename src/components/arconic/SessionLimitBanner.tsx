import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DAILY_SESSION_LIMIT, formatTimeUntilReset } from '@/lib/practice-session-service';

interface SessionLimitBannerProps {
  sessionsUsed: number;
  onRefresh?: () => void;
}

export const SessionLimitBanner = ({ sessionsUsed, onRefresh }: SessionLimitBannerProps) => {
  const navigate = useNavigate();
  const remaining = DAILY_SESSION_LIMIT - sessionsUsed;

  // State 3: Blocked - Daily limit reached
  if (remaining <= 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center space-y-6 border-2 border-muted">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <X className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Daily Limit Reached</h2>
            <p className="text-lg text-muted-foreground">
              You've completed {sessionsUsed} practice sessions today
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-sm text-foreground">
              Come back tomorrow to continue practicing!
            </p>
            <p className="text-xs text-muted-foreground">
              Your limit resets in <span className="font-medium text-foreground">{formatTimeUntilReset()}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              (Midnight UTC)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <Info className="w-4 h-4" />
              Check Status
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="gap-2">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // State 2: Warning - Last session remaining
  if (remaining === 1) {
    return (
      <Alert className="mb-6 border-amber-200 bg-amber-50/50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <span className="font-medium text-amber-900">Last session remaining today.</span>
          <span className="text-amber-700 ml-1">
            Daily limit resets at midnight UTC (in {formatTimeUntilReset()}).
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // State 1: Info - Multiple sessions remaining
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50/50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-sm text-blue-900">
        <span className="font-medium">{remaining} of {DAILY_SESSION_LIMIT} sessions remaining today</span>
      </AlertDescription>
    </Alert>
  );
};
