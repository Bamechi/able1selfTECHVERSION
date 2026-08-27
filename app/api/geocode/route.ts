import { requireSession } from "../../../lib/auth-session";

type OpenMeteoResult = {
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};

export async function GET(request: Request) {
  try {
    await requireSession(request);
    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length < 2 || query.length > 160) {
      return Response.json({ error: "Enter a city before searching." }, { status: 400 });
    }
    const endpoint = new URL("https://geocoding-api.open-meteo.com/v1/search");
    endpoint.searchParams.set("name", query);
    endpoint.searchParams.set("count", "6");
    endpoint.searchParams.set("language", "en");
    endpoint.searchParams.set("format", "json");
    const response = await fetch(endpoint, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error("The location service is temporarily unavailable.");
    const payload = (await response.json()) as { results?: OpenMeteoResult[] };
    const results = (payload.results ?? [])
      .filter((item) => item.name && item.timezone && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
      .map((item) => ({
        name: item.name,
        admin1: item.admin1 ?? "",
        country: item.country ?? "",
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone,
      }));
    return Response.json({ results });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Location lookup failed." },
      { status: 502 },
    );
  }
}
