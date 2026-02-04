"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityChartProps {
    data: { time_bucket: string; count: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <Card className="h-full shadow-sm border-2 border-slate-100 dark:border-slate-800">
            <CardHeader>
                <CardTitle>Volume Aktivitas (24 Jam)</CardTitle>
                <CardDescription>
                    Jumlah aktivitas pengguna per jam.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="time_bucket"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar
                            dataKey="count"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-blue-600"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
