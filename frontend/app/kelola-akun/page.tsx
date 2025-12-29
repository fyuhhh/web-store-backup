"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Users,
  LogOut,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

export default function KelolaAkunPage() {
  const [tab, setTab] = useState<String>("buat");
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Ambil id_peran dari roleOptions dan mapping peran dari backend
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
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  }

  // Handler buat akun baru (POST ke backend)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Validasi
    if (
      !form.username ||
      !form.password ||
      !form.role ||
      !form.skema ||
      (getPeranName(Number(form.role)).toLowerCase() === "divisi" &&
        !form.division)
    ) {
      alert("Mohon lengkapi semua field");
      setLoading(false);
      return;
    }
    try {
      const isDivisi =
        getPeranName(Number(form.role)).toLowerCase() === "divisi";
      const res = await fetch("http://localhost:5000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_pengguna: form.username,
          password: form.password,
          id_peran: Number(form.role),
          id_divisi: isDivisi ? Number(form.division) : null, // <-- kirim null jika bukan divisi
          id_skema: Number(form.skema),
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
    setTab("buat"); // Auto switch to form tab
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar Minimalis */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">Manajemen Akun</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          defaultValue="buat"
          value={String(tab)}
          onValueChange={(v) => setTab(v as any)}
          className="space-y-8"
        >
          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Admin</h2>
              <p className="text-slate-500 mt-1">Kelola pengguna dan hak akses aplikasi.</p>
            </div>
            <TabsList className="bg-white p-1 border border-slate-200 rounded-lg shadow-sm">
              <TabsTrigger
                value="buat"
                className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {editingIndex ? "Mode Edit" : "Buat Baru"}
              </TabsTrigger>
              <TabsTrigger
                value="monitoring"
                className="px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Monitoring
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content: Buat / Edit Akun */}
          <TabsContent value="buat" className="focus-visible:outline-none">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
              <CardHeader className="pb-8 border-b border-slate-100 bg-white">
                <CardTitle className="text-xl flex items-center gap-2 text-slate-800">
                  {editingIndex ? (
                    <>
                      <Edit2 className="w-5 h-5 text-blue-600" />
                      Update Identitas Akun
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 text-blue-600" />
                      Registrasi Akun Baru
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Lengkapi informasi di bawah ini untuk {editingIndex ? "memperbarui" : "mendaftarkan"} pengguna ke dalam sistem.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 bg-white">
                <form
                  onSubmit={
                    editingIndex ? handleUpdateAccount : handleCreateAccount
                  }
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                          Nama Pengguna <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="username"
                          value={form.username}
                          onChange={(e) =>
                            setForm({ ...form, username: e.target.value })
                          }
                          required
                          placeholder="Contoh: ahmad_admin"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                        />
                        <p className="text-xs text-slate-400">Gunakan kombinasi huruf dan angka tanpa spasi.</p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                          Kata Sandi <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                          required
                          placeholder="••••••••"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">
                          Peran Akun <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.role}
                          onValueChange={(v) => setForm({ ...form, role: v })}
                          required
                        >
                          <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                            <SelectValue placeholder="Pilih tingkat akses" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 shadow-md">
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

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">
                          Skema Database <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.skema}
                          onValueChange={(v) => setForm({ ...form, skema: v })}
                          required
                        >
                          <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                            <SelectValue placeholder="Pilih koneksi database" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-slate-200 shadow-md">
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

                      {form.role &&
                        (getPeranName(Number(form.role)).toLowerCase() ===
                          "divisi" ||
                          form.role === "2") && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-sm font-semibold text-slate-700">
                              Divisi Terkait <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={form.division}
                              onValueChange={(v) =>
                                setForm({ ...form, division: v })
                              }
                              required
                            >
                              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white">
                                <SelectValue placeholder="Pilih divisi departemen" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 shadow-md">
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
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                    {editingIndex && (
                      <Button
                        type="button"
                        variant="outline"
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
                        className="h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Batal Edit
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className={`h-11 px-8 text-base font-semibold shadow-md transition-all ${editingIndex
                          ? "bg-orange-500 hover:bg-orange-600"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {loading ? (
                        "Memproses..."
                      ) : editingIndex ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Simpan Perubahan
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5 mr-2" />
                          Buat Akun
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content: Monitoring */}
          <TabsContent value="monitoring" className="focus-visible:outline-none">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Daftar Pengguna Aktif</CardTitle>
                    <CardDescription>Total {accounts.length} akun terdaftar dalam sistem.</CardDescription>
                  </div>
                  {/* Fake Search Bar for visual polish */}
                  <div className="relative w-64 hidden sm:block">
                    <Input placeholder="Cari pengguna..." className="bg-white border-slate-200 pl-10 h-9 focus:border-blue-500 focus:ring-blue-500/20" disabled />
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-700 w-[50px]">No</TableHead>
                      <TableHead className="font-semibold text-slate-700">Pengguna</TableHead>
                      <TableHead className="font-semibold text-slate-700">Akses</TableHead>
                      <TableHead className="font-semibold text-slate-700">Keterangan</TableHead>
                      <TableHead className="font-semibold text-slate-700">Tanggal Dibuat</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 w-[120px]">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Users className="w-8 h-8 text-slate-300" />
                            <p>Belum ada data akun.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((acc, idx) => (
                        <TableRow key={acc.id_user ?? acc.id ?? idx} className="hover:bg-blue-50/30 transition-colors border-b border-slate-100">
                          <TableCell className="text-slate-500 text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-sm">
                                {acc.nama_pengguna ?? acc.username}
                              </span>
                              <span className="text-xs text-slate-400 font-mono mt-0.5">
                                PW: {acc.plain_password ?? "******"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Badge
                                className={`px-3 py-1 border shadow-sm font-medium ${getPeranName(acc.id_peran).toLowerCase() === "admin"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                variant="outline"
                              >
                                {getPeranName(acc.id_peran)}
                              </Badge>
                              <Badge variant="outline" className="text-xs text-slate-500 border-slate-200 font-normal bg-white">
                                {getSkemaName(acc.id_skema)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getDivisiName(acc.id_divisi) !== "-" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {getDivisiName(acc.id_divisi)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatLocalTime(acc.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                onClick={() => handleEditAccount(acc)}
                                title="Edit Akun"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                onClick={() => handleDeleteAccount(acc.id_user ?? acc.id)}
                                disabled={
                                  acc.nama_pengguna === "superadmin" ||
                                  acc.username === "superadmin"
                                }
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
