"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  const router = useRouter();

  // Tambahkan akun superadmin jika belum ada
  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const hasSuperadmin = accounts.some(
      (acc: any) => acc.username === "superadmin"
    );
    if (!hasSuperadmin) {
      const superadmin = {
        username: "superadmin",
        password: "superadminpentaewalk",
        role: "superadmin",
        division: undefined,
        skema: undefined, // ganti schema -> skema
        createdAt: new Date().toISOString(),
      };
      const updated = [superadmin, ...accounts];
      localStorage.setItem("accounts", JSON.stringify(updated));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMsg("Mohon lengkapi semua field");
      return;
    }

    // Ambil daftar akun dari localStorage
    const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const user = accounts.find(
      (acc: any) => acc.username === username && acc.password === password
    );

    if (!user) {
      setErrorMsg(
        "Nama pengguna atau kata sandi salah, atau akun belum terdaftar."
      );
      return;
    }

    // Simpan userData ke localStorage
    const userData = {
      username: user.username,
      role: user.role,
      division: user.division,
      skema: user.skema, // ganti schema -> skema
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem("userData", JSON.stringify(userData));

    // Redirect sesuai role
    if (user.role === "superadmin") {
      router.push("/kelola-akun");
    } else if (user.role === "admin") {
      router.push("/dashboard");
    } else if (user.role === "divisi") {
      router.push(`/dashboard/rekap-full?divisi=${user.division}`);
    } else {
      setErrorMsg("Role tidak dikenali.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Sistem Monitoring</h1>
        </div>
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Masuk ke Sistem
            </CardTitle>
            <CardDescription className="text-center">
              Masukkan kredensial Anda untuk mengakses aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nama Pengguna</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg("");
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  required
                />
              </div>
              {errorMsg && (
                <div className="text-red-500 text-sm text-center">
                  {errorMsg}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
              >
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <div>
            <strong>Superadmin:</strong>
          </div>
          <div>
            Nama Pengguna: <span className="font-mono">superadmin</span>
          </div>
          <div>
            Kata Sandi: <span className="font-mono">superadminpentaewalk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
