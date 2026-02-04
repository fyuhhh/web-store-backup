prData.forEach((pr: any) => {
    const items = prItemData.filter((item: any) => item.id_PR === pr.id_PR);

    items.forEach((item: any, idx: number) => {
        let prInfoPrinted = false;

        // Cari PO Item yang terkait PR Item ini
        const poItems = poItemData.filter((poi: any) => String(poi.id_PRItem) === String(item.id_PRItem));

        if (poItems.length === 0) {
            rekapRows.push({
                id: pr.id_PR + "-" + idx,
                id_PR: pr.id_PR,
                periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                tahunPR: getYear(pr.tanggalPR),
                bulanPR: getMonthName(pr.tanggalPR),
                noPR: pr.noPR,
                tanggalPR: pr.tanggalPR
                    ? (() => {
                        const d = new Date(pr.tanggalPR);
                        return `${d.getDate().toString().padStart(2, "0")}-${(
                            d.getMonth() + 1
                        ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                    })()
                    : "",
                hariPR: getDayName(pr.tanggalPR),
                // New Fields
                kodeBarangPR: item.kodeBarang || "",
                spesifikasi: item.spesifikasi || "",
                noMR: item.noMR || "",

                daftarBarangPR: item.namaBarang,
                quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                quantityPO: item.jumlah ?? "",
                satuanPR: item.id_satuan
                    ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                    : "",
                keteranganPR: item.keterangan || "",
                divisi: pr.id_divisi
                    ? localDivisiMap[String(pr.id_divisi)] || pr.id_divisi
                    : "",
                dibuatOleh: pr.dibuatOleh,
                skemaPR: pr.id_skema ?? "",
                skemaPRLabel: pr.id_skema
                    ? localSkemaMap[String(pr.id_skema)] || pr.id_skema
                    : "",
                targetTanggalPO: formatDateSimple(pr.estimasipo),
                delay: "",
                status:
                    pr.status === "PARTIAL PO"
                        ? "WAITING PO"
                        : pr.status && !["Menunggu", "Gantung", "Diproses"].includes(pr.status)
                            ? pr.status
                            : "",
                noPO: "",
                tanggalPO: "",
                periodePO: "",
                supplier: "",
                quantityAwalPO: "",
                satuanPO: "",
                hargaSatuanPO: "",
                diskonPersen: "",
                diskonRp: "",
                ppnPersen: "",
                ppnRp: "",
                totalHarga: "",
                tanggalEstimasiDiterima: "",
                statusPengiriman: "",
                diorderOleh: "",
                diinputOleh: "",
                terminPembayaran: "",
                skemaPO: "",
                noBTB: "",
                tanggalBTB: "",
                periodeBTB: "",
                namaSupplierBTB: "",
                namaBarangBTB: "",
                quantityBTB: "",
                satuanBTB: "",
                sisaStokBTB: "",
                statusPermintaanByPR: "",
                plan: pr.plan || "",
                noPlan: "",
                biayaBTB: "",
                diterimaOleh: "",
                skemaBTB: "",
                targetPencapaianPO: "",

                // BKB Fields Empty
                noBKB: "",
                tanggalBKB: "",
                kodeBarangBKB: "",
                namaBarangBKB: "",
                quantityBKBData: "",
                satuanBKB: "",
                divisiBKB: "",
            });
            prInfoPrinted = true;
        } else {
            poItems.forEach((poItem: any) => {
                const po = poData.find((p: any) => String(p.id_PO) === String(poItem.id_PO));
                let poInfoPrinted = false;

                const btbItems = btbItemData.filter((bi: any) => String(bi.id_POItem) === String(poItem.id_POItem));

                // Helper to get PR fields (blank if printed)
                const getPRFields = () => {
                    if (prInfoPrinted) {
                        return {
                            id_PR: pr.id_PR,
                            periodePR: "",
                            tahunPR: "",
                            bulanPR: "",
                            noPR: "",
                            tanggalPR: "",
                            hariPR: "",
                            kodeBarangPR: "",
                            spesifikasi: "",
                            noMR: "",
                            daftarBarangPR: item.namaBarang,
                            quantityAwalPR: "",
                            quantityPO: "",
                            satuanPR: "",
                            keteranganPR: "",
                            divisi: "",
                            dibuatOleh: "",
                            skemaPR: "",
                            skemaPRLabel: "",
                            targetTanggalPO: "",
                            status: "",
                            plan: "",
                        };
                    }
                    return {
                        id_PR: pr.id_PR,
                        periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                        tahunPR: getYear(pr.tanggalPR),
                        bulanPR: getMonthName(pr.tanggalPR),
                        noPR: pr.noPR,
                        tanggalPR: pr.tanggalPR
                            ? (() => {
                                const d = new Date(pr.tanggalPR);
                                return `${d.getDate().toString().padStart(2, "0")}-${(
                                    d.getMonth() + 1
                                ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                            })()
                            : "",
                        hariPR: getDayName(pr.tanggalPR),
                        kodeBarangPR: item.kodeBarang || "",
                        spesifikasi: item.spesifikasi || "",
                        noMR: item.noMR || "",
                        daftarBarangPR: item.namaBarang,
                        quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                        quantityPO: item.jumlah ?? "",
                        satuanPR: item.id_satuan
                            ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                            : "",
                        keteranganPR: item.keterangan || "",
                        divisi: pr.id_divisi
                            ? localDivisiMap[String(pr.id_divisi)] || pr.id_divisi
                            : "",
                        dibuatOleh: pr.dibuatOleh,
                        skemaPR: pr.id_skema ?? "",
                        skemaPRLabel: pr.id_skema
                            ? localSkemaMap[String(pr.id_skema)] || pr.id_skema
                            : "",
                        targetTanggalPO: formatDateSimple(pr.estimasipo),
                        status:
                            pr.status === "PARTIAL PO"
                                ? "WAITING PO"
                                : pr.status && !["Menunggu", "Gantung", "Diproses"].includes(pr.status)
                                    ? pr.status
                                    : "",
                        plan: pr.plan || "",
                    };
                };

                // Helper to get PO fields (blank if printed)
                const getPOFields = () => {
                    if (poInfoPrinted) {
                        return {
                            id_POItem: poItem?.id_POItem || "",
                            noPO: "",
                            tanggalPO: "",
                            periodePO: "",
                            supplier: "",
                            quantityAwalPO: "",
                            quantityPO: "",
                            satuanPO: "",
                            hargaSatuanPO: "",
                            diskonPersen: "",
                            diskonRp: "",
                            ppnPersen: "",
                            ppnRp: "",
                            totalHarga: "",
                            tanggalEstimasiDiterima: "",
                            statusPengiriman: "",
                            diorderOleh: "",
                            diinputOleh: "",
                            terminPembayaran: "",
                            skemaPO: "",
                            targetPencapaianPO: "",
                            delay: "",
                        };
                    }
                    if (!po) return {
                        id_POItem: poItem?.id_POItem || "",
                        noPO: "",
                        tanggalPO: "",
                        periodePO: "",
                        supplier: "",
                        quantityAwalPO: "",
                        quantityPO: "",
                        satuanPO: "",
                        hargaSatuanPO: "",
                        diskonPersen: "",
                        diskonRp: "",
                        ppnPersen: "",
                        ppnRp: "",
                        totalHarga: "",
                        tanggalEstimasiDiterima: "",
                        statusPengiriman: "",
                        diorderOleh: "",
                        diinputOleh: "",
                        terminPembayaran: "",
                        skemaPO: "",
                        targetPencapaianPO: "",
                        delay: "",
                    };

                    return {
                        id_POItem: poItem?.id_POItem || "",
                        noPO: po.noPO,
                        tanggalPO: po.tanggalPO
                            ? (() => {
                                const d = new Date(po.tanggalPO);
                                return `${d.getDate().toString().padStart(2, "0")}-${(
                                    d.getMonth() + 1
                                ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                            })()
                            : "",
                        periodePO: po.tanggalPO ? `${getMonthName(po.tanggalPO)} ${getYear(po.tanggalPO)}` : "",
                        supplier: po.id_supplier
                            ? localSupplierMap[String(po.id_supplier)] || po.id_supplier
                            : "",
                        quantityAwalPO: poItem.jumlahPO ?? poItem.jumlah ?? "",
                        quantityPO: item.jumlah ?? "",
                        satuanPO: poItem.satuan ?? "",
                        hargaSatuanPO: poItem.hargaSatuan,
                        diskonPersen: poItem.diskonPersen !== undefined && poItem.diskonPersen !== null
                            ? (typeof poItem.diskonPersen === "string" && poItem.diskonPersen.includes("+")
                                ? poItem.diskonPersen
                                : (Number(poItem.diskonPersen) % 1 === 0
                                    ? Number(poItem.diskonPersen).toString()
                                    : Number(poItem.diskonPersen).toFixed(2)
                                ) + "%"
                            )
                            : "",
                        diskonRp: poItem.diskonRupiah,
                        ppnPersen: poItem.ppnPersen !== undefined && poItem.ppnPersen !== null
                            ? (Number(poItem.ppnPersen) % 1 === 0
                                ? Number(poItem.ppnPersen).toString()
                                : Number(poItem.ppnPersen).toFixed(2)
                            ) + "%"
                            : "",
                        ppnRp: po.ppnAmount,
                        totalHarga: computeItemTotal(po, poItem),
                        tanggalEstimasiDiterima: formatDateSimple(po.estimasiTanggalTerima),
                        statusPengiriman: po.statusPengiriman
                            ? localStatusPengirimanMap[String(po.statusPengiriman)] || po.statusPengiriman
                            : "",
                        diorderOleh: po.orderedBy,
                        diinputOleh: po.diinputOleh,
                        terminPembayaran: po.termin,
                        skemaPO: poItem.skema
                            ? localSkemaMap[String(poItem.skema)] || poItem.skema
                            : "",
                        targetPencapaianPO: po.tanggalPO
                            ? formatDateSimple(addWorkingDays(po.tanggalPO, 3))
                            : "",
                        delay: po.tanggalPO && pr.estimasipo
                            ? (() => {
                                const diff = countWorkingDaysBetween(pr.estimasipo, po.tanggalPO);
                                if (diff > 0) return `Telat ${diff} hari`;
                                if (diff < 0) return `Cepat ${Math.abs(diff)} hari`;
                                return "On Time";
                            })()
                            : "",
                    };
                };


                if (btbItems.length === 0) {
                    const prFields = getPRFields();
                    const poFields = getPOFields();

                    rekapRows.push({
                        id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || ""),
                        ...prFields,
                        ...poFields,

                        noBTB: "",
                        tanggalBTB: "",
                        periodeBTB: "",
                        namaSupplierBTB: "",
                        namaBarangBTB: "",
                        quantityBTB: "",
                        satuanBTB: "",
                        sisaStokBTB: poItem.jumlahPO,
                        statusPermintaanByPR: "",
                        noPlan: "",
                        biayaBTB: "",
                        diterimaOleh: "",
                        skemaBTB: "",
                        noBKB: "",
                        tanggalBKB: "",
                        kodeBarangBKB: "",
                        namaBarangBKB: "",
                        quantityBKBData: "",
                        satuanBKB: "",
                        divisiBKB: "",
                    });
                    prInfoPrinted = true;
                    poInfoPrinted = true;
                } else {
                    btbItems.forEach((btbItem: any) => {
                        const btb = btbData.find((b: any) => String(b.id_btb) === String(btbItem.id_btb));
                        let btbInfoPrinted = false;

                        const relatedBkbItems = bkbItemData.filter((bkb: any) => String(bkb.id_btb_item) === String(btbItem.id_btb_item));

                        // Helper to get BTB fields
                        const getBTBFields = () => {
                            if (btbInfoPrinted) {
                                return {
                                    noBTB: "",
                                    tanggalBTB: "",
                                    periodeBTB: "",
                                    namaSupplierBTB: "",
                                    namaBarangBTB: btbItem.nama_barang || item.namaBarang,
                                    quantityBTB: "",
                                    satuanBTB: "",
                                    sisaStokBTB: "",
                                    biayaBTB: "",
                                    diterimaOleh: "",
                                    skemaBTB: "",
                                };
                            }
                            if (!btb) return {
                                noBTB: "",
                                tanggalBTB: "",
                                periodeBTB: "",
                                namaSupplierBTB: "",
                                namaBarangBTB: btbItem.nama_barang || item.namaBarang,
                                quantityBTB: btbItem.jumlah_diterima,
                                satuanBTB: "",
                                sisaStokBTB: poItem.jumlahPO,
                                biayaBTB: "",
                                diterimaOleh: "",
                                skemaBTB: "",
                            };

                            return {
                                noBTB: btb.no_btb,
                                tanggalBTB: btb.tanggal_btb ? formatDateSimple(btb.tanggal_btb) : "",
                                periodeBTB: btb.tanggal_btb ? `${getMonthName(btb.tanggal_btb)} ${getYear(btb.tanggal_btb)}` : "",
                                namaSupplierBTB: btb.id_supplier ? localSupplierMap[String(btb.id_supplier)] || btb.id_supplier : "",
                                namaBarangBTB: btbItem.nama_barang || item.namaBarang,
                                quantityBTB: btbItem.jumlah_diterima,
                                satuanBTB: btbItem.id_satuan ? localSatuanMap[String(btbItem.id_satuan)] || btbItem.id_satuan : "",
                                sisaStokBTB: poItem.jumlahPO,
                                biayaBTB: btbItem.biaya,
                                diterimaOleh: btb.diterima_oleh,
                                skemaBTB: btb.id_skema ? localSkemaMap[String(btb.id_skema)] || btb.id_skema : "",
                            };
                        };

                        if (relatedBkbItems.length === 0) {
                            const prFields = getPRFields();
                            const poFields = getPOFields();
                            const btbFields = getBTBFields();

                            rekapRows.push({
                                id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb || ""),
                                ...prFields,
                                ...poFields,
                                ...btbFields,

                                noBKB: "",
                                tanggalBKB: "",
                                kodeBarangBKB: "",
                                namaBarangBKB: "",
                                quantityBKBData: "",
                                satuanBKB: "",
                                divisiBKB: "",
                                statusPermintaanByPR: "",
                                noPlan: "",
                                targetPencapaianPO: poFields.targetPencapaianPO,
                                id_btb_item: btbItem.id_btb_item,
                            });
                            prInfoPrinted = true;
                            poInfoPrinted = true;
                            btbInfoPrinted = true;
                        } else {
                            relatedBkbItems.forEach((bkbItem: any, bkbIdx: number) => {
                                const parentBkb = bkbData.find((b: any) => String(b.id_bkb) === String(bkbItem.id_bkb));
                                const prFields = getPRFields();
                                const poFields = getPOFields();
                                const btbFields = getBTBFields();

                                rekapRows.push({
                                    id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb || "") + "-" + (bkbItem.id_bkb_item || bkbIdx),
                                    ...prFields,
                                    ...poFields,
                                    ...btbFields,

                                    noBKB: parentBkb?.no_bkb || "",
                                    tanggalBKB: parentBkb?.tanggal_bkb ? formatDateSimple(parentBkb.tanggal_bkb) : "",
                                    kodeBarangBKB: bkbItem.kodeBarang || "",
                                    namaBarangBKB: bkbItem.nama_barang || "",
                                    quantityBKBData: bkbItem.jumlah_keluar,
                                    satuanBKB: bkbItem.satuan || "",
                                    divisiBKB: parentBkb?.divisi || "",

                                    statusPermintaanByPR: "",
                                    noPlan: "",
                                    targetPencapaianPO: poFields.targetPencapaianPO,
                                    id_btb_item: btbItem.id_btb_item,
                                });
                                prInfoPrinted = true;
                                poInfoPrinted = true;
                                btbInfoPrinted = true;
                            });
                        }
                    });
                }
            });
        }
    });
});
