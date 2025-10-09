// Dummy data untuk testing aplikasi monitoring
export interface PRItem {
  id: string;
  namaBarang: string;
  jumlah: number;
  originalJumlah: number; // Original quantity from first input
  satuan: string;
  keterangan?: string; // Item-specific description
}

export interface PRData {
  id: string;
  noPR: string;
  tanggalPR: string;
  items: PRItem[]; // Multiple items per PR
  divisi: "IT" | "Civil" | "Eng" | "FAD" | "HRD";
  urgensi: "Low" | "Medium" | "High";
  dibuatOleh: string;
  status:
    | "Draft"
    | "Submitted"
    | "Approved"
    | "Processed"
    | "Clear"
    | "Gantung"
    | "Menunggu"
    | "Telah Selesai";
  createdAt: string;
  keterangan?: string;
}

export interface POData {
  id: string;
  noPO: string;
  tanggalPO: string;
  supplier: string;
  diskon: string;
  originalDiskon: string;
  ppn: number;
  totalPembayaran: number;
  orderedBy: string;
  estimasiTanggalDiterima: string;
  statusPengiriman: string;
  statusPermintaan: string;
  prIds: string[];
  poItems: Array<{
    prId: string;
    noPR: string;
    items: Array<
      PRItem & { hargaSatuan: number; jumlahPO: number; jumlahAsli: number }
    >;
  }>;
  status:
    | "Draft"
    | "Submitted"
    | "Approved"
    | "Delivered"
    | "Completed"
    | "Menunggu"
    | "Gantung"
    | "Telah dibuat BTB";
  keterangan?: string;
  createdAt: string;
}

export interface BTBData {
  id: string;
  noBTB: string;
  tanggal: string;
  periode: string;
  supplier: string;
  kodeSupplier: string;
  barang: string;
  jumlah: number;
  satuan: string;
  biaya: number;
  diterimaOleh: string;
  poId: string;
  status: "Draft" | "Received" | "Verified";
  createdAt: string;
}

export interface BKBData {
  id: string;
  noBKB: string;
  tanggal: string;
  tanggalBKB?: string;
  periode: string;
  supplier: string;
  kodeSupplier: string;
  barang: string;
  jumlah: number;
  satuan: string;
  biaya: number;
  dikirimOleh: string;
  btbId: string;
  status: "Draft" | "Shipped" | "Delivered";
  createdAt: string;
  keterangan?: string;
  items?: Array<{
    barang: string;
    jumlah: number;
    satuan: string;
    keterangan?: string;
    btbId: string;
  }>;
}

export interface RekapFullItem {
  id: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  keterangan?: string;
}

export interface RekapFullData {
  id: string;
  tahunPR: string;
  bulanPR: string;
  noPR: string;
  tanggalPR: string;
  hariPR: string;
  daftarBarangPR: string;
  quantityAwalPR: number;
  quantityPR: number;
  satuanPR: string;
  keteranganPR: string;
  divisi: string;
  targetTanggalPO: string;
  delay: number;
  noPO: string;
  tanggalPO: string;
  daftarBarangPO: string;
  quantityPO: number;
  satuanPO: string;
  keteranganPO: string;
  diskonPersen: number;
  diskonRp: number;
  subHargaDiskonRp: number;
  ppnPersen: number;
  ppnRp: number;
  totalHarga: number;
  dibuatOleh: string;
  tanggalEstimasiDiterima: string;
  kode: string;
  statusPengiriman: string;
  supplier: string;
  status: string;
  createdAt: string;
}

export const generateDummyPRData = (): PRData[] => {
  const divisi = ["IT", "Civil", "Eng", "FAD", "HRD"] as const;
  const urgensi = ["Low", "Medium", "High"] as const;
  const status = [
    "Draft",
    "Submitted",
    "Approved",
    "Processed",
    "Clear",
    "Gantung",
    "Menunggu",
    "Telah Selesai",
  ] as const;
  const barang = [
    "Laptop Dell Latitude",
    "Printer Canon",
    "Kertas A4",
    "Tinta Printer",
    "Mouse Wireless",
    "Keyboard Mechanical",
    "Monitor LED 24 inch",
    "Kabel HDMI",
    "Hard Disk External",
    "RAM DDR4 8GB",
  ];
  const satuan = ["pcs", "unit", "set", "box"];

  // Create specific PR for testing
  const testPR: PRData = {
    id: "PR-001",
    noPR: "PR/2024/001",
    tanggalPR: "2024-01-01",
    items: [
      {
        id: "item-001-a",
        namaBarang: "Barang A",
        jumlah: 10,
        originalJumlah: 10,
        satuan: "pcs",
        keterangan: "Test item A",
      },
      {
        id: "item-001-b",
        namaBarang: "Barang B",
        jumlah: 15,
        originalJumlah: 15,
        satuan: "pcs",
        keterangan: "Test item B",
      },
      {
        id: "item-001-c",
        namaBarang: "Barang C",
        jumlah: 10,
        originalJumlah: 10,
        satuan: "pcs",
        keterangan: "Test item C",
      },
    ],
    keterangan: "Test PR for cumulative PO tracking",
    divisi: "IT",
    urgensi: "Medium",
    dibuatOleh: "User1",
    status: "Approved",
    createdAt: new Date().toISOString(),
  };

  // Generate additional random PRs
  const additionalPRs = Array.from({ length: 49 }, (_, i) => {
    // Generate 1-3 items per PR
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: PRItem[] = [];

    for (let j = 0; j < numItems; j++) {
      const jumlah = Math.floor(Math.random() * 21); // 0 to 20
      const keterangan =
        jumlah === 0
          ? "Selesai"
          : `Kebutuhan ${
              divisi[Math.floor(Math.random() * divisi.length)]
            } untuk operasional`;
      items.push({
        id: `item-${i + 1}-${j}`,
        namaBarang: barang[Math.floor(Math.random() * barang.length)],
        jumlah,
        originalJumlah: jumlah,
        satuan: satuan[Math.floor(Math.random() * satuan.length)],
        keterangan,
      });
    }

    return {
      id: `PR-${String(i + 2).padStart(3, "0")}`,
      noPR: `PR/2024/${String(i + 2).padStart(3, "0")}`,
      tanggalPR: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )
        .toISOString()
        .split("T")[0],
      items,
      keterangan: `Kebutuhan ${
        divisi[Math.floor(Math.random() * divisi.length)]
      } untuk operasional`,
      divisi: divisi[Math.floor(Math.random() * divisi.length)],
      urgensi: urgensi[Math.floor(Math.random() * urgensi.length)],
      dibuatOleh: `User${Math.floor(Math.random() * 10) + 1}`,
      status: status[Math.floor(Math.random() * status.length)],
      createdAt: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toISOString(),
    };
  });

  return [testPR, ...additionalPRs];
};

