"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DIVISI_OPTIONS = ["IT", "Eng", "Civil", "HRD", "FAD"];
const ROLE_OPTIONS = ["admin", "divisi", "pengurus"];
const SCHEMA_OPTIONS = ["pentacity", "ewalk"];

export default function KelolaAkunPage() {
  const [tab, setTab] = useState<"buat" | "monitoring">("buat");
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "",
    division: "",
    schema: "",
  });
  const [accounts, setAccounts] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("accounts") || "[]");
    } catch {
      return [];
    }
  });
  const router = useRouter();

  useEffect(() => {
    // Tambahkan akun superadmin jika belum ada
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
        schema: undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [superadmin, ...accounts];
      localStorage.setItem("accounts", JSON.stringify(updated));
      setAccounts(updated);
    }
  }, []);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.username ||
      !form.password ||
      !form.role ||
      (form.role === "divisi" && !form.division) ||
      !form.schema
    ) {
      alert("Mohon lengkapi semua field");
      return;
    }
    const newAccount = {
      username: form.username,
      password: form.password,
      role: form.role,
      division: form.role === "divisi" ? form.division : undefined,
      schema: form.schema,
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    localStorage.setItem("accounts", JSON.stringify(updated));
    setForm({
      username: "",
      password: "",
      role: "",
      division: "",
      schema: "",
    });
    alert("Akun berhasil dibuat!");
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleLogout}>
          Keluar
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kelola Akun</CardTitle>
          <div className="mt-2">
            <Select value={tab} onValueChange={(v) => setTab(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih menu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buat">Buat Akun Baru</SelectItem>
                <SelectItem value="monitoring">Monitoring Akun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {tab === "buat" && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label>Nama Pengguna</Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Kata Sandi</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Peran</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.role === "divisi" && (
                <div>
                  <Label>Divisi</Label>
                  <Select
                    value={form.division}
                    onValueChange={(v) => setForm({ ...form, division: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIVISI_OPTIONS.map((div) => (
                        <SelectItem key={div} value={div}>
                          {div}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Skema Database</Label>
                <Select
                  value={form.schema}
                  onValueChange={(v) => setForm({ ...form, schema: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih skema database" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEMA_OPTIONS.map((schema) => (
                      <SelectItem key={schema} value={schema}>
                        {schema.charAt(0).toUpperCase() + schema.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Buat Akun
              </Button>
            </form>
          )}
          {tab === "monitoring" && (
            <div>
              <h2 className="font-semibold mb-2">Daftar Akun</h2>
              <table className="w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Nama Pengguna</th>
                    <th className="border px-2 py-1">Password</th>
                    <th className="border px-2 py-1">Peran</th>
                    <th className="border px-2 py-1">Divisi</th>
                    <th className="border px-2 py-1">Skema</th>
                    <th className="border px-2 py-1">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{acc.username}</td>
                      <td className="border px-2 py-1">{acc.password}</td>
                      <td className="border px-2 py-1">{acc.role}</td>
                      <td className="border px-2 py-1">
                        {acc.division || "-"}
                      </td>
                      <td className="border px-2 py-1">{acc.schema}</td>
                      <td className="border px-2 py-1">
                        {acc.createdAt?.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
