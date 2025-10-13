"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import {
  FileText,
  ShoppingCart,
  Package,
  PackageOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

// Dummy data for dashboard
const kpiData = {
  totalPR: 156,
  totalPO: 89,
  totalBTB: 67,
  totalBKB: 45,
  prOnTime: 78,
  prDelayed: 12,
  avgProcessTime: 2.3,
  budgetUtilization: 67.5,
};

const monthlyData = [
  { month: "Jan", PR: 12, PO: 8, BTB: 6, BKB: 4 },
  { month: "Feb", PR: 15, PO: 12, BTB: 9, BKB: 7 },
  { month: "Mar", PR: 18, PO: 14, BTB: 11, BKB: 8 },
  { month: "Apr", PR: 22, PO: 16, BTB: 13, BKB: 10 },
  { month: "Mei", PR: 25, PO: 19, BTB: 15, BKB: 12 },
  { month: "Jun", PR: 28, PO: 21, BTB: 17, BKB: 14 },
];

const statusData = [
  { name: "Selesai", value: 45, color: "hsl(var(--success))" },
  { name: "Proses", value: 30, color: "hsl(var(--primary))" },
  { name: "Tertunda", value: 15, color: "hsl(var(--warning))" },
  { name: "Dibatalkan", value: 10, color: "hsl(var(--destructive))" },
];

const supplierData = [
  { name: "PT. Supplier A", rating: 4.8, orders: 23, onTime: 95 },
  { name: "PT. Supplier B", rating: 4.5, orders: 18, onTime: 88 },
  { name: "PT. Supplier C", rating: 4.2, orders: 15, onTime: 82 },
  { name: "PT. Supplier D", rating: 3.9, orders: 12, onTime: 75 },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PR</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {kpiData.totalPR}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% dari bulan lalu
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PO</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {kpiData.totalPO}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% dari bulan lalu
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total BTB</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {kpiData.totalBTB}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% dari bulan lalu
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total BKB</CardTitle>
              <PackageOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {kpiData.totalBKB}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-destructive flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -2% dari bulan lalu
                </span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SLA and Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                SLA Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>PR Tepat Waktu</span>
                  <span className="font-medium">
                    {kpiData.prOnTime}/{kpiData.totalPR}
                  </span>
                </div>
                <Progress
                  value={(kpiData.prOnTime / kpiData.totalPR) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Rata-rata Waktu Proses</span>
                  <span className="font-medium">
                    {kpiData.avgProcessTime} hari
                  </span>
                </div>
                <Badge
                  variant={
                    kpiData.avgProcessTime <= 3 ? "default" : "destructive"
                  }
                >
                  {kpiData.avgProcessTime <= 3 ? "Baik" : "Perlu Perbaikan"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Utilisasi Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-2">
                {kpiData.budgetUtilization}%
              </div>
              <Progress
                value={kpiData.budgetUtilization}
                className="h-3 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Rp 2.4M dari Rp 3.6M budget tahunan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-success mr-2" />
                    <span className="text-sm">Selesai</span>
                  </div>
                  <span className="text-sm font-medium">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Proses</span>
                  </div>
                  <span className="text-sm font-medium">30</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-warning mr-2" />
                    <span className="text-sm">Tertunda</span>
                  </div>
                  <span className="text-sm font-medium">15</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trend Bulanan</CardTitle>
              <CardDescription>
                Aktivitas PR-PO-BTB-BKB per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="PR" fill="hsl(var(--primary))" />
                  <Bar dataKey="PO" fill="hsl(var(--success))" />
                  <Bar dataKey="BTB" fill="hsl(var(--warning))" />
                  <Bar dataKey="BKB" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribusi Status</CardTitle>
              <CardDescription>Status keseluruhan dokumen</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Evaluasi Supplier</CardTitle>
            <CardDescription>
              Performance supplier berdasarkan rating dan ketepatan waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierData.map((supplier, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {supplier.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>Rating: {supplier.rating}/5</span>
                      <span>Orders: {supplier.orders}</span>
                      <span>On-time: {supplier.onTime}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={supplier.onTime} className="w-20 h-2" />
                    <Badge
                      variant={
                        supplier.onTime >= 90
                          ? "default"
                          : supplier.onTime >= 80
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {supplier.onTime >= 90
                        ? "Excellent"
                        : supplier.onTime >= 80
                        ? "Good"
                        : "Poor"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// Jika ada filter data, pastikan menggunakan skema
// Contoh: data.filter((d) => !userSkema || d.skema === userSkema)
