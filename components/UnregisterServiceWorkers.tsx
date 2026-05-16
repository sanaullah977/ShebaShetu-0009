"use client"

import { useEffect } from "react";

export default function UnregisterServiceWorkers() {
    useEffect(() => {
        if (typeof window === "undefined") return;
        const hostname = window.location.hostname;
        if (!(hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1")) return;

        (async () => {
            try {
                if ("serviceWorker" in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((r) => r.unregister()));
                }

                if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }

                // no UI feedback — just keep console trace
                // eslint-disable-next-line no-console
                console.info("Unregistered service workers and cleared caches (local dev)");
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn("Failed to unregister service workers or clear caches", err);
            }
        })();
    }, []);

    return null;
}
