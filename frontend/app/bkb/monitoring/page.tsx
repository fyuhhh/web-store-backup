"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Helper format tanggal DD-MM-YYYY
function formatTanggal(tgl: string | null | undefined) {
  if (!tgl) return "-";
  const [date] = tgl.split("T");
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}-${m}-${y}`;
}

export default function BKBMonitoringPage() {
  const [bkbRows, setBkbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  const [satuanMap, setSatuanMap] = useState<Record<string, string>>({});
  const [btbMap, setBtbMap] = useState<Record<string, string>>({});

  // Fetch satuan list from backend and build mapping
  useEffect(() => {
    fetch("http://localhost:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((s: any) => {
          map[String(s.id_satuan)] = s.satuan;
        });
        setSatuanMap(map);
      });
  }, []);

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBKBData() {
      setLoading(true);
      try {
        // Ambil semua BKB, BKB Item, User, Skema, Satuan, BTB
        const [bkbRes, bkbItemRes, userRes, skemaRes, , btbRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/bkb"),
            fetch("http://localhost:5000/api/bkb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/btb"),
          ]);
        const bkbList = await bkbRes.json();
        const bkbItemList = await bkbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        // satuanList tidak perlu, sudah di-fetch di atas
        const btbList = await btbRes.json();

        // Buat mapping id_user -> nama_pengguna
        const userMapObj: Record<string, string> = {};
        userList.forEach((u: any) => {
          userMapObj[String(u.id_user)] = u.nama_pengguna;
        });
        setUserMap(userMapObj);

        // Buat mapping id_skema -> skema
        const skemaMapObj: Record<string, string> = {};
        skemaList.forEach((s: any) => {
          skemaMapObj[String(s.id_skema)] = s.skema;
        });
        setSkemaMap(skemaMapObj);

        // Buat mapping id_btb_item -> no_btb (asal BTB)
        const btbMapObj: Record<string, string> = {};
        btbList.forEach((btb: any) => {
          btbMapObj[String(btb.id_btb)] = btb.no_btb;
        });
        setBtbMap(btbMapObj);

        // Gabungkan: untuk setiap bkb_item, cari parent bkb dan label satuan
        const rows = bkbItemList.map((item: any) => {
          const bkb = bkbList.find((b: any) => b.id_bkb === item.id_bkb);
          return {
            id: item.id_bkb_item,
            noBKB: bkb?.no_bkb ?? "",
            tanggalBKB: bkb?.tanggal_bkb ?? "",
            namaBarang: item.nama_barang ?? "",
            quantity: item.jumlah_keluar ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? "", // tampilkan label satuan
            keterangan: item.keterangan ?? "",
            dikeluarkanOleh: bkb?.dikeluarkan_oleh ?? "",
            skema: bkb?.id_skema ?? "",
          };
        });
        setBkbRows(rows);
      } catch (err) {
        setBkbRows([]);
      }
      setLoading(false);
    }
    fetchBKBData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satuanMap]); // refetch rows when satuanMap ready

  // Filter data
  const filteredBKBData = bkbRows.filter((row) => {
    const matchesSearch =
      row.noBKB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBKBData.length / itemsPerPage);
  const paginatedData = filteredBKBData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BKB (Bukti Keluar Barang)
            </h1>
            <p className="text-muted-foreground">
              Pantau pengeluaran barang dari BTB
            </p>
          </div>
          <div>
            <Input
              placeholder="Cari No. BKB / Barang / Keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Keluar Barang</CardTitle>
            <CardDescription>
              Total: {filteredBKBData.length} BKB Item
              {filteredBKBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBKBData.length)}
                  {" dari "}
                  {filteredBKBData.length} BKB Item
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead>No. BKB</TableHead>
                    <TableHead>Tanggal BKB</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Dikeluarkan Oleh</TableHead>
                    <TableHead>Skema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.noBKB}</TableCell>
                        <TableCell>{formatTanggal(row.tanggalBKB)}</TableCell>
                        <TableCell>{row.namaBarang}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              Number(row.quantity) > 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            {row.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.satuan}</TableCell>
                        <TableCell>{row.keterangan}</TableCell>
                        <TableCell>
                          {userMap[String(row.dikeluarkanOleh)] ??
                            row.dikeluarkanOleh}
                        </TableCell>
                        <TableCell>
                          {skemaMap[String(row.skema)] ?? row.skema}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Card>
      </div>
    </MainLayout>
  );
}
