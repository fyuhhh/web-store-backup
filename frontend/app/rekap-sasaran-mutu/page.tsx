"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, TrendingUp, TrendingDown } from "lucide-react"

interface SasaranMutu {
  id: string
  tahun: number
  periode: string
  indikator: string
  target: number
  realisasi: number
  satuan: string
  pencapaian: number
  status: "Tercapai" | "Tidak Tercapai" | "Dalam Proses"
  divisi: string
  keterangan: string
  createdAt: string
}

export default function RekapSasaranMutuPage() {
  const [sasaranMutuData, setSasaranMutuData] = useState<SasaranMutu[]>([])
  const [filterTahun, setFilterTahun] = useState("2024")
  const [filterDivisi, setFilterDivisi] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const stored = localStorage.getItem("sasaranMutuData")
    if (stored) {
      setSasaranMutuData(JSON.parse(stored))
    } else {
      // Initialize with dummy data
      const dummyData: SasaranMutu[] = [
        {
          id: "SM-001",
          tahun: 2024,
          periode: "Q1 2024",
          indikator: "Ketepatan Waktu Pengadaan",
          target: 95,
          realisasi: 92,
          satuan: "%",
          pencapaian: 96.8,
          status: "Tercapai",
          divisi: "Procurement",
          keterangan: "Target hampir tercapai dengan sedikit penyesuaian",
          createdAt: new Date().toISOString(),
        },
        {
          id: "SM-002",
          tahun: 2024,
          periode: "Q1 2024",
          indikator: "Efisiensi Biaya",
          target: 90,
          realisasi: 85,
          satuan: "%",
          pencapaian: 94.4,
          status: "Tercapai",
          divisi: "Finance",
          keterangan: "Efisiensi biaya mencapai target yang ditetapkan",
          createdAt: new Date().toISOString(),
        },
        {
          id: "SM-003",
          tahun: 2024,
          periode: "Q1 2024",
          indikator: "Kepuasan Supplier",
          target: 85,
          realisasi: 78,
          satuan: "%",
          pencapaian: 91.8,
          status: "Tidak Tercapai",
          divisi: "Procurement",
          keterangan: "Perlu perbaikan dalam komunikasi dengan supplier",
          createdAt: new Date().toISOString(),
        },
        {
          id: "SM-004",
          tahun: 2024,
          periode: "Q2 2024",
          indikator: "Kualitas Barang Diterima",
          target: 98,
          realisasi: 96,
          satuan: "%",
          pencapaian: 98.0,
          status: "Tercapai",
          divisi: "Quality Control",
          keterangan: "Kualitas barang memenuhi standar yang ditetapkan",
          createdAt: new Date().toISOString(),
        },
        {
          id: "SM-005",
          tahun: 2024,
          periode: "Q2 2024",
          indikator: "Waktu Proses PR ke PO",
          target: 3,
          realisasi: 2.5,
          satuan: "hari",
          pencapaian: 120.0,
          status: "Tercapai",
          divisi: "Procurement",
          keterangan: "Proses lebih cepat dari target yang ditetapkan",
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("sasaranMutuData", JSON.stringify(dummyData))
      setSasaranMutuData(dummyData)
    }
  }

  const filteredData = sasaranMutuData.filter((item) => {
    const matchesTahun = item.tahun.toString() === filterTahun
    const matchesDivisi = filterDivisi === "all" || item.divisi === filterDivisi
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    return matchesTahun && matchesDivisi && matchesStatus
  })

  const getStatusStats = () => {
    return {
      tercapai: filteredData.filter((item) => item.status === "Tercapai").length,
      tidakTercapai: filteredData.filter((item) => item.status === "Tidak Tercapai").length,
      dalamProses: filteredData.filter((item) => item.status === "Dalam Proses").length,
      total: filteredData.length,
    }
  }

  const getAveragePencapaian = () => {
    if (filteredData.length === 0) return 0
    return filteredData.reduce((sum, item) => sum + item.pencapaian, 0) / filteredData.length
  }

  const getChartData = () => {
    const periodeData: Record<string, { target: number; realisasi: number; count: number }> = {}
    filteredData.forEach((item) => {
      if (!periodeData[item.periode]) {
        periodeData[item.periode] = { target: 0, realisasi: 0, count: 0 }
      }
      periodeData[item.periode].target += item.target
      periodeData[item.periode].realisasi += item.realisasi
      periodeData[item.periode].count += 1
    })

    return Object.entries(periodeData).map(([periode, data]) => ({
      periode,
      target: data.target / data.count,
      realisasi: data.realisasi / data.count,
    }))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Tercapai: "default",
      "Tidak Tercapai": "destructive",
      "Dalam Proses": "secondary",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  const handleExport = () => {
    const headers = [
      "Periode",
      "Indikator",
      "Target",
      "Realisasi",
      "Satuan",
      "Pencapaian",
      "Status",
      "Divisi",
      "Keterangan",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          item.periode,
          item.indikator,
          item.target,
          item.realisasi,
          item.satuan,
          item.pencapaian.toFixed(1),
          item.status,
          item.divisi,
          `"${item.keterangan}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rekap-sasaran-mutu-${filterTahun}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = getStatusStats()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rekap Sasaran Mutu</h1>
            <p className="text-muted-foreground">Monitoring pencapaian sasaran mutu organisasi</p>
          </div>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Indikator</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.tercapai}</div>
              <div className="text-sm text-muted-foreground">Tercapai</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.tidakTercapai}</div>
              <div className="text-sm text-muted-foreground">Tidak Tercapai</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{getAveragePencapaian().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Rata-rata Pencapaian</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDivisi} onValueChange={setFilterDivisi}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Quality Control">Quality Control</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Tercapai">Tercapai</SelectItem>
                  <SelectItem value="Tidak Tercapai">Tidak Tercapai</SelectItem>
                  <SelectItem value="Dalam Proses">Dalam Proses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Trend Pencapaian Sasaran Mutu</CardTitle>
            <CardDescription>Perbandingan target vs realisasi per periode</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periode" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="target" stroke="#3396D3" name="Target" strokeWidth={2} />
                <Line type="monotone" dataKey="realisasi" stroke="#22c55e" name="Realisasi" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Sasaran Mutu</CardTitle>
            <CardDescription>Menampilkan {filteredData.length} indikator sasaran mutu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Indikator</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Realisasi</TableHead>
                    <TableHead>Pencapaian</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.periode}</TableCell>
                      <TableCell className="font-medium">{item.indikator}</TableCell>
                      <TableCell>
                        {item.target} {item.satuan}
                      </TableCell>
                      <TableCell>
                        {item.realisasi} {item.satuan}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {item.pencapaian >= 100 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                          )}
                          {item.pencapaian.toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Progress value={Math.min(item.pencapaian, 100)} className="w-20" />
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.divisi}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.keterangan}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
