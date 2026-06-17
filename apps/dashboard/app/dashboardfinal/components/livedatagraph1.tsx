"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { UserPlus, UserMinus, Play, Pause, Wifi, WifiOff, Volume2 } from "lucide-react"
import { Line, ResponsiveContainer, XAxis, YAxis, LineChart, Tooltip } from "recharts"







export default function LiveDataGraph() {
    const [isStreaming, setIsStreaming] = useState(true)
    const [isConnected, setIsConnected] = useState(true)
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const [soundEnabled, setSoundEnabled] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const [chartData, setChartData] = useState({
        labels: [] as string[],
        datasets: [
            {
                fill: true,
                label: "In employees",
                data: [] as number[],
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
            {
                fill: true,
                label: "Out employees",
                data: [] as number[],
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
            },
        ],
    })

    // Function to format time with 5-minute delay
    const getTimeWithDelay = (delayMinutes = 5) => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - delayMinutes)
        return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    }

    // Simulate connection issues occasionally
    const simulateConnection = () => {
        const shouldDisconnect = Math.random() < 0.05 // 5% chance of disconnection
        if (shouldDisconnect && isConnected) {
            setIsConnected(false)
            setTimeout(() => setIsConnected(true), 3000) // Reconnect after 3 seconds
        }
    }

    // Play notification sound for significant changes
    const playNotification = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {
                // Handle autoplay restrictions
            })
        }
    }

    const updateChartData = () => {
        if (!isStreaming || !isConnected) return

        setChartData((prevData) => {
            const newTime = getTimeWithDelay()
            const newEmployeeValue = Math.floor(Math.random() * 25) + 3
            const leftEmployeeValue = Math.floor(Math.random() * 12) + 1

            // Check for significant changes (spike detection)
            const lastNewValue = prevData.datasets[0].data[prevData.datasets[0].data.length - 1] || 0
            if (Math.abs(newEmployeeValue - lastNewValue) > 10) {
                playNotification()
            }

            const newLabels = [...prevData.labels.slice(-19), newTime] // Keep last 20 points

            return {
                labels: newLabels,
                datasets: [
                    {
                        ...prevData.datasets[0],
                        data: [...prevData.datasets[0].data.slice(-19), newEmployeeValue],
                    },
                    {
                        ...prevData.datasets[1],
                        data: [...prevData.datasets[1].data.slice(-19), leftEmployeeValue],
                    },
                ],
            }
        })

        setLastUpdate(new Date())
        simulateConnection()
    }

    const toggleStreaming = () => {
        setIsStreaming(!isStreaming)
    }

    const toggleSound = () => {
        setSoundEnabled(!soundEnabled)
    }

    useEffect(() => {
        // Initialize with some data
        const initialLabels = Array(20)
            .fill(0)
            .map((_, i) => {
                const date = new Date()
                date.setMinutes(date.getMinutes() - 5 - (19 - i) * 0.25) // 15-second intervals
                return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            })

        const newEmployeeData = Array(20)
            .fill(0)
            .map(() => Math.floor(Math.random() * 20) + 5)

        const leftEmployeeData = Array(20)
            .fill(0)
            .map(() => Math.floor(Math.random() * 10) + 1)

        setChartData({
            labels: initialLabels,
            datasets: [
                {
                    ...chartData.datasets[0],
                    data: newEmployeeData,
                },
                {
                    ...chartData.datasets[1],
                    data: leftEmployeeData,
                },
            ],
        })

        // Create audio element for notifications
        audioRef.current = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
        )
    }, [])

    useEffect(() => {
        if (isStreaming && isConnected) {
            intervalRef.current = setInterval(updateChartData, 5000) // Update every 5 seconds
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isStreaming, isConnected])



    const getCurrentValue = (datasetIndex: number) => {
        const data = chartData.datasets[datasetIndex].data
        return data.length > 0 ? data[data.length - 1] : 0
    }

    return (
        <div className="p-0 space-y-6 bg-gray-50 ">

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

                {/* 
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                    <div className="text-lg font-bold mt-1">Employees currently inside the premises</div>

                        <div className="text-sm opacity-75">{getCurrentDate()}</div>
                        <div className="text-lg font-bold mt-1">In:2000  Out:1000</div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
                        >
                            <PieChart>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={staticChartData} dataKey="value" nameKey="name" label />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>

                </Card> */}




                <Card className="w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold">Live Employee Stream</CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                                    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                    {isConnected ? "Connected" : "Disconnected"}
                                </Badge>
                                <Badge variant={isStreaming ? "default" : "secondary"} className="animate-pulse">
                                    {isStreaming ? "🔴 LIVE" : "⏸️ PAUSED"}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <UserPlus className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-green-600">In employees</div>
                                            <div className="text-2xl font-bold text-green-700">{getCurrentValue(0)}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-green-600/70">Live: {lastUpdate.toLocaleTimeString()}</div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-full">
                                            <UserMinus className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-red-600">Out employees</div>
                                            <div className="text-2xl font-bold text-red-700">{getCurrentValue(1)}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-red-600/70">Live: {lastUpdate.toLocaleTimeString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={toggleSound} className={soundEnabled ? "bg-blue-50" : ""}>
                                    <Volume2 className={`h-4 w-4 ${soundEnabled ? "text-blue-600" : "text-gray-400"}`} />
                                </Button>
                                <Button
                                    variant={isStreaming ? "destructive" : "default"}
                                    size="sm"
                                    onClick={toggleStreaming}
                                    disabled={!isConnected}
                                >
                                    {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    {isStreaming ? "Pause" : "Resume"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="h-[350px] relative">
                            {!isConnected && (
                                <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-10 rounded">
                                    <div className="text-center">
                                        <WifiOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Connection lost. Reconnecting...</p>
                                    </div>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData.labels.map((label, i) => ({
                                        name: label,
                                        in: chartData.datasets[0].data[i],
                                        out: chartData.datasets[1].data[i]
                                    }))}
                                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                                >
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="in" stroke={chartData.datasets[0].borderColor} strokeWidth={2} />
                                    <Line type="monotone" dataKey="out" stroke={chartData.datasets[1].borderColor} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Updates every 5 seconds • Time delayed by 5 minutes</span>
                            <span>{chartData.labels.length > 0 && `Latest: ${chartData.labels[chartData.labels.length - 1]}`}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
