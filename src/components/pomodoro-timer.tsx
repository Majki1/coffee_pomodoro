
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { format, formatDistanceToNow } from "date-fns";
import { getInspirationalQuote } from "@/ai/flows/inspirational-rest-quotes";

import { CoffeeCup } from "@/components/coffee-cup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  History,
  Play,
  Pause,
  RotateCw,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Coffee,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./theme-toggle";

type Mode = "work" | "rest";
type Session = {
  id: number;
  completedAt: Date;
  duration: number;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25);
  const [restDuration, setRestDuration] = useState(5);
  const [tempWorkDuration, setTempWorkDuration] = useState(25);
  const [tempRestDuration, setTempRestDuration] = useState(5);
  const [mode, setMode] = useState<Mode>("work");
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quote, setQuote] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { toast } = useToast();
  
  const endSound = useRef<Tone.Synth | null>(null);
  const startSound = useRef<Tone.MembraneSynth | null>(null);

  useEffect(() => {
    // Client-side only audio setup
    if (typeof window !== "undefined") {
      endSound.current = new Tone.Synth({ oscillator: { type: "sine" } }).toDestination();
      startSound.current = new Tone.MembraneSynth({octaves: 10, pitchDecay: 0.1}).toDestination();
    }
  }, []);

  const playSound = useCallback((sound: 'start' | 'end') => {
    if (isMuted) return;
    try {
      Tone.start();
      if (sound === 'start' && startSound.current) {
        startSound.current.triggerAttackRelease("C2", "8n");
      } else if (sound === 'end' && endSound.current) {
        endSound.current.triggerAttackRelease("C5", "0.5s");
      }
    } catch (error) {
      console.error("Failed to play sound", error);
    }
  }, [isMuted]);

  const fetchQuote = useCallback(async () => {
    setQuote("Brewing some inspiration...");
    try {
      const result = await getInspirationalQuote({});
      setQuote(result.quote);
    } catch (error) {
      setQuote("Could not fetch inspiration. Just relax!");
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to fetch an inspirational quote.",
      });
    }
  }, [toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => time - 1);
      }, 1000);
    } else if (isActive && timeRemaining === 0) {
      playSound('end');
      const newMode: Mode = mode === "work" ? "rest" : "work";
      if (mode === "work") {
        setSessions(prev => [...prev, { id: Date.now(), completedAt: new Date(), duration: workDuration }]);
      }
      setMode(newMode);
      setIsActive(true);
      if (newMode === "rest") {
        setTimeRemaining(restDuration * 60);
        // fetchQuote();
      } else {
        setTimeRemaining(workDuration * 60);
        setQuote(null);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, mode, workDuration, restDuration, playSound, fetchQuote]);

  const handleToggle = () => {
    if (timeRemaining === 0) {
      const newMode: Mode = mode === "work" ? "rest" : "work";
      setMode(newMode);
      setTimeRemaining(newMode === "work" ? workDuration * 60 : restDuration * 60);
    }
    if(!isActive) playSound('start');
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setMode("work");
    setTimeRemaining(workDuration * 60);
    setQuote(null);
  };

  const handleSaveSettings = () => {
    setWorkDuration(tempWorkDuration);
    setRestDuration(tempRestDuration);
    if (!isActive) {
      setTimeRemaining(tempWorkDuration * 60);
      setMode('work');
    }
    setIsSettingsOpen(false);
  };

  const coffeeLevel = useMemo(() => {
    const totalDuration = mode === "work" ? workDuration * 60 : restDuration * 60;
    if (totalDuration === 0) return mode === 'work' ? 100 : 0;
    const progress = (timeRemaining / totalDuration) * 100;
    return mode === "work" ? progress : 100 - progress;
  }, [timeRemaining, workDuration, restDuration, mode]);
  
  const handleDurationChange = (type: 'work' | 'rest', operation: 'increment' | 'decrement') => {
    const setter = type === 'work' ? setTempWorkDuration : setTempRestDuration;
    const value = type === 'work' ? tempWorkDuration : tempRestDuration;
    
    if (operation === 'increment') {
      setter(value + 1);
    } else {
      setter(Math.max(1, value - 1));
    }
  }

  const [minutes, seconds] = formatTime(timeRemaining).split(':');

  return (
    <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-x-2">
        <div className="flex-1"></div>
        <CardTitle className="flex-1 text-center font-headline text-3xl sm:text-4xl tracking-tight">
          Coffee Time
        </CardTitle>
        <div className="flex-1 flex items-center justify-end gap-1">
            <ThemeToggle />
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Settings">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Customize Sessions</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="work-duration" className="text-right">Work</Label>
                            <div className="col-span-2 flex items-center gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleDurationChange('work', 'decrement')}><Minus className="h-4 w-4"/></Button>
                              <Input id="work-duration" type="number" value={tempWorkDuration} onChange={e => setTempWorkDuration(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" />
                              <Button variant="outline" size="icon" onClick={() => handleDurationChange('work', 'increment')}><Plus className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="rest-duration" className="text-right">Rest</Label>
                             <div className="col-span-2 flex items-center gap-2">
                              <Button variant="outline" size="icon" onClick={() => handleDurationChange('rest', 'decrement')}><Minus className="h-4 w-4"/></Button>
                              <Input id="rest-duration" type="number" value={tempRestDuration} onChange={e => setTempRestDuration(Math.max(1, parseInt(e.target.value) || 1))} className="text-center" />
                              <Button variant="outline" size="icon" onClick={() => handleDurationChange('rest', 'increment')}><Plus className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" onClick={handleSaveSettings}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Session History">
                        <History className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Session History</SheetTitle>
                        <SheetDescription>You have completed {sessions.length} work session{sessions.length !== 1 && 's'}.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                        {sessions.length > 0 ? (
                          [...sessions].reverse().map(session => (
                            <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                              <div className="flex items-center gap-3">
                                <Coffee className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-semibold">{session.duration} minutes</p>
                                  <p className="text-sm text-muted-foreground">{formatDistanceToNow(session.completedAt, { addSuffix: true })}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{format(session.completedAt, 'p')}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No sessions completed yet.</p>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center gap-2 mb-4">
            <Button variant={mode === 'work' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('work')} className="rounded-full">Work</Button>
            <Button variant={mode === 'rest' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('rest')} className="rounded-full">Rest</Button>
        </div>

        <CoffeeCup level={coffeeLevel} isHot={mode === 'work'} />
        
        <p className="font-headline text-6xl sm:text-8xl font-bold tracking-tighter text-primary drop-shadow-sm flex items-center">
          <span>{minutes}</span>
          <span className="relative -top-1 sm:-top-2 mx-1 sm:mx-2">:</span>
          <span>{seconds}</span>
        </p>
        
        <div className="h-10 text-center">
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-4 w-full">
          <Button
            onClick={handleToggle}
            className="w-32 rounded-full text-lg font-bold uppercase tracking-wider"
            size="lg"
            style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}
          >
            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
            {isActive ? "Pause" : "Start"}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
           <Button onClick={handleReset} variant="ghost" size="sm" className="text-muted-foreground">
            <RotateCw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Separator orientation="vertical" className="h-6" />
           <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" size="icon" className="text-muted-foreground" aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

    

    