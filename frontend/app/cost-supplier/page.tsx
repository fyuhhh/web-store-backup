"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, Search, TrendingUp, TrendingDown } from "lucide-react"
import type { POData } from "@/lib/dummy-data"

interface CostSupplier {
  id: string
  supplier: string
  kategori: string
  totalOrder: number
  totalValue: number
  averageOrderValue: number
  lastOrderDate: string
  paymentTerms: string
  discountRate: number
  performanceScore: number
  costTrend: "Naik" | "Turun" | "Stabil"
  riskLevel: "Rendah" | "Sedang" | "Tinggi"
}

export default function CostSupplierPage() {
  const [costSupplierData, setCostSupplierData] = useState<CostSupplier[]>([])
  const [poData, setPoData] = useState<POData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterKategori, setFilterKategori] = useState("all")
  const [filterRisk, setFilterRisk] = useState("all")
  const [sortBy, setSortBy] = useState("totalValue")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const storedPO = localStorage.getItem("poData")
    const storedCost = localStorage.getItem("costSupplierData")

    if (storedPO) {
      const pos: POData[] = JSON.parse(storedPO)
      setPoData(pos)

      if (!storedCost) {
        // Generate cost supplier data from PO data
        generateCostSupplierData(pos)
      }
    }

    if (storedCost) {
      setCostSupplierData(JSON.parse(storedCost))
    } else {
      // Initialize with dummy data
      const dummyData: CostSupplier[] = [
        {
          id: "CS-001",
          supplier: "PT. Supplier A",
          kategori: "Hardware",
          totalOrder: 15,
          totalValue: 450000000,
          averageOrderValue: 30000000,
          lastOrderDate: "2024-06-15",
          paymentTerms: "NET 30",
          discountRate: 5.5,
          performanceScore: 92,
          costTrend: "Stabil",
          riskLevel: "Rendah",
        },
        {
          id: "CS-002",
          supplier: "PT. Supplier B",
          kategori: "Software",
          totalOrder: 8,
          totalValue: 240000000,
          averageOrderValue: 30000000,
          lastOrderDate: "2024-06-10",
          paymentTerms: "NET 45",
          discountRate: 3.0,
          performanceScore: 88,
          costTrend: "Naik",
          riskLevel: "Sedang",
        },
        {
          id: "CS-003",
          supplier: "PT. Supplier C",
          kategori: "Material",
          totalOrder: 22,
          totalValue: 680000000,
          averageOrderValue: 30909091,
          lastOrderDate: "2024-06-20",
          paymentTerms: "NET 15",
          discountRate: 7.2,
          performanceScore: 95,
          costTrend: "Turun",
          riskLevel: "Rendah",
        },
        {
          id: "CS-004",
          supplier: "PT. Supplier D",
          kategori: "Service",
          totalOrder: 5,
          totalValue: 125000000,
          averageOrderValue: 25000000,
          lastOrderDate: "2024-05-28",
          paymentTerms: "NET 60",
          discountRate: 2.5,
          performanceScore: 78,
          costTrend: "Naik",
          riskLevel: "Tinggi",
        },
      ]
      localStorage.setItem("costSupplierData", JSON.stringify(dummyData))
      setCostSupplierData(dummyData)
    }
  }

  const generateCostSupplierData = (pos: POData[]) => {
    const supplierMap: Record<string, any> = {}

    pos.forEach((po) => {
      if (!supplierMap[po.supplier]) {
        supplierMap[po.supplier] = {
          supplier: po.supplier,
          totalOrder: 0,
          totalValue: 0,
          orders: [],
        }
      }

      supplierMap[po.supplier].totalOrder += 1
      supplierMap[po.supplier].totalValue += po.totalPembayaran
      supplierMap[po.supplier].orders.push(po)
    })

    const generatedData: CostSupplier[] = Object.values(supplierMap).map((supplier, index) => ({
      id: `CS-${String(index + 1).padStart(3, "0")}`,
      supplier: supplier.supplier,
      kategori: ["Hardware", "Software", "Material", "Service"][index % 4],
      totalOrder: supplier.totalOrder,
      totalValue: supplier.totalValue,
      averageOrderValue: supplier.totalValue / supplier.totalOrder,
      lastOrderDate: supplier.orders[supplier.orders.length - 1]?.tanggalPO || "2024-06-01",
      paymentTerms: ["NET 30", "NET 45", "NET 15", "NET 60"][index % 4],
      discountRate: Math.random() * 8 + 2,
      performanceScore: Math.random() * 30 + 70,
      costTrend: ["Naik", "Turun", "Stabil"][Math.floor(Math.random() * 3)] as any,
      riskLevel: ["Rendah", "Sedang", "Tinggi"][Math.floor(Math.random() * 3)] as any,
    }))

    localStorage.setItem("costSupplierData", JSON.stringify(generatedData))
    setCostSupplierData(generatedData)
  }

  const filteredData = costSupplierData
    .filter((supplier) => {
      const matchesSearch = supplier.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesKategori = filterKategori === "all" || supplier.kategori === filterKategori
      const matchesRisk = filterRisk === "all" || supplier.riskLevel === filterRisk
      return matchesSearch && matchesKategori && matchesRisk
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "totalValue":
          return b.totalValue - a.totalValue
        case "totalOrder":
          return b.totalOrder - a.totalOrder
        case "performanceScore":
          return b.performanceScore - a.performanceScore
        case "averageOrderValue":
          return b.averageOrderValue - a.averageOrderValue
        default:
          return 0
      }
    })

  const getTotalSpend = () => filteredData.reduce((sum, supplier) => sum + supplier.totalValue, 0)
  const getAverageDiscount = () => {
    if (filteredData.length === 0) return 0
    return filteredData.reduce((sum, supplier) => sum + supplier.discountRate, 0) / filteredData.length
  }

  const getTopSuppliers = () => {
    return filteredData.slice(0, 5).map((supplier) => ({
      supplier: supplier.supplier.substring(0, 15) + "...",
      value: supplier.totalValue,
      orders: supplier.totalOrder,
    }))
  }

  const getCostTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"]
    return months.map((month, index) => ({
      month,
      cost: Math.random() * 200000000 + 100000000,
      savings: Math.random() * 50000000 + 10000000,
    }))
  }

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Rendah: "default",
      Sedang: "secondary",
      Tinggi: "destructive",
    }
    return <Badge variant={variants[risk] || "secondary"}>{risk}</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Naik":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "Turun":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />
    }
  }

  const handleExport = () => {
    const headers = [
      "Supplier",
      "Kategori",
      "Total Order",
      "Total Value",
      "Average Order Value",
      "Last Order Date",
      "Payment Terms",
      "Discount Rate",
      "Performance Score",
      "Cost Trend",
      "Risk Level",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((supplier) =>
        [
          `"${supplier.supplier}"`,
          supplier.kategori,
          supplier.totalOrder,
          supplier.totalValue,
          supplier.averageOrderValue.toFixed(0),
          supplier.lastOrderDate,
          supplier.paymentTerms,
          supplier.discountRate.toFixed(1),
          supplier.performanceScore,
          supplier.costTrend,
          supplier.riskLevel,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cost-supplier-analysis-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cost Supplier</h1>
            <p className="text-muted-foreground">Analisis biaya dan performa supplier</p>
          </div>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">Rp {getTotalSpend().toLocaleString("id-ID")}</div>
              <div className="text-sm text-muted-foreground">Total Spend</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">{filteredData.length}</div>
              <div className="text-sm text-muted-foreground">Active Suppliers</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{getAverageDiscount().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Discount</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredData.filter((s) => s.riskLevel === "Tinggi").length}
              </div>
              <div className="text-sm text-muted-foreground">High Risk Suppliers</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Risk</SelectItem>
                  <SelectItem value="Rendah">Rendah</SelectItem>
                  <SelectItem value="Sedang">Sedang</SelectItem>
                  <SelectItem value="Tinggi">Tinggi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalValue">Total Value</SelectItem>
                  <SelectItem value="totalOrder">Total Orders</SelectItem>
                  <SelectItem value="performanceScore">Performance</SelectItem>
                  <SelectItem value="averageOrderValue">Avg Order Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Top 5 Suppliers by Value</CardTitle>
              <CardDescription>Supplier dengan nilai transaksi tertinggi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopSuppliers()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`} />
                  <Bar dataKey="value" fill="#3396D3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Cost Trend & Savings</CardTitle>
              <CardDescription>Trend biaya dan penghematan bulanan</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getCostTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`} />
                  <Line type="monotone" dataKey="cost" stroke="#3396D3" name="Total Cost" strokeWidth={2} />
                  <Line type="monotone" dataKey="savings" stroke="#22c55e" name="Savings" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Supplier Cost Analysis</CardTitle>
            <CardDescription>Detail analisis biaya per supplier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>Discount Rate</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Payment Terms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.supplier}</TableCell>
                      <TableCell>{supplier.kategori}</TableCell>
                      <TableCell>{supplier.totalOrder}</TableCell>
                      <TableCell>Rp {supplier.totalValue.toLocaleString("id-ID")}</TableCell>
                      <TableCell>Rp {supplier.averageOrderValue.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{supplier.discountRate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              supplier.performanceScore >= 90
                                ? "bg-green-500"
                                : supplier.performanceScore >= 80
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          {supplier.performanceScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getTrendIcon(supplier.costTrend)}
                          <span className="ml-1">{supplier.costTrend}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(supplier.riskLevel)}</TableCell>
                      <TableCell>{supplier.paymentTerms}</TableCell>
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
