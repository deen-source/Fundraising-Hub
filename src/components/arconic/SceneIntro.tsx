import { Scenario, Avatar } from '@/types/arconic-simulator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mic, MicOff, Check, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SceneIntroProps {
  scenario: Scenario;
  avatar: Avatar;
  isOpen: boolean;
  isMobile: boolean;
  onStart: () => void;
  onClose: () => void;
}

export const SceneIntro = ({
  scenario,
  avatar,
  isOpen,
  isMobile,
  onStart,
  onClose,
}: SceneIntroProps) => {
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [micTesting, setMicTesting] = useState(false);

  // Check mic permission on mount
  useEffect(() => {
    if (isOpen) {
      checkMicPermission();
    }
  }, [isOpen]);

  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicPermission('denied');
    }
  };

  const handleMicTest = async () => {
    setMicTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');

      // Simulate mic test
      setTimeout(() => {
        setMicTesting(false);
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
    } catch (error) {
      setMicPermission('denied');
      setMicTesting(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Your Goal */}
      {scenario.goal && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Your Goal:</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {scenario.goal}
          </p>
        </div>
      )}

      {/* What to expect */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">What to expect:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {scenario.bullets.map((bullet, index) => (
            <li key={index} className="flex gap-2 items-start">
              <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avatar display */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Your partner:</h4>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-border">
            <img
              src={avatar.imageSrc}
              alt={avatar.name}
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{avatar.name}</p>
            <p className="text-xs text-muted-foreground">{avatar.role}</p>
          </div>
        </div>
      </div>

      {/* Mic test */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Microphone check:</h4>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMicTest}
            disabled={micTesting}
            className="gap-2"
          >
            {micPermission === 'granted' ? (
              <Mic className="w-4 h-4 text-primary" />
            ) : (
              <MicOff className="w-4 h-4 text-destructive" />
            )}
            {micTesting ? 'Testing...' : 'Test Mic'}
          </Button>
          {micPermission === 'granted' && (
            <span className="text-sm text-primary flex items-center gap-1">
              <Check className="w-4 h-4" />
              Ready
            </span>
          )}
          {micPermission === 'denied' && (
            <span className="text-sm text-destructive">
              Microphone access required
            </span>
          )}
        </div>
      </div>

      {/* Start button */}
      <Button
        onClick={onStart}
        disabled={micPermission !== 'granted'}
        size="lg"
        className="w-full gap-2 mt-2"
      >
        <Mic className="w-5 h-5" />
        Start Session
      </Button>

      {micPermission === 'denied' && (
        <p className="text-xs text-muted-foreground text-center">
          Please enable microphone access in your browser settings to continue.
        </p>
      )}
    </div>
  );

  // Use Sheet for mobile, Dialog for desktop
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-y-auto"
          aria-label="Scenario introduction"
        >
          <SheetHeader className="space-y-3">
            <div className="flex items-center justify-center gap-4 mt-4">
              <SheetTitle className="text-center">{scenario.title}</SheetTitle>
              <Badge variant="outline" className="gap-1 inline-flex shrink-0">
                <Clock className="w-3 h-3" />
                {scenario.duration}
              </Badge>
            </div>
            <SheetDescription className="sr-only">
              {scenario.description}
            </SheetDescription>
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
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-label="Scenario introduction"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center gap-4 mt-4">
            <DialogTitle className="text-center">{scenario.title}</DialogTitle>
            <Badge variant="outline" className="gap-1 inline-flex shrink-0">
              <Clock className="w-3 h-3" />
              {scenario.duration}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            {scenario.description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
