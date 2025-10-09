# TODO: Update BTB Input Page with Full PO Table

## Overview

Modify the BTB input page (app/btb/input/page.tsx) to include the full PO table from monitoring PO, with all filters, pagination, and checkbox selection. Add "Buat BTB" button for selected POs and integrate with existing BTB form.

## Tasks

- [x] Copy full PO table structure from app/btb/monitoring/page.tsx to app/btb/input/page.tsx
- [x] Add all filter states (namaBarang, qty, satuan, keterangan, hargaSatuan, total, tanggalPO, estimasiDiterima, supplier, kode, statusPengiriman, status, diorderOleh)
- [x] Add search term state and pagination states
- [x] Implement filteredPOData logic with all filters
- [x] Add unique values computation for dropdown filters
- [x] Replace simple table with full table including Popover filters and TableHeader
- [x] Update table body to display all PO item details with rowspan
- [x] Add "Buat BTB" button that appears when POs are selected
- [x] Ensure PO table only shows Approved or Delivered POs
- [x] Test table display, filters, and pagination
- [x] Test checkbox selection and "Buat BTB" button functionality
- [x] Test BTB form pre-filling and submission
- [x] Verify PO status updates to "Delivered" after BTB creation
