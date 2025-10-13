"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function RekapFullPage() {
  const [btbData, setBtbData] = useState<any[]>([]);
  const [bkbData, setBkbData] = useState<any[]>([]);

  // Filter states
  const [filterSumber, setFilterSumber] = useState<string[]>([]);
  const [filterNoDokumen, setFilterNoDokumen] = useState<string[]>([]);
  const [noDokumenSearch, setNoDokumenSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState<string[]>([]);
  const [tanggalSearch, setTanggalSearch] = useState("");
  const [filterNamaBarang, setFilterNamaBarang] = useState<string[]>([]);
  const [namaBarangSearch, setNamaBarangSearch] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearch, setSatuanSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [filterKeterangan, setFilterKeterangan] = useState<string[]>([]);
  const [keteranganSearch, setKeteranganSearch] = useState("");

  useEffect(() => {
    setBtbData(JSON.parse(localStorage.getItem("btbData") || "[]"));
    setBkbData(JSON.parse(localStorage.getItem("bkbData") || "[]"));
  }, []);

  // Gabungkan data BTB dan BKB ke satu array
  const rekapData = [
    // BTB
    ...btbData.flatMap((btb) =>
      (btb.items && Array.isArray(btb.items) && btb.items.length > 0
        ? btb.items
        : btb.barang
        ? [{ barang: btb.barang, jumlah: btb.jumlah, satuan: btb.satuan }]
        : []
      ).map((item: any) => ({
        sumber: "BTB",
        noDokumen: btb.noBTB,
        tanggal: btb.tanggal,
        namaBarang: item.barang,
        quantity: item.jumlah,
        satuan: item.satuan,
        supplier: btb.supplier,
        keterangan: btb.keterangan || "",
      }))
    ),
    // BKB
    ...bkbData.flatMap((bkb) =>
      (Array.isArray(bkb.items) && bkb.items.length > 0
        ? bkb.items
        : Array.isArray(bkb.barang)
        ? bkb.barang
        : bkb.barang
        ? [
            {
              barang: bkb.barang,
              jumlah: bkb.jumlah,
              satuan: bkb.satuan,
              keterangan: bkb.keterangan,
            },
          ]
        : []
      ).map((item: any) => ({
        sumber: "BKB",
        noDokumen: bkb.noBKB,
        tanggal: bkb.tanggalBKB || bkb.tanggal,
        namaBarang: item.barang,
        quantity: item.jumlah,
        satuan: item.satuan,
        supplier: "", // BKB tidak punya supplier
        keterangan: item.keterangan ?? bkb.keterangan ?? "",
      }))
    ),
  ];

  // Nilai unik untuk filter dropdown
  const uniqueSumber = ["BTB", "BKB"];
  const uniqueNoDokumen = Array.from(
    new Set(rekapData.map((d) => d.noDokumen).filter(Boolean))
  ).sort();
  const uniqueTanggal = Array.from(
    new Set(rekapData.map((d) => d.tanggal).filter(Boolean))
  ).sort();
  const uniqueNamaBarang = Array.from(
    new Set(rekapData.map((d) => d.namaBarang).filter(Boolean))
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(rekapData.map((d) => d.satuan).filter(Boolean))
  ).sort();
  const uniqueSupplier = Array.from(
    new Set(rekapData.map((d) => d.supplier).filter(Boolean))
  ).sort();
  const uniqueKeterangan = Array.from(
    new Set(rekapData.map((d) => d.keterangan).filter(Boolean))
  ).sort();

  // Filter data
  const filteredData = rekapData.filter((row) => {
    const matchSumber =
      filterSumber.length === 0 || filterSumber.includes(row.sumber);
    const matchNoDokumen =
      filterNoDokumen.length === 0 || filterNoDokumen.includes(row.noDokumen);
    const matchTanggal =
      filterTanggal.length === 0 || filterTanggal.includes(row.tanggal);
    const matchNamaBarang =
      filterNamaBarang.length === 0 ||
      filterNamaBarang.includes(row.namaBarang);
    const matchSatuan =
      filterSatuan.length === 0 || filterSatuan.includes(row.satuan);
    const matchSupplier =
      filterSupplier.length === 0 || filterSupplier.includes(row.supplier);
    const matchKeterangan =
      filterKeterangan.length === 0 ||
      filterKeterangan.includes(row.keterangan);
    return (
      matchSumber &&
      matchNoDokumen &&
      matchTanggal &&
      matchNamaBarang &&
      matchSatuan &&
      matchSupplier &&
      matchKeterangan
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rekapitulasi BTB & BKB</CardTitle>
            <CardDescription>
              Data gabungan seluruh transaksi BTB dan BKB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300 min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    {/* Sumber */}
                    <TableHead className="min-w-[80px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Sumber <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2 bg-white">
                          {uniqueSumber.map((s) => (
                            <div
                              key={s}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`sumber-${s}`}
                                checked={filterSumber.includes(s)}
                                onCheckedChange={(checked) => {
                                  if (checked)
                                    setFilterSumber([...filterSumber, s]);
                                  else
                                    setFilterSumber(
                                      filterSumber.filter((x) => x !== s)
                                    );
                                }}
                              />
                              <Label
                                htmlFor={`sumber-${s}`}
                                className="text-sm"
                              >
                                {s}
                              </Label>
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* No Dokumen */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            No Dokumen <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No Dokumen..."
                            value={noDokumenSearch}
                            onChange={(e) => setNoDokumenSearch(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueNoDokumen
                              .filter((n) =>
                                n
                                  .toLowerCase()
                                  .includes(noDokumenSearch.toLowerCase())
                              )
                              .map((n) => (
                                <div
                                  key={n}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`nodokumen-${n}`}
                                    checked={filterNoDokumen.includes(n)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterNoDokumen([
                                          ...filterNoDokumen,
                                          n,
                                        ]);
                                      else
                                        setFilterNoDokumen(
                                          filterNoDokumen.filter((x) => x !== n)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`nodokumen-${n}`}
                                    className="text-sm"
                                  >
                                    {n}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tanggal */}
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Tanggal <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari Tanggal..."
                            value={tanggalSearch}
                            onChange={(e) => setTanggalSearch(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueTanggal
                              .filter((t) =>
                                t
                                  .toLowerCase()
                                  .includes(tanggalSearch.toLowerCase())
                              )
                              .map((t) => (
                                <div
                                  key={t}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tanggal-${t}`}
                                    checked={filterTanggal.includes(t)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggal([...filterTanggal, t]);
                                      else
                                        setFilterTanggal(
                                          filterTanggal.filter((x) => x !== t)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tanggal-${t}`}
                                    className="text-sm"
                                  >
                                    {t}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Nama Barang */}
                    <TableHead className="min-w-[180px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Nama Barang <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari Nama Barang..."
                            value={namaBarangSearch}
                            onChange={(e) =>
                              setNamaBarangSearch(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueNamaBarang
                              .filter((n) =>
                                n
                                  .toLowerCase()
                                  .includes(namaBarangSearch.toLowerCase())
                              )
                              .map((n) => (
                                <div
                                  key={n}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`namabarang-${n}`}
                                    checked={filterNamaBarang.includes(n)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterNamaBarang([
                                          ...filterNamaBarang,
                                          n,
                                        ]);
                                      else
                                        setFilterNamaBarang(
                                          filterNamaBarang.filter(
                                            (x) => x !== n
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`namabarang-${n}`}
                                    className="text-sm"
                                  >
                                    {n}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Quantity */}
                    <TableHead className="min-w-[90px]">Quantity</TableHead>
                    {/* Satuan */}
                    <TableHead className="min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Satuan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari Satuan..."
                            value={satuanSearch}
                            onChange={(e) => setSatuanSearch(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueSatuan
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(satuanSearch.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`satuan-${s}`}
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
                                  <Label
                                    htmlFor={`satuan-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Supplier */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Supplier <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari Supplier..."
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueSupplier
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(supplierSearch.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`supplier-${s}`}
                                    checked={filterSupplier.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterSupplier([
                                          ...filterSupplier,
                                          s,
                                        ]);
                                      else
                                        setFilterSupplier(
                                          filterSupplier.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`supplier-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Keterangan */}
                    <TableHead className="min-w-[160px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Keterangan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari Keterangan..."
                            value={keteranganSearch}
                            onChange={(e) =>
                              setKeteranganSearch(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKeterangan
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(keteranganSearch.toLowerCase())
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`keterangan-${k}`}
                                    checked={filterKeterangan.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKeterangan([
                                          ...filterKeterangan,
                                          k,
                                        ]);
                                      else
                                        setFilterKeterangan(
                                          filterKeterangan.filter(
                                            (x) => x !== k
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`keterangan-${k}`}
                                    className="text-sm"
                                  >
                                    {k}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground"
                      >
                        Tidak ada data rekap.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.sumber}</TableCell>
                      <TableCell>{row.noDokumen}</TableCell>
                      <TableCell>{row.tanggal}</TableCell>
                      <TableCell>{row.namaBarang}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{row.satuan}</TableCell>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell>{row.keterangan}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
