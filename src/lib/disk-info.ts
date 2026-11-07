import { execFile } from "node:child_process";
import { promisify } from "node:util";
import si from "systeminformation";

const execFileAsync = promisify(execFile);

/** Mounted filesystem / volume. */
export type DiskVolume = {
  filesystem: string;
  type: string;
  size: number;
  used: number;
  available: number;
  use: number;
  mount: string;
  rw: boolean | null;
  label: string;
  physical: string;
  removable: boolean;
  device: string;
};

/** Physical drive from the hardware layout. */
export type PhysicalDisk = {
  device: string;
  name: string;
  type: string;
  vendor: string;
  size: number;
  interfaceType: string;
  smartStatus: string;
  serialNum: string;
  temperature: number | null;
};

export type DiskSummary = {
  volumeCount: number;
  physicalCount: number;
  totalSize: number;
  totalUsed: number;
  totalAvailable: number;
  overallUse: number;
  ssdCount: number;
  hddCount: number;
  criticalVolumes: number;
  warningVolumes: number;
};

export type DiskAnalytics = {
  volumes: DiskVolume[];
  physical: PhysicalDisk[];
  summary: DiskSummary;
  source: "systeminformation" | "fallback";
  platform: string;
};

/** @deprecated Prefer DiskVolume — kept for older call sites. */
export type DiskDrive = {
  filesystem: string;
  blocks: number;
  used: number;
  available: number;
  capacity: string;
  mounted: string;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

function formatPercent(use: number): string {
  if (!Number.isFinite(use)) {
    return "0%";
  }
  return `${Math.round(use)}%`;
}

/**
 * Human-readable size / percent helpers for the TUI.
 */
export const diskFormat = {
  bytes: formatBytes,
  percent: formatPercent,
};

function buildSummary(
  volumes: DiskVolume[],
  physical: PhysicalDisk[],
): DiskSummary {
  const totalSize = volumes.reduce((sum, v) => sum + v.size, 0);
  const totalUsed = volumes.reduce((sum, v) => sum + v.used, 0);
  const totalAvailable = volumes.reduce((sum, v) => sum + v.available, 0);

  return {
    volumeCount: volumes.length,
    physicalCount: physical.length,
    totalSize,
    totalUsed,
    totalAvailable,
    overallUse: totalSize > 0 ? (totalUsed / totalSize) * 100 : 0,
    ssdCount: physical.filter((d) => /ssd|nvme/i.test(d.type)).length,
    hddCount: physical.filter((d) => /^(hd|hdd)$/i.test(d.type)).length,
    criticalVolumes: volumes.filter((v) => v.use >= 90).length,
    warningVolumes: volumes.filter((v) => v.use >= 75 && v.use < 90).length,
  };
}

function volumeToDrive(volume: DiskVolume): DiskDrive {
  return {
    filesystem: volume.type || volume.filesystem,
    blocks: volume.size,
    used: volume.used,
    available: volume.available,
    capacity: formatPercent(volume.use),
    mounted: volume.mount,
  };
}

async function run(command: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4,
    windowsHide: true,
  });
  return stdout;
}

async function fallbackWindowsVolumes(): Promise<DiskVolume[]> {
  const script = [
    "Get-CimInstance Win32_LogicalDisk |",
    "Select-Object DeviceID,FileSystem,Size,FreeSpace,VolumeName |",
    "ConvertTo-Json -Compress",
  ].join(" ");

  const stdout = await run("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    script,
  ]);
  const trimmed = stdout.trim();
  if (!trimmed) {
    return [];
  }

  type WinDisk = {
    DeviceID?: string;
    FileSystem?: string | null;
    Size?: number | string | null;
    FreeSpace?: number | string | null;
    VolumeName?: string | null;
  };

  const parsed = JSON.parse(trimmed) as WinDisk | WinDisk[];
  const rows = Array.isArray(parsed) ? parsed : [parsed];

  return rows
    .map((row) => {
      const size = Number(row.Size ?? 0);
      const free = Number(row.FreeSpace ?? 0);
      const used = Math.max(0, size - free);
      const mount = row.DeviceID ?? "";
      return {
        filesystem: mount,
        type: row.FileSystem ?? "unknown",
        size,
        used,
        available: free,
        use: size > 0 ? (used / size) * 100 : 0,
        mount,
        rw: true,
        label: row.VolumeName?.trim() ?? "",
        physical: "Local",
        removable: false,
        device: "",
      };
    })
    .filter((d) => d.mount.length > 0 && d.size > 0);
}

