import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

const PracticePitching = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [context, setContext] = useState("");
  const { toast } = useToast();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          handleSendMessage();
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Speech recognition failed. Please try again.",
          variant: "destructive",
        });
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async () => {
    const message = transcript.trim();
    if (!message) return;

    setConversation(prev => [...prev, { role: 'user', content: message }]);
    setTranscript("");

    try {
      const { data, error } = await supabase.functions.invoke('practice-pitching', {
        body: { message, context }
      });

      if (error) throw error;

      const aiResponse = data.response;
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      speak(aiResponse);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startNewSession = () => {
    setConversation([]);
    setTranscript("");
    setContext("");
    stopSpeaking();
    
    const greeting = "Hi! I'm ready to hear your pitch. Tell me about your startup.";
    setConversation([{ role: 'assistant', content: greeting }]);
    speak(greeting);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Practice Pitching</h1>
        <p className="text-muted-foreground">
          Practice your pitch with an AI investor powered by Google Gemini
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Setup</CardTitle>
          <CardDescription>
            Add context about your startup to help the AI provide better feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., We're a SaaS startup in fintech with $500K ARR, raising $2M Series A..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[100px] mb-4"
          />
          <Button onClick={startNewSession} className="w-full">
            Start New Session
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Start a new session to begin practicing your pitch
            </p>
          ) : (
            conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-primary/10 ml-auto max-w-[80%]' 
                    : 'bg-muted max-w-[80%]'
                }`}
              >
                <p className="font-semibold mb-1">
                  {msg.role === 'user' ? 'You' : 'AI Investor'}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {conversation.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {transcript && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-1">You're saying:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={toggleListening}
                  className={isListening ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Speaking
                    </>
                  )}
                </Button>

                {isSpeaking && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={stopSpeaking}
                  >
                    <VolumeX className="mr-2 h-5 w-5" />
                    Stop AI Voice
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticePitching;
