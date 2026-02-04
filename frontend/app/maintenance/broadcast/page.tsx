"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Volume2, StopCircle, Send, Play, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/config";

export default function BroadcastPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
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
                let endTimeFormatted = "";
                if (d.endTime) {
                    const date = new Date(d.endTime);
                    const offset = date.getTimezoneOffset() * 60000;
                    endTimeFormatted = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
                }

                setData({
                    message: d.message || "",
                    endTime: endTimeFormatted,
                    isActive: d.isActive || false
                });
                setFetching(false);
            })
            .catch(err => {
                console.error(err);
                setFetching(false);
            });
    }, []);

    const handleSave = async (active: boolean) => {
        if (active && (!data.message || !data.endTime)) {
            toast.error("Pesan dan Waktu Berakhir harus diisi untuk mengaktifkan broadcast.");
            return;
        }

        setLoading(true);
        try {
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

    const addDuration = (mins: number) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + mins);
        const offset = now.getTimezoneOffset() * 60000;
        const iso = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
        setData(prev => ({ ...prev, endTime: iso }));
    };

    if (fetching) return (
        <MainLayout>
            <div className="p-8 text-center text-muted-foreground">Memuat data broadcast...</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-blue-600 pl-4">
                            Broadcast Notification
                        </h1>
                        <p className="text-slate-500 mt-2 pl-4">
                            Kirim pengumuman penting yang akan muncul di layar semua pengguna.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* LEFT COLUMN: EDITOR */}
                    <Card className="shadow-md border-slate-200">
                        <CardHeader className="bg-slate-50 pb-4 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-blue-600" />
                                Editor Pesan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            <div className="space-y-2">
                                <Label htmlFor="message">Isi Pesan</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tulis pesan pengumuman di sini..."
                                    value={data.message}
                                    onChange={(e) => setData({ ...data, message: e.target.value })}
                                    rows={5}
                                    className="resize-none text-base"
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {data.message.length} karakter
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="endtime">Berakhir Pada</Label>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="xs" onClick={() => addDuration(60)} className="h-6 text-[10px]">+1 Jam</Button>
                                        <Button variant="outline" size="xs" onClick={() => addDuration(1440)} className="h-6 text-[10px]">+24 Jam</Button>
                                    </div>
                                </div>
                                <Input
                                    id="endtime"
                                    type="datetime-local"
                                    value={data.endTime}
                                    onChange={(e) => setData({ ...data, endTime: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Setelah waktu ini, broadcast otomatis hilang dari layar user.
                                </p>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t py-4 flex flex-col gap-3">
                            <Button
                                onClick={() => handleSave(true)}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                {loading ? "Memproses..." : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        {data.isActive ? "Update Broadcast" : "Kirim Broadcast Sekarang"}
                                    </>
                                )}
                            </Button>
                            {data.isActive && (
                                <Button
                                    onClick={() => handleSave(false)}
                                    disabled={loading}
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                >
                                    <StopCircle className="w-4 h-4 mr-2" />
                                    Matikan Broadcast
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* RIGHT COLUMN: PREVIEW & STATUS */}
                    <div className="space-y-6">

                        {/* Status Card */}
                        <Card className={`${data.isActive ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${data.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {data.isActive ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${data.isActive ? 'text-green-800' : 'text-slate-700'}`}>
                                            {data.isActive ? "Sedang Tayang (Live)" : "Tidak Ada Broadcast"}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {data.isActive
                                                ? `Berakhir pada: ${new Date(data.endTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`
                                                : "User tidak melihat notifikasi apa pun saat ini."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Live Preview */}
                        <div>
                            <Label className="mb-2 block text-muted-foreground text-xs uppercase tracking-wider font-semibold">Live Preview</Label>
                            <div className="relative w-full max-w-md mx-auto bg-slate-100 rounded-xl border border-slate-200 h-[300px] flex items-start justify-center pt-8 overflow-hidden shadow-inner">
                                {/* Blurred Background mock */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://placehold.co/400x300/e2e8f0/e2e8f0')] bg-cover"></div>

                                {/* Mock Toggle to show interaction */}
                                <div className="absolute top-0 w-full bg-white h-8 border-b flex items-center px-2 space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                </div>

                                {/* The Broadcast Component Mock */}
                                <div className={`mt-6 w-[90%] transform transition-all duration-500 ${data.message ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
                                    <div className="bg-white/95 backdrop-blur shadow-xl rounded-lg border border-blue-100 overflow-hidden text-left">
                                        <div className="left-0 top-0 bottom-0 w-1 absolute bg-blue-500"></div>
                                        <div className="p-3 pl-4 flex gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                                    Pemberitahuan
                                                    <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">Penting</span>
                                                </h4>
                                                <p className="text-xs text-slate-600 leading-snug mt-1 break-words line-clamp-3">
                                                    {data.message || "Tulis pesan untuk melihat preview..."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-2 text-[10px] text-slate-400">
                                    Simulasi Layar User
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
