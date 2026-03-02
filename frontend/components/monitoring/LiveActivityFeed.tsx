"use client";

import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, LogIn, LogOut, FileText, Eye, CheckCircle, AlertTriangle, Box, Truck, Compass } from "lucide-react";

export interface ActivityLog {
    id: number;
    id_user: number;
    nama_pengguna: string;
    action_type: string;
    entity_id: string | null;
    details: string | any;
    timestamp: string;
    status: string;
}

interface LiveActivityFeedProps {
    logs: ActivityLog[];
}

export function LiveActivityFeed({ logs }: LiveActivityFeedProps) {

    const getIcon = (action: string) => {
        switch (action) {
            case "LOGIN": return <LogIn className="h-4 w-4 text-emerald-500" />;
            case "LOGOUT": return <LogOut className="h-4 w-4 text-rose-500" />;
            case "CREATE_PR": return <FileText className="h-4 w-4 text-blue-500" />;
            case "VIEW_PR": return <Eye className="h-4 w-4 text-sky-400" />;
            case "CREATE_PO": return <CheckCircle className="h-4 w-4 text-violet-500" />;
            case "UPDATE_PO": return <FileText className="h-4 w-4 text-violet-500" />;
            case "DELETE_PO": return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            case "VIEW_BTB": return <Eye className="h-4 w-4 text-amber-400" />;
            case "CREATE_BTB": return <Box className="h-4 w-4 text-amber-500" />;
            case "CREATE_BKB": return <Truck className="h-4 w-4 text-indigo-500" />;
            case "UPDATE_BKB": return <Truck className="h-4 w-4 text-indigo-500" />;
            case "DELETE_BKB": return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            case "NAVIGATE": return <Compass className="h-4 w-4 text-teal-500" />;
            default: return <Activity className="h-4 w-4 text-slate-400" />;
        }
    };

    const getBadges = (action: string) => {
        if (action.includes("LOGIN")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (action.includes("LOGOUT")) return "bg-rose-50 text-rose-700 border-rose-200";
        if (action.includes("PR")) return "bg-blue-50 text-blue-700 border-blue-200";
        if (action.includes("PO")) return "bg-violet-50 text-violet-700 border-violet-200";
        if (action.includes("BTB")) return "bg-amber-50 text-amber-700 border-amber-200";
        if (action.includes("BKB")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
        if (action.includes("DELETE")) return "bg-rose-50 text-rose-700 border-rose-200";
        if (action.includes("NAVIGATE")) return "bg-teal-50 text-teal-700 border-teal-200";
        return "bg-slate-50 text-slate-700 border-slate-200";
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Live Activity Feed
                </h3>
                <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-200 px-2 py-0.5 shadow-sm">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                    Realtime
                </Badge>
            </div>

            <div className="flex-1 p-5 overflow-y-auto max-h-[500px] bg-slate-50/30">
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => {
                            let detailsObj = log.details;
                            if (typeof log.details === 'string') {
                                try { detailsObj = JSON.parse(log.details); } catch { }
                            }

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative pl-8 pb-5 border-l-[3px] border-slate-200 last:pb-0 last:border-transparent group"
                                >
                                    <div className="absolute left-[-11px] top-1 bg-white rounded-full p-1.5 border-2 border-slate-200 shadow-sm transition-colors group-hover:border-blue-200">
                                        {getIcon(log.action_type)}
                                    </div>

                                    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                                            <span className="font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {format(new Date(log.timestamp), "HH:mm:ss · dd MMM", { locale: id })}
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${getBadges(log.action_type)}`}>
                                                {log.action_type}
                                            </Badge>
                                        </div>

                                        <div className="text-sm leading-relaxed">
                                            <span className="font-bold text-slate-800 mr-1.5">{log.nama_pengguna}</span>
                                            <span className="text-slate-600 mr-1">
                                                {log.action_type === 'LOGIN' && 'telah masuk ke sistem (Login)'}
                                                {log.action_type === 'LOGOUT' && 'telah keluar dari sistem (Logout)'}
                                                {log.action_type === 'VIEW_PR' && 'sedang melihat detail PR'}
                                                {log.action_type === 'VIEW_BTB' && 'sedang melihat detail BTB'}
                                                {log.action_type === 'CREATE_PR' && 'membuat PR baru'}
                                                {log.action_type === 'CREATE_PO' && 'membuat PO baru'}
                                                {log.action_type === 'CREATE_BTB' && 'membuat BTB baru'}
                                                {log.action_type === 'NAVIGATE' && 'mengunjungi halaman'}
                                                {!['LOGIN', 'LOGOUT', 'VIEW_PR', 'VIEW_BTB', 'CREATE_PR', 'CREATE_PO', 'CREATE_BTB', 'NAVIGATE'].includes(log.action_type) && `melakukan ${log.action_type}`}
                                            </span>
                                            {log.entity_id && (
                                                <span className="font-mono ml-1 inline-flex items-center bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                                                    #{log.entity_id}
                                                </span>
                                            )}
                                        </div>

                                        {detailsObj && Object.keys(detailsObj).length > 0 && (
                                            <div className="mt-1 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono truncate max-w-full">
                                                {JSON.stringify(detailsObj).substring(0, 100)}
                                                {JSON.stringify(detailsObj).length > 100 && "..."}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Activity className="h-8 w-8 mb-3 opacity-20" />
                            <p className="text-sm font-medium">Belum ada aktivitas tercatat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