async function fallbackUnixVolumes(): Promise<DiskVolume[]> {
  const skipFs = new Set([
    "tmpfs",
    "devtmpfs",
    "sysfs",
    "proc",
    "cgroup",
    "cgroup2",
    "devpts",
    "securityfs",
    "pstore",
    "bpf",
    "tracefs",
    "debugfs",
    "configfs",
    "fusectl",
    "mqueue",
    "hugetlbfs",
    "overlay",
    "squashfs",
  ]);
  const skipMountPrefixes = [
    "/proc",
    "/sys",
    "/dev",
    "/run",
    "/apex",
    "/vendor",
    "/product",
    "/system_ext",
    "/metadata",
  ];

  let stdout: string;
  try {
    stdout = await run("df", ["-kP"]);
  } catch {
    stdout = await run("df", ["-k"]);
  }

  const body = stdout.split(/\r?\n/).filter(Boolean).slice(1);
  const volumes: DiskVolume[] = [];

  for (const line of body) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) {
      continue;
    }

    const filesystem = parts[0] ?? "";
    const blocksKb = Number(parts[1] ?? 0);
    const usedKb = Number(parts[2] ?? 0);
    const availKb = Number(parts[3] ?? 0);
    const mount = parts.slice(5).join(" ");

    if (skipFs.has(filesystem.toLowerCase())) {
      continue;
    }
    if (
      skipMountPrefixes.some((p) => mount === p || mount.startsWith(`${p}/`))
    ) {
      continue;
    }
    if (!Number.isFinite(blocksKb) || blocksKb <= 0) {
      continue;
    }

    const size = blocksKb * 1024;
    const used = usedKb * 1024;
    const available = availKb * 1024;

    volumes.push({
      filesystem,
      type: filesystem.includes("/") ? "local" : filesystem,
      size,
      used,
      available,
      use: size > 0 ? (used / size) * 100 : 0,
      mount,
      rw: null,
      label: "",
      physical: "Local",
      removable: false,
      device: "",
    });
  }

  const rank = (mounted: string): number => {
    if (mounted === "/" || mounted === "/data" || mounted === "/sdcard") {
      return 0;
    }
    if (mounted.startsWith("/storage") || mounted.startsWith("/home")) {
      return 1;
    }
    return 2;
  };

  return volumes.sort((a, b) => rank(a.mount) - rank(b.mount));
}

async function getFallbackVolumes(): Promise<DiskVolume[]> {
  if (process.platform === "win32") {
    return fallbackWindowsVolumes();
  }
  return fallbackUnixVolumes();
}

type BlockRow = Awaited<ReturnType<typeof si.blockDevices>>[number];

function enrichFromBlockDevices(
  volumes: DiskVolume[],
  blocks: BlockRow[],
): DiskVolume[] {
  return volumes.map((volume) => {
    const match = blocks.find(
      (b) =>
        b.mount === volume.mount ||
        b.name === volume.mount ||
        b.identifier === volume.mount ||
        b.name === volume.filesystem,
    );
    if (!match) {
      return volume;
    }
    return {
      ...volume,
      label: volume.label || match.label || "",
      physical: match.physical || volume.physical,
      removable: Boolean(match.removable),
      device: match.device || volume.device,
      type: volume.type || match.fsType || "unknown",
    };
  });
}

/**
 * Full disk analytics: volumes, physical layout, and summary stats.
 * Prefers `systeminformation`; falls back to PowerShell / df for Termux etc.
 */
export async function getDiskAnalytics(): Promise<DiskAnalytics> {
  const platform = process.platform;

  try {
    const [fsSize, diskLayout, blockDevices] = await Promise.all([
      si.fsSize(),
      si
        .diskLayout()
        .catch(() => [] as Awaited<ReturnType<typeof si.diskLayout>>),
      si
        .blockDevices()
        .catch(() => [] as Awaited<ReturnType<typeof si.blockDevices>>),
    ]);

    const mapped = fsSize
      .filter((v) => Number(v.size) > 0)
      .map((v) => ({
        filesystem: v.fs,
        type: v.type || "unknown",
        size: Number(v.size) || 0,
        used: Number(v.used) || 0,
        available: Number(v.available) || 0,
        use: Number(v.use) || 0,
        mount: v.mount || v.fs,
        rw: typeof v.rw === "boolean" ? v.rw : null,
        label: "",
        physical: "Local",
        removable: false,
        device: "",
      }));

    const volumes = enrichFromBlockDevices(mapped, blockDevices);
    if (volumes.length === 0) {
      throw new Error("systeminformation returned no volumes");
    }

    const physical: PhysicalDisk[] = diskLayout.map((d) => ({
      device: d.device || "",
      name: d.name || "Unknown disk",
      type: d.type || "Unknown",
      vendor: d.vendor || "",
      size: Number(d.size) || 0,
      interfaceType: d.interfaceType || "",
      smartStatus: d.smartStatus || "unknown",
      serialNum: d.serialNum || "",
      temperature: typeof d.temperature === "number" ? d.temperature : null,
    }));

    return {
      volumes,
      physical,
      summary: buildSummary(volumes, physical),
      source: "systeminformation",
      platform,
    };
  } catch {
    const volumes = await getFallbackVolumes();
    const physical: PhysicalDisk[] = [];
    return {
      volumes,
      physical,
      summary: buildSummary(volumes, physical),
      source: "fallback",
      platform,
    };
  }
}

/**
 * Volume list only (legacy shape used by simple call sites).
 */
export async function getDiskInfo(): Promise<DiskDrive[]> {
  const analytics = await getDiskAnalytics();
  return analytics.volumes.map(volumeToDrive);
}
