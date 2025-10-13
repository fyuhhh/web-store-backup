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
    skema: "", // ganti schema -> skema
  });
  const [accounts, setAccounts] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("accounts") || "[]");
    } catch {
      return [];
    }
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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
        skema: undefined, // ganti schema -> skema
        createdAt: new Date().toISOString(),
      };
      const updated = [superadmin, ...accounts];
      localStorage.setItem("accounts", JSON.stringify(updated));
      setAccounts(updated);
    }
  }, []);

  const handleEditAccount = (idx: number) => {
    setEditingIndex(idx);
    setForm({
      username: accounts[idx].username,
      password: accounts[idx].password,
      role: accounts[idx].role,
      division: accounts[idx].division || "",
      skema: accounts[idx].skema || "",
    });
    setTab("buat");
  };

  const handleDeleteAccount = (idx: number) => {
    if (
      window.confirm(
        "Yakin ingin menghapus akun ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      const updated = accounts.filter((_, i) => i !== idx);
      setAccounts(updated);
      localStorage.setItem("accounts", JSON.stringify(updated));
      if (editingIndex === idx) {
        setEditingIndex(null);
        setForm({
          username: "",
          password: "",
          role: "",
          division: "",
          skema: "",
        });
      }
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.username ||
      !form.password ||
      !form.role ||
      (form.role === "divisi" && !form.division) ||
      !form.skema // ganti schema -> skema
    ) {
      alert("Mohon lengkapi semua field");
      return;
    }
    if (editingIndex !== null) {
      // Edit mode
      const updated = accounts.map((acc, idx) =>
        idx === editingIndex
          ? {
              ...acc,
              username: form.username,
              password: form.password,
              role: form.role,
              division: form.role === "divisi" ? form.division : undefined,
              skema: form.skema,
            }
          : acc
      );
      setAccounts(updated);
      localStorage.setItem("accounts", JSON.stringify(updated));
      setEditingIndex(null);
      alert("Akun berhasil diupdate!");
    } else {
      const newAccount = {
        username: form.username,
        password: form.password,
        role: form.role,
        division: form.role === "divisi" ? form.division : undefined,
        skema: form.skema, // ganti schema -> skema
        createdAt: new Date().toISOString(),
      };
      const updated = [...accounts, newAccount];
      setAccounts(updated);
      localStorage.setItem("accounts", JSON.stringify(updated));
      alert("Akun berhasil dibuat!");
    }
    setForm({
      username: "",
      password: "",
      role: "",
      division: "",
      skema: "", // ganti schema -> skema
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleLogout}>
          Keluar
        </Button>
      </div>
      <Card className="shadow-lg border border-border rounded-xl bg-white mx-auto" style={{ maxWidth: "1300px" }}>
        <CardHeader>
          <CardTitle>Kelola Akun</CardTitle>
          <div className="mt-2">
            <Select value={tab} onValueChange={(v) => setTab(v as any)}>
              <SelectTrigger className="w-[200px] bg-white border border-border rounded-md">
                <SelectValue placeholder="Pilih menu" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border rounded-md shadow-md">
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
                  value={form.skema} // ganti schema -> skema
                  onValueChange={(v) => setForm({ ...form, skema: v })}
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
                {editingIndex !== null ? "Update Akun" : "Buat Akun"}
              </Button>
              {editingIndex !== null && (
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => {
                    setEditingIndex(null);
                    setForm({
                      username: "",
                      password: "",
                      role: "",
                      division: "",
                      skema: "",
                    });
                  }}
                >
                  Batal Edit
                </Button>
              )}
            </form>
          )}
          {tab === "monitoring" && (
            <div>
              <h2 className="font-semibold mb-2">Daftar Akun</h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[1200px] w-full border-collapse rounded-lg shadow-sm mx-auto">
                  <thead>
                    <tr className="bg-muted/20">
                      <th className="border px-4 py-2 font-semibold text-left min-w-[140px]">
                        Nama Pengguna
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[140px]">
                        Password
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[120px]">
                        Peran
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[120px]">
                        Divisi
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[120px]">
                        Skema
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[120px]">
                        Dibuat
                      </th>
                      <th className="border px-4 py-2 font-semibold text-left min-w-[120px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, idx) => (
                      <tr key={idx} className="hover:bg-muted/10 transition">
                        <td className="border px-4 py-2">{acc.username}</td>
                        <td className="border px-4 py-2">{acc.password}</td>
                        <td className="border px-4 py-2">{acc.role}</td>
                        <td className="border px-4 py-2">
                          {acc.division || "-"}
                        </td>
                        <td className="border px-4 py-2">{acc.skema}</td>
                        <td className="border px-4 py-2">
                          {acc.createdAt?.slice(0, 10)}
                        </td>
                        <td className="border px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAccount(idx)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAccount(idx)}
                            className="text-destructive"
                            disabled={acc.username === "superadmin"}
                          >
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
