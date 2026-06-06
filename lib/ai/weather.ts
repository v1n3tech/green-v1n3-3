/**
 * Open-Meteo weather + climate wrapper (free, no API key).
 *
 * Provides real forecast and recent climate data for the 17 Plateau State
 * LGAs. The AI advisory assistant uses this as a *tool* so its farming advice
 * is grounded in real numbers rather than guesses.
 *
 * Docs: https://open-meteo.com/en/docs
 */

export type LgaCoords = { lat: number; lon: number }

// Approximate centroids for each Plateau LGA (decimal degrees).
export const LGA_COORDS: Record<string, LgaCoords> = {
  Bokkos: { lat: 9.3, lon: 9.0 },
  "Barkin Ladi": { lat: 9.53, lon: 8.9 },
  Bassa: { lat: 10.0, lon: 8.83 },
  "Jos East": { lat: 9.83, lon: 9.05 },
  "Jos North": { lat: 9.93, lon: 8.89 },
  "Jos South": { lat: 9.8, lon: 8.86 },
  Kanam: { lat: 9.3, lon: 9.65 },
  Kanke: { lat: 9.28, lon: 9.4 },
  "Langtang North": { lat: 9.13, lon: 9.79 },
  "Langtang South": { lat: 8.9, lon: 9.83 },
  Mangu: { lat: 9.52, lon: 9.1 },
  Mikang: { lat: 8.95, lon: 9.55 },
  Pankshin: { lat: 9.33, lon: 9.44 },
  "Qua'an Pan": { lat: 8.75, lon: 9.73 },
  Riyom: { lat: 9.62, lon: 8.75 },
  Shendam: { lat: 8.88, lon: 9.53 },
  Wase: { lat: 9.1, lon: 9.95 },
}

// Plateau State centroid — used when no LGA is known.
export const PLATEAU_CENTER: LgaCoords = { lat: 9.22, lon: 9.52 }

export function resolveCoords(lga?: string | null): { coords: LgaCoords; label: string } {
  if (lga && LGA_COORDS[lga]) return { coords: LGA_COORDS[lga], label: `${lga}, Plateau` }
  return { coords: PLATEAU_CENTER, label: "Plateau State" }
}

const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
}

export function describeWeatherCode(code: number): string {
  return WMO[code] ?? "Mixed conditions"
}

export type WeatherForecast = {
  location: string
  current: { temperature: number; humidity: number; conditions: string; windSpeed: number } | null
  daily: Array<{
    date: string
    tempMax: number
    tempMin: number
    precipitationMm: number
    precipitationProbability: number
    conditions: string
  }>
  recentRainfallMm: number // total over the last 7 days
}

/**
 * Fetch a 7-day forecast + recent 7-day rainfall total for an LGA.
 * Returns null on network failure so callers can degrade gracefully.
 */
export async function getWeatherForecast(lga?: string | null): Promise<WeatherForecast | null> {
  const { coords, label } = resolveCoords(lga)
  try {
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
      past_days: "7",
      forecast_days: "7",
      timezone: "Africa/Lagos",
    })
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 1800 }, // cache 30 min
    })
    if (!res.ok) return null
    const data = await res.json()

    const daily: WeatherForecast["daily"] = []
    const times: string[] = data?.daily?.time ?? []
    const today = new Date().toISOString().slice(0, 10)
    let recentRainfallMm = 0

    for (let i = 0; i < times.length; i++) {
      const date = times[i]
      const precip = Number(data.daily.precipitation_sum?.[i] ?? 0)
      if (date < today) {
        recentRainfallMm += precip
        continue // skip past days in the forecast list, keep them only for rainfall sum
      }
      daily.push({
        date,
        tempMax: Number(data.daily.temperature_2m_max?.[i] ?? 0),
        tempMin: Number(data.daily.temperature_2m_min?.[i] ?? 0),
        precipitationMm: precip,
        precipitationProbability: Number(data.daily.precipitation_probability_max?.[i] ?? 0),
        conditions: describeWeatherCode(Number(data.daily.weather_code?.[i] ?? 0)),
      })
    }

    return {
      location: label,
      current: data?.current
        ? {
            temperature: Number(data.current.temperature_2m ?? 0),
            humidity: Number(data.current.relative_humidity_2m ?? 0),
            conditions: describeWeatherCode(Number(data.current.weather_code ?? 0)),
            windSpeed: Number(data.current.wind_speed_10m ?? 0),
          }
        : null,
      daily,
      recentRainfallMm: Math.round(recentRainfallMm * 10) / 10,
    }
  } catch (err) {
    console.log("[v0] getWeatherForecast failed:", (err as Error).message)
    return null
  }
}

/** Compact text summary for embedding into an LLM prompt or a UI card. */
export function summarizeForecast(f: WeatherForecast): string {
  const lines: string[] = [`Weather for ${f.location}:`]
  if (f.current) {
    lines.push(
      `Now: ${f.current.temperature}°C, ${f.current.conditions}, humidity ${f.current.humidity}%, wind ${f.current.windSpeed} km/h.`,
    )
  }
  lines.push(`Rainfall in the last 7 days: ${f.recentRainfallMm} mm.`)
  const next = f.daily.slice(0, 5)
  for (const d of next) {
    lines.push(
      `${d.date}: ${d.tempMin}–${d.tempMax}°C, ${d.conditions}, rain ${d.precipitationMm}mm (${d.precipitationProbability}% chance).`,
    )
  }
  return lines.join("\n")
}
