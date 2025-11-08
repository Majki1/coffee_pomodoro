import { PomodoroTimer } from '@/components/pomodoro-timer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <PomodoroTimer />
    </main>
  );
}
