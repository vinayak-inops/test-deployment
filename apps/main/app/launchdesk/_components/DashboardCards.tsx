"use client"

import React from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@inops/store/src/store";
import { ArrowUpRight, Grid2x2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { allCards } from "@/json/launchdesk/launchdesk";
import useCurrentDomain from "@/hooks/api/useCurrentDomain";
import { Card, CardContent } from "@/components/ui/card";

const DashboardCards: React.FC = () => {
    const adminRole = useSelector((state: RootState) => (state as any).api?.data);
    const apiState = useSelector((state: RootState) => state.api);

    const { data: session, status } = useSession();
    const router = useRouter();

    const [isClient, setIsClient] = React.useState(false);
    const [allowedServices, setAllowedServices] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasWaited, setHasWaited] = React.useState(false);
    const [didSessionRefresh, setDidSessionRefresh] = React.useState(false);

    const NEXT_PUBLIC_NEXTAUTH_URL = useCurrentDomain();

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        const t = setTimeout(() => setHasWaited(true), 1500);
        return () => clearTimeout(t);
    }, []);

    React.useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session) {
            if (!session.user?.preferred_username && !session.user?.email && !session.user?.name) {
                router.push('/login');
                return;
            }


            const hasRealmAccess = session.user?.realm_access?.roles?.length > 0;


            if (!didSessionRefresh) {
                setDidSessionRefresh(true);
                router.refresh();
            }
        }
    }, [status, session, router]);

    React.useEffect(() => {
        const apiPerms =
            (apiState?.data && Array.isArray(apiState.data) ? apiState.data[0] : apiState?.data) ?? null;

        const rolePerms = apiPerms ?? adminRole ?? null;

        if (!rolePerms || typeof rolePerms !== "object") {
            setIsLoading(true);
            setAllowedServices([]);
            return;
        }

        const names = Object.entries(rolePerms)
            .filter(([_, val]) => {
                if (!val) return false;
                if (typeof val === "object" && "isActive" in (val as any)) {
                    return Boolean((val as any).isActive);
                }
                return val === true;
            })
            .map(([key]) => key);

        const unique = Array.from(new Set(names)) as string[];
        setAllowedServices(unique);
        setIsLoading(!(unique.length > 0 || hasWaited));
    }, [adminRole, apiState, hasWaited]);

    const cards = React.useMemo(() => {
        if (!isClient || isLoading || apiState?.loading) return [] as typeof allCards;
        if (!allowedServices.length) return [] as typeof allCards;

        return allCards.filter((card: any) => {
            if (!card?.serviceName) return false;
            const names = Array.isArray(card.serviceName) ? card.serviceName : [card.serviceName];
            return names.some((name: string) => allowedServices.includes(name));
        });
    }, [isClient, isLoading, apiState?.loading, allowedServices]);

    return (
        <div className="mx-auto px-4 pl-0 pt-0 pb-8 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-2 px-4 py-3 pl-0"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-wide text-slate-700">
                        APPLICATIONS & DATA ENTRY
                    </h2>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                        ?
                    </span>
                </div>
            </motion.div>

            {isLoading || apiState?.loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : cards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center">
                    <p className="text-sm text-slate-500">
                        No services available with your current permissions.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {cards.map((card: any, idx): any => (
                        <motion.div
                            key={card?.title ?? idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="h-full"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    const baseUrl = (NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin).replace(/\/$/, "");
                                    const linkPath = String(card.link || "").replace(/^\//, "");
                                    window.location.href = `${baseUrl}/${linkPath}`;
                                }}
                                className="block h-full w-full text-left"
                            >
                                <div className="group h-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/20 hover:shadow-md">
                                    <div className="flex h-full">
                                        <div className="flex w-[98px] flex-shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50/80 p-2">
                                            <div
                                                className="aspect-[5/4] w-full rounded-lg border border-slate-200 bg-white bg-cover bg-center shadow-sm"
                                                style={{
                                                    backgroundImage: `url(${card.image || "https://img.icons8.com/?size=96&id=13014&format=png&color=4a90e2"})`,
                                                }}
                                                aria-label={card.title}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1 p-4">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <h3 className="truncate text-sm font-semibold text-blue-700">
                                                    {card.title}
                                                </h3>
                                                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 text-blue-700" />
                                                {card?.badge !== undefined && (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white"
                                                    >
                                                        {card.badge}
                                                    </motion.span>
                                                )}
                                            </div>
                                            <p className="line-clamp-2 text-sm leading-5 text-slate-700">
                                                {card.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
        // <div className="mx-auto px-4 py-4 sm:px-6 lg:px-8">
        //     <motion.div
        //         initial={{ opacity: 0, y: -20 }}
        //         animate={{ opacity: 1, y: 0 }}
        //         transition={{ duration: 0.5 }}
        //         className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3"
        //     >
        //         <div className="flex items-center justify-between">
        //             <h2 className="text-sm font-semibold tracking-wide text-slate-700">APPLICATIONS & DATA ENTRY</h2>
        //             <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">?</span>
        //         </div>
        //         <p className="mt-1 text-xs text-slate-500">Quick access to frequently used request modules</p>
        //     </motion.div>
            
        //     {isLoading || apiState?.loading ? (
        //         <div className="flex items-center justify-center py-16">
        //             <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        //         </div>
        //     ) : cards.length === 0 ? (
        //         <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center">
        //             <p className="text-sm text-slate-500">No services available with your current permissions.</p>
        //         </div>
        //     ) : (
        //         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        //         {cards.map((card:any, idx): any => (
        //             <motion.div
        //                 key={card?.title ?? idx}
        //                 initial={{ opacity: 0, y: 20 }}
        //                 animate={{ opacity: 1, y: 0 }}
        //                 transition={{ duration: 0.5, delay: idx * 0.1 }}
        //                 className="h-full"
        //             >
        //                 <button
        //                     type="button"
        //                     onClick={() => {
        //                         const baseUrl = (NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin).replace(/\/$/, "");
        //                         const linkPath = String(card.link || "").replace(/^\//, "");
        //                         window.location.href = `${baseUrl}/${linkPath}`;
        //                     }}
        //                     className="block h-full w-full text-left"
        //                 >
        //                     <Card className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
        //                         <CardContent className="relative z-20 p-0">
        //                             <span className="absolute right-3 top-3 z-30 rounded-full bg-blue-50 p-1 text-blue-600 shadow-sm">
        //                                 <ArrowUpRight className="h-4 w-4" />
        //                             </span>
        //                             <div className="relative border-b border-slate-100 p-4">
        //                                 <div className="flex items-center justify-between gap-3">
        //                                     <div className="flex min-w-0 items-center gap-3">
        //                                         <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
        //                                             <Grid2x2 className="h-4 w-4" />
        //                                         </span>
        //                                         <div className="min-w-0">
        //                                             <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Module</div>
        //                                             <h3 className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
        //                                                 {card.title}
        //                                             </h3>
        //                                         </div>
        //                                     </div>
        //                                     {card?.badge !== undefined && (
        //                                         <motion.span 
        //                                             initial={{ scale: 0 }}
        //                                             animate={{ scale: 1 }}
        //                                             className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white shadow-md"
        //                                         >
        //                                             {card.badge}
        //                                         </motion.span>
        //                                     )}
        //                                 </div>
        //                             </div>

        //                             <div className="relative p-4">
        //                                 <p className="line-clamp-2 text-sm leading-5 text-slate-600">
        //                                     {card.description}
        //                                 </p>
        //                                 <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
        //                                     Open module
        //                                 </div>
        //                             </div>
        //                             <div className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
        //                         </CardContent>
        //                     </Card>
        //                 </button>
        //             </motion.div>
        //         ))}
        //         </div>
        //     )}
        // </div>
    );
};

export default DashboardCards;
