"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as ExcelJS from "exceljs";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Edit,
  Search,
  Download,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

// Robust date parser helper
function parseDateStringToDayjs(tgl: string) {
  if (!tgl) return dayjs(null);
  const cleanTgl = String(tgl).trim();
  if (!cleanTgl) return dayjs(null);

  let dObj = dayjs(cleanTgl);
  if (dObj.isValid()) {
    if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanTgl)) {
      const [d, m, y] = cleanTgl.substring(0, 10).split("/");
      const manualObj = dayjs(`${y}-${m}-${d}`);
      if (manualObj.isValid()) return manualObj;
    }
    return dObj;
  }

  if (/^\d{2}-\d{2}-\d{4}/.test(cleanTgl)) {
    const [d, m, y] = cleanTgl.substring(0, 10).split("-");
    const manualObj = dayjs(`${y}-${m}-${d}`);
    if (manualObj.isValid()) return manualObj;
  }

  if (/^\d{2}\/\d{2}\/\d{4}/.test(cleanTgl)) {
    const [d, m, y] = cleanTgl.substring(0, 10).split("/");
    const manualObj = dayjs(`${y}-${m}-${d}`);
    if (manualObj.isValid()) return manualObj;
  }

  return dayjs(null);
}

// Format date helper
function formatTanggal(tgl: string) {
  if (!tgl) return "";
  const dateObj = parseDateStringToDayjs(tgl);
  if (dateObj.isValid()) {
    return dateObj.format("DD/MM/YYYY");
  }
  return tgl ?? "";
}

// Helper to wrap text at a hard limit of characters per line
function wrapTextAtCharLimit(text: string, limit: number = 55): string {
  if (!text) return "";
  const lines = text.split("\n");
  const wrappedLines: string[] = [];

  lines.forEach(line => {
    let currentLine = "";
    const words = line.split(" ");
    
    words.forEach(word => {
      if (word.length > limit) {
        if (currentLine) {
          wrappedLines.push(currentLine);
          currentLine = "";
        }
        let remaining = word;
        while (remaining.length > limit) {
          wrappedLines.push(remaining.substring(0, limit));
          remaining = remaining.substring(limit);
        }
        currentLine = remaining;
      } else {
        if ((currentLine + (currentLine ? " " : "") + word).length > limit) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine += (currentLine ? " " : "") + word;
        }
      }
    });

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  });

  return wrappedLines.join("\n");
}

// Parse PO Number for sorting
function parseNoPO(noPO: string | null | undefined) {
  if (!noPO || typeof noPO !== "string") return { year: 0, month: 0, urut: 0 };
  const s = noPO.trim().toUpperCase();

  const romanMap: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
    'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
  };

  const matchMid = s.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
  let year = 0;
  let month = 0;

  if (matchMid) {
    year = 2000 + parseInt(matchMid[1], 10);
    month = romanMap[matchMid[2]] || 0;
  }

  const matchSeq = s.match(/(\d+)(?!.*\d)/);
  let urut = matchSeq ? parseInt(matchSeq[1], 10) : 0;

  return { year, month, urut };
}

// Parse PR Number for sorting
function parseNoPR(noPR: string | null | undefined) {
  if (!noPR || typeof noPR !== "string") return { year: 0, month: 0, urut: 0 };
  const s = noPR.trim().toUpperCase();

  const romanMap: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
    'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
  };

  const matchMid = s.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
  let year = 0;
  let month = 0;

  if (matchMid) {
    year = 2000 + parseInt(matchMid[1], 10);
    month = romanMap[matchMid[2]] || 0;
  }

  const matchSeq = s.match(/(\d+)(?!.*\d)/);
  let urut = matchSeq ? parseInt(matchSeq[1], 10) : 0;

  return { year, month, urut };
}

// Sort PO List helper
function sortPOList(filteredPOData: any[]) {
  return [...filteredPOData].sort((a, b) => {
    const pa = parseNoPO(a.noPO);
    const pb = parseNoPO(b.noPO);

    if (pa.year !== pb.year) return pa.year - pb.year;
    if (pa.month !== pb.month) return pa.month - pb.month;
    return pa.urut - pb.urut;
  });
}

// Calculate delay in days helper from Estimasi Diterima date to today/last BTB date
function calculateKeterlambatan(estimasiTgl: string, jumlahBelumTerkirim: number, btbItems: any[], btbMap: any) {
  if (!estimasiTgl) return "0 Hari";
  
  const estDate = parseDateStringToDayjs(estimasiTgl).startOf('day');
  if (!estDate.isValid()) return "0 Hari";

  if (jumlahBelumTerkirim > 0) {
    // Still open (belum terkirim > 0), calculate delay up to today
    const today = dayjs().startOf('day');
    const diffDays = today.diff(estDate, 'day');
    return `${diffDays} Hari`;
  } else {
    // Completed (belum terkirim === 0), stop calculation at the latest BTB date
    if (btbItems && btbItems.length > 0) {
      let maxBtbDate = dayjs('1970-01-01');
      btbItems.forEach(bi => {
        const btbInfo = btbMap[bi.id_btb];
        if (btbInfo && btbInfo.tanggal_btb) {
          const tglBtb = parseDateStringToDayjs(btbInfo.tanggal_btb).startOf('day');
          if (tglBtb.isValid() && tglBtb.isAfter(maxBtbDate)) {
            maxBtbDate = tglBtb;
          }
        }
      });
      if (maxBtbDate.isAfter(dayjs('1970-01-01'))) {
        const diffDays = maxBtbDate.diff(estDate, 'day');
        return `${diffDays} Hari`;
      }
    }
    return "0 Hari";
  }
}

