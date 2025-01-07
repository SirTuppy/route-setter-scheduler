// app/page.tsx
import ScheduleComponent from './components/ScheduleComponent';

export default function Home() {
    return (
        <main className="min-h-screen p-0 bg-slate-900">
            <ScheduleComponent />
        </main>
    );
}