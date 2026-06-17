"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Default getId: normalize _id (handles MongoDB $oid or plain string).
 * Parent can pass a custom getId for their entity.
 */
function defaultGetId(item: any): string {
    if (!item) return "";
    const raw = item._id;
    if (typeof raw === "object" && raw?.$oid) return raw.$oid;
    return String(raw ?? "");
}

export interface UseRouteControlOptions {
    /** Base path for list and form routes (e.g. "/employee-management/employee-shift"). Required, passed from parent. */
    basePath: string;
    /** Optional: function to get id from a record. Default handles _id / $oid. */
    getId?: (item: any) => string;
}

export function useRouteControl(options: UseRouteControlOptions) {
    const { basePath, getId: getIdFromParent } = options;
    const getId = getIdFromParent ?? defaultGetId;

    const router = useRouter();
    const searchParams = useSearchParams();

    const mode = searchParams.get("mode");
    const id = searchParams.get("id");
    const isFormMode = mode === "edit" || mode === "add" || mode === "view";

    const goToAdd = useCallback(() => {
        router.push(`${basePath}?mode=add`);
    }, [router, basePath]);

    const goToEdit = useCallback(
        (item: any) => {
            const itemId = getId(item);
            if (itemId) router.push(`${basePath}?mode=edit&id=${encodeURIComponent(itemId)}`);
        },
        [router, basePath, getId]
    );

    const goToView = useCallback(
        (item: any) => {
            const itemId = getId(item);
            if (itemId) router.push(`${basePath}?mode=view&id=${encodeURIComponent(itemId)}`);
        },
        [router, basePath, getId]
    );

    const goToList = useCallback(() => {
        router.push(basePath);
    }, [router, basePath]);

    return {
        basePath,
        mode,
        id,
        isFormMode,
        goToAdd,
        goToEdit,
        goToView,
        goToList,
        getId,
    };
}
