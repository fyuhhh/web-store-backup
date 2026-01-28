"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Volume2, StopCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/config";

export default function BroadcastPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        message: "",
        endTime: "",
        isActive: false
    });

    // Fetch current status
    useEffect(() => {
        fetch(API_BASE_URL + "/api/broadcast")
            .then(res => res.json())
            .then(d => {
                // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
                let endTimeFormatted = "";
                if (d.endTime) {
                    const date = new Date(d.endTime);
                    // Adjust to local timezone correctly for input
                    const offset = date.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                    endTimeFormatted = localISOTime;
                }

                setData({
                    message: d.message || "",
                    endTime: endTimeFormatted,
                    isActive: d.isActive || false
                });
            })
            .catch(err => console.error(err));
    }, []);

    const handleSave = async (active: boolean) => {
        if (active && (!data.message || !data.endTime)) {
            toast.error("Pesan dan Waktu Berakhir harus diisi untuk mengaktifkan broadcast.");
            return;
        }

        setLoading(true);
        try {
            // Convert local time back to ISO
            const payload = {
                message: data.message,
                endTime: data.endTime ? new Date(data.endTime).toISOString() : "",
                isActive: active
            };

            const res = await fetch(API_BASE_URL + "/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newData = await res.json();
                setData(prev => ({ ...prev, isActive: newData.data.isActive }));
                toast.success(active ? "Broadcast berhasil dikirim!" : "Broadcast dimatikan.");
            } else {
                toast.error("Gagal menyimpan broadcast.");
            }
        } catch (err) {
            toast.error("Error: " + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Broadcast Notification</h1>
                    <p className="text-muted-foreground">
                        Kirim notifikasi pop-up ke seluruh user sistem.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-blue-600" />
                                Input Broadcast
                            </CardTitle>
                            <CardDescription>
                                Pesan ini akan muncul sebagai pop-up di layar semua user yang sedang aktif atau baru login.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">

                            {data.isActive ? (
                                <Alert className="bg-green-50 border-green-200 mb-4">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Broadcast Aktif</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        Pesan sedang ditayangkan sampai {new Date(data.endTime).toLocaleString("id-ID")}.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert className="bg-slate-50 border-slate-200 mb-4">
                                    <StopCircle className="h-4 w-4 text-slate-500" />
                                    <AlertTitle className="text-slate-700">Broadcast Tidak Aktif</AlertTitle>
                                    <AlertDescription className="text-slate-600">
                                        Saat ini tidak ada pesan yang disiarkan.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="message">Pesan Notifikasi</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Contoh: Sistem akan maintenance pada jam 12:00..."
                                    value={data.message}
                                    onChange={(e) => setData({ ...data, message: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endtime">Tampilkan Sampai (Waktu Berakhir)</Label>
                                <Input
                                    id="endtime"
                                    type="datetime-local"
                                    value={data.endTime}
                                    onChange={(e) => setData({ ...data, endTime: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Notifikasi akan otomatis berhenti muncul setelah waktu ini.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    onClick={() => handleSave(true)}
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? "Menyimpan..." : "Kirim Broadcast"}
                                </Button>

                                {data.isActive && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleSave(false)}
                                        disabled={loading}
                                    >
                                        Hentikan Broadcast
                                    </Button>
                                )}
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
