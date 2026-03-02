"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Monitor, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface OnlineUser {
    socketId: string;
    id_user: number;
    nama_pengguna: string;
    role: number;
    divisi: number | null;
    loginTime: string;
}

interface ActiveUsersGridProps {
    users: OnlineUser[];
}

export function ActiveUsersGrid({ users }: ActiveUsersGridProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
                        <Monitor className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 leading-none">Pengguna Aktif</h2>
                        <p className="text-sm text-slate-500 mt-1">Status online saat ini</p>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 text-sm self-start sm:self-auto shadow-sm border border-green-200">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    {users.length} Online
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence>
                    {users.map((user) => (
                        <motion.div
                            key={user.socketId}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="group"
                        >
                            <Card className="overflow-hidden bg-white hover:bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-2 ring-green-100">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nama_pengguna}&backgroundColor=e2e8f0,cbd5e1&textColor=334155`} />
                                                <AvatarFallback className="bg-slate-100 text-slate-600"><User className="h-5 w-5"/></AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-200" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <p className="font-semibold text-slate-800 text-sm truncate mb-1 pr-4" title={user.nama_pengguna}>
                                                {user.nama_pengguna}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    ID: {user.id_user}
                                                </span>
                                                {user.role && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        Role: {user.role}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span>
                                                    {formatDistanceToNow(new Date(user.loginTime), { addSuffix: true, locale: id })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {users.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200"
                    >
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <User className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-base font-medium text-slate-600">Tidak ada pengguna online</p>
                        <p className="text-sm text-slate-400 mt-1">Hanya anda yang sedang aktif saat ini.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
