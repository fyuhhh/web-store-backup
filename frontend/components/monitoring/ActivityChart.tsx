"use client";

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp } from "lucide-react";

interface ActivityChartProps {
    data: { time_bucket: string; count: number }[];
}

export function ActivityChart({ data = [] }: ActivityChartProps) {
    // Menghitung total aktivitas untuk ringkasan
    const safeData = Array.isArray(data) ? data : [];
    const totalActivity = safeData.reduce((sum, item) => sum + (item?.count || 0), 0);

    return (
        <Card className="h-full bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardHeader className="pb-0 pt-6 px-6 border-b-0 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 rounded-xl text-white">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                Volume Aktivitas Live
                            </CardTitle>
                            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                                Interaksi sistem dalam 24 jam
                            </CardDescription>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">
                            {totalActivity.toLocaleString('id-ID')}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200/60 uppercase tracking-widest shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </div>
                </div>
            </CardHeader>

            <CardContent className="h-[320px] pt-4 px-2 sm:px-4 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            vertical={false} 
                            stroke="#f1f5f9" 
                        />
                        
                        <XAxis
                            dataKey="time_bucket"
                            stroke="#cbd5e1"
                            fontSize={12}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={30}
                        />
                        
                        <YAxis
                            stroke="#cbd5e1"
                            fontSize={12}
                            fontWeight={500}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            dx={-10}
                        />
                        
                        <Tooltip
                            cursor={{
                                stroke: '#cbd5e1',
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                                fill: 'transparent'
                            }}
                            contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(8px)',
                                padding: '12px 16px',
                            }}
                            labelStyle={{
                                color: '#64748b',
                                fontSize: '12px',
                                fontWeight: 600,
                                marginBottom: '4px'
                            }}
                            itemStyle={{
                                color: '#0f172a',
                                fontWeight: 700,
                                fontSize: '15px'
                            }}
                        />
                        
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="url(#lineColor)"
                            strokeWidth={3}
                            fill="url(#colorCount)"
                            activeDot={{
                                r: 6,
                                strokeWidth: 0,
                                fill: '#4f46e5',
                                style: { 
                                    filter: 'drop-shadow(0px 2px 5px rgba(79,70,229,0.5))' 
                                }
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
