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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function MaintenanceAdminPage() {
    const [isActive, setIsActive] = useState(false);
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is admin (ID 141) - Extra security check on frontend level
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        // Robust check for ID
        const userId = String(userData.id ?? userData.id_user ?? "");

        if (userId !== "141") {
            window.location.href = "/dashboard";
            return;
        }

        fetch("http://192.168.10.10:5000/api/maintenance")
            .then((res) => res.json())
            .then((data) => {
                setIsActive(data.isActive);
                setEndTime(data.endTime);
                setDescription(data.description);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        try {
            setLoading(true);

            // Calculate Start Time (Lockout Time) = Now + 5 minutes
            let startTimeToSend = "";
            if (isActive) {
                // If activating, set start time to 5 mins from now
                // UNLESS it's already active and we just want to update EndTime/Description without resetting countdown?
                // For simplicity based on request: "ketika aku aktifkan... hitung mundur 5 menit"
                // So every save with Active=true resets countdown? Or only if it wasn't active?
                // To be safe and avoid resetting countdown on minor edits, check if we need to set it.
                // But simplified: User wants 5 min warning.

                // Fetch current first to see if already active? 
                // We have initial state in `isActive` (from component mount). 
                // Ideally, if it was false and now true -> Set startTime.
                // If it was true and remains true -> Keep existing startTime?
                // Let's rely on fetching `data` in useEffect. But here we only have local state.

                // Let's assume we always reset countdown if we click save and it is active.
                // Or better: pass startTime only if it's a new activation.
                // Actually, the user says "ketika aku aktifkan", implies the action.
                // Let's set it to 5 mins from now.
                const d = new Date();
                d.setMinutes(d.getMinutes() + 5);
                startTimeToSend = d.toISOString();
            }

            const res = await fetch("http://192.168.10.10:5000/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive,
                    endTime,
                    description,
                    startTime: isActive ? startTimeToSend : "",
                }),
            });
            if (res.ok) {
                alert("Pengaturan Maintenance berhasil disimpan!");
            } else {
                alert("Gagal menyimpan pengaturan.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Pengaturan Maintenance</h1>
                    <p className="text-muted-foreground">
                        Aktifkan mode maintenance untuk membatasi akses pengguna.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Maintenance</CardTitle>
                        <CardDescription>
                            Jika aktif, pengguna selain Admin (dan whitelist) tidak bisa mengakses aplikasi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg bg-gray-50">
                            <Label htmlFor="maintenance-mode" className="flex flex-col space-y-1">
                                <span className="font-semibold text-base">Mode Maintenance</span>
                                <span className="font-normal text-sm text-muted-foreground">
                                    {isActive ? "Aktif" : "Tidak Aktif"}
                                </span>
                            </Label>
                            <Switch
                                id="maintenance-mode"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="end-time">Estimasi Selesai (Waktu)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="end-time"
                                        type="datetime-local"
                                        value={endTime || ""}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        disabled={!isActive}
                                    />
                                    <Button variant="outline" size="sm" onClick={() => {
                                        // Helper to set time to now + 1 hour for quick setup
                                        const d = new Date();
                                        d.setHours(d.getHours() + 1);
                                        // Format to YYYY-MM-DDTHH:mm for input type datetime-local
                                        const iso = d.toISOString().slice(0, 16); // rudimentary format
                                        // Adjust for timezone offset for input value if needed (datetime-local expects local time usually, but depends on brower. simplest is explicit string)
                                        // A safer visual construct for local time:
                                        const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                        setEndTime(local);
                                    }}>
                                        +1 Jam
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Digunakan untuk hitung mundur di halaman maintenance user.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Keterangan / Pesan</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Contoh: Sedang melakukan update server..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!isActive}
                                    rows={3}
                                />
                            </div>

                            <Button onClick={handleSave} className="w-full" disabled={loading}>
                                {loading ? "Menyimpan..." : "Simpan Perubahan"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