export const generateDummyRekapFullData = (): RekapFullData[] => {
  const divisi = ["IT", "Civil", "Eng", "FAD", "HRD"];
  const suppliers = [
    "PT. Supplier A",
    "PT. Supplier B",
    "PT. Supplier C",
    "PT. Supplier D",
  ];
  const barangPR = [
    "Laptop Dell",
    "Printer Canon",
    "Kertas A4",
    "Mouse Wireless",
  ];
  const barangPO = [
    "Laptop Dell Latitude",
    "Printer Canon MP",
    "Kertas A4 80gsm",
    "Mouse Logitech",
  ];
  const satuan = ["pcs", "unit", "set", "box"];
  const statusPengiriman = ["Pending", "In Transit", "Delivered", "Cancelled"];
  const status = ["Draft", "Approved", "Completed"];

  return Array.from({ length: 50 }, (_, i) => {
    const tanggalPR = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const tanggalPO = new Date(
      tanggalPR.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
    );
    const targetTanggalPO = new Date(
      tanggalPR.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    const delay = Math.floor(
      (tanggalPO.getTime() - targetTanggalPO.getTime()) / (24 * 60 * 60 * 1000)
    );
    const quantityAwal = Math.floor(Math.random() * 20) + 1;
    const quantityPR = quantityAwal;
    const quantityPO = quantityPR;
    const hargaSatuan = Math.floor(Math.random() * 1000000) + 100000;
    const diskonPersen = Math.floor(Math.random() * 20);
    const diskonRp = (hargaSatuan * quantityPO * diskonPersen) / 100;
    const subHargaDiskonRp = hargaSatuan * quantityPO - diskonRp;
    const ppnPersen = 11;
    const ppnRp = (subHargaDiskonRp * ppnPersen) / 100;
    const totalHarga = subHargaDiskonRp + ppnRp;

    return {
      id: `rekap-${String(i + 1).padStart(3, "0")}`,
      tahunPR: tanggalPR.getFullYear().toString(),
      bulanPR: (tanggalPR.getMonth() + 1).toString().padStart(2, "0"),
      noPR: `PR/2024/${String(i + 1).padStart(3, "0")}`,
      tanggalPR: tanggalPR.toISOString().split("T")[0],
      hariPR: tanggalPR.toLocaleDateString("id-ID", { weekday: "long" }),
      daftarBarangPR: barangPR[Math.floor(Math.random() * barangPR.length)],
      quantityAwalPR: quantityAwal,
      quantityPR: quantityPR,
      satuanPR: satuan[Math.floor(Math.random() * satuan.length)],
      keteranganPR: `Kebutuhan ${
        divisi[Math.floor(Math.random() * divisi.length)]
      }`,
      divisi: divisi[Math.floor(Math.random() * divisi.length)],
      targetTanggalPO: targetTanggalPO.toISOString().split("T")[0],
      delay: delay,
      noPO: `PO/2024/${String(i + 1).padStart(3, "0")}`,
      tanggalPO: tanggalPO.toISOString().split("T")[0],
      daftarBarangPO: barangPO[Math.floor(Math.random() * barangPO.length)],
      quantityPO: quantityPO,
      satuanPO: satuan[Math.floor(Math.random() * satuan.length)],
      keteranganPO: `PO untuk ${
        barangPO[Math.floor(Math.random() * barangPO.length)]
      }`,
      diskonPersen: diskonPersen,
      diskonRp: diskonRp,
      subHargaDiskonRp: subHargaDiskonRp,
      ppnPersen: ppnPersen,
      ppnRp: ppnRp,
      totalHarga: totalHarga,
      dibuatOleh: `User${Math.floor(Math.random() * 10) + 1}`,
      tanggalEstimasiDiterima: new Date(
        tanggalPO.getTime() + 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      kode: `KODE-${String(i + 1).padStart(3, "0")}`,
      statusPengiriman:
        statusPengiriman[Math.floor(Math.random() * statusPengiriman.length)],
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      status: status[Math.floor(Math.random() * status.length)],
      createdAt: new Date().toISOString(),
    };
  });
};

// Initialize localStorage with dummy data
export const initializeDummyData = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("prData")) {
      localStorage.setItem("prData", JSON.stringify(generateDummyPRData()));
    }
    if (!localStorage.getItem("rekapFullData")) {
      localStorage.setItem(
        "rekapFullData",
        JSON.stringify(generateDummyRekapFullData())
      );
    }
  }
};
