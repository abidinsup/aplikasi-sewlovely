"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
    const [status, setStatus] = useState<string>("Checking...");
    const [envInfo, setEnvInfo] = useState<string>("");
    const supabase = createClientComponentClient();

    useEffect(() => {
        async function checkConnection() {
            try {
                const { data, error } = await supabase.from('partners').select('count', { count: 'exact', head: true });

                if (error) {
                    setStatus(`ERROR: ${error.message} (Code: ${error.code})`);
                } else {
                    setStatus(`SUCCESS: Connected to database. Found partners table.`);
                }
            } catch (e: any) {
                setStatus(`EXCEPTION: ${e.message}`);
            }

            // Check env vars (safe to expose partially for debugging)
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            setEnvInfo(`URL: ${url ? url.substring(0, 15) + '...' : 'MISSING'}\nKEY: ${key ? key.substring(0, 10) + '...' : 'MISSING'}`);
        }

        checkConnection();
    }, []);

    return (
        <div className="p-10 font-mono">
            <h1 className="text-xl font-bold mb-4">Auth Debugger</h1>
            <div className="bg-gray-100 p-4 rounded mb-4">
                <strong>Status:</strong> {status}
            </div>
            <pre className="bg-gray-800 text-white p-4 rounded">
                {envInfo}
            </pre>
        </div>
    );
}
