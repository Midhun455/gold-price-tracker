import { getMetalData } from "@/lib/fetcher";

let cache = null;
let lastFetch = 0;

export async function GET() {
    const now = Date.now();

    if (cache && now - lastFetch < 60000) {
        return Response.json(cache);
    }

    const data = await getMetalData();

    cache = data;
    lastFetch = now;

    return Response.json(data);
}
