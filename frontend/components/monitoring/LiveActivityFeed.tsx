"use client";

// import { ScrollArea } from "@/components/ui/scroll-area";
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
    details: string | any; // JSON string or object
    timestamp: string;
    status: string;
}

interface LiveActivityFeedProps {
    logs: ActivityLog[];
}

export function LiveActivityFeed({ logs }: LiveActivityFeedProps) {

    const getIcon = (action: string) => {
        switch (action) {
            case "LOGIN": return <LogIn className="h-4 w-4 text-green-500" />;
            case "LOGOUT": return <LogOut className="h-4 w-4 text-red-500" />;
            case "CREATE_PR": return <FileText className="h-4 w-4 text-blue-500" />;
            case "VIEW_PR": return <Eye className="h-4 w-4 text-blue-400" />;
            case "CREATE_PO": return <CheckCircle className="h-4 w-4 text-purple-500" />; // New for PO
            case "UPDATE_PO": return <FileText className="h-4 w-4 text-purple-500" />;
            case "DELETE_PO": return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "VIEW_BTB": return <Eye className="h-4 w-4 text-orange-400" />;
            case "CREATE_BTB": return <Box className="h-4 w-4 text-orange-500" />;
            case "CREATE_BKB": return <Truck className="h-4 w-4 text-indigo-500" />; // New for BKB
            case "UPDATE_BKB": return <Truck className="h-4 w-4 text-indigo-500" />;
            case "DELETE_BKB": return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "UPDATE_BKB": return <Truck className="h-4 w-4 text-indigo-500" />;
            case "DELETE_BKB": return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "NAVIGATE": return <Compass className="h-4 w-4 text-teal-500" />; // New for Route
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getBadges = (action: string) => {
        if (action.includes("LOGIN")) return "bg-green-100 text-green-800 border-green-200";
        if (action.includes("LOGOUT")) return "bg-red-100 text-red-800 border-red-200";
        if (action.includes("PR")) return "bg-blue-100 text-blue-800 border-blue-200";
        if (action.includes("PO")) return "bg-purple-100 text-purple-800 border-purple-200"; // New for PO
        if (action.includes("BTB")) return "bg-orange-100 text-orange-800 border-orange-200";
        if (action.includes("BKB")) return "bg-indigo-100 text-indigo-800 border-indigo-200"; // New for BKB
        if (action.includes("BKB")) return "bg-indigo-100 text-indigo-800 border-indigo-200"; // New for BKB
        if (action.includes("DELETE")) return "bg-red-100 text-red-800 border-red-200";
        if (action.includes("NAVIGATE")) return "bg-teal-100 text-teal-800 border-teal-200";
        return "bg-gray-100 text-gray-800";
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border shadow-sm">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Live Activity Feed
                </h3>
                <Badge variant="outline" className="text-xs">
                    Realtime
                </Badge>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
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
                                    initial={{ opacity: 0, y: -20, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative pl-6 pb-4 border-l-2 border-muted last:pb-0"
                                >
                                    <div className="absolute left-[-5px] top-1 bg-background rounded-full p-1 border shadow-sm">
                                        {getIcon(log.action_type)}
                                    </div>

                                    <div className="flex flex-col gap-1 bg-muted/10 p-3 rounded-lg hover:bg-muted/20 transition-colors border border-transparent hover:border-border">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                            <span className="font-mono">
                                                {format(new Date(log.timestamp), "HH:mm:ss dd/MM", { locale: id })}
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getBadges(log.action_type)}`}>
                                                {log.action_type}
                                            </Badge>
                                        </div>

                                        <div className="text-sm">
                                            <span className="font-semibold text-foreground mr-1">{log.nama_pengguna}</span>
                                            <span className="text-muted-foreground mr-1">
                                                {log.action_type === 'LOGIN' && 'telah masuk ke sistem (Login)'}
                                                {log.action_type === 'LOGOUT' && 'telah keluar dari sistem (Logout)'}
                                                {log.action_type === 'VIEW_PR' && 'sedang melihat detail PR'}
                                                {log.action_type === 'VIEW_BTB' && 'sedang melihat detail BTB'}
                                                {log.action_type === 'CREATE_PR' && 'membuat PR baru'}
                                                {log.action_type === 'CREATE_BTB' && 'membuat BTB baru'}
                                                {log.action_type === 'CREATE_PR' && 'membuat PR baru'}
                                                {log.action_type === 'CREATE_BTB' && 'membuat BTB baru'}
                                                {log.action_type === 'NAVIGATE' && 'mengunjungi halaman'}
                                                {!['LOGIN', 'LOGOUT', 'VIEW_PR', 'VIEW_BTB', 'CREATE_PR', 'CREATE_BTB', 'NAVIGATE'].includes(log.action_type) && `melakukan ${log.action_type}`}
                                            </span>
                                            {log.entity_id && (
                                                <span className="font-mono ml-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">
                                                    #{log.entity_id}
                                                </span>
                                            )}
                                        </div>

                                        {detailsObj && Object.keys(detailsObj).length > 0 && (
                                            <div className="mt-1 text-xs text-muted-foreground bg-background/50 p-2 rounded border font-mono truncate max-w-full">
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
                        <div className="text-center py-10 text-muted-foreground">
                            Belum ada aktivitas tercatat.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
