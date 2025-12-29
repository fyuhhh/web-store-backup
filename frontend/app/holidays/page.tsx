"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import dayjs from "dayjs";
import { Trash2, Plus, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function HolidayPage() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newDate, setNewDate] = useState<Date>();
    const [newDesc, setNewDesc] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHolidays();
    }, []);

    async function fetchHolidays() {
        try {
            setLoading(true);
            const res = await fetch("http://192.168.10.10:5000/api/holidays");
            const data = await res.json();
            setHolidays(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleAdd() {
        if (!newDate) return alert("Pilih tanggal!");
        try {
            const formattedDate = format(newDate, "yyyy-MM-dd");
            const res = await fetch("http://192.168.10.10:5000/api/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tanggal: formattedDate, description: newDesc }),
            });
            if (res.ok) {
                setNewDate(undefined);
                setNewDesc("");
                fetchHolidays();
            } else {
                alert("Gagal menambah hari libur");
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Hapus hari libur ini?")) return;
        try {
            await fetch(`http://192.168.10.10:5000/api/holidays/${id}`, { method: "DELETE" });
            fetchHolidays();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <MainLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Pengaturan Hari Libur</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tambah Hari Libur</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Tanggal</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !newDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newDate ? format(newDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={newDate}
                                            onSelect={setNewDate}
                                            initialFocus
                                            locale={id}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Keterangan</label>
                                <Input
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Contoh: Libur Nasional, Cuti Bersama..."
                                />
                            </div>
                            <Button onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Hari Libur</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : holidays.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-gray-500">Belum ada data hari libur</TableCell>
                                        </TableRow>
                                    ) : (
                                        holidays.map(h => (
                                            <TableRow key={h.id}>
                                                <TableCell>{dayjs(h.tanggal).format("DD MMM YYYY")}</TableCell>
                                                <TableCell>{h.description}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(h.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
