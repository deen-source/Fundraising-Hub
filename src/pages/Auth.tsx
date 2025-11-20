import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { StarField } from '@/components/StarField';
import { TrendingUp, Shield, Zap, Mail, AlertCircle } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      setPendingEmail(email);
      setVerificationPending(true);
      toast.success('Account created! Please check your email to verify.');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    const emailToResend = pendingEmail || email;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailToResend,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Verification email resent to ${emailToResend}`);
      setResendCooldown(60); // 60 second cooldown
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if error is due to unverified email
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('email not confirmed')) {
        setPendingEmail(email);
        setVerificationPending(true);
        toast.error('Please verify your email before logging in. Check your inbox!');
      } else {
        toast.error(error.message);
      }
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-10">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <img
                src="/arconic-logo.svg"
                alt="Arconic Logo"
                className="h-12 w-12"
              />
              <h1 className="text-4xl font-bold">
                Fundraising Hub
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              The complete investment toolkit for ambitious founders
            </p>
          </div>

          <div className="space-y-6">
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              Practical AI tools to help founders raise with clarity and confidence. Each solves a real challenge in the fundraising process. Sign up to make fundraising simpler.
            </p>

            <div className="flex items-start gap-5">
              <div className="p-3 border">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">AI-Powered Analysis</h3>
                <p className="text-muted-foreground text-xs">
                  Get instant insights on term sheets, metrics, and valuations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="p-3 border">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">Secure & Private</h3>
                <p className="text-muted-foreground text-xs">
                  Your data is encrypted and never shared with third parties
                </p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="p-3 border">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-0.5">Lightning Fast</h3>
                <p className="text-muted-foreground text-xs">
                  Calculate complex scenarios in seconds, not hours
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to access your founder tools</CardDescription>
          </CardHeader>
          <CardContent>
            {verificationPending ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">
                      Check Your Email
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      We sent a verification link to
                    </p>
                    <p className="font-medium text-foreground">
                      {pendingEmail}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Click the link in the email to verify your account before signing in.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleResendVerification}
                    disabled={loading || resendCooldown > 0}
                    variant="outline"
                    className="w-full h-11"
                  >
                    {loading
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </Button>

                  <Button
                    onClick={() => setVerificationPending(false)}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="font-medium text-foreground">Didn&#39;t receive it?</strong> Check your spam folder or use the resend button above.
                  </p>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="founder@startup.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="founder@startup.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-background/50"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
