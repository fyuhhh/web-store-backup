"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-green-500" />
                    Pengguna Aktif
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-200">
                        {users.length} Online
                    </Badge>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {users.map((user) => (
                        <motion.div
                            key={user.socketId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-10 w-10 border-2 border-green-200">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.nama_pengguna}`} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-sm truncate" title={user.nama_pengguna}>
                                                    {user.nama_pengguna}
                                                </p>
                                                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium bg-secondary px-1.5 py-0.5 rounded">
                                                        ID: {user.id_user}
                                                    </span>
                                                    {user.role && (
                                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                            Role: {user.role}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        Login {formatDistanceToNow(new Date(user.loginTime), { addSuffix: true, locale: id })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {users.length === 0 && (
                    <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada pengguna lain yang online saat ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
