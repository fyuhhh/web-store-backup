"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMsg("Mohon lengkapi semua field");
      return;
    }

    try {
      const res = await fetch("http://192.168.10.10:5000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_pengguna: username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Login gagal");
        return;
      }

      // Simpan userData ke localStorage (simpan seluruh objek user)
      localStorage.setItem("userData", JSON.stringify(data.user));

      // Mulai animasi fade-out sebelum redirect
      setIsTransitioning(true);
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
          router.push(`/dashboard/rekap-full?divisi=${data.user.divisi}`);
        } else {
          router.push("/dashboard");
        }
      }, 600); // Durasi animasi 600ms
    } catch (err) {
      setErrorMsg("Terjadi kesalahan server.");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${
        isTransitioning
          ? "opacity-0 scale-95 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Sistem Monitoring
          </h1>
        </div>
        <Card
          className="bg-white/80 border border-primary/20 shadow-xl rounded-2xl backdrop-blur-md"
          style={{
            boxShadow: "0 8px 32px #6366f11a",
            border: "1px solid #e0e7ff",
          }}
        >
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center font-semibold text-primary">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Masukkan Nama Pengguna dan Kata Sandi Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-medium text-primary">
                  Nama Pengguna
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan Nama Pengguna"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg("");
                  }}
                  required
                  className="h-11 rounded-lg bg-muted/30 border-primary/30 focus:border-primary focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium text-primary">
                  Kata Sandi
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan Kata Sandi"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  required
                  className="h-11 rounded-lg bg-muted/30 border-primary/30 focus:border-primary focus:ring-primary/30"
                />
              </div>
              {errorMsg && (
                <div className="text-red-500 text-sm text-center rounded-md bg-red-50 py-2">
                  {errorMsg}
                </div>
              )}
              <Button
                type="submit"
                className="relative w-full h-11 overflow-hidden rounded-lg font-semibold text-white transition-all duration-500 ease-out
             bg-gradient-to-r from-primary to-indigo-500 shadow-md
             hover:scale-[1.03] hover:shadow-lg hover:shadow-indigo-400/30"
              >
                <span className="relative z-10">Masuk</span>
                <span
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-primary to-indigo-500
               opacity-0 group-hover:opacity-100 animate-gradient-move transition-opacity duration-500"
                ></span>
              </Button>
            </form>
          </CardContent>
        </Card>
        {/* Demo akun section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
          <div className="bg-white/70 rounded-lg p-3 shadow border border-primary/10">
            <div className="font-semibold text-primary">Demo Penta</div>
            <div>
              Nama Pengguna: <span className="font-mono">ewalk</span>
            </div>
            <div>
              Kata Sandi: <span className="font-mono">ewalk</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3 shadow border border-primary/10">
            <div className="font-semibold text-primary">Demo Admin</div>
            <div>
              Nama Pengguna: <span className="font-mono">admin</span>
            </div>
            <div>
              Kata Sandi: <span className="font-mono">admin</span>
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3 shadow border border-primary/10">
            <div className="font-semibold text-primary">Superadmin</div>
            <div>
              Nama Pengguna: <span className="font-mono">superadmin</span>
            </div>
            <div>
              Kata Sandi:{" "}
              <span className="font-mono">superadminpentaewalk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
