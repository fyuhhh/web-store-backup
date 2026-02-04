"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "sonner";
import { AlertTriangle, Clock, Save, Power, Eye, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MaintenanceAdminPage() {
    const [isActive, setIsActive] = useState(false);
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userId = String(userData.id ?? userData.id_user ?? "");

        if (userId !== "141") {
            window.location.href = "/dashboard";
            return;
        }

        fetch(API_BASE_URL + "/api/maintenance")
            .then((res) => res.json())
            .then((data) => {
                setIsActive(data.isActive);

                // Format date for input
                let formattedTime = "";
                if (data.endTime) {
                    const date = new Date(data.endTime);
                    const offset = date.getTimezoneOffset() * 60000;
                    formattedTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                }
                setEndTime(formattedTime);

                setDescription(data.description || "");
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        if (isActive && !endTime) {
            toast.error("Waktu selesai wajib diisi jika mode maintenance aktif.");
            return;
        }

        try {
            setSaving(true);

            // If activating, set start time to 5 mins from now if not already set or logic requires
            // For simplicity, we just send what we have. API usually handles 'startTime' logic or we send it here.
            // Let's stick to the previous logic: if activating, set start time.
            let startTimeToSend = "";
            if (isActive) {
                const d = new Date();
                // If it's a NEW activation (we don't track prev state perfectly here without ref, but okay to reset grace period on save)
                // User requirement: "ketika aku aktifkan... hitung mundur 5 menit"
                d.setMinutes(d.getMinutes() + 5);
                startTimeToSend = d.toISOString();
            }

            const res = await fetch(API_BASE_URL + "/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isActive,
                    endTime: endTime ? new Date(endTime).toISOString() : "",
                    description,
                    startTime: isActive ? startTimeToSend : "",
                }),
            });

            if (res.ok) {
                toast.success("Pengaturan Maintenance berhasil disimpan!");
            } else {
                toast.error("Gagal menyimpan pengaturan.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setSaving(false);
        }
    };

    const addTime = (minutes: number) => {
        const d = endTime ? new Date(endTime) : new Date();
        // If endTime is invalid or in past, start from NOW
        if (isNaN(d.getTime()) || d.getTime() < Date.now()) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + minutes);
            const offset = now.getTimezoneOffset() * 60000;
            const iso = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
            setEndTime(iso);
        } else {
            d.setMinutes(d.getMinutes() + minutes);
            const offset = d.getTimezoneOffset() * 60000;
            const iso = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
            setEndTime(iso);
        }
    };

    if (loading) return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[500px]">
                <RefreshCw className="animate-spin text-slate-400" />
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-amber-500 pl-4">mode Maintenance</h1>
                        <p className="text-slate-500 mt-2 pl-4">
                            Kontrol akses sistem secara global untuk keperluan update atau perbaikan.
                        </p>
                    </div>
                    {isActive ? (
                        <Badge variant="destructive" className="text-sm px-4 py-1.5 h-auto">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Sistem dalam Maintenance
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-sm px-4 py-1.5 h-auto bg-green-50 text-green-700 border-green-200">
                            <Power className="w-4 h-4 mr-2" />
                            Sistem Normal
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Controls */}
                    <Card className="lg:col-span-2 shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-slate-500" />
                                Konfigurasi Status
                            </CardTitle>
                            <CardDescription>
                                Atur status aktif dan durasi maintenance di sini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">

                            {/* Toggle Switch */}
                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label htmlFor="maintenance-mode" className="text-base font-semibold">Aktifkan Maintenance</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Pengguna akan dialihkan ke halaman maintenance setelah 5 menit.
                                    </p>
                                </div>
                                <Switch
                                    id="maintenance-mode"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </div>

                            {/* Time Controls */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="end-time" className="text-sm font-medium">Waktu Selesai (Estimasi)</Label>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="xs" onClick={() => addTime(30)} className="text-xs h-7 px-2">+30m</Button>
                                        <Button variant="outline" size="xs" onClick={() => addTime(60)} className="text-xs h-7 px-2">+1h</Button>
                                        <Button variant="outline" size="xs" onClick={() => addTime(120)} className="text-xs h-7 px-2">+2h</Button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="end-time"
                                        type="datetime-local"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="pl-9"
                                        disabled={!isActive}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Countdown akan ditampilkan sesuai waktu ini.
                                </p>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Pesan Publik</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Contoh: Kami sedang melakukan update fitur keamanan..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!isActive}
                                    rows={4}
                                    className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Pesan ini akan muncul di halaman maintenance publik.
                                </p>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end py-4">
                            <Button size="lg" onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[150px]">
                                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* RIGHT COLUMN: Preview Card */}
                    <div className="space-y-6">
                        <div className="bg-slate-100 rounded-lg p-6 text-center border-2 border-dashed border-slate-300">
                            <h3 className="font-semibold text-slate-500 mb-4 flex items-center justify-center gap-2">
                                <Eye className="w-4 h-4" /> Preview Tampilan User
                            </h3>

                            {/* Mini Preview of Maintenance Page */}
                            <div className="bg-white rounded-lg shadow-sm border p-4 text-center transform scale-95 opacity-80 pointer-events-none select-none">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="h-2 w-24 bg-slate-200 rounded mx-auto mb-2" />
                                <div className="h-6 w-32 bg-slate-900 rounded mx-auto mb-3" />
                                <div className="h-10 w-full bg-slate-50 rounded border border-slate-100 mb-2 flex items-center justify-center text-xs text-slate-400">
                                    Timer Count Down
                                </div>
                                <p className="text-[10px] text-slate-500 italic mt-2">
                                    "{description || "Pesan maintenance..."}"
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 mt-4">
                                Tampilan sebenarnya mungkin berbeda tergantung perangkat user.
                            </p>
                        </div>

                        <Card className="bg-blue-50 border-blue-100">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-blue-800">Whitelist Access</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    User dengan <strong>Role ID 141 (Super Admin)</strong> dan <strong>Role ID 2</strong> akan tetap bisa mengakses dashboard saat maintenance aktif.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
