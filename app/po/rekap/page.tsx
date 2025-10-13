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
import { Download, Edit, Trash2 } from "lucide-react";
import type { POData } from "@/lib/dummy-data";

export default function RekapPOPage() {
  const [poData, setPoData] = useState<POData[]>([]);
  const [filterBulan, setFilterBulan] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("poData");
    if (stored) {
      setPoData(JSON.parse(stored));
    }
  }, []);

  const getRekapBySupplier = () => {
    const supplierData: Record<string, { count: number; total: number }> = {};
    poData.forEach((po) => {
      if (!supplierData[po.supplier]) {
        supplierData[po.supplier] = { count: 0, total: 0 };
      }
      supplierData[po.supplier].count += 1;
      supplierData[po.supplier].total += po.totalPembayaran;
    });

    return Object.entries(supplierData).map(([supplier, data]) => ({
      supplier,
      count: data.count,
      total: data.total,
      color: ["#3396D3", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"][
        Object.keys(supplierData).indexOf(supplier) % 5
      ],
    }));
  };

  const getRekapByBulan = () => {
    const bulanData: Record<string, { count: number; total: number }> = {};
    poData.forEach((po) => {
      const date = new Date(po.tanggalPO);
      const bulan = date.toLocaleDateString("id-ID", { month: "long" });
      if (!bulanData[bulan]) {
        bulanData[bulan] = { count: 0, total: 0 };
      }
      bulanData[bulan].count += 1;
      bulanData[bulan].total += po.totalPembayaran;
    });

    return Object.entries(bulanData).map(([bulan, data]) => ({
      bulan,
      count: data.count,
      total: data.total,
    }));
  };

  const getStatusDistribution = () => {
    const statusCount: Record<string, number> = {};
    poData.forEach((po) => {
      statusCount[po.status] = (statusCount[po.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      color:
        {
          Draft: "#6b7280",
          Submitted: "#3b82f6",
          Approved: "#22c55e",
          Delivered: "#f59e0b",
          Completed: "#10b981",
        }[status] || "#6b7280",
    }));
  };

  const filteredData = poData.filter((po) => {
    const date = new Date(po.tanggalPO);
    const bulan = date.toLocaleDateString("id-ID", { month: "long" });
    const matchesBulan = filterBulan === "all" || bulan === filterBulan;
    const matchesSupplier =
      filterSupplier === "all" || po.supplier === filterSupplier;
    return matchesBulan && matchesSupplier;
  });

  const getTotalValue = () => {
    return filteredData.reduce((sum, po) => sum + po.totalPembayaran, 0);
  };

  const handleExport = () => {
    const headers = [
      "No PO",
      "Tanggal",
      "Supplier",
      "Total Item",
      "Diskon",
      "PPN",
      "Total",
      "Status",
      "Di order oleh",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((po) => {
        const totalItems = po.poItems.reduce(
          (sum, poItem) =>
            sum +
            poItem.items.reduce(
              (itemSum, item) =>
                itemSum + (item.jumlahPO > 0 ? item.jumlahPO : 0),
              0
            ),
          0
        );
        return [
          po.noPO,
          po.tanggalPO,
          po.supplier,
          totalItems,
          po.diskon,
          po.ppn,
          po.totalPembayaran,
          po.status,
          po.orderedBy,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-po-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditPO = (po: POData) => {
    // For now, just alert. In a real app, this would open an edit modal or navigate to edit page
    alert(`Edit PO ${po.noPO} - Feature coming soon!`);
  };

  const handleDeletePO = (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus PO ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      const updatedData = poData.filter((po) => po.id !== id);
      localStorage.setItem("poData", JSON.stringify(updatedData));
      setPoData(updatedData);
      alert("PO berhasil dihapus!");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rekap PO</h1>
            <p className="text-muted-foreground">
              Laporan dan analisis Purchase Order
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {filteredData.length}
              </div>
              <div className="text-sm text-muted-foreground">Total PO</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">
                Rp {getTotalValue().toLocaleString("id-ID")}
              </div>
              <div className="text-sm text-muted-foreground">Total Nilai</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-success">
                {filteredData.filter((po) => po.status === "Completed").length}
              </div>
              <div className="text-sm text-muted-foreground">PO Selesai</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-warning">
                {
                  filteredData.filter(
                    (po) =>
                      po.status === "Approved" || po.status === "Delivered"
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">PO Proses</div>
            </CardContent>
          </Card>
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
              <Select
                value={filterSupplier || "all"}
                onValueChange={setFilterSupplier}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Supplier</SelectItem>
                  {Array.from(new Set(poData.map((po) => po.supplier)))
                    .filter((supplier) => supplier && supplier.trim() !== "")
                    .map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Rekap per Supplier</CardTitle>
              <CardDescription>
                Jumlah dan nilai PO berdasarkan supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRekapBySupplier()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "count"
                        ? value
                        : `Rp ${value.toLocaleString("id-ID")}`,
                      name === "count" ? "Jumlah PO" : "Total Nilai",
                    ]}
                  />
                  <Bar dataKey="count" fill="#3396D3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribusi Status</CardTitle>
              <CardDescription>Status PO saat ini</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Trend Bulanan */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Trend Nilai PO Bulanan</CardTitle>
            <CardDescription>Total nilai PO per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getRekapByBulan()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                    "Total Nilai",
                  ]}
                />
                <Bar dataKey="total" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detail Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Rekap</CardTitle>
            <CardDescription>
              Menampilkan {filteredData.length} dari {poData.length} total PO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-w-[1100px]">
              <Table className="border border-gray-300 min-w-[1100px]">
                <TableHeader>
                  <TableRow className="border-b border-gray-300">
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[140px]">
                      No. PO
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[140px]">
                      Tanggal
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[140px]">
                      Supplier
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[100px]">
                      Total Item
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[120px]">
                      Total Pembayaran
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-2 text-left border-r border-gray-300 min-w-[100px]">
                      Di order oleh
                    </TableHead>
                    <TableHead className="w-24 px-4 py-2 text-left border-gray-300">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((po) => {
                    const totalItems = po.poItems.reduce(
                      (sum, poItem) =>
                        sum +
                        poItem.items.reduce(
                          (itemSum, item) =>
                            itemSum + (item.jumlahPO > 0 ? item.jumlahPO : 0),
                          0
                        ),
                      0
                    );
                    return (
                      <TableRow
                        key={po.id}
                        className="border-b border-gray-300 align-middle"
                      >
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[120px] font-medium">
                          {po.noPO}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[120px]">
                          {po.tanggalPO}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[140px]">
                          {po.supplier}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[100px]">
                          {totalItems} item
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[120px]">
                          Rp {po.totalPembayaran.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[100px]">
                          {po.status}
                        </TableCell>
                        <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[100px]">
                          {po.orderedBy}
                        </TableCell>
                        <TableCell className="px-4 py-2 text-left border-gray-300 align-middle">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPO(po)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePO(po.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
