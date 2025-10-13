"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Download, AlertTriangle, CheckCircle } from "lucide-react"

interface AnalisisMutu {
  id: string
  periode: string
  indikator: string
  pencapaian: number
  target: number
  gap: number
  kategoriRisiko: "Rendah" | "Sedang" | "Tinggi"
  akarMasalah: string
  rekomendasiPerbaikan: string
  targetPerbaikan: number
  timelinePerbaikan: string
  picPerbaikan: string
  status: "Analisis" | "Perbaikan" | "Monitoring" | "Selesai"
}

export default function AnalisaSasaranMutuPage() {
  const [analisisData, setAnalisisData] = useState<AnalisisMutu[]>([])
  const [filterPeriode, setFilterPeriode] = useState("all")
  const [filterRisiko, setFilterRisiko] = useState("all")
  const [selectedAnalisis, setSelectedAnalisis] = useState<AnalisisMutu | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const stored = localStorage.getItem("analisisMutuData")
    if (stored) {
      setAnalisisData(JSON.parse(stored))
    } else {
      // Initialize with dummy data
      const dummyData: AnalisisMutu[] = [
        {
          id: "AM-001",
          periode: "Q1 2024",
          indikator: "Ketepatan Waktu Pengadaan",
          pencapaian: 92,
          target: 95,
          gap: -3,
          kategoriRisiko: "Sedang",
          akarMasalah:
            "Proses approval yang terlalu panjang dan kurangnya koordinasi antar divisi dalam proses pengadaan",
          rekomendasiPerbaikan:
            "1. Streamline proses approval dengan digitalisasi\n2. Implementasi sistem notifikasi otomatis\n3. Training koordinasi antar divisi",
          targetPerbaikan: 97,
          timelinePerbaikan: "Q2 2024",
          picPerbaikan: "Manager Procurement",
          status: "Perbaikan",
        },
        {
          id: "AM-002",
          periode: "Q1 2024",
          indikator: "Kepuasan Supplier",
          pencapaian: 78,
          target: 85,
          gap: -7,
          kategoriRisiko: "Tinggi",
          akarMasalah: "Komunikasi yang kurang efektif dan proses pembayaran yang lambat",
          rekomendasiPerbaikan:
            "1. Implementasi portal supplier untuk komunikasi\n2. Percepatan proses pembayaran\n3. Regular supplier meeting",
          targetPerbaikan: 88,
          timelinePerbaikan: "Q3 2024",
          picPerbaikan: "Manager Finance",
          status: "Analisis",
        },
        {
          id: "AM-003",
          periode: "Q2 2024",
          indikator: "Kualitas Barang Diterima",
          pencapaian: 96,
          target: 98,
          gap: -2,
          kategoriRisiko: "Rendah",
          akarMasalah: "Beberapa supplier baru belum memahami standar kualitas yang ditetapkan",
          rekomendasiPerbaikan:
            "1. Supplier orientation program\n2. Quality audit berkala\n3. Penalty system untuk non-compliance",
          targetPerbaikan: 99,
          timelinePerbaikan: "Q3 2024",
          picPerbaikan: "Manager Quality Control",
          status: "Monitoring",
        },
      ]
      localStorage.setItem("analisisMutuData", JSON.stringify(dummyData))
      setAnalisisData(dummyData)
    }
  }

  const filteredData = analisisData.filter((item) => {
    const matchesPeriode = filterPeriode === "all" || item.periode === filterPeriode
    const matchesRisiko = filterRisiko === "all" || item.kategoriRisiko === filterRisiko
    return matchesPeriode && matchesRisiko
  })

  const getRisikoStats = () => {
    return {
      rendah: filteredData.filter((item) => item.kategoriRisiko === "Rendah").length,
      sedang: filteredData.filter((item) => item.kategoriRisiko === "Sedang").length,
      tinggi: filteredData.filter((item) => item.kategoriRisiko === "Tinggi").length,
    }
  }

  const getStatusStats = () => {
    return {
      analisis: filteredData.filter((item) => item.status === "Analisis").length,
      perbaikan: filteredData.filter((item) => item.status === "Perbaikan").length,
      monitoring: filteredData.filter((item) => item.status === "Monitoring").length,
      selesai: filteredData.filter((item) => item.status === "Selesai").length,
    }
  }

  const getGapAnalysisData = () => {
    return filteredData.map((item) => ({
      indikator: item.indikator.substring(0, 20) + "...",
      target: item.target,
      pencapaian: item.pencapaian,
      gap: Math.abs(item.gap),
    }))
  }

  const getRisikoDistribution = () => {
    const stats = getRisikoStats()
    return [
      { name: "Rendah", value: stats.rendah, color: "#22c55e" },
      { name: "Sedang", value: stats.sedang, color: "#f59e0b" },
      { name: "Tinggi", value: stats.tinggi, color: "#ef4444" },
    ]
  }

  const getRadarData = () => {
    const indicators = ["Ketepatan Waktu", "Kualitas", "Efisiensi", "Kepuasan", "Compliance"]
    return indicators.map((indicator) => {
      const relatedItems = filteredData.filter((item) => item.indikator.includes(indicator.split(" ")[0]))
      const avgPencapaian =
        relatedItems.length > 0
          ? relatedItems.reduce((sum, item) => sum + item.pencapaian, 0) / relatedItems.length
          : Math.random() * 100 + 50 // Dummy data for demo
      return {
        indicator,
        pencapaian: avgPencapaian,
        target: 95,
      }
    })
  }

  const getRisikoBadge = (risiko: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Rendah: "default",
      Sedang: "secondary",
      Tinggi: "destructive",
    }
    return <Badge variant={variants[risiko] || "secondary"}>{risiko}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Analisis: "outline",
      Perbaikan: "secondary",
      Monitoring: "default",
      Selesai: "default",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  const handleExport = () => {
    const headers = [
      "Periode",
      "Indikator",
      "Pencapaian",
      "Target",
      "Gap",
      "Kategori Risiko",
      "Akar Masalah",
      "Rekomendasi",
      "Target Perbaikan",
      "Timeline",
      "PIC",
      "Status",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((item) =>
        [
          item.periode,
          `"${item.indikator}"`,
          item.pencapaian,
          item.target,
          item.gap,
          item.kategoriRisiko,
          `"${item.akarMasalah}"`,
          `"${item.rekomendasiPerbaikan.replace(/\n/g, " | ")}"`,
          item.targetPerbaikan,
          item.timelinePerbaikan,
          item.picPerbaikan,
          item.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analisa-sasaran-mutu-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const risikoStats = getRisikoStats()
  const statusStats = getStatusStats()

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analisa Sasaran Mutu</h1>
            <p className="text-muted-foreground">Analisis gap dan rencana perbaikan sasaran mutu</p>
          </div>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export Analisis
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 mr-2" />
                {risikoStats.tinggi}
              </div>
              <div className="text-sm text-muted-foreground">Risiko Tinggi</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{risikoStats.sedang}</div>
              <div className="text-sm text-muted-foreground">Risiko Sedang</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{risikoStats.rendah}</div>
              <div className="text-sm text-muted-foreground">Risiko Rendah</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary flex items-center justify-center">
                <CheckCircle className="h-6 w-6 mr-2" />
                {statusStats.selesai}
              </div>
              <div className="text-sm text-muted-foreground">Perbaikan Selesai</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  <SelectItem value="Q1 2024">Q1 2024</SelectItem>
                  <SelectItem value="Q2 2024">Q2 2024</SelectItem>
                  <SelectItem value="Q3 2024">Q3 2024</SelectItem>
                  <SelectItem value="Q4 2024">Q4 2024</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisiko} onValueChange={setFilterRisiko}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Risiko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Risiko</SelectItem>
                  <SelectItem value="Tinggi">Risiko Tinggi</SelectItem>
                  <SelectItem value="Sedang">Risiko Sedang</SelectItem>
                  <SelectItem value="Rendah">Risiko Rendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Gap Analysis</CardTitle>
              <CardDescription>Perbandingan target vs pencapaian</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getGapAnalysisData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="indikator" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="target" fill="#3396D3" name="Target" />
                  <Bar dataKey="pencapaian" fill="#22c55e" name="Pencapaian" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribusi Risiko</CardTitle>
              <CardDescription>Kategori risiko berdasarkan gap analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getRisikoDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRisikoDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Performance Radar</CardTitle>
            <CardDescription>Analisis performa multi-dimensi sasaran mutu</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="indicator" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Pencapaian" dataKey="pencapaian" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Radar name="Target" dataKey="target" stroke="#3396D3" fill="#3396D3" fillOpacity={0.1} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Analysis Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Analisis</CardTitle>
            <CardDescription>Analisis mendalam dan rencana perbaikan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredData.map((item) => (
                <Card key={item.id} className="border border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.indikator}</CardTitle>
                        <CardDescription>
                          {item.periode} • PIC: {item.picPerbaikan}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        {getRisikoBadge(item.kategoriRisiko)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Performance</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Target:</span>
                            <span className="font-medium">{item.target}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pencapaian:</span>
                            <span className="font-medium">{item.pencapaian}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gap:</span>
                            <span className={`font-medium ${item.gap < 0 ? "text-red-600" : "text-green-600"}`}>
                              {item.gap}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Akar Masalah</h4>
                        <p className="text-sm text-muted-foreground">{item.akarMasalah}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Rencana Perbaikan</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {item.rekomendasiPerbaikan.split("\n").map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Target Perbaikan:</span> {item.targetPerbaikan}%
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Timeline:</span> {item.timelinePerbaikan}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
