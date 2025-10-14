"use client";

import type React from "react";
import { useState } from "react";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMsg("Mohon lengkapi semua field");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_pengguna: username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Login gagal");
        return;
      }

      // Simpan userData ke localStorage
      localStorage.setItem(
        "userData",
        JSON.stringify({
          nama_pengguna: data.user.nama_pengguna,
          password: data.user.password,
          id_peran: data.user.id_peran,
        })
      );

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
        (data.user.role ?? data.user.peran ?? "").toLowerCase() === "divisi" ||
        data.user.id_peran === 3
      ) {
        router.push(`/dashboard/rekap-full?divisi=${data.user.divisi}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan server.");
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
