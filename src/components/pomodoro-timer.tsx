
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { format, formatDistanceToNow } from "date-fns";

import { CoffeeCup, type CupStyle } from "@/components/coffee-cup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
import { Progress } from "@/components/ui/progress";
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
  Star,
  CupSoda,
  GlassWater,
  Gift,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";


type Mode = "work" | "rest";
type Session = {
  id: number;
  completedAt: Date;
  duration: number;
};

const UNLOCKABLES: { level: number; name: string; style: CupStyle, icon: React.ReactNode }[] = [
    { level: 1, name: "Classic Mug", style: "mug", icon: <Coffee className="h-5 w-5" /> },
    { level: 5, name: "Iced Coffee Glass", style: "glass", icon: <GlassWater className="h-5 w-5" /> },
    { level: 10, name: "Takeaway Cup", style: "takeaway", icon: <CupSoda className="h-5 w-5" /> },
    { level: 15, name: "Fancy Teacup", style: "fancy", icon: <Gift className="h-5 w-5" /> },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const XP_PER_MINUTE = 10;
const baseXpForNextLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

export function PomodoroTimer() {
  const [workDuration, setWorkDuration] = useState(25);
  const [restDuration, setRestDuration] = useState(5);
  const [tempWorkDuration, setTempWorkDuration] = useState(25);
  const [tempRestDuration, setTempRestDuration] = useState(5);
  const [mode, setMode] = useState<Mode>("work");
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalXpForNextLevel, setTotalXpForNextLevel] = useState(baseXpForNextLevel(1));
  const [selectedCupIndex, setSelectedCupIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();


  const { toast } = useToast();
  
  const endSound = useRef<Tone.Synth | null>(null);
  const startSound = useRef<Tone.MembraneSynth | null>(null);

  useEffect(() => {
    // Client-side only audio setup
    if (typeof window !== "undefined") {
      endSound.current = new Tone.Synth({ oscillator: { type: "sine" } }).toDestination();
      startSound.current = new Tone.MembraneSynth({octaves: 10, pitchDecay: 0.1}).toDestination();
      
      // Load from localStorage
      const savedXp = localStorage.getItem('pomodoro-xp');
      const savedLevel = localStorage.getItem('pomodoro-level');
      let currentLevel = 1;
      if (savedLevel) {
          currentLevel = parseInt(savedLevel, 10);
          setLevel(currentLevel);
          setTotalXpForNextLevel(baseXpForNextLevel(currentLevel));
      } else {
          setTotalXpForNextLevel(baseXpForNextLevel(1));
      }
      if (savedXp) setXp(parseInt(savedXp, 10));

      const savedCupIndex = localStorage.getItem('pomodoro-selected-cup');
       if (savedCupIndex) {
        const index = parseInt(savedCupIndex, 10);
        if (UNLOCKABLES[index].level <= currentLevel) {
          setSelectedCupIndex(index);
        }
      }
    }
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoro-xp', String(xp));
      localStorage.setItem('pomodoro-level', String(level));
    }
  }, [xp, level]);

  useEffect(() => {
    if (carouselApi) {
      const unlockedIndex = UNLOCKABLES.filter(u => u.level <= level).length - 1;
      const lastUnlockedCupIndex = Math.max(0, unlockedIndex);

      const onSelect = () => {
        const selected = carouselApi.selectedScrollSnap();
        if (UNLOCKABLES[selected].level > level) {
            toast({
                title: "Cup Locked!",
                description: `Reach level ${UNLOCKABLES[selected].level} to use the ${UNLOCKABLES[selected].name}.`,
                variant: 'destructive',
            });
            setTimeout(() => carouselApi.scrollTo(selectedCupIndex, true), 100);
        } else {
            setSelectedCupIndex(selected);
            localStorage.setItem('pomodoro-selected-cup', String(selected));
        }
      };
      carouselApi.on("select", onSelect);
      carouselApi.scrollTo(selectedCupIndex, true);
      return () => {
        carouselApi.off("select", onSelect);
      };
    }
  }, [carouselApi, level, selectedCupIndex, toast]);


  const playSound = useCallback((sound: 'start' | 'end' | 'level-up') => {
    if (isMuted) return;
    try {
      Tone.start();
      if (sound === 'start' && startSound.current) {
        startSound.current.triggerAttackRelease("C2", "8n");
      } else if (sound === 'end' && endSound.current) {
        endSound.current.triggerAttackRelease("C5", "0.5s");
      } else if (sound === 'level-up' && endSound.current) {
        const now = Tone.now();
        endSound.current.triggerAttackRelease("C5", "0.2s", now);
        endSound.current.triggerAttackRelease("E5", "0.2s", now + 0.2);
        endSound.current.triggerAttackRelease("G5", "0.2s", now + 0.4);
      }
    } catch (error) {
      console.error("Failed to play sound", error);
    }
  }, [isMuted]);
  
  const addXp = useCallback((amount: number) => {
    let newXp = xp + amount;
    let currentLevel = level;
    let xpNeeded = baseXpForNextLevel(currentLevel);
    let leveledUp = false;

    while (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        currentLevel += 1;
        leveledUp = true;
        xpNeeded = baseXpForNextLevel(currentLevel);

        const unlockedItem = UNLOCKABLES.find(u => u.level === currentLevel);
        if (unlockedItem) {
            setTimeout(() => {
                 toast({
                    title: `✨ Unlocked: ${unlockedItem.name}!`,
                    description: `You've reached level ${currentLevel} and unlocked a new cup.`,
                });
            }, 1000);
        }
    }
    
    if (leveledUp) {
        playSound('level-up');
        toast({
            title: `Level Up!`,
            description: `You've reached level ${currentLevel}!`,
        });
    }

    setXp(newXp);
    setLevel(currentLevel);
  }, [xp, level, toast, playSound]);


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
        addXp(workDuration * XP_PER_MINUTE);
      }
      setMode(newMode);
      setIsActive(true); // Automatically start the next session
      if (newMode === "rest") {
        setTimeRemaining(restDuration * 60);
      } else {
        setTimeRemaining(workDuration * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining, mode, workDuration, restDuration, playSound, addXp]);
  
  useEffect(() => {
    setTotalXpForNextLevel(baseXpForNextLevel(level));
  }, [level]);


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
  };
  
  const handleModeChange = (newMode: Mode) => {
    if (isActive) {
        toast({
            title: "Cannot switch mode while timer is active",
            variant: "destructive"
        });
        return;
    }
    setMode(newMode);
    setTimeRemaining(newMode === 'work' ? workDuration * 60 : restDuration * 60);
  }

  const handleSaveSettings = () => {
    setWorkDuration(tempWorkDuration);
    setRestDuration(tempRestDuration);
    if (!isActive) {
      if(mode === 'work') setTimeRemaining(tempWorkDuration * 60);
      if(mode === 'rest') setTimeRemaining(tempRestDuration * 60);
    }
    setIsSettingsOpen(false);
  };

  const coffeeLevel = useMemo(() => {
    const totalDuration = mode === "work" ? workDuration * 60 : restDuration * 60;
    if (totalDuration === 0) return mode === 'work' ? 100 : 0;
    const progress = (timeRemaining / totalDuration) * 100;
    return mode === "work" ? progress : 100 - progress;
  }, [timeRemaining, workDuration, restDuration, mode]);
  
  const xpProgress = useMemo(() => (xp / totalXpForNextLevel) * 100, [xp, totalXpForNextLevel]);

  const currentCup = useMemo(() => {
    return UNLOCKABLES[selectedCupIndex];
  }, [selectedCupIndex]);
  
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1"></div>
        <CardTitle className="text-center font-headline text-3xl sm:text-4xl tracking-tight">
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
            <Button variant={mode === 'work' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleModeChange('work')} className="rounded-full">Work</Button>
            <Button variant={mode === 'rest' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleModeChange('rest')} className="rounded-full">Rest</Button>
        </div>
        
        <Carousel setApi={setCarouselApi} className="w-full max-w-xs">
          <CarouselContent>
            {UNLOCKABLES.map((cup, index) => (
              <CarouselItem key={index}>
                  <div className={cn(
                    "relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 mx-auto transition-opacity",
                    level < cup.level && "opacity-50"
                  )}>
                    <CoffeeCup level={coffeeLevel} isHot={mode === 'work'} cupStyle={cup.style} />
                    {level < cup.level && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-full">
                        <Lock className="h-10 w-10 text-foreground" />
                        <span className="text-sm font-bold text-foreground mt-2">Lvl {cup.level}</span>
                      </div>
                    )}
                  </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        
        <p className="font-headline text-6xl sm:text-8xl font-bold tracking-tighter text-primary drop-shadow-sm flex items-center tabular-nums">
          <span>{minutes}</span>
          <span className="relative bottom-[0.1em] mx-1">:</span>
          <span>{seconds}</span>
        </p>
        
        <div className="w-full px-8 space-y-2">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    {currentCup.icon}
                    <span>{currentCup.name}</span>
                </div>
                 <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent" />
                    <span>Level {level}</span>
                </div>
            </div>
            <Progress value={xpProgress} className="h-2"/>
             <div className="text-right text-xs text-muted-foreground">{xp}/{totalXpForNextLevel} XP</div>
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

    