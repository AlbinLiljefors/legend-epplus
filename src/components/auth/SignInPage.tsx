import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const ADJECTIVES = [
  "Swift", "Bright", "Calm", "Bold", "Keen",
  "Sharp", "Wise", "Quick", "Cool", "Epic",
  "Noble", "Brave", "Vivid", "Agile", "Clever",
];
const NOUNS = [
  "Fox", "Owl", "Bear", "Wolf", "Hawk",
  "Lynx", "Puma", "Raven", "Otter", "Eagle",
  "Falcon", "Bison", "Crane", "Heron", "Tiger",
];

function generateAnonName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj}${noun}${num}`;
}

export function SignInPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // If already authenticated, go straight to the graph
  if (user) {
    navigate('/loading/epplus', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await signIn(name.trim(), email.trim() || undefined);
    navigate('/loading/epplus');
  };

  const handleSkip = async () => {
    const anonName = generateAnonName();
    await signIn(anonName);
    navigate('/loading/epplus');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 left-4"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-lg">
            <Layers className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Legend</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to explore the architecture
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optional)"
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <Button type="submit" className="w-full py-3 gap-2" disabled={!name.trim()}>
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          Continue without signing in
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your info is only used to personalize your exploration session.
        </p>
      </motion.div>
    </div>
  );
}
