"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMsg("Mohon lengkapi semua field");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("http://192.168.10.10:5000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_pengguna: username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Login gagal");
        setIsLoading(false);
        return;
      }

      // Simpan userData ke localStorage (simpan seluruh objek user)
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Beri sedikit delay untuk animasi loading
      setTimeout(() => {
        // Redirect sesuai role/peran
        if (data.user.id_peran === 5) {
          router.push("/kelola-akun");
        } else if (data.user.id_peran === 1) {
          router.push("/dashboard");
        } else if (
          (data.user.role ?? data.user.peran ?? "").toLowerCase() ===
          "superadmin" ||
          data.user.nama_pengguna?.toLowerCase() === "superadmin"
        ) {
          router.push("/kelola-akun");
        } else if (
          (data.user.role ?? data.user.peran ?? "").toLowerCase() === "admin" ||
          data.user.id_peran === 2
        ) {
          router.push("/dashboard");
        } else if (
          (data.user.role ?? data.user.peran ?? "").toLowerCase() ===
          "divisi" ||
          data.user.id_peran === 3
        ) {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 800);
    } catch (err) {
      setErrorMsg("Terjadi kesalahan server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sistem Monitoring
          </h1>
          <p className="text-slate-500 text-sm">
            Masuk untuk mengakses halaman utama.
          </p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Selamat Datang Kembali
            </CardTitle>
            <CardDescription>
              Silakan masukkan kredensial akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  Nama Pengguna
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="nama_pengguna"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg("");
                    }}
                    required
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium text-slate-800"
                  />
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    Kata Sandi
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    required
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all font-medium text-slate-800"
                  />
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] mt-2 group"
              >
                {isLoading ? (
                  "Memeriksa..."
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Sistem Monitoring Purchasing & Store BSB Balikpapan
          </p>
        </div>
      </div>
    </div>
  );
}
