"use client";

import React, { useState, useEffect } from "react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  ChevronDown,
} from "lucide-react";
// Pagination removed
import { type POData, type PRData, type BTBData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";

// Tambahkan helper parseNoPO dan sortPOList (sama seperti PO Monitoring)
function parseNoPO(noPO: string | null | undefined) {
  if (!noPO || typeof noPO !== "string") return null;
  const s = noPO.trim().toUpperCase();
  const regex = /^PO\/(E-?WALK|PSV)\/([A-Z0-9]+)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;
  const match = s.match(regex);
  if (!match) return null;
  const [, brand, store, tahun2, bulanRomawi, urutStr] = match;
  const bulanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };
  const bulan = bulanMap[bulanRomawi] ?? 0;
  const tahun = 2000 + parseInt(tahun2, 10);
  const urut = parseInt(urutStr, 10);
  return { tahun, bulan, urut, brand, store };
}

function parseNoPR(noPR: string | null | undefined) {
  if (!noPR || typeof noPR !== "string") return null;
  const s = noPR.trim().toUpperCase();
  const regex = /^PR\/(E-?WALK|PRQ)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;
  const match = s.match(regex);
  if (!match) return null;
  const [, brand, tahun2, bulanRomawi, urutStr] = match;
  const bulanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };
  const bulan = bulanMap[bulanRomawi] ?? 0;
  const tahun = 2000 + parseInt(tahun2, 10);
  const urut = parseInt(urutStr, 10);
  return { tahun, bulan, urut, brand };
}

function sortPOList(filteredPOData: any[]) {
  return [...filteredPOData].sort((a, b) => {
    const pa = parseNoPO(a.noPO);
    const pb = parseNoPO(b.noPO);

    // Jika keduanya punya format valid, urutkan berdasarkan komponen ID (ASC / Terkecil -> Terbesar)
    if (pa && pb) {
      // Tahun ASC
      if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun;

      // Bulan ASC
      if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan;

      // Nomor urut ASC
      return pa.urut - pb.urut;
    }

    // Fallback: jika salah satu atau keduanya tidak valid, urutkan tanggal (ASC / Terlama -> Terbaru)
    // Gunakan string comparison untuk tanggal YYYY-MM-DD
    const dateA = a.tanggalPO || "";
    const dateB = b.tanggalPO || "";
    return dateA.localeCompare(dateB);
  });
}

// ... existing code ...




