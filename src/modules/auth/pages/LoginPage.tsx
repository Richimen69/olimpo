import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2 } from "lucide-react";
import { loginUser } from "../services/auth.service";
import { useAuthStore } from "../store/useAuthStore";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const res = await loginUser(email, password);

    if (res.success) {
      login(res.data.user, res.data.token);
      navigate("/");
    } else {
      setError(res.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Efecto de luz de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-600/10 blur-[60px] pointer-events-none"></div>

        {/* Logo y Título */}
        <div className="relative z-10 flex flex-col items-center mb-8 text-center">
          <div className="flex items-center gap-4 mb-6">
            {/* Contenedor del logo escalado */}
            <div className="p-2.5 bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-inner">
              <img src="/logo_b.svg" alt="Logo" className="w-10 h-10" />
            </div>

            {/* Texto escalado */}
            <div className="flex flex-col justify-center text-left">
              <span className="font-bold text-white tracking-[0.15em] text-3xl leading-none">
                OLIMPO
              </span>
              <span className="text-[10px] text-red-500 font-bold tracking-[0.3em] mt-1.5">
                TOYOTA
              </span>
            </div>
          </div>

          <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
            Ingresa tus credenciales de Kyojin para publicar archivos, fichas,
            álbumes y más.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-white text-sm p-3 font-bold rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-600" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                placeholder="usuario@toyotaguerrero.com.mx"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-600" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg bg-zinc-900/50 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
