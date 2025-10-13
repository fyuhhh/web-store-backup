"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Download, Plus, Edit, Trash2 } from "lucide-react"
import type { POData } from "@/lib/dummy-data"

interface BiayaPlan {
  id: string
  tahun: number
  bulan: string
  divisi: string
  kategori: string
  budgetPlan: number
  realisasi: number
  variance: number
  persentase: number
  keterangan: string
  createdAt: string
}

export default function BiayaPlanPage() {
  const [biayaPlanData, setBiayaPlanData] = useState<BiayaPlan[]>([])
  const [poData, setPoData] = useState<POData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<BiayaPlan | null>(null)
  const [filterTahun, setFilterTahun] = useState("2024")
  const [filterDivisi, setFilterDivisi] = useState("all")

  // Form state
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    bulan: "",
    divisi: "",
    kategori: "",
    budgetPlan: "",
    keterangan: "",
  })

  useEffect(() => {
    loadData()
    calculateRealisasi()
  }, [])

  const loadData = () => {
    const storedPlan = localStorage.getItem("biayaPlanData")
    const storedPO = localStorage.getItem("poData")

    if (storedPO) {
      setPoData(JSON.parse(storedPO))
    }

    if (storedPlan) {
      setBiayaPlanData(JSON.parse(storedPlan))
    } else {
      // Initialize with dummy data
      const dummyPlan: BiayaPlan[] = [
        {
          id: "BP-001",
          tahun: 2024,
          bulan: "Januari",
          divisi: "IT",
          kategori: "Hardware",
          budgetPlan: 100000000,
          realisasi: 75000000,
          variance: -25000000,
          persentase: 75,
          keterangan: "Budget untuk pembelian laptop dan perangkat IT",
          createdAt: new Date().toISOString(),
        },
        {
          id: "BP-002",
          tahun: 2024,
          bulan: "Februari",
          divisi: "Civil",
          kategori: "Material",
          budgetPlan: 200000000,
          realisasi: 180000000,
          variance: -20000000,
          persentase: 90,
          keterangan: "Budget untuk material konstruksi",
          createdAt: new Date().toISOString(),
        },
        {
          id: "BP-003",
          tahun: 2024,
          bulan: "Maret",
          divisi: "Eng",
          kategori: "Equipment",
          budgetPlan: 150000000,
          realisasi: 160000000,
          variance: 10000000,
          persentase: 107,
          keterangan: "Budget untuk peralatan engineering",
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("biayaPlanData", JSON.stringify(dummyPlan))
      setBiayaPlanData(dummyPlan)
    }
  }

  const calculateRealisasi = () => {
    // Calculate realisasi from PO data
    const storedPO = localStorage.getItem("poData")
    if (storedPO) {
      const pos: POData[] = JSON.parse(storedPO)
      // Update realisasi based on actual PO data
      // This is a simplified calculation
    }
  }

  const saveBiayaPlanData = (data: BiayaPlan[]) => {
    localStorage.setItem("biayaPlanData", JSON.stringify(data))
    setBiayaPlanData(data)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPlan) {
      // Update existing plan
      const updatedData = biayaPlanData.map((plan) =>
        plan.id === editingPlan.id
          ? {
              ...plan,
              ...formData,
              budgetPlan: Number.parseFloat(formData.budgetPlan),
              variance: plan.realisasi - Number.parseFloat(formData.budgetPlan),
              persentase: (plan.realisasi / Number.parseFloat(formData.budgetPlan)) * 100,
            }
          : plan,
      )
      saveBiayaPlanData(updatedData)
    } else {
      // Create new plan
      const newPlan: BiayaPlan = {
        id: `BP-${String(biayaPlanData.length + 1).padStart(3, "0")}`,
        tahun: formData.tahun,
        bulan: formData.bulan,
        divisi: formData.divisi,
        kategori: formData.kategori,
        budgetPlan: Number.parseFloat(formData.budgetPlan),
        realisasi: 0,
        variance: -Number.parseFloat(formData.budgetPlan),
        persentase: 0,
        keterangan: formData.keterangan,
        createdAt: new Date().toISOString(),
      }

      saveBiayaPlanData([...biayaPlanData, newPlan])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      tahun: new Date().getFullYear(),
      bulan: "",
      divisi: "",
      kategori: "",
      budgetPlan: "",
      keterangan: "",
    })
    setShowForm(false)
    setEditingPlan(null)
  }

  const handleEdit = (plan: BiayaPlan) => {
    setEditingPlan(plan)
    setFormData({
      tahun: plan.tahun,
      bulan: plan.bulan,
      divisi: plan.divisi,
      kategori: plan.kategori,
      budgetPlan: plan.budgetPlan.toString(),
      keterangan: plan.keterangan,
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus rencana biaya ini?")) {
      const updatedData = biayaPlanData.filter((plan) => plan.id !== id)
      saveBiayaPlanData(updatedData)
    }
  }

  const filteredData = biayaPlanData.filter((plan) => {
    const matchesTahun = plan.tahun.toString() === filterTahun
    const matchesDivisi = filterDivisi === "all" || plan.divisi === filterDivisi
    return matchesTahun && matchesDivisi
  })

  const getTotalBudget = () => filteredData.reduce((sum, plan) => sum + plan.budgetPlan, 0)
  const getTotalRealisasi = () => filteredData.reduce((sum, plan) => sum + plan.realisasi, 0)
  const getTotalVariance = () => filteredData.reduce((sum, plan) => sum + plan.variance, 0)

  const getChartData = () => {
    const monthlyData: Record<string, { budget: number; realisasi: number }> = {}
    filteredData.forEach((plan) => {
      if (!monthlyData[plan.bulan]) {
        monthlyData[plan.bulan] = { budget: 0, realisasi: 0 }
      }
      monthlyData[plan.bulan].budget += plan.budgetPlan
      monthlyData[plan.bulan].realisasi += plan.realisasi
    })

    return Object.entries(monthlyData).map(([bulan, data]) => ({
      bulan,
      budget: data.budget,
      realisasi: data.realisasi,
    }))
  }

  const handleExport = () => {
    const headers = ["Tahun", "Bulan", "Divisi", "Kategori", "Budget Plan", "Realisasi", "Variance", "Persentase"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((plan) =>
        [
          plan.tahun,
          plan.bulan,
          plan.divisi,
          plan.kategori,
          plan.budgetPlan,
          plan.realisasi,
          plan.variance,
          plan.persentase.toFixed(2),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `biaya-plan-${filterTahun}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Biaya Plan</h1>
            <p className="text-muted-foreground">Perencanaan dan monitoring budget vs realisasi</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Plan
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">Rp {getTotalBudget().toLocaleString("id-ID")}</div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">Rp {getTotalRealisasi().toLocaleString("id-ID")}</div>
              <div className="text-sm text-muted-foreground">Total Realisasi</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className={`text-2xl font-bold ${getTotalVariance() >= 0 ? "text-red-600" : "text-green-600"}`}>
                Rp {Math.abs(getTotalVariance()).toLocaleString("id-ID")}
              </div>
              <div className="text-sm text-muted-foreground">
                {getTotalVariance() >= 0 ? "Over Budget" : "Under Budget"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">
                {getTotalBudget() > 0 ? ((getTotalRealisasi() / getTotalBudget()) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Utilisasi Budget</div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>{editingPlan ? "Edit Biaya Plan" : "Tambah Biaya Plan"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tahun">Tahun</Label>
                    <Input
                      id="tahun"
                      type="number"
                      value={formData.tahun}
                      onChange={(e) => setFormData({ ...formData, tahun: Number.parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulan">Bulan</Label>
                    <Select
                      value={formData.bulan}
                      onValueChange={(value) => setFormData({ ...formData, bulan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Januari">Januari</SelectItem>
                        <SelectItem value="Februari">Februari</SelectItem>
                        <SelectItem value="Maret">Maret</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="Mei">Mei</SelectItem>
                        <SelectItem value="Juni">Juni</SelectItem>
                        <SelectItem value="Juli">Juli</SelectItem>
                        <SelectItem value="Agustus">Agustus</SelectItem>
                        <SelectItem value="September">September</SelectItem>
                        <SelectItem value="Oktober">Oktober</SelectItem>
                        <SelectItem value="November">November</SelectItem>
                        <SelectItem value="Desember">Desember</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="divisi">Divisi</Label>
                    <Select
                      value={formData.divisi}
                      onValueChange={(value) => setFormData({ ...formData, divisi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih divisi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Eng">Engineering</SelectItem>
                        <SelectItem value="FAD">Finance & Admin</SelectItem>
                        <SelectItem value="HRD">Human Resources</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kategori">Kategori</Label>
                    <Select
                      value={formData.kategori}
                      onValueChange={(value) => setFormData({ ...formData, kategori: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Material">Material</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budgetPlan">Budget Plan (Rp)</Label>
                    <Input
                      id="budgetPlan"
                      type="number"
                      value={formData.budgetPlan}
                      onChange={(e) => setFormData({ ...formData, budgetPlan: e.target.value })}
                      placeholder="100000000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Deskripsi budget plan"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingPlan ? "Update" : "Simpan"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Budget vs Realisasi</CardTitle>
            <CardDescription>Perbandingan budget plan dengan realisasi per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`} />
                <Bar dataKey="budget" fill="#3396D3" name="Budget Plan" />
                <Bar dataKey="realisasi" fill="#22c55e" name="Realisasi" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Detail Biaya Plan</CardTitle>
            <CardDescription>Menampilkan {filteredData.length} rencana biaya</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Budget Plan</TableHead>
                    <TableHead>Realisasi</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.bulan}</TableCell>
                      <TableCell>{plan.divisi}</TableCell>
                      <TableCell>{plan.kategori}</TableCell>
                      <TableCell>Rp {plan.budgetPlan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>Rp {plan.realisasi.toLocaleString("id-ID")}</TableCell>
                      <TableCell className={plan.variance >= 0 ? "text-red-600" : "text-green-600"}>
                        {plan.variance >= 0 ? "+" : ""}
                        {plan.variance.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{plan.persentase.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Progress value={Math.min(plan.persentase, 100)} className="w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(plan.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
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
