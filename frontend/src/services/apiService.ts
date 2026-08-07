// ==============================================================================
// FILE: src/services/apiService.ts
// WHAT THIS FILE IS: API Service Module for HTTP requests to FastAPI Backend.
// WHY IT IS USED: Encapsulates all REST fetch calls (health check, system telemetry, 
//                 system action dispatch) to keep component code clean and maintainable.
// ==============================================================================

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface HealthStatus {
  status: string;
  environment: string;
  ai_provider: string;
}

export interface SystemTelemetry {
  os: string;
  os_version: string;
  processor: string;
  cpu_usage_percent: number;
  cpu_count_logical: number;
  cpu_count_physical: number;
  ram_used_gb: number;
  ram_total_gb: number;
  ram_percent: number;
  disk_free_gb: number;
  disk_total_gb: number;
  disk_percent: number;
  net_bytes_sent_mb: number;
  net_bytes_recv_mb: number;
  total_processes: number;
  battery?: {
    percent: number;
    power_plugged: boolean;
  } | null;
  boot_timestamp: number;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
}

export async function fetchServerHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Backend server on port 8000 is currently offline or unreachable.");
    return null;
  }
}

export async function fetchSystemTelemetry(): Promise<SystemTelemetry | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/system/telemetry`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Failed to fetch system telemetry.");
    return null;
  }
}

export async function executeSystemAction(action: string, args: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/system/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, args }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error: any) {
    console.error(`Failed to execute system action '${action}':`, error);
    return { error: error.message || "Failed to execute action" };
  }
}
