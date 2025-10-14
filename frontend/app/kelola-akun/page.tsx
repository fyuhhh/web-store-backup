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

export default function KelolaAkunPage() {
  const [tab, setTab] = useState<"buat" | "monitoring">("buat");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [schemaOptions, setSchemaOptions] = useState<any[]>([]);
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "", // id_peran
    division: "", // id_divisi
    skema: "", // id_skema
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const editingIndex = null; // Tambahkan ini di awal komponen agar tidak error

  // Ambil id_peran dari roleOptions dan mapping peran dari backend
  const [peranList, setPeranList] = useState<any[]>([]);
  useEffect(() => {
    // Fetch peran dari backend
    fetch("http://localhost:5000/api/peran")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRoleOptions(data); // [{id_peran, peran}]
      })
      .catch(() => setRoleOptions([]));

    // Fetch skema dari backend
    fetch("http://localhost:5000/api/skema")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSchemaOptions(data); // [{id_skema, skema}]
      })
      .catch(() => setSchemaOptions([]));

    // Fetch divisi dari backend
    fetch("http://localhost:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDivisiOptions(data); // [{id_divisi, divisi}]
      })
      .catch(() => setDivisiOptions([]));

    // Fetch akun dari backend
    fetch("http://localhost:5000/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAccounts(data);
      })
      .catch(() => setAccounts([]));
  }, []);

  // Helper: cari nama divisi dari id_divisi
  function getDivisiName(id_divisi: any) {
    const found = divisiOptions.find((d: any) => d.id_divisi === id_divisi);
    return found ? found.divisi : "-";
  }
  // Helper: cari nama skema dari id_skema
  function getSkemaName(id_skema: any) {
    const found = schemaOptions.find((s: any) => s.id_skema === id_skema);
    return found ? found.skema : "-";
  }
  // Helper: cari nama peran dari id_peran
  function getPeranName(id_peran: any) {
    const found = roleOptions.find((r: any) => r.id_peran === id_peran);
    return found ? found.peran : "-";
  }

  // Helper: konversi UTC ke waktu lokal (WIB)
  function formatLocalTime(utcString: string) {
    if (!utcString) return "-";
    const date = new Date(utcString);
    // WIB = UTC+7
    const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return wibDate
      .toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");
  }

  // Handler buat akun baru (POST ke backend)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const peranStr = getPeranName(Number(form.role)).toLowerCase();
    const isSuperadmin = Number(form.role) === 5 || peranStr === "superadmin";
    const isDivisi = peranStr === "divisi";
    // Validasi
    if (
      !form.username ||
      !form.password ||
      !form.role ||
      (!isSuperadmin && !form.skema) ||
      (isDivisi && !form.division)
    ) {
      alert("Mohon lengkapi semua field");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_pengguna: form.username,
          password: form.password,
          id_peran: Number(form.role),
          id_divisi: isDivisi ? Number(form.division) : null,
          id_skema: isSuperadmin ? null : Number(form.skema),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal membuat akun");
      } else {
        alert("Akun berhasil dibuat!");
        // Refresh daftar akun
        fetch("http://localhost:5000/api/user")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setAccounts(data);
          });
        setForm({
          username: "",
          password: "",
          role: "",
          division: "",
          skema: "",
        });
      }
    } catch (err) {
      alert("Terjadi kesalahan server");
    }
    setLoading(false);
  };

  // Handler edit akun
  const handleEditAccount = (acc: any) => {
    setForm({
      username: acc.nama_pengguna ?? acc.username ?? "",
      password: acc.password ?? "",
      role: String(acc.id_peran ?? ""),
      division: String(acc.id_divisi ?? ""),
      skema: String(acc.id_skema ?? ""),
    });
    setEditingIndex(acc.id_user ?? acc.id); // gunakan id_user dari backend
    setTab("buat");
  };

  // Handler hapus akun
  const handleDeleteAccount = async (id: number) => {
    if (
      window.confirm(
        "Yakin ingin menghapus akun ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Gagal menghapus akun");
        } else {
          // Refresh daftar akun
          fetch("http://localhost:5000/api/user")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data)) setAccounts(data);
            });
        }
      } catch {
        alert("Terjadi kesalahan server");
      }
    }
  };

  // Handler update akun (PUT)
  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.username ||
      !form.password ||
      !form.role ||
      !form.division ||
      !form.skema
    ) {
      alert("Mohon lengkapi semua field");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/${editingIndex}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nama_pengguna: form.username,
            password: form.password,
            id_peran: Number(form.role),
            id_divisi: Number(form.division),
            id_skema: Number(form.skema),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal update akun");
      } else {
        alert("Akun berhasil diupdate!");
        fetch("http://localhost:5000/api/user")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setAccounts(data);
          });
        setEditingIndex(null);
        setForm({
          username: "",
          password: "",
          role: "",
          division: "",
          skema: "",
        });
      }
    } catch {
      alert("Terjadi kesalahan server");
    }
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
      <Card
        className="shadow-lg border border-border rounded-xl bg-white mx-auto"
        style={{ maxWidth: "1300px" }}
      >
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
            <form
              onSubmit={
                editingIndex ? handleUpdateAccount : handleCreateAccount
              }
              className="space-y-4"
            >
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
                  <SelectTrigger className="bg-white border border-border">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border">
                    {roleOptions.length === 0 ? (
                      <SelectItem value="__loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      roleOptions.map((role: any) => (
                        <SelectItem
                          key={role.id_peran}
                          value={String(role.id_peran)}
                        >
                          {role.peran}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {form.role &&
                (getPeranName(Number(form.role)).toLowerCase() === "divisi" ||
                  form.role === "2") && (
                  <div>
                    <Label>Divisi</Label>
                    <Select
                      value={form.division}
                      onValueChange={(v) => setForm({ ...form, division: v })}
                      required
                    >
                      <SelectTrigger className="bg-white border border-border">
                        <SelectValue placeholder="Pilih divisi" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-border max-h-60 overflow-y-auto">
                        {divisiOptions.length === 0 ? (
                          <SelectItem value="__loading" disabled>
                            Memuat...
                          </SelectItem>
                        ) : (
                          divisiOptions.map((div: any) => (
                            <SelectItem
                              key={div.id_divisi}
                              value={String(div.id_divisi)}
                            >
                              {div.divisi}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              <div>
                <Label>Skema Database</Label>
                <Select
                  value={form.skema}
                  onValueChange={(v) => setForm({ ...form, skema: v })}
                  required
                >
                  <SelectTrigger className="bg-white border border-border">
                    <SelectValue placeholder="Pilih skema database" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border">
                    {schemaOptions.length === 0 ? (
                      <SelectItem value="__loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      schemaOptions.map((schema: any) => (
                        <SelectItem
                          key={schema.id_skema}
                          value={String(schema.id_skema)}
                        >
                          {schema.skema}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {editingIndex ? "Update Akun" : "Buat Akun"}
              </Button>
              {editingIndex && (
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
                      <tr
                        key={acc.id_user ?? acc.id ?? idx}
                        className="hover:bg-muted/10 transition"
                      >
                        <td className="border px-4 py-2">
                          {acc.nama_pengguna ?? acc.username}
                        </td>
                        <td className="border px-4 py-2">
                          {acc.password ?? "-"}
                        </td>
                        <td className="border px-4 py-2">
                          {getPeranName(acc.id_peran)}
                        </td>
                        <td className="border px-4 py-2">
                          {getDivisiName(acc.id_divisi)}
                        </td>
                        <td className="border px-4 py-2">
                          {getSkemaName(acc.id_skema)}
                        </td>
                        <td className="border px-4 py-2">
                          {formatLocalTime(acc.created_at)}
                        </td>
                        <td className="border px-4 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAccount(acc)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteAccount(acc.id_user ?? acc.id)
                            }
                            disabled={
                              acc.nama_pengguna === "superadmin" ||
                              acc.username === "superadmin"
                            }
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
