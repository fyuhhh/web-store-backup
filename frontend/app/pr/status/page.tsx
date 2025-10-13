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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import type { PRData } from "@/lib/dummy-data";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Search,
} from "lucide-react";

export default function StatusPRPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUrgensi, setFilterUrgensi] = useState("");

  useEffect(() => {
    loadPRData();
  }, []);

  const loadPRData = () => {
    const stored = localStorage.getItem("prData");
    if (stored) {
      setPrData(JSON.parse(stored) as PRData[]);
    }
  };

  const savePRData = (data: PRData[]) => {
    localStorage.setItem("prData", JSON.stringify(data));
    setPrData(data);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus PR ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      try {
        const updatedData = prData.filter((pr) => pr.id !== id);
        savePRData(updatedData);

        // Show success message
        alert("PR berhasil dihapus!");

        // Reload data to ensure consistency
        loadPRData();
      } catch (error) {
        console.error("Error deleting PR:", error);
        alert("Terjadi kesalahan saat menghapus PR. Silakan coba lagi.");
      }
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: prData.length,
      draft: prData.filter((pr) => pr.status === "Draft").length,
      submitted: prData.filter((pr) => pr.status === "Submitted").length,
      approved: prData.filter((pr) => pr.status === "Approved").length,
      processed: prData.filter((pr) => pr.status === "Processed").length,
      clear: prData.filter((pr) => pr.status === "Clear").length,
      gantung: prData.filter((pr) => pr.status === "Gantung").length,
    };
    return stats;
  };

  const getSLAStatus = (tanggalPR: string) => {
    const prDate = new Date(tanggalPR);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - prDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3)
      return { status: "On Time", color: "text-success", icon: CheckCircle };
    if (diffDays <= 5)
      return {
        status: "Warning",
        color: "text-warning",
        icon: AlertTriangle,
      };
    return { status: "Delayed", color: "text-destructive", icon: XCircle };
  };

  const stats = getStatusStats();

  // Filter data
  const filteredPRData = prData.filter((pr) => {
    const matchesSearch =
      (pr.items &&
        pr.items.some((item) =>
          item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
      pr.noPR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivisi =
      !filterDivisi || filterDivisi === "all" || pr.divisi === filterDivisi;
    const matchesStatus =
      !filterStatus || filterStatus === "all" || pr.status === filterStatus;
    const matchesUrgensi =
      !filterUrgensi || filterUrgensi === "all" || pr.urgensi === filterUrgensi;
    return matchesSearch && matchesDivisi && matchesStatus && matchesUrgensi;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Status Pencapaian PR
          </h1>
          <p className="text-muted-foreground">
            Monitor status dan SLA Purchase Request
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total PR</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.draft}
              </div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.submitted}
              </div>
              <div className="text-sm text-muted-foreground">Submitted</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.approved}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">
                {stats.processed}
              </div>
              <div className="text-sm text-muted-foreground">Telah Selesai</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">
                {stats.clear}
              </div>
              <div className="text-sm text-muted-foreground">Clear</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {stats.gantung}
              </div>
              <div className="text-sm text-muted-foreground">Gantung</div>
            </CardContent>
          </Card>
        </div>

        {/* SLA Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>SLA Performance</CardTitle>
            <CardDescription>
              Target proses PR maksimal 3 hari kerja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>PR Tepat Waktu (≤ 3 hari)</span>
                  <span className="font-medium">
                    {
                      filteredPRData.filter((pr) => {
                        const sla = getSLAStatus(pr.tanggalPR);
                        return sla.status === "On Time";
                      }).length
                    }{" "}
                    / {stats.total}
                  </span>
                </div>
                <Progress
                  value={
                    stats.total > 0
                      ? (filteredPRData.filter((pr) => {
                          const sla = getSLAStatus(pr.tanggalPR);
                          return sla.status === "On Time";
                        }).length /
                          stats.total) *
                        100
                      : 0
                  }
                  className="h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan no PR, barang, atau keterangan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterDivisi} onValueChange={setFilterDivisi}>
                <SelectTrigger className="w-[150px]">
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Processed">Telah Selesai</SelectItem>
                  <SelectItem value="Clear">Clear</SelectItem>
                  <SelectItem value="Gantung">Gantung</SelectItem>
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUrgensi} onValueChange={setFilterUrgensi}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Urgensi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Urgensi</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Status PR</CardTitle>
            <CardDescription>
              Status lengkap semua Purchase Request (Total:{" "}
              {filteredPRData.length})
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
                    <TableHead>Divisi</TableHead>
                    <TableHead>Urgensi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Hari Proses</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPRData.map((pr) => {
                    const sla = getSLAStatus(pr.tanggalPR);
                    const prDate = new Date(pr.tanggalPR);
                    const today = new Date();
                    const diffTime = Math.abs(
                      today.getTime() - prDate.getTime()
                    );
                    const diffDays = Math.ceil(
                      diffTime / (1000 * 60 * 60 * 24)
                    );

                    return (
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
                        <TableCell>{pr.divisi}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pr.urgensi === "High"
                                ? "destructive"
                                : pr.urgensi === "Medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {pr.urgensi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              pr.status === "Processed" || pr.status === "Clear"
                                ? "default"
                                : pr.status === "Gantung"
                                ? "destructive"
                                : pr.status === "Menunggu"
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              pr.status === "Processed" || pr.status === "Clear"
                                ? "bg-success/10 text-success border-success/20"
                                : pr.status === "Gantung"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : pr.status === "Menunggu"
                                ? "bg-muted/50 text-muted-foreground border-muted/50"
                                : ""
                            }
                          >
                            {pr.status === "Processed" || pr.status === "Clear"
                              ? "Telah Selesai"
                              : pr.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div
                            className="text-sm text-muted-foreground max-w-xs truncate"
                            title={pr.keterangan}
                          >
                            {pr.keterangan}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center ${sla.color}`}>
                            <sla.icon className="h-4 w-4 mr-1" />
                            {sla.status}
                          </div>
                        </TableCell>
                        <TableCell>{diffDays} hari</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(pr.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