interface TextSegment {
  text: string;
  isRed: boolean;
}

interface DisplayLine {
  segments: TextSegment[];
  isHidden: boolean;
}

// Parse note text into segments separating bracketed hidden contents from normal text, stripping formatting characters and coloring star contents
function parseNoteText(text: string): DisplayLine[] {
  if (!text) return [];
  const rawLines = text.split("\n");
  const displayLines: DisplayLine[] = [];

  rawLines.forEach(line => {
    // Regex to match square brackets
    const regex = /\[(.*?)\]/g;
    let lastIndex = 0;
    let match;
    let hasMatch = false;
    
    // Helper function to split a string by asterisks into segments
    const splitByStars = (str: string): TextSegment[] => {
      const parts = str.split("*");
      return parts.map((part, idx) => ({
        text: part,
        isRed: idx % 2 === 1
      })).filter(seg => seg.text !== "");
    };

    while ((match = regex.exec(line)) !== null) {
      hasMatch = true;
      const matchIndex = match.index;
      const bracketContent = match[1]; // Extract contents inside brackets (brackets stripped!)

      // Text before brackets
      const textBefore = line.substring(lastIndex, matchIndex).trim();
      if (textBefore) {
        displayLines.push({
          segments: splitByStars(textBefore),
          isHidden: false
        });
      }

      // Bracket content
      if (bracketContent) {
        displayLines.push({
          segments: splitByStars(bracketContent),
          isHidden: true
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (hasMatch) {
      // Remaining text after last bracket
      const textAfter = line.substring(lastIndex).trim();
      if (textAfter) {
        displayLines.push({
          segments: splitByStars(textAfter),
          isHidden: false
        });
      }
    } else {
      // If no brackets matched and line is not empty
      if (line.trim()) {
        displayLines.push({
          segments: splitByStars(line),
          isHidden: false
        });
      }
    }
  });

  return displayLines;
}

export default function DailyMonitoringPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  const [poData, setPoData] = useState<any[]>([]);

  // Column Widths for resizable columns
  const [columnWidths, setColumnWidths] = useState<{ namaBarang: number; keteranganPO: number }>({
    namaBarang: 180,
    keteranganPO: 160,
  });

  // Load saved column widths on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("daily_po_column_widths");
      if (saved) {
        try {
          setColumnWidths(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load saved column widths", e);
        }
      }
    }
  }, []);

  const startResize = (columnKey: "namaBarang" | "keteranganPO", e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX));
      setColumnWidths((prev) => ({
        ...prev,
        [columnKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Save to localStorage
      setColumnWidths((latest) => {
        localStorage.setItem("daily_po_column_widths", JSON.stringify(latest));
        return latest;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterPurchasing, setFilterPurchasing] = useState<string[]>([]);
  const [purchasingSearchTerm, setPurchasingSearchTerm] = useState("");

  const [isDivisi, setIsDivisi] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [userSkema, setUserSkema] = useState("");
  const [filterItemStatus, setFilterItemStatus] = useState<string>("ALL");

  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Sync scroll
  useEffect(() => {
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

  // Export states
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Modal & Toast states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false);

  // Delay Reason Edit Modal States
  const [editReasonOpen, setEditReasonOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newReason, setNewReason] = useState("");

  // Set default date range to current month
  useEffect(() => {
    if (filterStartDate === null && filterEndDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterStartDate(firstDay);
      setFilterEndDate(lastDay);
    }
  }, [filterStartDate, filterEndDate]);

  useEffect(() => {
    if (highlight && poData.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(highlight);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [highlight, poData]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
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
        btbRes,
        btbItemRes,
        divisiRes,
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
        fetch(API_BASE_URL + "/api/btb", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/btb-item", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/divisi", { cache: "no-store" }),
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
        btbList,
        btbItemList,
        divisiList,
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
        btbRes.json(),
        btbItemRes.json(),
        divisiRes.json(),
      ]);

      // Role check from LocalStorage
      const userDataStr = localStorage.getItem("userData");
      const userDataObj = userDataStr ? JSON.parse(userDataStr) : {};
      const role = (userDataObj.role || "").toLowerCase();
      const userId = Number(userDataObj.id || userDataObj.id_user || 0);

      const isRestricted = role === "divisi" && ![98, 141].includes(userId);
      setIsDivisi(isRestricted);

      if ([112, 113, 168, 169].includes(userId)) {
        setIsReadOnly(true);
      }

      const savedSkemaId = localStorage.getItem("selectedSkemaId");
      const activeSkema = savedSkemaId || String(userDataObj.id_skema ?? userDataObj.skema ?? "");
      const rawSkema = (activeSkema || "").toLowerCase();
      let skemaName = "";
      if (rawSkema === "2" || rawSkema.includes("ewalk")) {
        skemaName = "EWALK";
      } else if (rawSkema === "1" || rawSkema.includes("pentacity") || rawSkema.includes("penta")) {
        skemaName = "PENTACITY";
      }
      setUserSkema(skemaName);

      // Helper maps
      const prMap = Object.fromEntries(prList.map((p: any) => [String(p.id_PR), p.noPR]));
      const prItemMap = Object.fromEntries(prItemList.map((pi: any) => [String(pi.id_PRItem), pi]));
      const supplierMap = Object.fromEntries(supplierList.map((s: any) => [String(s.id_supplier), s.namaSupplier]));
      const userMap = Object.fromEntries(userList.map((u: any) => [String(u.id_user), u.nama_pengguna]));
      const btbMap = Object.fromEntries((btbList || []).map((b: any) => [String(b.id_btb), b]));
      const divisiMap = Object.fromEntries((divisiList || []).map((d: any) => [String(d.id_divisi), d.divisi]));
      
      const prDivisiMap = Object.fromEntries(
        prList.map((p: any) => [String(p.id_PR), divisiMap[String(p.id_divisi)] || ""])
      );
      const prDateMap = Object.fromEntries(
        prList.map((p: any) => [String(p.id_PR), p.tanggalPR])
      );

      // Group BTB items by id_POItem
      const btbItemsByPOItem: Record<string, any[]> = {};
      (btbItemList || []).forEach((bi: any) => {
        const pid = String(bi.id_POItem);
        if (!btbItemsByPOItem[pid]) btbItemsByPOItem[pid] = [];
        btbItemsByPOItem[pid].push(bi);
      });

      // Map each PO
      const mappedPOs = (poList || []).map((po: any) => {
        const itemsForPO = (poItemList || []).filter(
          (pi: any) => String(pi.id_PO) === String(po.id_PO || po.id)
        );

        const poItemsGrouped: any[] = [];
        const groupMap: Record<string, number> = {};

        itemsForPO.forEach((pi: any) => {
          const prItem = prItemMap[String(pi.id_PRItem)] || {};
          const prId = String(prItem.id_PR || prItem.id_pr || pi.id_PR || "");
          const noPR = prMap[prId] || prItem.noPR || prItem.id_PR || "";

          // BTB details
          const relatedBtbItems = btbItemsByPOItem[String(pi.id_POItem)] || [];
          const totalReceived = relatedBtbItems.reduce((sum, bi) => sum + (Number(bi.jumlah_diterima) || 0), 0);
          
          const originalPOQuantity = Math.round(Number(pi.jumlahAsli) || (Number(pi.jumlahPO) + totalReceived) || 0);
          const totalReceivedRounded = Math.round(totalReceived);
          const totalRemaining = Math.max(0, originalPOQuantity - totalReceivedRounded);

          const delayText = calculateKeterlambatan(po.estimasiTanggalTerima, totalRemaining, relatedBtbItems, btbMap);

          const itemSatuan = prItem.satuanLabel || prItem.satuan || prItem.id_satuan || pi.id_satuan || "";

          const item = {
            id_POItem: pi.id_POItem,
            id_PRItem: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
            namaBarang: prItem.namaBarang ?? prItem.namabarang ?? pi.namaBarang ?? "",
            jumlahPO: originalPOQuantity,
            satuan: itemSatuan,
            hargaSatuan: Number(pi.hargaSatuan) || 0,
            keterangan: pi.keterangan || prItem.keterangan || "",
            divisi: prDivisiMap[prId] || "-",
            diskonPersen: pi.diskonPersen ?? 0,
            diskonNominal: pi.diskonRupiah ?? 0,
            ppnItem: pi.ppnPersen ?? 0,
            ppnAmount: pi.ppnRupiah ?? 0,
            totalPerItem: typeof pi.totalPerItem !== "undefined" && pi.totalPerItem !== null ? Number(pi.totalPerItem) : undefined,
            namaPembeli: pi.namaPembeli ?? "",
            noPR: noPR,
            tanggalPR: prDateMap[prId] || "",
            
            // BTB & Delay calculations
            jumlahSudahTerkirim: totalReceivedRounded,
            jumlahBelumTerkirim: totalRemaining,
            keterlambatan: delayText,
            alasan_keterlambatan: pi.alasan_keterlambatan || "",
            status: totalRemaining > 0 ? "OPEN" : "CLOSED",
            autoKeteranganLines: relatedBtbItems.map((bi: any) => {
              const btbInfo = btbMap[bi.id_btb];
              const tgl = btbInfo?.tanggal_btb ? formatTanggal(btbInfo.tanggal_btb) : "-";
              const qtyDiterima = Math.round(Number(bi.jumlah_diterima) || 0);
              return `Barang telah diterima ${qtyDiterima} ${itemSatuan} dan telah terbit BTB pada ${tgl}`;
            })
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

        // Sort items inside groups
        poItemsGrouped.forEach((group) => {
          group.items.sort(
            (a: any, b: any) => Number(a.id_PRItem ?? 0) - Number(b.id_PRItem ?? 0)
          );
        });

        // Ordered by name
        const orderedByName = userMap[String(po.orderedBy)] || po.orderedBy || po.dipesanOleh || "";

        return {
          id: po.id_PO ?? po.id,
          noPO: po.noPO ?? "",
          tanggalPO: po.tanggalPO ?? "",
          estimasiTanggalTerima: po.estimasiTanggalTerima ?? "",
          supplier: supplierMap[String(po.id_supplier)] || po.supplier || String(po.id_supplier || ""),
          poItems: poItemsGrouped,
          totalPembayaran: Number(po.totalPembayaran) || 0,
          status: po.status ?? "WAITING PART",
          orderedBy: orderedByName,
          skema: po.id_skema ?? "",
          rawSkemaId: po.id_skema ?? null,
          termin: po.termin ?? "",
        };
      });

      setPoData(mappedPOs);
    } catch (err) {
      console.error("Gagal memuat data PO:", err);
      setPoData([]);
    }
  };

  // Toast Auto-close
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // Select all pagination items
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(sortedPOData.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs((prev) => [...prev, poId]);
    } else {
      setSelectedPOs((prev) => prev.filter((id) => id !== poId));
    }
  };

  // Open Delay Reason modal
  const openEditReason = (item: any, noPO: string) => {
    if (isReadOnly) return;
    setEditingItem({ ...item, noPO });
    setNewReason(item.alasan_keterlambatan || (item.autoKeteranganLines || []).join("\n"));
    setEditReasonOpen(true);
  };

  // Save delay reason
  const handleSaveReason = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/po-item/${editingItem.id_POItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan_keterlambatan: newReason }),
      });
      if (res.ok) {
        setToastMsg("Alasan keterlambatan berhasil diperbarui.");
        setToastError(false);
        setToastOpen(true);
        setEditReasonOpen(false);
        await fetchAll();
      } else {
        const data = await res.json();
        setToastMsg(data.message || "Gagal memperbarui alasan keterlambatan.");
        setToastError(true);
        setToastOpen(true);
      }
    } catch (err) {
      setToastMsg("Gagal menghubungi server.");
      setToastError(true);
      setToastOpen(true);
    }
  };

  // Filter & Search Logic
  const filteredPOData = poData
    .map((po) => {
      let status = po.status || "WAITING PART";
      return { ...po, status };
    })
    .filter((po) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        po.noPO.toLowerCase().includes(searchLower) ||
        po.supplier.toLowerCase().includes(searchLower) ||
        po.poItems.some((poItem: any) =>
          poItem.items.some((item: any) => item.namaBarang.toLowerCase().includes(searchLower))
        );

      // Filter by schema based on PO number prefix
      let matchesSkema = true;
      if (userSkema) {
        const skemaUpper = userSkema.toUpperCase();
        if (skemaUpper === "EWALK") {
          matchesSkema = po.noPO.toUpperCase().includes("E-WALK") || po.noPO.toUpperCase().includes("EWALK");
        } else if (skemaUpper === "PENTACITY" || skemaUpper === "PENTA") {
          matchesSkema = po.noPO.toUpperCase().includes("PSV");
        }
      }

      const matchesNamaBarang =
        !filterNamaBarang ||
        po.poItems.some((poItem: any) =>
          poItem.items.some((item: any) =>
            item.namaBarang.toLowerCase().includes(filterNamaBarang.toLowerCase())
          )
        );

      const matchesSupplier = filterSupplier.length === 0 || filterSupplier.includes(po.supplier);
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(po.status);
      const matchesPurchasing =
        filterPurchasing.length === 0 ||
        po.poItems.some((poItem: any) =>
          poItem.items.some((item: any) => filterPurchasing.includes(item.namaPembeli))
        );

      // Date Range filter
      let matchesDateRange = true;
      if (filterStartDate && filterEndDate) {
        const tglStr = (po.tanggalPO || "").split("T")[0];
        if (tglStr) {
          const parts = tglStr.split("-");
          const tglDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          matchesDateRange = tglDate >= filterStartDate && tglDate <= end;
        } else {
          matchesDateRange = false;
        }
      }

      return (
        matchesSkema &&
        matchesSearch &&
        matchesNamaBarang &&
        matchesSupplier &&
        matchesStatus &&
        matchesPurchasing &&
        matchesDateRange
      );
    });

  const sortedPOData = sortPOList(filteredPOData);

  // Compute filters list
  const uniqueSuppliers = Array.from(new Set(poData.map((po) => String(po.supplier ?? ""))))
    .filter((s) => s.trim() !== "")
    .sort();

  const uniqueStatus = [
    "WAITING PART",
    "PARTIAL PART",
    "PART COMPLETE",
    "Draft",
    "Submitted",
    "Approved",
    "Delivered",
    "Completed",
    "Telah dibuat BTB",
  ];

  const uniquePurchasing = Array.from(
    new Set(
      poData.flatMap((po) =>
        po.poItems.flatMap((poItem: any) => poItem.items.map((item: any) => String(item.namaPembeli ?? "")))
      )
    )
  )
    .filter((p) => p.trim() !== "")
    .sort();

  // Export Logic
  const getExportPOData = () => {
    if (exportMode === "selected") {
      return sortedPOData.filter((po) => selectedPOs.includes(po.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return sortedPOData.filter((po) => {
        if (!po.tanggalPO) return false;
        const tgl = dayjs(po.tanggalPO);
        const start = dayjs(exportStartDate);
        const end = dayjs(exportEndDate).endOf("day");
        return tgl.isValid() && (tgl.isAfter(start) || tgl.isSame(start)) && (tgl.isBefore(end) || tgl.isSame(end));
      });
    }
    return sortedPOData;
  };

  const handleExport = async () => {
    const exportData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily Monitoring");

    const headers = [
      "NO. PO",
      "TANGGAL PO",
      "NAMA SUPPLIER",
      "NAMA/JENIS BARANG",
      "JUMLAH",
      "SATUAN",
      "HARGA SATUAN",
      "DISKON (%)",
      "DISKON (RP)",
      "PPN (%)",
      "PPN (RP)",
      "TOTAL",
      "GRAND TOTAL",
      "NAMA PURCHASING",
      "ESTIMASI PENERIMAAN",
      "KETERANGAN PO",
      "DEPARTEMENT",
      "JUMLAH SUDAH TERKIRIM",
      "JUMLAH BELUM TERKIRIM",
      "KETERLAMBATAN",
      "KETERANGAN/ALASAN KETERLAMBATAN",
      "TERMIN PEMBAYARAN",
      "STATUS"
    ];

    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEEEEEE" },
      };
      cell.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
    });

    let currentRowIdx = 2;

    exportData.forEach((po) => {
      const flatItems: any[] = [];
      po.poItems.forEach((group: any) => {
        if (group.items) {
          flatItems.push(...group.items);
        }
      });

      const poStartRow = currentRowIdx;

      if (flatItems.length > 0) {
        flatItems.forEach((item: any) => {
          const row = worksheet.getRow(currentRowIdx);
          const rowData = [
            po.noPO ? po.noPO.toUpperCase() : "",
            formatTanggal(po.tanggalPO),
            po.supplier ? po.supplier.toUpperCase() : "",
            item.namaBarang ? item.namaBarang.toUpperCase() : "",
            item.jumlahPO || "",
            item.satuan ? item.satuan.toUpperCase() : "",
            item.hargaSatuan || 0,
            item.diskonPersen ? String(item.diskonPersen) : "0",
            item.diskonNominal || 0,
            item.ppnItem ? String(item.ppnItem) : "0",
            item.ppnAmount || 0,
            item.totalPerItem || 0,
            po.totalPembayaran || 0,
            po.orderedBy ? po.orderedBy.replace(/_/g, " ").toUpperCase() : "",
            formatTanggal(po.estimasiTanggalTerima),
            item.keterangan ? item.keterangan.toUpperCase() : "",
            item.divisi ? item.divisi.toUpperCase() : "",
            item.jumlahSudahTerkirim,
            item.jumlahBelumTerkirim,
            item.keterlambatan,
            (() => {
              const rawNoteText = item.alasan_keterlambatan || (item.autoKeteranganLines || []).join("\n");
              const parsed = parseNoteText(rawNoteText);
              const textOnly = parsed.map(line => line.segments.map(s => s.text).join("")).join("\n");
              return textOnly.toUpperCase();
            })(),
            po.termin ? po.termin.toUpperCase() : "",
            item.status ? item.status.toUpperCase() : "",
          ];

          rowData.forEach((val, idx) => {
            row.getCell(idx + 1).value = val;
          });

          currentRowIdx++;
        });
      } else {
        const row = worksheet.getRow(currentRowIdx);
        const rowData = [
          po.noPO ? po.noPO.toUpperCase() : "",
          formatTanggal(po.tanggalPO),
          po.supplier ? po.supplier.toUpperCase() : "",
          "", "", "", 0, "0", 0, "0", 0, 0,
          po.totalPembayaran || 0,
          po.orderedBy ? po.orderedBy.replace(/_/g, " ").toUpperCase() : "",
          formatTanggal(po.estimasiTanggalTerima),
          "", 
          "", 
          0,
          0,
          "0 HARI",
          "",
          po.termin ? po.termin.toUpperCase() : "",
          po.status ? po.status.toUpperCase() : "",
        ];
        rowData.forEach((val, idx) => {
          row.getCell(idx + 1).value = val;
        });
        currentRowIdx++;
      }

      // Merge PO specific headers
      const poEndRow = currentRowIdx - 1;
      if (poEndRow > poStartRow) {
        const mergeCols = [1, 2, 3, 13, 14, 15, 22];
        mergeCols.forEach((col) => {
          try {
            worksheet.mergeCells(poStartRow, col, poEndRow, col);
          } catch (e) {}
        });
      }
    });

    const currencyFmt = '_("Rp."* #,##0_);_("Rp."* (#,##0);_("Rp."* "-"_);_(@_)';
    worksheet.getColumn(5).numFmt = '#,##0'; // Qty
    worksheet.getColumn(7).numFmt = currencyFmt; // Harga Satuan
    worksheet.getColumn(9).numFmt = currencyFmt; // Diskon Rp
    worksheet.getColumn(11).numFmt = currencyFmt; // PPN Rp
    worksheet.getColumn(12).numFmt = currencyFmt; // Total
    worksheet.getColumn(13).numFmt = currencyFmt; // Grand Total
    worksheet.getColumn(18).numFmt = '#,##0'; // Sudah Terkirim
    worksheet.getColumn(19).numFmt = '#,##0'; // Belum Terkirim

    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        const extraPadding = (cellValue.length > 0 && /^\d+$/.test(cellValue)) ? 8 : 4;
        maxLength = Math.max(maxLength, cellValue.length + extraPadding);
      });
      column.width = Math.min(maxLength, 60);
    });

    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 25 : 20;
      row.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-monitoring-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "CLOSED" || s === "COMPLETED" || s === "TELAH DIBUAT BTB" || s === "PART COMPLETE" || s === "TELAH SELESAI" || s === "SELESAI") {
      return (
        <Badge className="bg-success/10 text-success border-success/20 font-bold">
          CLOSED
        </Badge>
      );
    }
    if (s === "OPEN" || s === "PARTIAL PART" || s === "GANTUNG" || s === "PARTIAL PO" || s === "PARTIAL" || s === "MENUNGGU" || s === "WAITING PART" || s === "WAITING PO") {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold">
          OPEN
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Monitoring</h1>
            <p className="text-muted-foreground">Monitoring harian keterlambatan dan status Purchase Order</p>
          </div>
          {/* Export section */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4 gap-2 border-dashed border-gray-400 hover:bg-gray-50 hover:border-gray-500">
                  <Download className="h-4 w-4" />
                  <span className="font-medium">Export Excel</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 z-[9999] bg-white" align="end">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Export Data Daily Monitoring
                    </h4>
                    <p className="text-xs text-muted-foreground">Pilih data yang ingin diunduh.</p>
                  </div>

                  <Tabs defaultValue={exportMode} onValueChange={(v) => setExportMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
                      <TabsTrigger value="selected" className="text-xs">Pilihan</TabsTrigger>
                      <TabsTrigger value="range" className="text-xs">Tanggal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4 space-y-2">
                      <div className="p-3 bg-gray-50 rounded-md border text-center">
                        <span className="text-xs text-muted-foreground block mb-1">Total Data</span>
                        <span className="text-xl font-bold text-primary">{sortedPOData.length}</span>
                      </div>
                    </TabsContent>

                    <TabsContent value="selected" className="mt-4 space-y-2">
                      <div className="p-3 bg-gray-50 rounded-md border text-center">
                        <span className="text-xs text-muted-foreground block mb-1">Data Terpilih</span>
                        <span className={`text-xl font-bold ${selectedPOs.length > 0 ? 'text-primary' : 'text-gray-400'}`}>
                          {selectedPOs.length}
                        </span>
                      </div>
                      {selectedPOs.length === 0 && (
                        <p className="text-[10px] text-red-500 text-center">Pilih checkbox pada tabel terlebih dahulu.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="range" className="mt-4 space-y-3">
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          <Label className="text-xs">Tanggal Mulai</Label>
                          <Input
                            type="date"
                            value={exportStartDate}
                            onChange={(e) => setExportStartDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Tanggal Akhir</Label>
                          <Input
                            type="date"
                            value={exportEndDate}
                            onChange={(e) => setExportEndDate(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button
                    onClick={handleExport}
                    className="w-full h-9 bg-green-600 hover:bg-green-700 text-white gap-2"
                    disabled={
                      (exportMode === "selected" && selectedPOs.length === 0) ||
                      (exportMode === "range" && (!exportStartDate || !exportEndDate))
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .xlsx
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            placeholder="Cari No. PO, Supplier, atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[320px]"
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Tanggal PO:</span>
            <DatePicker
              selected={filterStartDate}
              onChange={(date) => setFilterStartDate(date)}
              selectsStart
              startDate={filterStartDate}
              endDate={filterEndDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Mulai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              maxDate={filterEndDate || undefined}
              isClearable
            />
            <span className="mx-1">-</span>
            <DatePicker
              selected={filterEndDate}
              onChange={(date) => setFilterEndDate(date)}
              selectsEnd
              startDate={filterStartDate}
              endDate={filterEndDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Selesai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              minDate={filterStartDate || undefined}
              isClearable
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Status:</span>
            <select
              value={filterItemStatus}
              onChange={(e) => setFilterItemStatus(e.target.value)}
              className="h-9 w-28 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:bg-slate-50 font-medium text-slate-700"
            >
              <option value="ALL">Semua</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Table container */}
        <Card className="bg-white bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Daily Monitoring PO</CardTitle>
            <CardDescription>
              Total: {filteredPOData.length} PO | Dipilih: {selectedPOs.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={tableWrapperRef}
              className="overflow-auto"
              style={{
                maxHeight: "70vh",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
              }}
            >
              <Table className="border-collapse border border-gray-300 table-auto min-w-full">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead
                      className="border border-gray-300 px-3 py-1 text-center align-middle sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Checkbox
                        checked={selectedPOs.length === sortedPOData.length && sortedPOData.length > 0}
                        onCheckedChange={handleSelectAll}
                        style={{
                          boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                          border: "1.5px solid #bbb",
                          borderRadius: 4,
                        }}
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </TableHead>
                    <TableHead className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>NO. PO</TableHead>
                    <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>TANGGAL PO</TableHead>
                    <TableHead className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>NAMA SUPPLIER</TableHead>
                    <TableHead 
                      className="border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase select-none relative group" 
                      style={{ 
                        position: "sticky", 
                        top: 0, 
                        zIndex: 10, 
                        background: "#f3f4f6", 
                        borderBottom: "2px solid #d1d5db",
                        width: columnWidths.namaBarang,
                        minWidth: columnWidths.namaBarang,
                        maxWidth: columnWidths.namaBarang,
                      }}
                    >
                      NAMA/JENIS BARANG
                      <div 
                        onMouseDown={(e) => startResize("namaBarang", e)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 bg-transparent active:bg-blue-600 transition-colors z-20"
                      />
                    </TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>JUMLAH</TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>SATUAN</TableHead>
                    <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>HARGA SATUAN</TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>DISKON (%)</TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>DISKON (RP)</TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>PPN (%)</TableHead>
                    <TableHead className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>PPN (RP)</TableHead>
                    <TableHead className="min-w-[110px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>TOTAL</TableHead>
                    <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>GRAND TOTAL</TableHead>
                    <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>NAMA PURCHASING</TableHead>
                    <TableHead className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>ESTIMASI PENERIMAAN</TableHead>
                    <TableHead 
                      className="border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase select-none relative group" 
                      style={{ 
                        position: "sticky", 
                        top: 0, 
                        zIndex: 10, 
                        background: "#f3f4f6", 
                        borderBottom: "2px solid #d1d5db",
                        width: columnWidths.keteranganPO,
                        minWidth: columnWidths.keteranganPO,
                        maxWidth: columnWidths.keteranganPO,
                      }}
                    >
                      KETERANGAN PO
                      <div 
                        onMouseDown={(e) => startResize("keteranganPO", e)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 bg-transparent active:bg-blue-600 transition-colors z-20"
                      />
                    </TableHead>
                    <TableHead className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase whitespace-nowrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>DEPARTEMENT</TableHead>
                    <TableHead className="min-w-[160px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase whitespace-nowrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>JUMLAH SUDAH TERKIRIM</TableHead>
                    <TableHead className="min-w-[160px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase whitespace-nowrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>JUMLAH BELUM TERKIRIM</TableHead>
                    <TableHead className="min-w-[130px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase whitespace-nowrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>KETERLAMBATAN</TableHead>
                    <TableHead className="min-w-[400px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase whitespace-nowrap" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>KETERANGAN/ALASAN KETERLAMBATAN</TableHead>
                    <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>TERMIN PEMBAYARAN</TableHead>
                    <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPOData.map((po) => {
                    const allItems = po.poItems.flatMap((poItem: any) =>
                      poItem.items.map((item: any) => ({
                        ...item,
                        noPR: poItem.noPR,
                      }))
                    );

                    const filteredItems = allItems.filter((item: any) => {
                      if (filterItemStatus === "ALL") return true;
                      return (item.status || "").toUpperCase() === filterItemStatus.toUpperCase();
                    });

                    if (filteredItems.length === 0) return null;

                    return (
                      <React.Fragment key={po.id}>
                        {filteredItems.map((item: any, itemIndex: number) => (
                          <TableRow
                            key={`${po.id}-item-${itemIndex}`}
                            id={itemIndex === 0 ? po.noPO : undefined}
                            className={`hover:bg-gray-50 transition-colors ${highlight && po.noPO === highlight ? "bg-yellow-100" : ""}`}
                          >
                            {itemIndex === 0 ? (
                              <>
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
                                  <Checkbox
                                    checked={selectedPOs.includes(po.id)}
                                    onCheckedChange={(checked) => handleSelectPO(po.id, checked as boolean)}
                                    style={{
                                      boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                                      border: "1.5px solid #bbb",
                                      borderRadius: 4,
                                    }}
                                  />
                                </TableCell>
                                <TableCell rowSpan={filteredItems.length} className="font-semibold px-3 py-1 border border-gray-300 align-middle text-center uppercase text-blue-600">
                                  {po.noPO}
                                </TableCell>
                                <TableCell rowSpan={filteredItems.length} className="text-center border border-gray-300 align-middle min-w-[120px] uppercase">
                                  {formatTanggal(po.tanggalPO)}
                                </TableCell>
                                <TableCell rowSpan={filteredItems.length} className="text-left border border-gray-300 align-middle min-w-[140px] uppercase">
                                  {po.supplier}
                                </TableCell>
                              </>
                            ) : null}

                            <TableCell 
                              className="px-3 py-1 border border-gray-300 align-middle text-left text-justify whitespace-normal break-words uppercase"
                              style={{
                                width: columnWidths.namaBarang,
                                minWidth: columnWidths.namaBarang,
                                maxWidth: columnWidths.namaBarang,
                              }}
                            >
                              {item.namaBarang}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[90px] uppercase">
                              {item.jumlahPO}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[90px] uppercase">
                              {item.satuan}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[120px] uppercase">
                              Rp {item.hargaSatuan.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[90px] uppercase">
                              {item.diskonPersen}%
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              Rp {item.diskonNominal.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[90px] uppercase">
                              {item.ppnItem}%
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              Rp {item.ppnAmount.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[110px] uppercase">
                              Rp {(item.totalPerItem ?? 0).toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </TableCell>

                            {itemIndex === 0 ? (
                              <>
                                <TableCell rowSpan={filteredItems.length} className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[120px] uppercase font-bold">
                                  Rp {po.totalPembayaran.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                                </TableCell>
                                 <TableCell rowSpan={filteredItems.length} className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[120px] uppercase">
                                  {po.orderedBy ?? ""}
                                </TableCell>
                              </>
                            ) : null}

                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[140px] uppercase">
                              {formatTanggal(po.estimasiTanggalTerima)}
                            </TableCell>
                            <TableCell 
                              className="px-3 py-1 border border-gray-300 align-middle text-left text-justify whitespace-normal break-words uppercase"
                              style={{
                                width: columnWidths.keteranganPO,
                                minWidth: columnWidths.keteranganPO,
                                maxWidth: columnWidths.keteranganPO,
                              }}
                            >
                              {item.keterangan}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[140px] uppercase">
                              {item.divisi || "-"}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[120px] uppercase">
                              {item.jumlahSudahTerkirim}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[120px] uppercase">
                              {item.jumlahBelumTerkirim}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[120px] uppercase">
                              {item.keterlambatan}
                            </TableCell>
                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-left min-w-[400px]">
                              {(() => {
                                const hasCustomReason = !!item.alasan_keterlambatan;
                                const rawNoteText = hasCustomReason
                                  ? item.alasan_keterlambatan
                                  : (item.autoKeteranganLines || []).join("\n");
                                
                                const parsedLines = parseNoteText(rawNoteText);

                                return (
                                  <div className="flex items-start justify-between gap-3">
                                    {/* Note Text on Left */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                      {parsedLines.map((lineObj: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className={`text-xs font-semibold whitespace-nowrap flex flex-wrap items-center gap-0.5 ${
                                            lineObj.isHidden 
                                              ? "text-slate-400 italic" 
                                              : hasCustomReason 
                                                ? "text-slate-800" 
                                                : "text-slate-600"
                                          }`}
                                        >
                                          {lineObj.segments.map((seg: any, segIdx: number) => (
                                            <span
                                              key={segIdx}
                                              className={seg.isRed ? "text-red-500 font-bold" : ""}
                                            >
                                              {seg.text}
                                            </span>
                                          ))}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Edit Button on Right */}
                                    {!isReadOnly && (
                                      <div className="shrink-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openEditReason(item, po.noPO)}
                                          className="h-6 w-20 px-1 text-[10px] text-blue-600 border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 font-semibold flex items-center justify-center gap-1 rounded-md"
                                        >
                                          <Edit className="h-2.5 w-2.5" />
                                          Edit
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>

                            {itemIndex === 0 ? (
                              <TableCell rowSpan={filteredItems.length} className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[120px] uppercase">
                                {po.termin || "-"}
                              </TableCell>
                            ) : null}

                            <TableCell className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[100px] uppercase">
                              {getStatusBadge(item.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Alasan Keterlambatan Modal */}
        {editReasonOpen && editingItem &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 min-w-[400px] max-w-[500px] space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Keterangan/Alasan Keterlambatan</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    PO: <span className="font-semibold text-slate-700">{editingItem.noPO}</span> | Barang: <span className="font-semibold text-slate-700">{editingItem.namaBarang}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reason-input" className="text-sm font-semibold">Alasan Keterlambatan</Label>
                  <Textarea
                    id="reason-input"
                    placeholder="Masukkan alasan keterlambatan pengiriman barang..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="min-h-[100px] rounded-xl focus-visible:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditReasonOpen(false)} className="rounded-xl">
                    Batal
                  </Button>
                  <Button onClick={handleSaveReason} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Simpan Alasan
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        }

        {/* Toast */}
        {toastOpen &&
          createPortal(
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
              <div className={`border shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 ${toastError ? "bg-red-600 text-white border-red-600" : "bg-white border-slate-200 text-green-600"}`}>
                <span className="text-sm font-medium">{toastMsg}</span>
                <button onClick={() => setToastOpen(false)} className="hover:opacity-80 font-bold ml-2">×</button>
              </div>
            </div>,
            document.body
          )
        }
      </div>
    </MainLayout>
  );
}
