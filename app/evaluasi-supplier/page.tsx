"use client";

import { useState, useEffect } from "react";

interface EvaluasiSupplier {
  id: string;
  supplier: string;
  periode: string;
  kualitasBarang: number;
  ketepatanWaktu: number;
  pelayanan: number;
  harga: number;
  komunikasi: number;
  compliance: number;
  totalScore: number;
  grade: "A" | "B" | "C" | "D";
  status: "Active" | "Warning" | "Blacklist";
  evaluator: string;
  tanggalEvaluasi: string;
  catatan: string;
  rekomendasiTindakLanjut: string;
}

export default function EvaluasiSupplierPage() {
  const [evaluasiData, setEvaluasiData] = useState<EvaluasiSupplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluasi, setEditingEvaluasi] =
    useState<EvaluasiSupplier | null>(null);
  const [filterPeriode, setFilterPeriode] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
  const [selectedSupplier, setSelectedSupplier] =
    useState<EvaluasiSupplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    supplier: "",
    periode: "",
    kualitasBarang: "",
    ketepatanWaktu: "",
    pelayanan: "",
    harga: "",
    komunikasi: "",
    compliance: "",
    catatan: "",
    rekomendasiTindakLanjut: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const stored = localStorage.getItem("evaluasiSupplierData");
    if (stored) {
      setEvaluasiData(JSON.parse(stored));
    } else {
      // Initialize with dummy data
      const dummyData: EvaluasiSupplier[] = [
        {
          id: "ES-001",
          supplier: "PT. Supplier A",
          periode: "Q1 2024",
          kualitasBarang: 92,
          ketepatanWaktu: 88,
          pelayanan: 90,
          harga: 85,
          komunikasi: 87,
          compliance: 95,
          totalScore: 89.5,
          grade: "A",
          status: "Active",
          evaluator: "Manager Procurement",
          tanggalEvaluasi: "2024-04-15",
          catatan: "Performa sangat baik.",
          rekomendasiTindakLanjut: "Pertahankan kerjasama.",
        },
      ];
      setEvaluasiData(dummyData);
      localStorage.setItem("evaluasiSupplierData", JSON.stringify(dummyData));
    }
  };
}
