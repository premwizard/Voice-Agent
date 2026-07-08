import VoiceAgent from '../components/VoiceAgent';
import ChatInterface from '../components/ChatInterface';

export default function Home() {
  return (
    <main className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-1/2 flex flex-col">
          <VoiceAgent />
        </div>
        <div className="flex-1 lg:w-1/2 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
