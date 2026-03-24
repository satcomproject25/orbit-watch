import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Shield, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import satelliteBg from "@/assets/satellite-bg.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate("/dashboard");
    else setError("Invalid credentials. Access denied.");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img src={satelliteBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-xs font-mono text-primary tracking-[0.3em] mb-1">ISRO – ISTRAC</p>
          <h1 className="text-2xl font-bold text-foreground">Carrier Monitoring System</h1>
          <p className="text-xs text-muted-foreground mt-1">Satellite Signal Surveillance Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@istrac.gov.in"
                className="pl-9 bg-background/50 border-border"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10 bg-background/50 border-border"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold">
            {loading ? "Authenticating..." : "Secure Login"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Authorized personnel only. All access is monitored and logged.
          </p>
        </form>
      </div>
    </div>
  );
}
