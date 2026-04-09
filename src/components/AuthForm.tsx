import { useState } from 'react';
import { Bot, LogIn, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '../lib/firebase';

interface AuthFormProps {
  onGoogleSignIn: () => void;
}

export function AuthForm({ onGoogleSignIn }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#212121] flex flex-col items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full border border-[#2f2f2f] flex items-center justify-center mb-6">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-[#676767]">
            {isSignUp ? 'Sign up to start chatting' : 'Log in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isSignUp && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#676767]" />
              <input
                type="text"
                placeholder="Display Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-white/20 outline-none transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#676767]" />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-white/20 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#676767]" />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2f2f2f] border border-[#3f3f3f] rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-white/20 outline-none transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-[#d7d7d7] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2f2f2f]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#212121] text-[#676767]">OR</span>
          </div>
        </div>

        <button
          onClick={onGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-transparent border border-[#3f3f3f] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2f2f2f] transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-sm text-[#676767] mt-8">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white hover:underline font-medium"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