export default function BTBInputPage() {
  const [poData, setPoData] = useState<POData[]>([]);
  const [btbData, setBtbData] = useState<BTBData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBTB, setEditingBTB] = useState<BTBData | null>(null);
  const [selectedPO, setSelectedPO] = useState<POData | null>(null);
  const [selectedPOsForBTB, setSelectedPOsForBTB] = useState<POData[]>([]);

  // PO table selection state
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  // Pagination states for PO table
  // Pagination states removed
  const tableWrapperRef = React.useRef<HTMLDivElement>(null);

  // Sinkronkan scroll antara tabel dan scrollbar custom
  React.useEffect(() => {
    const tableDiv = tableWrapperRef.current;
    if (!tableDiv) return;

    const handleTableScroll = () => {
      const stickyScrollbar = document.querySelector('.sticky') as HTMLElement;
      if (stickyScrollbar) {
        stickyScrollbar.scrollLeft = tableDiv.scrollLeft;
      }
    };

    tableDiv.addEventListener('scroll', handleTableScroll);
    return () => {
      tableDiv.removeEventListener('scroll', handleTableScroll);
    };
  }, []);


  // Search filter for PO table
  const [searchTerm, setSearchTerm] = useState("");

  // PO date range filter (start and end)
  const [poStartDate, setPoStartDate] = useState<Date | null>(null);
  const [poEndDate, setPoEndDate] = useState<Date | null>(null);

  // Set default rentang tanggal ke awal & akhir bulan saat halaman diakses
  useEffect(() => {
    if (poStartDate === null && poEndDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setPoStartDate(firstDay);
      setPoEndDate(lastDay);
    }
  }, [poStartDate, poEndDate]);

  // Filter states
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterKeterangan, setFilterKeterangan] = useState("");
  const [filterHargaSatuanMin, setFilterHargaSatuanMin] = useState<number | "">(
    ""
  );
  const [filterHargaSatuanMax, setFilterHargaSatuanMax] = useState<number | "">(
    ""
  );
  const [filterTotalMin, setFilterTotalMin] = useState<number | "">("");
  const [filterTotalMax, setFilterTotalMax] = useState<number | "">("");
  const [filterTanggalPO, setFilterTanggalPO] = useState<string[]>([]);
  const [tanggalPOSearchTerm, setTanggalPOSearchTerm] = useState("");
  const [filterEstimasiDiterima, setFilterEstimasiDiterima] = useState<
    string[]
  >([]);
  const [estimasiDiterimaSearchTerm, setEstimasiDiterimaSearchTerm] =
    useState("");
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  const [filterStatusPengiriman, setFilterStatusPengiriman] = useState<
    string[]
  >([]);
  const [statusPengirimanSearchTerm, setStatusPengirimanSearchTerm] =
    useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterDiorderOleh, setFilterDiorderOleh] = useState<string[]>([]);
  const [diorderOlehSearchTerm, setDiorderOlehSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState<any>({
    noBTB: "",
    tanggal: new Date(),
    periode: "",
    supplier: "",
    kodeSupplier: "",
    barang: "",
    jumlah: "",
    satuan: "",
    biaya: 0,
    diterimaOleh: "",
    poId: "",
    tanggalDiterima: null,
    skema: "",
  });

  // Flag to track if user manually edited No BTB
  const [isManualNoBTB, setIsManualNoBTB] = useState(false);

  // Add: for BTB form, store array of items from selected PO(s)
  const [selectedPOItems, setSelectedPOItems] = useState<
    Array<{ poId: string; noPO: string; supplier: string; items: any[] }>
  >([]);

  // Helper to get PO item remaining qty
  function getPOItemsWithSisa(po: POData) {
    return po.poItems.flatMap((poItem) =>
      poItem.items
        .filter((item) => item.jumlahPO > 0)
        .map((item) => ({
          ...item,
          qtySisa: item.qtySisa ?? item.jumlahPO,
          poItemId: poItem.noPR + "-" + item.id,
          satuan: item.satuan,
          id_satuan: item.id_satuan ?? null, // <-- pastikan id_satuan ikut
        }))
    );
  }

  // Add state for BTB input quantities
  const [btbInputQty, setBtbInputQty] = useState<Record<string, number>>({});

  // Notification state
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);



  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [skemaList, setSkemaList] = useState<any[]>([]);
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const sId = userData.id_skema ?? userData.skema;
        if (sId) {
          setUserSkemaId(String(sId));
          setUserSchema(String(sId));
        }
      } catch (e) {
        console.error("Error parsing userData", e);
      }
    }
  }, []);








  // Auto-fill BTB Number on PO Selection/Date change
  useEffect(() => {
    // Logic: Trigger when PO is selected (which implies schema) OR Date is changed
    // AND No BTB is empty or standard
    const id_skema = selectedPOsForBTB[0]?.skema || userSkemaId || formData.skema;
    const tanggal = formData.tanggal;
    const noBTB = formData.noBTB;

    console.log("[Auto-fill BTB] Triggered", {
      id_skema,
      tanggal,
      noBTB,
      selectedPOsForBTB_Skema: selectedPOsForBTB[0]?.skema,
      userSkemaId,
      formData_skema: formData.skema
    });

    if (!id_skema || !tanggal) {
      console.log("[Auto-fill BTB] Skipping: Missing id_skema or tanggal");
      return;
    }

    // Guard: Do not overwrite if user manually input/edited the number
    if (isManualNoBTB) return;

    // Guard: Only auto-fill if field is empty OR looks like a standard format "BTB/..."
    const isEmpryOrStandard = !noBTB || noBTB.startsWith("BTB/");
    if (!isEmpryOrStandard) {
      console.log("[Auto-fill BTB] Skipping: Field not empty/standard");
      return;
    }

    const fetchNextNumber = async () => {
      try {
        const dateParam = formatDateForBackend(tanggal);
        if (!dateParam) return;

        const url = `${API_BASE_URL}/api/btb/next-number?id_skema=${id_skema}&tanggal_btb=${dateParam}`;
        console.log("[Auto-fill BTB] Fetching:", url);

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          console.log("[Auto-fill BTB] Received:", data);
          if (data.nextNoBTB) {
            setFormData((prev: any) => ({ ...prev, noBTB: data.nextNoBTB }));
          }
        } else {
          console.error("[Auto-fill BTB] Fetch failed:", res.status);
        }
      } catch (err) {
        console.error("Failed to fetch next BTB number", err);
      }
    };

    fetchNextNumber();
  }, [selectedPOsForBTB, formData.tanggal, userSkemaId, formData.skema]);


  // Reset to page 1 when filters change (logic removed)

  // Tambahkan state untuk data PO dari backend
  const [backendPOData, setBackendPOData] = useState<any[]>([]);

  // === Edit Mode Logic ===
  const searchParams = useSearchParams();
  const editBtbId = searchParams.get("id");
  const [btbDataForEdit, setBtbDataForEdit] = useState<any>(null);
  const [lockedItems, setLockedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editBtbId) {
      fetch(`${API_BASE_URL}/api/btb/${editBtbId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setBtbDataForEdit(data);
        });
    }
  }, [editBtbId]);

  useEffect(() => {
    if (btbDataForEdit && backendPOData.length > 0) {
      const targetPO = backendPOData.find((p: any) => String(p.id) === String(btbDataForEdit.id_po));
      if (targetPO) {
        setSelectedPOsForBTB([targetPO]);
        setShowForm(true);

        setFormData((prev: any) => ({
          ...prev,
          noBTB: btbDataForEdit.no_btb,
          tanggal: new Date(btbDataForEdit.tanggal_btb),
          periode: btbDataForEdit.periode || "",
          supplier: targetPO.id_supplier,
          supplierLabel: targetPO.supplier,
          noPO: targetPO.noPO,
          skema: btbDataForEdit.id_skema,
          poId: targetPO.id,
          biaya: btbDataForEdit.biaya
        }));

        fetch(`${API_BASE_URL}/api/btb-item`)
          .then(r => r.json())
          .then(allBtbItems => {
            const currentBtbItems = allBtbItems.filter((i: any) => String(i.id_btb) === String(btbDataForEdit.id_btb));

            const qtyObj: Record<string, number> = {};
            const lockObj: Record<string, boolean> = {};

            currentBtbItems.forEach((bItem: any) => {
              let foundNoPR = "";
              targetPO.poItems.forEach((group: any) => {
                const found = group.items.find((pi: any) => String(pi.id) === String(bItem.id_POItem));
                if (found) foundNoPR = group.noPR;
              });

              if (foundNoPR) {
                const key = `${foundNoPR}-${bItem.id_POItem}`;
                qtyObj[key] = Number(bItem.jumlah_diterima);
                if (bItem.hasBKB) {
                  lockObj[key] = true;
                }
              }
            });

            setBtbInputQty(qtyObj);
            setLockedItems(lockObj);

            const newSelectedPOItems = [{
              poId: targetPO.id,
              noPO: targetPO.noPO,
              supplier: targetPO.supplier,
              items: getPOItemsWithSisa(targetPO).filter((item) =>
                qtyObj[item.poItemId] !== undefined
              )
            }];

            setSelectedPOItems(newSelectedPOItems);
          });
      }
    }
  }, [btbDataForEdit, backendPOData]);

  // Ambil data PO dari backend dan mapping seperti monitoring PO
  useEffect(() => {
    async function fetchPOBackend() {
      try {
        const [
          poRes,
          poItemRes,
          prItemRes,
          prRes,
          supRes,
          statusPermintaanRes,
          statusPengirimanRes,
          skemaRes,
          userRes,
        ] = await Promise.all([
          fetch(API_BASE_URL + "/api/po", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/po-item", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/pr-item", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/pr", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/supplier", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/status-permintaan", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/status-pengiriman", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/skema", { cache: "no-store" }),
          fetch(API_BASE_URL + "/api/user", { cache: "no-store" }),
        ]);
        const [
          poList,
          poItemList,
          prItemList,
          prList,
          supplierList,
          statusPermintaanList,
          statusPengirimanList,
          skemaList,
          userList,
        ] = await Promise.all([
          poRes.json(),
          poItemRes.json(),
          prItemRes.json(),
          prRes.json(),
          supRes.json(),
          statusPermintaanRes.json(),
          statusPengirimanRes.json(),
          skemaRes.json(),
          userRes.json(),
        ]);

        // Helper maps
        const prMap = Object.fromEntries(
          prList.map((p: any) => [String(p.id_PR), p.noPR])
        );
        const prItemMap = Object.fromEntries(
          prItemList.map((pi: any) => [String(pi.id_PRItem), pi])
        );
        const supplierMap = Object.fromEntries(
          supplierList.map((s: any) => [String(s.id_supplier), s.namaSupplier])
        );
        const statusPermintaanMap = Object.fromEntries(
          statusPermintaanList.map((s: any) => [
            String(s.id_statusPermintaan),
            s.status_permintaan,
          ])
        );
        const statusPengirimanMap = Object.fromEntries(
          statusPengirimanList.map((s: any) => [
            String(s.id_statusPengiriman),
            s.status_pengiriman,
          ])
        );
        const userMap = Object.fromEntries(
          userList.map((u: any) => [String(u.id_user), u.nama_pengguna])
        );

        // --- TAMBAHAN: Map Tanggal PR untuk sorting Group ---
        const prDateMap = Object.fromEntries(
          prList.map((p: any) => [String(p.id_PR), p.tanggalPR])
        );

        // Mapping PO persis seperti monitoring PO
        const mappedPOs = (poList || []).map((po: any) => {
          // Group items by PR (noPR)
          const itemsForPO = (poItemList || []).filter(
            (pi: any) => String(pi.id_PO) === String(po.id_PO || po.id)
          );
          const poItemsGrouped: any[] = [];
          const groupMap: Record<string, number> = {};
          itemsForPO.forEach((pi: any) => {
            const prItem = prItemMap[String(pi.id_PRItem)] || {};
            const prId = String(prItem.id_PR || prItem.id_pr || pi.id_PR || "");
            const noPR = prMap[prId] || prItem.noPR || prItem.id_PR || "";
            // --- Perubahan: urutkan item berdasarkan id_PRItem ASC ---
            const item = {
              id: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
              namaBarang: prItem.namaBarang ?? prItem.namabarang ?? "",
              jumlahPO: Number(pi.jumlahPO) || Number(pi.jumlah) || 0,
              jumlahAsli: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
              satuan:
                prItem.satuanLabel || prItem.satuan || prItem.id_satuan || "",
              id_satuan: prItem.id_satuan ?? pi.id_satuan ?? null,
              hargaSatuan: Number(pi.hargaSatuan) || 0,
              keterangan: pi.keterangan || prItem.keterangan || "",
              status: pi.status,
            };
            const key = String(noPR || prId || "__noPR__");
            if (groupMap[key] === undefined) {
              groupMap[key] = poItemsGrouped.length;
              poItemsGrouped.push({
                prId: prId || "",
                noPR: key,
                items: [item],
              });
            } else {
              poItemsGrouped[groupMap[key]].items.push(item);
            }
          });
          // --- Pastikan urutan item di setiap poItems sesuai id ASC ---
          poItemsGrouped.forEach((group) => {
            group.items.sort(
              (a: any, b: any) => Number(a.id ?? 0) - Number(b.id ?? 0)
            );
          });

          // --- SORTING GROUP: Berdasarkan No PR (ASC) agar urut sesuai input ---
          poItemsGrouped.sort((a, b) => {
            const pa = parseNoPR(a.noPR);
            const pb = parseNoPR(b.noPR);
            if (pa && pb) {
              if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun;
              if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan;
              return pa.urut - pb.urut;
            }
            // Fallback: sort by string noPR
            return (a.noPR || "").localeCompare(b.noPR || "");
          });

          // Build labels using maps
          const statusPermintaanLabel =
            statusPermintaanMap[String(po.id_statusPermintaan)] ||
            po.statusPermintaan ||
            String(po.id_statusPermintaan || "");
          const statusPengirimanLabel =
            statusPengirimanMap[String(po.id_statusPengiriman)] ||
            po.statusPengiriman ||
            String(po.id_statusPengiriman || "");
          const orderedByName =
            userMap[String(po.orderedBy)] ||
            po.orderedBy ||
            po.dipesanOleh ||
            "";

          return {
            id: po.id_PO ?? po.id,
            noPO: po.noPO ?? "",
            tanggalPO: po.tanggalPO,
            estimasiTanggalTerima: po.estimasiTanggalTerima,
            supplier:
              supplierMap[String(po.id_supplier)] ||
              po.supplier ||
              String(po.id_supplier || ""),
            id_supplier: po.id_supplier ?? null, // <-- tambahkan id_supplier di objek PO
            poItems: poItemsGrouped,
            totalPembayaran: Number(po.totalPembayaran) || 0,
            statusPermintaan: statusPermintaanLabel,
            statusPengiriman: statusPengirimanLabel,
            status: po.status ?? "Menunggu",
            orderedBy: orderedByName,
            skema: po.id_skema ?? "",
            termin: po.termin ?? "-", // <-- add termin
          };
        });

        setBackendPOData(mappedPOs);
      } catch (err) {
        setBackendPOData([]);
      }
    }
    fetchPOBackend();
    // ...existing code...
  }, []);

  // Reset to page 1 when filters change (logic removed)

  const loadData = () => {
    const storedPO = localStorage.getItem("poData");
    const storedBTB = localStorage.getItem("btbData");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userSkema = userData.skema || "";

    if (storedPO) {
      // Filter PO sesuai skema user
      setPoData(
        JSON.parse(storedPO).filter(
          (po: any) => !userSkema || po.skema === userSkema
        )
      );
    }
    if (storedBTB) {
      // Filter BTB sesuai skema user
      const btbArr = JSON.parse(storedBTB)
        .filter((btb: any) => !userSkema || btb.skema === userSkema)
        .map((btb: any) => ({
          ...btb,
          skema: btb.skema ?? "pentacity",
        }));
      setBtbData(btbArr);
    } else {
      // Initialize with dummy BTB data
      const dummyBTB: BTBData[] = [
        {
          id: "BTB-001",
          noBTB: "BTB/2024/001",
          tanggal: "2024-06-20",
          periode: "Juni 2024",
          supplier: "PT. Supplier A",
          kodeSupplier: "SUP-001",
          barang: "Laptop Dell Latitude",
          jumlah: 5,
          satuan: "unit",
          biaya: 75000000,
          diterimaOleh: "Admin",
          poId: "PO-001",
          status: "Received",
          createdAt: new Date().toISOString(),
          skema: "pentacity", // <-- tambah skema di dummy
        },
      ];
      localStorage.setItem("btbData", JSON.stringify(dummyBTB));
      setBtbData(dummyBTB);
    }
  };

  const saveBTBData = (data: BTBData[]) => {
    localStorage.setItem("btbData", JSON.stringify(data));
    setBtbData(data);
  };

  // Helper format tanggal ke yyyy-mm-dd untuk backend
  function formatDateForBackend(date: Date | null) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }


  // Fungsi format tanggal standar (tanpa penambahan hari)
  function formatTanggal(tgl: string) {
    if (!tgl) return "";
    let dateObj = dayjs(tgl);
    if (!dateObj.isValid() && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
      const [d, m, y] = tgl.split("-");
      dateObj = dayjs(`${y}-${m}-${d}`);
    }
    if (dateObj.isValid()) {
      return dateObj.format("DD-MM-YYYY");
    }
    return tgl ?? "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Validasi: minimal satu barang qty > 0
    const hasQty = selectedPOItems.some((po) =>
      po.items.some((item) => (btbInputQty[item.poItemId] ?? 0) > 0)
    );
    if (!hasQty) {
      setNotif({
        type: "error",
        message: "Isi minimal satu barang dengan qty > 0.",
      });
      setTimeout(() => setNotif(null), 3000);
      return;
    }
    if (!formData.tanggal) {
      setNotif({ type: "error", message: "Tanggal BTB wajib diisi." });
      setTimeout(() => setNotif(null), 3000);
      return;
    }

    if (!formData.supplier) {
      setNotif({ type: "error", message: "Data Supplier tidak valid (ID Supplier kosong)." });
      setTimeout(() => setNotif(null), 3000);
      return;
    }

    const id_skema = selectedPOsForBTB[0]?.skema ?? null;
    if (!id_skema) {
      setNotif({ type: "error", message: "Data Skema tidak valid (ID Skema kosong pada PO)." });
      setTimeout(() => setNotif(null), 3000);
      return;
    }

    if (!formData.noBTB || !formData.tanggal) {
      setNotif({ type: "error", message: "No BTB dan Tanggal wajib diisi." });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    if (editBtbId) {
      // === UPDATE MODE ===
      try {
        const dateParam = formatDateForBackend(formData.tanggal);
        const updatePayload = {
          no_btb: formData.noBTB,
          tanggal_btb: dateParam,
          periode: formData.periode,
          id_supplier: formData.supplier, // update supplier? might be tricky if items depend on it.
          id_skema: formData.skema,
          diterima_oleh: formData.diterimaOleh,
          tanggal_diterima: formData.tanggalDiterima ? formatDateForBackend(new Date(formData.tanggalDiterima)) : null
        };

        const res = await fetch(`${API_BASE_URL}/api/btb/${editBtbId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload)
        });

        if (!res.ok) throw new Error("Gagal mengupdate BTB");

        alert("Header BTB berhasil diupdate. Perubahan item tidak didukung dalam versi ini (Item terkunci untuk menjaga integritas data parsial).");
        // Reload or redirect?
        window.location.href = "/btb/monitoring";

      } catch (err: any) {
        setNotif({ type: "error", message: err.message || "Gagal update BTB" });
      }
      return;
    }

    try {
      // 1. POST header BTB
      // Ambil id_po, id_supplier, id_skema dari PO pertama
      const id_po = selectedPOsForBTB[0]?.id ?? null;
      const id_supplier = formData.supplier; // <-- ini id_supplier (number/integer)
      const id_skema = selectedPOsForBTB[0]?.skema ?? null;

      // 2. POST setiap item ke /api/btb-item
      // Setelah insert header BTB dan dapat id_btb
      // Ambil data PO Item dari backend (pastikan sudah ada di database)
      const poItemsRes = await fetch(
        API_BASE_URL + "/api/po-item?po=" + id_po
      );
      const poItems = await poItemsRes.json();

      // Mapping item BTB dengan id_POItem dan id_satuan yang benar
      const items = selectedPOItems.flatMap((po) =>
        po.items
          .filter((item) => (btbInputQty[item.poItemId] ?? 0) > 0)
          .map((item) => {
            // Cari poItem dari poItems (ambil id_POItem dan id_satuan)
            const poItem = poItems.find(
              (p) =>
                String(p.id_PRItem) === String(item.id) ||
                p.namaBarang === item.namaBarang
            );
            const hargaSatuanInt = poItem?.hargaSatuan
              ? Number(poItem.hargaSatuan)
              : 0;
            const totalPerItem = poItem?.totalPerItem
              ? Number(poItem.totalPerItem)
              : 0;
            const jumlahAsli = poItem?.jumlahAsli
              ? Number(poItem.jumlahAsli)
              : 0;
            const qtyDiterima = btbInputQty[item.poItemId] ?? 0;
            // --- Hitung biaya per item proporsional ---
            let biaya = 0;
            if (qtyDiterima > 0 && totalPerItem > 0 && jumlahAsli > 0) {
              biaya = (qtyDiterima / jumlahAsli) * totalPerItem;
            } else if (qtyDiterima > 0 && totalPerItem > 0) {
              biaya = totalPerItem / qtyDiterima;
            }
            return {
              id_POItem: poItem?.id_POItem,
              nama_barang: item.namaBarang,
              jumlah_diterima: qtyDiterima,
              id_satuan: item.id_satuan ?? poItem?.id_satuan ?? null,
              keterangan: item.keterangan ?? "",
              hargaSatuan: hargaSatuanInt,
              biaya, // <-- biaya per item BTB, dikirim ke backend
            };
          })
          .filter((item) => !!item.id_POItem)
      );

      // Hitung total biaya BTB dari semua item diterima
      const totalBiayaBTB = items.reduce(
        (sum, item) => sum + (item.biaya ?? 0),
        0
      );

      // LOG: dikirim frontend ke btb (header dan items)
      console.log("DIKIRIM FRONTEND KE BTB HEADER:", {
        no_btb: formData.noBTB,
        tanggal_btb: formData.tanggal,
        periode: formData.periode,
        id_po,
        id_supplier: formData.supplier,
        nama_supplier: getSupplierLabel(formData.supplier),
        id_user: userData.id_user || userData.id,
        id_skema,
        biaya: totalBiayaBTB, // <-- gunakan total biaya BTB
        diterima_oleh: userData.id_user || userData.id,
        tanggal_diterima: formData.tanggal,
      });
      console.log("DIKIRIM FRONTEND KE BTB ITEMS:", items);
      console.log(filteredPOData); // Cek data yang difilter


      // POST header BTB dengan biaya sesuai qty diterima
      // POST header BTB dengan biaya sesuai qty diterima
      const btbHeaderRes = await fetch(API_BASE_URL + "/api/btb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_btb: formData.noBTB,
          tanggal_btb: formatDateForBackend(formData.tanggal),
          periode: formData.periode,
          id_po,
          id_supplier, // <-- kirim id_supplier (number/integer)
          nama_supplier: getSupplierLabel(id_supplier), // label supplier (opsional)
          id_user: userData.id_user || userData.id,
          id_skema,
          biaya: totalBiayaBTB, // <-- gunakan total biaya BTB
          diterima_oleh: userData.id_user || userData.id,
          tanggal_diterima: formatDateForBackend(formData.tanggalDiterima),
          // status dan created_at otomatis di backend
        }),
      });

      const btbHeaderData = await btbHeaderRes.json();

      if (!btbHeaderRes.ok) {
        throw new Error(btbHeaderData.message || btbHeaderData.error || "Gagal menyimpan header BTB");
      }

      const id_btb = btbHeaderData.id;

      for (const item of items) {
        // Validasi field
        if (!id_btb || !item.id_POItem || !item.nama_barang) {
          console.error("Field wajib kosong saat POST btb-item:", {
            id_btb,
            item,
          });
          continue; // skip jika field penting kosong
        }

        // POST ke btb_item (ubah endpoint)
        const res = await fetch(API_BASE_URL + "/api/btb-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_btb,
            id_POItem: item.id_POItem,
            nama_barang: item.nama_barang,
            jumlah_diterima: item.jumlah_diterima, // decimal allowed if needed, but qty usually int
            id_satuan: item.id_satuan,
            keterangan: item.keterangan,
            qty_sisa: item.jumlah_diterima, // decimal allowed
            biaya: item.biaya, // <-- kirim biaya per item ke backend
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Gagal insert btb_item:", errText);
        }
        if (!res.ok) {
          const errText = await res.text();
          console.error("Gagal insert btb_item:", errText);
        }

        // 3. Update jumlahPO di po_item (PUT) -> REMOVED
        // Sekarang update jumlahPO ditangani langsung di backend (POST /api/btb-item)
        // agar tidak mentrigger logic "Edit PO" yang merusak pr_item.jumlah

      }

      setNotif({ type: "success", message: "BTB berhasil disimpan!" });
      setTimeout(() => {
        setNotif(null);
        // Redirect jika perlu
        window.location.reload(); // <-- auto refresh ke halaman input BTB
      }, 1800);
      resetForm();
    } catch (err: any) {
      if (err.message?.includes("digunakan")) {
        console.warn("Validation error:", err.message);
        setNotif({ type: "error", message: err.message });
      } else {
        console.error(err);
        setNotif({ type: "error", message: "Gagal menyimpan BTB ke backend." });
      }
      setTimeout(() => setNotif(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      noBTB: "",
      tanggal: null,
      periode: "",
      supplier: "",
      kodeSupplier: "",
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: 0,
      diterimaOleh: "",
      poId: "",
      tanggalDiterima: null,
      skema: "",
    });
    setShowForm(false);
    setEditingBTB(null);
    setSelectedPO(null);
    setSelectedPOsForBTB([]);
    setSelectedPOs([]);
    // setCurrentPage(1); removed
    setSearchTerm("");
  };

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs([...selectedPOs, poId]);
    } else {
      setSelectedPOs(selectedPOs.filter((id) => id !== poId));
    }
  };

  // Tambahkan state untuk selected item per PO
  const [selectedPOItemIds, setSelectedPOItemIds] = useState<string[]>([]);

  // Fungsi untuk handle checkbox item di tabel PO
  const handleSelectPOItem = (poId: string, poItemId: string, checked: boolean) => {
    const key = `${poId}::${poItemId}`;
    if (checked) {
      setSelectedPOItemIds((prev) => [...prev, key]);
    } else {
      setSelectedPOItemIds((prev) => prev.filter((id) => id !== key));
    }
  };

  // Tambahkan: handle checkbox group (per PO)
  const handleSelectPOGroup = (poId: string, checked: boolean, allItemKeys: string[]) => {
    if (checked) {
      setSelectedPOItemIds((prev) => Array.from(new Set([...prev, ...allItemKeys])));
    } else {
      setSelectedPOItemIds((prev) => prev.filter((id) => !allItemKeys.includes(id)));
    }
  };

  // Fungsi untuk select all item di halaman
  const handleSelectAllItemsOnPage = (checked: boolean, paginatedData: any[]) => {
    const allItemKeys = paginatedData.flatMap((po) =>
      po.poItems.flatMap((poItem: any) =>
        poItem.items
          .filter((item: any) => item.jumlahPO > 0)
          .map((item: any) =>
            `${po.id}::${poItem.noPR}-${item.id}`
          )
      )
    );
    if (checked) {
      setSelectedPOItemIds((prev) =>
        Array.from(new Set([...prev, ...allItemKeys]))
      );
    } else {
      setSelectedPOItemIds((prev) =>
        prev.filter((id) => !allItemKeys.includes(id))
      );
    }
  };

  // Tombol Buat BTB muncul jika ada item dipilih
  const anyItemSelected = selectedPOItemIds.length > 0;

  const handleBuatBTB = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    // Ambil PO yang mengandung item terpilih
    let selectedPOObjects = filteredPOData.filter((po) =>
      po.poItems.some((poItem: any) =>
        poItem.items.some((item: any) =>
          selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
        )
      )
    );
    // --- Pastikan urutan PO sesuai ID (ASC) ---
    selectedPOObjects = sortPOList(selectedPOObjects);

    if (selectedPOObjects.length === 0) {
      alert("Pilih minimal satu item PO untuk dibuat BTB.");
      return;
    }
    setSelectedPOsForBTB(selectedPOObjects);
    setShowForm(true);

    // Ambil hanya item yang dipilih
    setSelectedPOItems(
      selectedPOObjects.map((po) => ({
        poId: po.id,
        noPO: po.noPO,
        supplier: po.supplier,
        items: getPOItemsWithSisa(po).filter((item) =>
          selectedPOItemIds.includes(`${po.id}::${item.poItemId}`)
        ),
      }))
    );
    // LOG: diterima frontend dari PO (pastikan id_supplier adalah id PO, bukan label)
    console.log(
      "DITERIMA FRONTEND DARI PO:",
      selectedPOObjects.map((po) => ({
        id_PO: po.id,
        id_supplier: po.id_supplier ?? po.id_supplier, // pastikan ini id_supplier (number/integer)
        supplier: po.supplier,
        noPO: po.noPO,
        items: getPOItemsWithSisa(po).map((item) => ({
          namaBarang: item.namaBarang,
          id_satuan: item.id_satuan,
          satuan: item.satuan,
          qtySisa: item.qtySisa,
          poItemId: item.poItemId,
        })),
      }))
    );
    // Set initial BTB input qty to qtySisa for each item (bisa diubah user)
    const qtyObj: Record<string, number> = {};
    selectedPOObjects.forEach((po) => {
      getPOItemsWithSisa(po)
        .filter((item) => selectedPOItemIds.includes(`${po.id}::${item.poItemId}`))
        .forEach((item) => {
          qtyObj[item.poItemId] = item.qtySisa;
        });
    });
    setBtbInputQty(qtyObj);

    // Perbaiki error split: pastikan id string
    const firstPO = selectedPOObjects[0];
    let kodeSupplier = "";
    if (typeof firstPO.kodeSupplier === "string" && firstPO.kodeSupplier) {
      kodeSupplier = firstPO.kodeSupplier;
    } else if (firstPO.id !== undefined && firstPO.id !== null) {
      const idStr = String(firstPO.id);
      const idParts = idStr.split("-");
      kodeSupplier = idParts.length > 1 ? `SUP-${idParts[1]}` : "";
    }

    // Determine schema to use (Priority: PO > User ID > User Name > Default)
    const skemaToUse = firstPO.skema || userData.id_skema || userData.skema || "1";

    // Prepare initial form data
    const initialDate = new Date();

    setFormData({
      noBTB: "", // Will be updated by useEffect
      tanggal: initialDate,
      periode: "",
      supplier: firstPO.id_supplier ?? "",
      supplierLabel: firstPO.supplier ?? "",
      noPO: firstPO.noPO ?? "",
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: firstPO.totalPembayaran?.toString() ?? "",
      diterimaOleh: "",
      poId: firstPO.id,
      tanggalDiterima: "",
      skema: skemaToUse,
    });

    // LOG: Daftar PO yang diterima oleh frontend (beserta id_supplier dan id_satuan tiap item)
    console.log("DAFTAR PO YANG DITERIMA OLEH FRONTEND:");
    selectedPOObjects.forEach((po, idx) => {
      console.log(
        `[${idx}] id_PO: ${po.id}, id_supplier: ${po.id_supplier}, supplier: ${po.supplier}, noPO: ${po.noPO}`
      );
      po.poItems.forEach((poItem, i) => {
        poItem.items.forEach((item, j) => {
          console.log(
            `  [item ${i}-${j}] namaBarang: ${item.namaBarang}, id_satuan: ${item.id_satuan}, satuan: ${item.satuan}, qtySisa: ${item.qtySisa}, poItemId: ${item.poItemId}`
          );
        });
      });
    });
  };

  // Compute unique values for filters
  const uniqueSatuan = Array.from(
    new Set(
      poData.flatMap((po) =>
        po.poItems.flatMap((poItem) => poItem.items.map((item) => item.satuan))
      )
    )
  ).sort();
  const uniqueSuppliers = Array.from(
    new Set(poData.map((po) => po.supplier).filter((s) => s && s.trim() !== ""))
  ).sort();
  const uniqueStatus = [
    "Draft",
    "Submitted",
    "Approved",
    "Delivered",
    "Completed",
    "Menunggu",
    "Gantung",
    "Telah dibuat BTB",
  ];
  const uniqueTanggalPO = Array.from(
    new Set(
      poData
        .map((po) => po.tanggalPO)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueEstimasiDiterima = Array.from(
    new Set(
      poData
        .map((po) => po.estimasiTanggalTerima)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueStatusPengiriman = Array.from(
    new Set(
      poData
        .map((po) => po.statusPengiriman)
        .filter((s): s is string => s !== undefined && s.trim() !== "")
    )
  ).sort() as string[];
  const uniqueDiorderOleh = Array.from(
    new Set(
      poData
        .map((po) => po.orderedBy)
        .filter((o): o is string => o !== undefined && o.trim() !== "")
    )
  ).sort();

  // Badge status (copy dari monitoring\page.tsx)
  const getStatusBadge = (status: string) => {
    if (status === "Completed" || status === "Telah dibuat BTB") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Selesai
        </Badge>
      );
    }
    if (status === "Menunggu") {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          {status}
        </Badge>
      );
    }
    if (status === "Gantung") {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Tambahkan helper formatRupiah
  function formatRupiah(val: any) {
    if (val === undefined || val === "" || isNaN(val)) return "";
    return "Rp " + Number(val).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Helper: format tanggal ke dd-mm-yyyy
  function formatTanggal(tgl: string | null | undefined) {
    if (!tgl) return "-";
    // Asumsi tgl format "YYYY-MM-DD"
    const [date] = tgl.split("T");
    const [y, m, d] = date.split("-");
    if (!y || !m || !d) return tgl;
    return `${d}-${m}-${y}`;
  }

  // Helper untuk dapatkan label supplier dari id_supplier
  function getSupplierLabel(id: string) {
    const found = supplierList.find(
      (s) => String(s.id_supplier) === String(id)
    );
    return found ? found.namaSupplier : id;
  }

  function highlightWeekends(date: Date) {
    const day = date.getDay();
    if (day === 0 || day === 6) return "datepicker-red";
    return undefined;
  }

  // Tambahkan state untuk filter kode dan skema
  const [kodeSearchTerm, setKodeSearchTerm] = useState("");
  const [filterKode, setFilterKode] = useState<string[]>([]);
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);

  const uniqueKode = Array.from(
    new Set(
      poData
        .map((po) => String(po.statusPermintaan ?? ""))
        .filter((k) => k.trim() !== "")
    )
  ).sort();

  // Tambahkan filteredPOData dan paginatedData sebelum return

  // --- Tabel PO: gunakan backendPOData dan filter skema sesuai user login ---
  const filteredPOData = backendPOData
    .filter((po) => !userSkemaId || String(po.skema) === userSkemaId)
    .filter((po) => {
      // Gabungkan searchTerm untuk noPO, supplier, barang
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        po.noPO.toLowerCase().includes(searchLower) ||
        String(po.supplier).toLowerCase().includes(searchLower) ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) =>
            item.namaBarang.toLowerCase().includes(searchLower)
          )
        );
      // Filter supplier
      const matchSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(po.supplier);
      // Filter satuan
      const matchSatuan =
        filterSatuan.length === 0 ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) => filterSatuan.includes(item.satuan))
        );
      // Filter barang
      const matchBarang =
        !filterNamaBarang ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) =>
            item.namaBarang
              .toLowerCase()
              .includes(filterNamaBarang.toLowerCase())
          )
        );
      // Filter status
      const matchStatus =
        filterStatus.length === 0 || filterStatus.includes(po.status);
      // Filter kode
      const matchKode =
        filterKode.length === 0 ||
        filterKode.includes(String(po.statusPermintaan));
      // Filter skema
      const matchSkema =
        filterSkema.length === 0 || filterSkema.includes(String(po.skema));

      // --- Filter by PO date range ---
      let matchDateRange = true;
      if (poStartDate || poEndDate) {
        // Assume po.tanggalPO is yyyy-mm-dd or yyyy-mm-ddTHH:mm:ss
        const tgl = (po.tanggalPO || "").split("T")[0];
        if (tgl) {
          const parts = tgl.split("-");
          // Buat date object local time (00:00:00)
          const tglDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
          );

          let afterStart = true;
          let beforeEnd = true;

          if (poStartDate) {
            afterStart = tglDate >= poStartDate;
          }

          if (poEndDate) {
            // Set poEndDate ke akhir hari (23:59:59) untuk perbandingan inklusif
            const end = new Date(poEndDate);
            end.setHours(23, 59, 59, 999);
            beforeEnd = tglDate <= end;
          }

          matchDateRange = afterStart && beforeEnd;
        } else {
          matchDateRange = false;
        }
      }

      return (
        matchSearch &&
        matchSupplier &&
        matchSatuan &&
        matchBarang &&
        matchStatus &&
        matchKode &&
        matchSkema &&
        matchDateRange
      );
    });



  // --- SORTING: PO TERBARU → TERLAMA (PAKAI PARSER GLOBAL) ---
  const sortedPOData = sortPOList(filteredPOData);

  // Pagination logic removed
  const paginatedData = sortedPOData;

  // --- Checkbox header untuk select all pada halaman (mirip monitoring BTB) ---
  const pagePOIds = paginatedData.map((po) => po.id);
  const allPageSelected =
    pagePOIds.length > 0 && pagePOIds.every((id) => selectedPOs.includes(id));

  // Auto-logout logic (testing: 5 detik idle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }, 10800000); // 3 jam idle
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  return (
    <MainLayout>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {/* Notifikasi tengah layar */}
        {notif && (
          <div
            className={`fixed left-1/2 top-16 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold
              ${notif.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
              }`}
            style={{ minWidth: 280, maxWidth: 400 }}
          >
            {notif.message}
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Input BTB
            </h1>
            <p className="text-muted-foreground">
              Pilih item PO yang sudah disetujui untuk dibuatkan BTB
            </p>
          </div>
          {/* Buat BTB button top right, only if item(s) selected and not showing form */}
          {anyItemSelected && !showForm && (
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleBuatBTB}
            >
              Buat BTB
            </Button>
          )}
        </div>

        {/* Search Bar dan Filter Rentang Tanggal PO */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Input
              placeholder="Cari No. PO, Supplier, atau Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[320px]"
            />
            {/* Filter rentang tanggal PO */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Tanggal PO:</span>
              <DatePicker
                selected={poStartDate}
                onChange={(date) => setPoStartDate(date)}
                selectsStart
                startDate={poStartDate}
                endDate={poEndDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Mulai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                maxDate={poEndDate || undefined}
                isClearable
              />
              <span className="mx-1">-</span>
              <DatePicker
                selected={poEndDate}
                onChange={(date) => setPoEndDate(date)}
                selectsEnd
                startDate={poStartDate}
                endDate={poEndDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selesai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                minDate={poStartDate || undefined}
                isClearable
              />
            </div>
          </div>
        )}

        {/* Tabel PO dari Monitoring PO */}
        {!showForm && (
          <Card className="bg-white bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Purchase Order</CardTitle>
              <CardDescription>
                Total: {filteredPOData.length} PO | Item dipilih: {selectedPOItemIds.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "70vh", // agar tabel bisa discroll vertikal jika data banyak
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                }}
              >
                <Table className="border-collapse border border-gray-300 table-auto min-w-full">
                  <TableHeader>
                    <TableRow>
                      {/* Tambahkan checkbox header untuk select all */}
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 w-12 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Checkbox
                          checked={
                            paginatedData.some((po) =>
                              po.poItems.flatMap((poItem: any) =>
                                poItem.items
                                  .filter((item: any) => item.jumlahPO > 0)
                                  .map((item: any) =>
                                    selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                  )
                              ).some(Boolean)
                            ) &&
                              !paginatedData.every((po) =>
                                po.poItems.flatMap((poItem: any) =>
                                  poItem.items
                                    .filter((item: any) => item.jumlahPO > 0)
                                    .map((item: any) =>
                                      selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                    )
                                ).every(Boolean)
                              )
                              ? "indeterminate"
                              : paginatedData.every((po) =>
                                po.poItems.flatMap((poItem: any) =>
                                  poItem.items
                                    .filter((item: any) => item.jumlahPO > 0)
                                    .map((item: any) =>
                                      selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                    )
                                ).every(Boolean)
                              )
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAllItemsOnPage(checked === true, paginatedData)
                          }
                        />
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        NO. PO
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              TANGGAL PO <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari tanggal..."
                              value={tanggalPOSearchTerm}
                              onChange={(e) =>
                                setTanggalPOSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueTanggalPO
                                .filter((tgl) =>
                                  tgl
                                    .toLowerCase()
                                    .includes(tanggalPOSearchTerm.toLowerCase())
                                )
                                .map((tgl) => (
                                  <div
                                    key={tgl}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterTanggalPO.includes(tgl)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterTanggalPO([
                                            ...filterTanggalPO,
                                            tgl,
                                          ]);
                                        else
                                          setFilterTanggalPO(
                                            filterTanggalPO.filter(
                                              (x) => x !== tgl
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{tgl}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              Supplier <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari supplier..."
                              value={supplierSearchTerm}
                              onChange={(e) =>
                                setSupplierSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueSuppliers
                                .filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(supplierSearchTerm.toLowerCase())
                                )
                                .map((s) => (
                                  <div
                                    key={s}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterSupplier.includes(s)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterSupplier([
                                            ...filterSupplier,
                                            s,
                                          ]);
                                        else
                                          setFilterSupplier(
                                            filterSupplier.filter(
                                              (x) => x !== s
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        DAFTAR BARANG
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              KUANTITAS PO <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Min Qty"
                              type="number"
                              value={filterQtyMin}
                              onChange={(e) =>
                                setFilterQtyMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              placeholder="Max Qty"
                              type="number"
                              value={filterQtyMax}
                              onChange={(e) =>
                                setFilterQtyMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              SATUAN <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari satuan..."
                              value={satuanSearchTerm}
                              onChange={(e) =>
                                setSatuanSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueSatuan
                                .filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(satuanSearchTerm.toLowerCase())
                                )
                                .map((s) => (
                                  <div
                                    key={s}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterSatuan.includes(s)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterSatuan([...filterSatuan, s]);
                                        else
                                          setFilterSatuan(
                                            filterSatuan.filter((x) => x !== s)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              KETERANGAN <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari keterangan..."
                              value={filterKeterangan}
                              onChange={(e) =>
                                setFilterKeterangan(e.target.value)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              HARGA SATUAN <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Min Harga"
                              type="number"
                              value={filterHargaSatuanMin}
                              onChange={(e) =>
                                setFilterHargaSatuanMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              placeholder="Max Harga"
                              type="number"
                              value={filterHargaSatuanMax}
                              onChange={(e) =>
                                setFilterHargaSatuanMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              TOTAL <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Min Total"
                              type="number"
                              value={filterTotalMin}
                              onChange={(e) =>
                                setFilterTotalMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              placeholder="Max Total"
                              type="number"
                              value={filterTotalMax}
                              onChange={(e) =>
                                setFilterTotalMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>

                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              Estimasi Diterima{" "}
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari estimasi..."
                              value={estimasiDiterimaSearchTerm}
                              onChange={(e) =>
                                setEstimasiDiterimaSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueEstimasiDiterima
                                .filter((tgl) =>
                                  tgl
                                    .toLowerCase()
                                    .includes(
                                      estimasiDiterimaSearchTerm.toLowerCase()
                                    )
                                )
                                .map((tgl) => (
                                  <div
                                    key={tgl}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterEstimasiDiterima.includes(
                                        tgl
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterEstimasiDiterima([
                                            ...filterEstimasiDiterima,
                                            tgl,
                                          ]);
                                        else
                                          setFilterEstimasiDiterima(
                                            filterEstimasiDiterima.filter(
                                              (x) => x !== tgl
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{tgl}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>

                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              Status Pengiriman{" "}
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari status pengiriman..."
                              value={statusPengirimanSearchTerm}
                              onChange={(e) =>
                                setStatusPengirimanSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueStatusPengiriman
                                .filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(
                                      statusPengirimanSearchTerm.toLowerCase()
                                    )
                                )
                                .map((s) => (
                                  <div
                                    key={s}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterStatusPengiriman.includes(
                                        s
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterStatusPengiriman([
                                            ...filterStatusPengiriman,
                                            s,
                                          ]);
                                        else
                                          setFilterStatusPengiriman(
                                            filterStatusPengiriman.filter(
                                              (x) => x !== s
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              Status <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari status..."
                              value={statusSearchTerm}
                              onChange={(e) =>
                                setStatusSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueStatus
                                .filter((s) =>
                                  s
                                    .toLowerCase()
                                    .includes(statusSearchTerm.toLowerCase())
                                )
                                .map((s) => (
                                  <div
                                    key={s}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterStatus.includes(s)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterStatus([...filterStatus, s]);
                                        else
                                          setFilterStatus(
                                            filterStatus.filter((x) => x !== s)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        TERMIN PEMBAYARAN
                      </TableHead>
                      <TableHead
                        className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1 uppercase">
                              Diorder oleh <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari user..."
                              value={diorderOlehSearchTerm}
                              onChange={(e) =>
                                setDiorderOlehSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueDiorderOleh
                                .filter((o) =>
                                  o
                                    .toLowerCase()
                                    .includes(
                                      diorderOlehSearchTerm.toLowerCase()
                                    )
                                )
                                .map((o) => (
                                  <div
                                    key={o}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterDiorderOleh.includes(o)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterDiorderOleh([
                                            ...filterDiorderOleh,
                                            o,
                                          ]);
                                        else
                                          setFilterDiorderOleh(
                                            filterDiorderOleh.filter(
                                              (x) => x !== o
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{o}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      {/* <TableHead
                        className="border-r border-gray-300 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              Skema <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari skema..."
                              value={skemaSearchTerm}
                              onChange={(e) =>
                                setSkemaSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueKode
                                .filter((s) =>
                                  String(s)
                                    .toLowerCase()
                                    .includes(skemaSearchTerm.toLowerCase())
                                )
                                .map((s) => (
                                  <div
                                    key={s}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterSkema.includes(s)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterSkema([...filterSkema, s]);
                                        else
                                          setFilterSkema(
                                            filterSkema.filter((x) => x !== s)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((po, poIdx) => {
                      const allItems = po.poItems.flatMap((poItem: any) =>
                        poItem.items
                          .filter((item: any) => item.jumlahPO > 0)
                          .map((item: any) => ({
                            ...item,
                            noPR: poItem.noPR,
                          }))
                      );
                      // Kumpulkan semua item key untuk group PO ini
                      const groupItemKeys = allItems.map((item: any) => `${po.id}::${item.noPR}-${item.id}`);

                      const allGroupSelected = groupItemKeys.length > 0 && groupItemKeys.every((key) => selectedPOItemIds.includes(key));
                      const someGroupSelected = groupItemKeys.some((key) => selectedPOItemIds.includes(key));
                      return (
                        <React.Fragment key={po.id}>
                          {allItems.map((item: any, itemIndex: number) => (
                            <TableRow
                              key={`${po.id}-item-${itemIndex}`}
                              className={`border-b border-gray-300 align-middle ${poIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/50 transition-colors`}
                            >
                              {/* Checkbox group (per PO), hanya di baris pertama group */}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center uppercase"
                                >
                                  <Checkbox
                                    checked={someGroupSelected && !allGroupSelected ? "indeterminate" : allGroupSelected}
                                    onCheckedChange={(checked) =>
                                      handleSelectPOGroup(po.id, checked === true, groupItemKeys)
                                    }
                                  />
                                </TableCell>
                              )}
                              {/* Kolom No. PO dan Barang */}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="font-medium px-3 py-1 border-r border-gray-300 align-middle text-left uppercase"
                                >
                                  {po.noPO}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {formatTanggal(po.tanggalPO)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[140px] uppercase"
                                >
                                  {po.supplier}
                                </TableCell>
                              )}
                              {/* Checkbox + Nama Barang */}
                              <TableCell className="px-3 py-1 border-r border-gray-300 text-left min-w-[200px] flex items-left gap-2 justify-left uppercase">
                                <Checkbox
                                  checked={selectedPOItemIds.includes(`${po.id}::${item.noPR}-${item.id}`)}
                                  onCheckedChange={(checked) =>
                                    handleSelectPOItem(po.id, `${item.noPR}-${item.id}`, checked === true)
                                  }
                                />
                                {item.namaBarang}
                              </TableCell>
                              <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[80px]">
                                {item.jumlahPO}
                              </TableCell>
                              <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[60px] uppercase">
                                {item.satuan}
                              </TableCell>
                              <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left max-w-xs whitespace-normal break-words uppercase">
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div
                                      className="text-sm text-muted-foreground cursor-help"
                                      title={item.keterangan}
                                    >
                                      {truncateText(item.keterangan, 10)}
                                    </div>
                                  </HoverCardTrigger>
                                </HoverCard>
                              </TableCell>
                              <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px]">
                                Rp {item.hargaSatuan.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              {itemIndex === 0 ? (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] font-semibold"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                              ) : null}

                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {formatTanggal(po.estimasiTanggalTerima)}
                                </TableCell>
                              )}

                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px] uppercase"
                                >
                                  {/* Status Pengiriman dari po.statusPengiriman */}
                                  {po.statusPengiriman}
                                </TableCell>
                              )}
                              <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase">
                                {/* Status dari item.status */}
                                <Badge
                                  variant="outline"
                                  className={
                                    item.status === "WAITING PART"
                                      ? "items-center gap-1 bg-red-50 text-red-600 border-red-200"
                                      : item.status === "PARTIAL PART"
                                        ? "items-center gap-1 bg-yellow-50 text-yellow-600 border-yellow-200"
                                        : item.status === "PART COMPLETE"
                                          ? "items-center gap-1 bg-green-50 text-green-600 border-green-200"
                                          : "items-center gap-1"
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {po.termin}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px] uppercase"
                                >
                                  {/* Diorder oleh dari po.orderedBy */}
                                  {typeof po.orderedBy === "string" ? po.orderedBy.replace(/_/g, " ") : po.orderedBy}
                                </TableCell>
                              )}
                              {/* {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px] uppercase"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema}
                                </TableCell>
                              )} */}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card >
        )
        }

        {/* BTB Form - show only when showForm is true */}
        {
          showForm && (
            <Card className="bg-white bg-card border-border shadow-md rounded-md">
              <CardHeader>
                <CardTitle>
                  {editingBTB ? "Edit BTB" : "Tambah BTB Baru"}
                </CardTitle>
                <CardDescription>
                  Isi form di bawah untuk{" "}
                  {editingBTB ? "mengubah" : "menambahkan"} Bukti Terima Barang
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Input Nomor BTB dan Tgl BTB sejajar */}
                <div className="mb-4">
                  {/* Judul detail PO yang dipilih: warna hitam, besar */}
                  <div className="mb-2 text-2xl font-semibold text-black">
                    Detail PO yang Dipilih
                  </div>
                  {/* Info No. PO dan Supplier, sejajar, tidak terlalu tebal/besar */}
                  <div className="mb-3 flex flex-row gap-2 items-center text-base font-normal text-foreground">
                    <span>No. PO: {formData.noPO}</span>
                    <span className="mx-2">|</span>
                    <span>Supplier: {formData.supplierLabel}</span>
                  </div>
                  {/* Input Nomor BTB dan Tgl BTB sejajar */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="noBTB">NO. BTB</Label>
                      <Input
                        id="noBTB"
                        value={formData.noBTB}
                        onChange={(e) => {
                          setFormData({ ...formData, noBTB: e.target.value });
                          setIsManualNoBTB(true); // User manually changed it
                        }}
                        placeholder="Auto-generated"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="tanggal">TANGGAL BTB</Label>
                      <DatePicker
                        id="tanggal"
                        selected={formData.tanggal}
                        onChange={(date) =>
                          setFormData({ ...formData, tanggal: date })
                        }
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Pilih tanggal"
                        className="w-full px-3 py-2 border rounded-md bg-white"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        dayClassName={highlightWeekends}
                        customInput={
                          <Input
                            value={
                              formData.tanggal
                                ? (() => {
                                  const d =
                                    formData.tanggal instanceof Date
                                      ? formData.tanggal
                                      : new Date(formData.tanggal);
                                  return `${String(d.getDate()).padStart(
                                    2,
                                    "0"
                                  )}-${String(d.getMonth() + 1).padStart(
                                    2,
                                    "0"
                                  )}-${d.getFullYear()}`;
                                })()
                                : ""
                            }
                            readOnly
                            className="w-full px-3 py-2 border rounded-md bg-white"
                          />
                        }
                      />
                    </div>
                  </div>
                </div>
                {/* Tabel barang: hanya tampilkan item yang dipilih */}
                <div className="border border-[#e5e7eb] rounded-lg overflow-x-auto mb-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-white font-semibold text-center h-12 border-b border-[#e5e7eb]">
                        <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[200px] uppercase">NAMA BARANG</th>
                        <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[160px] uppercase">KUANTITAS PO</th>
                        <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[180px] uppercase">KUANTITAS DITERIMA</th>
                        <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[140px] uppercase">SATUAN</th>
                        <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[220px] uppercase">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPOItems
                        .flatMap((po) => po.items.filter((item) => item.qtySisa > 0))
                        .map((item, idx) => (
                          <tr
                            key={item.poItemId}
                            className={`border-b border-[#e5e7eb] text-center align-middle h-12 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-blue-50/50 transition-colors`}
                          >
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[200px] uppercase">
                              {item.namaBarang}
                            </td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[160px]">
                              {item.qtySisa}
                            </td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[180px]">
                              <div className="relative">
                                {lockedItems[item.poItemId] && <span className="absolute -top-5 left-0 right-0 text-[10px] text-red-500 font-bold bg-white/80 mx-auto w-fit px-1 rounded">(Locked)</span>}
                                <Input
                                  type="number"
                                  disabled={lockedItems[item.poItemId]}
                                  min={0}
                                  max={item.qtySisa}
                                  inputMode="numeric"
                                  value={
                                    btbInputQty[item.poItemId] !== undefined
                                      ? btbInputQty[item.poItemId]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/^0+(\d)/, "$1");
                                    let parsedVal =
                                      val === ""
                                        ? ""
                                        : Math.max(
                                          0,
                                          Math.min(Number(val), item.qtySisa)
                                        );
                                    setBtbInputQty((prev) => ({
                                      ...prev,
                                      [item.poItemId]: parsedVal,
                                    }));
                                  }}
                                  className={`w-20 h-9 text-center mx-auto border rounded appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${lockedItems[item.poItemId] ? "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed" : "bg-white border-[#e5e7eb]"}`}
                                  style={{
                                    MozAppearance: "textfield",
                                  }}
                                  onWheel={(e) => {
                                    // @ts-ignore
                                    e.target.blur();
                                    e.preventDefault();
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[140px] uppercase">
                              {item.satuan}
                            </td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[220px]">
                              <div
                                className="text-muted-foreground max-w-xs truncate uppercase"
                                title={item.keterangan}
                              >
                                {item.keterangan}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Form bawah: Skema saja */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Skema di-hide, tetap dikirim */}
                  <input type="hidden" name="skema" value={formData.skema} />
                  <div className="flex space-x-2 justify-end">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                    >
                      {editingBTB ? "Update BTB" : "Simpan BTB"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedPOItems([]);
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )
        }
      </div >
    </MainLayout >
  );
}
