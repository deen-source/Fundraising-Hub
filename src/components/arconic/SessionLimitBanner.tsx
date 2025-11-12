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
        <Card className="p-8 text-center space-y-6 border border-muted">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Daily Limit Reached</h2>
            <p className="text-lg text-muted-foreground">
              You've completed {sessionsUsed} sessions today
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-muted/30 rounded-lg px-4 py-3 inline-block">
              <p className="text-sm text-muted-foreground">
                Your limit resets in <span className="font-medium text-foreground">{formatTimeUntilReset()}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={() => navigate('/dashboard')}>
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
