"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, Building2, Store } from "lucide-react";
// import { cn } from "@/lib/utils"; (Still avoiding this to prevent crash)

// --- Helper for conditional classes (mini-cn) ---
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}

// --- Local UI Components (Inlined to avoid import runtime errors) ---

const Button = ({ className, variant = "default", size = "default", ...props }: any) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };
    return (
        <button
            className={cn(baseStyles, variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className)}
            {...props}
        />
    );
};

const Input = ({ className, ...props }: any) => {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
};

const Label = ({ className, ...props }: any) => (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
);

const Card = ({ className, ...props }: any) => (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm bg-white", className)} {...props} />
);

const CardHeader = ({ className, ...props }: any) => (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: any) => (
    <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
);

const CardDescription = ({ className, ...props }: any) => (
    <p className={cn("text-sm text-neutral-500", className)} {...props} />
);

const CardContent = ({ className, ...props }: any) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
);

import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/config";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // New state for animation

    // Default mode: "internal" (Purchasing & Store)
    const [loginMode, setLoginMode] = useState<"internal" | "divisi">("internal");

    const router = useRouter();

    // Clear error when switching modes
    useEffect(() => {
        setErrorMsg("");
    }, [loginMode]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setErrorMsg("Mohon lengkapi semua field");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(API_BASE_URL + "/api/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama_pengguna: username, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || "Login gagal");
                setIsLoading(false);
                return;
            }

            const userRole = Number(data.user.id_peran);

            // STRICT ROLE VALIDATION
            if (loginMode === "divisi") {
                if (userRole !== 2) {
                    setErrorMsg("Akun ini bukan akun Divisi. Harap login di menu Purchasing & Store.");
                    setIsLoading(false);
                    return;
                }
            } else {
                if (userRole === 2) {
                    setErrorMsg("Akun Divisi harap login di pilihan Divisi.");
                    setIsLoading(false);
                    return;
                }
            }

            localStorage.setItem("userData", JSON.stringify(data.user));

            // --- MAINTENANCE CHECK START ---
            try {
                const maintRes = await fetch(API_BASE_URL + "/api/maintenance");
                const maintData = await maintRes.json();
                if (maintData.isActive) {
                    const whitelist = ["141", "90", "89", "85"];
                    const currentId = String(data.user.id ?? data.user.id_user ?? "");
                    const now = new Date().getTime();
                    const startTime = maintData.startTime ? new Date(maintData.startTime).getTime() : 0;
                    const inGracePeriod = startTime > 0 && now < startTime;

                    if (!whitelist.includes(currentId) && !inGracePeriod) {
                        router.push("/maintenance");
                        return;
                    }
                }
            } catch (e) {
                console.error("Maintenance check on login failed", e);
            }
            // --- MAINTENANCE CHECK END ---

            // --- ANIMATION & REDIRECT ---
            // Trigger success animation for ALL modes
            setIsSuccess(true);

            // Delay redirect to allow animation to play
            setTimeout(() => {
                if (loginMode === "divisi") {
                    window.location.href = "/divisi/dashboard";
                } else {
                    const roleId = Number(data.user.id_peran);
                    const roleName = (data.user.role ?? data.user.peran ?? "").toLowerCase();
                    const userName = (data.user.nama_pengguna || "").toLowerCase();

                    if (roleId === 5 || roleName === "superadmin" || userName === "superadmin") {
                        window.location.href = "/kelola-akun";
                    } else if (roleId === 2) {
                        window.location.href = "/divisi/dashboard";
                    } else if (roleId === 1 || roleName === "admin") {
                        window.location.href = "/dashboard";
                    } else if (roleId === 3 || roleName === "divisi") {
                        window.location.href = "/divisi/dashboard";
                    } else {
                        window.location.href = "/dashboard";
                    }
                }
            }, 1500);

        } catch (err) {
            console.error(err);
            setErrorMsg("Terjadi kesalahan server.");
            setIsLoading(false);
        }
    };

    const isDivisi = loginMode === "divisi";

    return (
        <div className={cn(
            "min-h-screen flex items-center justify-center p-4 font-sans transition-all duration-700 ease-in-out relative overflow-hidden",
            isDivisi ? "bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950" : "bg-slate-50"
        )}>
            {/* --- LUXURIOUS TRANSITION OVERLAY --- */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            "fixed inset-0 z-50 flex items-center justify-center",
                            isDivisi ? "bg-indigo-950" : "bg-white"
                        )}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-center"
                        >
                            <div className="mb-6 relative">
                                <div className={cn(
                                    "absolute inset-0 blur-3xl opacity-20 rounded-full animate-pulse",
                                    isDivisi ? "bg-indigo-500" : "bg-slate-200"
                                )} />
                                {isDivisi ? (
                                    <Building2 className="w-24 h-24 text-indigo-300 relative z-10 mx-auto" strokeWidth={1} />
                                ) : (
                                    <Store className="w-24 h-24 text-slate-800 relative z-10 mx-auto" strokeWidth={1} />
                                )}
                            </div>
                            <h2 className={cn(
                                "text-3xl font-light tracking-[0.2em] uppercase",
                                isDivisi ? "text-white" : "text-black"
                            )}>
                                Selamat Datang
                            </h2>
                            <p className={cn(
                                "mt-2 text-sm font-medium tracking-widest",
                                isDivisi ? "text-indigo-300/60" : "text-slate-500"
                            )}>
                                MEMUAT DASHBOARD {isDivisi ? "DIVISI" : "PURCHASING & STORE"}
                            </p>
                            {/* Loading Line */}
                            <motion.div
                                className={cn(
                                    "h-0.5 mt-8 mx-auto rounded-full",
                                    isDivisi ? "bg-indigo-500/50" : "bg-slate-800"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: "100px" }}
                                transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Ambience Animations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={cn("absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-3xl transition-opacity duration-1000", isDivisi ? "bg-indigo-500/20 opacity-100 animate-pulse" : "opacity-0")} />
                <div className={cn("absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl transition-opacity duration-1000 delay-700", isDivisi ? "bg-blue-500/20 opacity-100 animate-pulse" : "opacity-0")} />
                <div className={cn("absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-opacity duration-1000", !isDivisi ? "opacity-100" : "opacity-0")} />
            </div>

            <div className="w-full max-w-[480px] animate-in fade-in zoom-in duration-500 relative z-10 flex flex-col items-center">

                {/* Header Text */}
                <div className="mb-8 text-center space-y-2">
                    <h1 className={cn("text-3xl font-bold tracking-tight transition-colors duration-500", isDivisi ? "text-white" : "text-slate-900")}>
                        {isDivisi ? "Portal Divisi" : "Purchasing & Store"}
                    </h1>
                    <p className={cn("text-sm transition-colors duration-500", isDivisi ? "text-indigo-200" : "text-slate-500")}>
                        {isDivisi ? "Kelola permintaan barang divisi Anda." : "Sistem monitoring internal purchasing."}
                    </p>
                </div>

                {/* Mode Toggles */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/50 backdrop-blur-sm rounded-full mb-8 relative overflow-hidden ring-1 ring-black/5 w-full shadow-sm">
                    <button
                        type="button"
                        onClick={() => setLoginMode("internal")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-semibold transition-all duration-300 relative z-20",
                            !isDivisi
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                        )}
                    >
                        <Store className="w-3.5 h-3.5" />
                        <span>Purchasing & Store</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMode("divisi")}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 px-4 rounded-full text-xs font-semibold transition-all duration-300 relative z-20",
                            isDivisi
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500"
                                : "text-slate-600 hover:text-indigo-900 hover:bg-white/40"
                        )}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Divisi</span>
                    </button>
                </div>

                {/* Login Card */}
                <Card className={cn(
                    "w-full border-0 shadow-xl transition-all duration-500",
                    isDivisi
                        ? "bg-white/10 backdrop-blur-xl ring-1 ring-white/10 shadow-indigo-900/20"
                        : "bg-white/80 backdrop-blur-xl ring-1 ring-slate-200 shadow-slate-200/50"
                )}>
                    <CardHeader className="space-y-2 pb-6 text-center">
                        <CardTitle className={cn("text-xl font-bold transition-colors", isDivisi ? "text-white" : "text-slate-900")}>
                            Login {isDivisi ? "Divisi" : "Purchasing & Store"}
                        </CardTitle>
                        <CardDescription className={cn("text-sm", isDivisi ? "text-indigo-200/80" : "text-slate-500")}>
                            Silakan masukkan kredensial akun {isDivisi ? "Divisi" : "Purchasing atau Store"} Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className={cn("text-xs font-bold uppercase tracking-wider transition-colors", isDivisi ? "text-indigo-100" : "text-slate-600")}>
                                    Nama Pengguna
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="nama_pengguna"
                                        value={username}
                                        onChange={(e: any) => {
                                            setUsername(e.target.value);
                                            setErrorMsg("");
                                        }}
                                        required
                                        className={cn(
                                            "pl-10 h-10 transition-all font-medium border-0 ring-1 ring-inset",
                                            isDivisi
                                                ? "bg-black/20 text-white placeholder:text-white/40 ring-white/10 focus:ring-indigo-400 focus:bg-black/40 hover:bg-black/30"
                                                : "bg-white text-slate-800 ring-slate-200 focus:ring-blue-500 hover:bg-slate-50"
                                        )}
                                    />
                                    <div className="absolute left-3 top-2.5">
                                        <User className={cn("w-5 h-5 transition-colors duration-200", isDivisi ? "text-indigo-300" : "text-slate-400")} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className={cn("text-xs font-bold uppercase tracking-wider transition-colors", isDivisi ? "text-indigo-100" : "text-slate-600")}>
                                        Kata Sandi
                                    </Label>
                                </div>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e: any) => {
                                            setPassword(e.target.value);
                                            setErrorMsg("");
                                        }}
                                        required
                                        className={cn(
                                            "pl-10 h-10 transition-all font-medium border-0 ring-1 ring-inset",
                                            isDivisi
                                                ? "bg-black/20 text-white placeholder:text-white/40 ring-white/10 focus:ring-indigo-400 focus:bg-black/40 hover:bg-black/30"
                                                : "bg-white text-slate-800 ring-slate-200 focus:ring-blue-500 hover:bg-slate-50"
                                        )}
                                    />
                                    <div className="absolute left-3 top-2.5">
                                        <Lock className={cn("w-5 h-5 transition-colors duration-200", isDivisi ? "text-indigo-300" : "text-slate-400")} />
                                    </div>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className={cn(
                                    "p-3 rounded-md text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-1 border",
                                    isDivisi
                                        ? "bg-red-500/10 border-red-500/20 text-red-200"
                                        : "bg-red-50 border-red-100 text-red-600"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", isDivisi ? "bg-red-400" : "bg-red-500")} />
                                    <span className="leading-tight font-medium">{errorMsg}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className={cn(
                                    "w-full h-10 font-semibold shadow-md transition-all active:scale-[0.98] mt-2",
                                    isDivisi
                                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 ring-1 ring-indigo-500"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
                                )}
                            >
                                {isLoading ? (
                                    "Verifikasi..."
                                ) : (
                                    <>
                                        Masuk
                                        <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <p className={cn("text-xs transition-colors", isDivisi ? "text-indigo-300/60" : "text-slate-400")}>
                        &copy; {new Date().getFullYear()} - FLOWSTORE
                    </p>
                </div>
            </div>
        </div>
    );
}
