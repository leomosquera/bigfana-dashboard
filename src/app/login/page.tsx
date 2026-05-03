"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
} from "lucide-react";

const stats = [
  { value: "147K+", label: "Fans activos" },
  { value: "$2.84M", label: "Revenue mensual" },
  { value: "73.4%", label: "Engagement rate" },
  { value: "23", label: "Sponsors activos" },
];

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("demo@bigfana.com");
  const [password, setPassword] = useState("demo1234");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200));

    router.push("/dashboard");
  }

  const [particles, setParticles] = useState<
  {
      id: number;
      left: number;
      duration: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 40 + Math.random() * 20,
      duration: 4 + Math.random() * 3,
      delay: Math.random() * 3,
    }));

    setParticles(generated);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06060A]">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#06060A] via-[#0D0D14] to-[#06060A]" />

      {/* RED GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,45,85,0.14)_0%,transparent_60%)]" />

      {/* BLUE ATMOSPHERE */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]" />

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* SMALL PARTICLES */}
      <div className="absolute inset-0 overflow-hidden">

      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [-20, -120],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
          className="
            absolute
            w-[2px]
            h-[2px]
            rounded-full
            bg-[#FF2D55]
          "
          style={{
            left: `${p.left}%`,
            bottom: "-20px",
          }}
        />
      ))}

      </div>

      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">

        {/* LOGIN CARD */}
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
          }}
          className="
            w-full
            max-w-[420px]

            rounded-[32px]

            border
            border-[#FF2D55]/10

            bg-[#0D0D14]/75

            backdrop-blur-2xl

            shadow-[0_0_80px_rgba(255,45,85,0.10)]

            p-8
            md:p-10
          "
        >

          {/* LOGO */}
          <div className="flex flex-col items-center text-center mb-8">

            <div className="
              relative
              mb-5
            ">

              <div className="
                absolute
                inset-0

                rounded-full

                bg-[#FF2D55]/20

                blur-[30px]
              " />

              <img
                src="/logo-bigfana.png"
                alt="BigFana"
                className="
                  relative
                  z-10

                  h-14
                  object-contain
                "
              />

            </div>

            <div className="
              inline-flex
              items-center
              gap-2

              px-3
              py-1.5

              rounded-full

              border
              border-[#FF2D55]/15

              bg-[#FF2D55]/10

              mb-5
            ">

              <Zap
                size={12}
                className="text-[#FF2D55]"
              />

              <span className="
                text-[11px]
                font-semibold
                tracking-[0.18em]

                text-[#FF2D55]
              ">
                DEMO PLATFORM
              </span>

            </div>


            <p className="
              text-sm
              leading-relaxed
              text-[#777792]

              max-w-[300px]
            ">
              La plataforma premium de monetización y engagement para clubes deportivos.
            </p>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* EMAIL */}
            <div className="space-y-2">

              <label className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[#777792]
              ">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@club.com"
                className="
                  w-full
                  h-12

                  px-4

                  rounded-2xl

                  border
                  border-white/[0.06]

                  bg-[#141420]

                  text-sm
                  text-[#F0F0F8]

                  placeholder:text-[#55556A]

                  outline-none

                  focus:border-[#FF2D55]/40

                  transition-all
                "
              />

            </div>

            {/* PASSWORD */}
            <div className="space-y-2">

              <label className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.16em]

                text-[#777792]
              ">
                Contraseña
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="
                    w-full
                    h-12

                    px-4
                    pr-12

                    rounded-2xl

                    border
                    border-white/[0.06]

                    bg-[#141420]

                    text-sm
                    text-[#F0F0F8]

                    placeholder:text-[#55556A]

                    outline-none

                    focus:border-[#FF2D55]/40

                    transition-all
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2

                    text-[#55556A]

                    hover:text-[#8888AA]

                    transition-colors
                  "
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>

              </div>

            </div>

            {/* OPTIONS */}
            <div className="flex items-center justify-between pt-1">

              <label className="
                flex
                items-center
                gap-2

                cursor-pointer
              ">

                <input
                  type="checkbox"
                  className="
                    w-3.5
                    h-3.5

                    accent-[#FF2D55]
                  "
                />

                <span className="
                  text-xs
                  text-[#55556A]
                ">
                  Recordarme
                </span>

              </label>

              <button
                type="button"
                className="
                  text-xs
                  text-[#FF2D55]

                  hover:text-[#FF6B6B]

                  transition-colors
                "
              >
                ¿Olvidaste tu contraseña?
              </button>

            </div>

            {/* SUBMIT */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.99,
              }}
              className="
                relative

                w-full
                h-12

                rounded-2xl

                bg-[#FF2D55]

                text-sm
                font-semibold
                text-white

                flex
                items-center
                justify-center
                gap-2

                shadow-[0_0_40px_rgba(255,45,85,0.35)]

                hover:bg-[#FF4368]

                transition-all

                disabled:opacity-70
              "
            >

              {loading ? (
                <div className="flex items-center gap-2">

                  <div className="
                    w-4
                    h-4

                    rounded-full

                    border-2
                    border-white/30
                    border-t-white

                    animate-spin
                  " />

                  <span>Ingresando...</span>

                </div>
              ) : (
                <>
                  <span>Ingresar al Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}

            </motion.button>

          </form>

          {/* DEMO ACCESS */}
          <div className="
            mt-6

            rounded-2xl

            border
            border-[#FF2D55]/10

            bg-[#FF2D55]/[0.05]

            px-4
            py-3
          ">

            <p className="
              text-center
              text-xs
              text-[#777792]
            ">

              <span className="
                font-semibold
                text-[#FF2D55]
              ">
                Demo:
              </span>

              {" "}
              demo@bigfana.com · demo1234

            </p>

          </div>

        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            delay: 0.3,
          }}
          className="
            mt-8

            grid
            grid-cols-2
            md:grid-cols-4

            gap-3

            w-full
            max-w-[820px]
          "
        >

          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.4,
                delay: 0.5 + i * 0.08,
              }}
              className="
                rounded-2xl

                border
                border-white/[0.06]

                bg-white/[0.03]

                backdrop-blur-xl

                px-5
                py-4

                text-center
              "
            >

              <p className="
                text-2xl
                font-black
                text-[#F0F0F8]
              ">
                {stat.value}
              </p>

              <p className="
                mt-1

                text-xs
                text-[#55556A]
              ">
                {stat.label}
              </p>

            </motion.div>
          ))}

        </motion.div>

      </div>

    </div>
  );
}