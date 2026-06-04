"use client";

import React, { useState, useEffect } from "react";
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
import { Trash2, Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from "@/lib/config";

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newDate, setNewDate] = useState<Date | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_BASE_URL + "/api/holidays");
            if (!res.ok) throw new Error("Gagal mengambil data libur");
            const data = await res.json();
            setHolidays(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userIdNum = Number(userData.id_user || userData.id || 0);
        if ([168, 169].includes(userIdNum)) {
            window.location.href = "/dashboard";
            return;
        }
        fetchHolidays();
    }, []);

    const handleAddString = async () => {
        if (!newDate) return;

        const yyyy = newDate.getFullYear();
        const mm = String(newDate.getMonth() + 1).padStart(2, "0");
        const dd = String(newDate.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        try {
            const res = await fetch(API_BASE_URL + "/api/holidays", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tanggal: dateStr, description }),
            });
            if (!res.ok) throw new Error("Gagal menambah libur");

            setNewDate(null);
            setDescription("");
            fetchHolidays();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin ingin menghapus hari libur ini?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/holidays/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Gagal menghapus libur");
            fetchHolidays();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const formatDateDisplay = (isoString: string) => {
        try {
            const date = new Date(isoString);
            const dd = String(date.getDate()).padStart(2, "0");
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const yyyy = date.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        } catch {
            return isoString;
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Manajemen Hari Libur</h1>
                    <p className="text-muted-foreground">
                        Atur daftar hari libur yang akan dilewati perhitungan estimasi PO.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tambah Hari Libur</CardTitle>
                            <CardDescription>Pilih tanggal dan keterangan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tanggal</Label>
                                    <DatePicker
                                        selected={newDate}
                                        onChange={(date) => setNewDate(date)}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="Pilih tanggal"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Keterangan</Label>
                                    <Input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Contoh: Libur Nasional"
                                    />
                                </div>
                                <Button onClick={handleAddString} disabled={!newDate} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" /> Tambah
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Hari Libur</CardTitle>
                            <CardDescription>Total: {holidays.length} hari libur terdaftar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p>Loading...</p>
                            ) : error ? (
                                <p className="text-red-500">{error}</p>
                            ) : holidays.length === 0 ? (
                                <p className="text-muted-foreground italic">Belum ada hari libur.</p>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                                    {holidays.map((h) => (
                                        <div
                                            key={h.id}
                                            className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div>
                                                <div className="font-semibold">{formatDateDisplay(h.tanggal)}</div>
                                                <div className="text-sm text-muted-foreground">{h.description || "-"}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(h.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
