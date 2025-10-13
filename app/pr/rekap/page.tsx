"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download } from "lucide-react";
import type { PRData } from "@/lib/dummy-data";

export default function RekapPRPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [filterBulan, setFilterBulan] = useState("all");
  const [filterDivisi, setFilterDivisi] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("prData");
    if (stored) {
      const parsedData = JSON.parse(stored);
      setPrData(parsedData as PRData[]);
    }
  }, []);

  const getRekapByDivisi = () => {
    const divisiCount: Record<string, number> = {};
    prData.forEach((pr) => {
      divisiCount[pr.divisi] = (divisiCount[pr.divisi] || 0) + 1;
    });

    return Object.entries(divisiCount).map(([divisi, count]) => ({
      divisi,
      count,
      color:
        {
          IT: "#3396D3",
          Civil: "#22c55e",
          Eng: "#f59e0b",
          FAD: "#ef4444",
          HRD: "#8b5cf6",
        }[divisi] || "#6b7280",
    }));
  };

  const getRekapByBulan = () => {
    const bulanCount: Record<string, number> = {};
    prData.forEach((pr) => {
      const bulan = new Date(pr.tanggalPR).toLocaleString("default", {
        month: "long",
      });
      bulanCount[bulan] = (bulanCount[bulan] || 0) + 1;
    });

    return Object.entries(bulanCount).map(([bulan, count]) => ({
      bulan,
      count,
    }));
  };

  const filteredData = prData.filter((pr) => {
    const prBulan = new Date(pr.tanggalPR).toLocaleString("default", {
      month: "long",
    });
    const matchesBulan = filterBulan === "all" || prBulan === filterBulan;
    const matchesDivisi = filterDivisi === "all" || pr.divisi === filterDivisi;
    return matchesBulan && matchesDivisi;
  });

  const handleExport = () => {
    // Simple CSV export
    const headers = [
      "No PR",
      "Tanggal",
      "Daftar Barang",
      "Keterangan",
      "Divisi",
      "Urgensi",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.flatMap((pr) =>
        pr.items.map((item) =>
          [
            pr.noPR,
            pr.tanggalPR,
            `${item.namaBarang} - ${item.jumlah} ${item.satuan}`,
            item.keterangan || "-",
            pr.divisi,
            pr.urgensi,
            pr.status,
          ].join(",")
        )
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-pr-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rekap PR</h1>
            <p className="text-muted-foreground">
              Laporan dan analisis Purchase Request
            </p>
          </div>
          <Button
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={filterBulan} onValueChange={setFilterBulan}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  <SelectItem value="Januari">Januari</SelectItem>
                  <SelectItem value="Februari">Februari</SelectItem>
                  <SelectItem value="Maret">Maret</SelectItem>
                  <SelectItem value="April">April</SelectItem>
                  <SelectItem value="Mei">Mei</SelectItem>
                  <SelectItem value="Juni">Juni</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDivisi} onValueChange={setFilterDivisi}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="Eng">Engineering</SelectItem>
                  <SelectItem value="FAD">Finance & Admin</SelectItem>
                  <SelectItem value="HRD">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Rekap per Divisi</CardTitle>
              <CardDescription>Jumlah PR berdasarkan divisi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getRekapByDivisi()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ divisi, count }) => `${divisi}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getRekapByDivisi().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trend Bulanan</CardTitle>
              <CardDescription>Jumlah PR per bulan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRekapByBulan()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bulan" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3396D3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Rekap</CardTitle>
            <CardDescription>
              Menampilkan {filteredData.length} dari {prData.length} total PR
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. PR</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Daftar Barang</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Urgensi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">{pr.noPR}</TableCell>
                      <TableCell>{pr.tanggalPR}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {pr.items.map((item, index) => (
                            <div key={item.id} className="text-sm">
                              {index + 1}. {item.namaBarang} - {item.jumlah}{" "}
                              {item.satuan}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[200px]">
                          {pr.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="text-sm truncate"
                              title={item.keterangan || "Tidak ada keterangan"}
                            >
                              {item.keterangan || "-"}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{pr.divisi}</TableCell>
                      <TableCell>{pr.urgensi}</TableCell>
                      <TableCell>{pr.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
