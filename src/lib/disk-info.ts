import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Normalized drive / mount info shared across platforms.
 */
export type DiskDrive = {
  filesystem: string;
  blocks: number;
  used: number;
  available: number;
  capacity: string;
  mounted: string;
};

function formatCapacity(used: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((used / total) * 100)}%`;
}

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

/**
 * Human-readable size helpers for the TUI.
 */
export const diskFormat = {
  bytes: formatBytes,
};

async function run(
  command: string,
  args: string[],
  options?: { shell?: boolean },
): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4,
    windowsHide: true,
    shell: options?.shell ?? false,
  });
  return stdout;
}

/**
 * Windows: PowerShell CIM (wmic is removed on modern Windows).
 */
async function getWindowsDisks(): Promise<DiskDrive[]> {
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
      const label = row.VolumeName?.trim();
      const fs =
        [row.FileSystem, label].filter(Boolean).join(" ") || "Local Disk";

      return {
        filesystem: fs,
        blocks: size,
        used,
        available: free,
        capacity: formatCapacity(used, size),
        mounted: mount,
      };
    })
    .filter((d) => d.mounted.length > 0);
}

/**
 * Linux / Android Termux: portable `df -kP` (POSIX-ish columns).
 * Filters virtual / pseudo filesystems that clutter Termux output.
 */
async function getUnixDisks(): Promise<DiskDrive[]> {
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
    // BusyBox / some Termux builds: drop -P
    stdout = await run("df", ["-k"]);
  }

  const lines = stdout.split(/\r?\n/).filter(Boolean);
  // Drop header
  const body = lines.slice(1);
  const drives: DiskDrive[] = [];

  for (const line of body) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) {
      continue;
    }

    const filesystem = parts[0] ?? "";
    const blocksKb = Number(parts[1] ?? 0);
    const usedKb = Number(parts[2] ?? 0);
    const availKb = Number(parts[3] ?? 0);
    const capacityToken = parts[4] ?? "0%";
    const mounted = parts.slice(5).join(" ");

    const fsName = filesystem.toLowerCase();
    if (skipFs.has(fsName)) {
      continue;
    }
    if (
      skipMountPrefixes.some(
        (p) => mounted === p || mounted.startsWith(`${p}/`),
      )
    ) {
      continue;
    }
    // Skip zero-size pseudo mounts
    if (!Number.isFinite(blocksKb) || blocksKb <= 0) {
      continue;
    }

    const blocks = blocksKb * 1024;
    const used = usedKb * 1024;
    const available = availKb * 1024;
    const capacity = capacityToken.endsWith("%")
      ? capacityToken
      : formatCapacity(used, blocks);

    drives.push({
      filesystem,
      blocks,
      used,
      available,
      capacity,
      mounted,
    });
  }

  // Prefer real storage mounts first (/, /data, /sdcard, /home, drive letters)
  const rank = (mounted: string): number => {
    if (mounted === "/" || mounted === "/data" || mounted === "/sdcard") {
      return 0;
    }
    if (mounted.startsWith("/storage") || mounted.startsWith("/home")) {
      return 1;
    }
    return 2;
  };

  return drives.sort((a, b) => rank(a.mounted) - rank(b.mounted));
}

/**
 * Collect disk / mount info for the current OS.
 * Supports Windows (PowerShell), Linux, and Android Termux (df).
 */
export async function getDiskInfo(): Promise<DiskDrive[]> {
  const platform = process.platform;

  if (platform === "win32") {
    return getWindowsDisks();
  }

  if (platform === "linux" || platform === "android" || platform === "darwin") {
    return getUnixDisks();
  }

  // Fallback: try df anywhere else (BSD, etc.)
  try {
    return await getUnixDisks();
  } catch {
    throw new Error(`Disk info is not supported on platform: ${platform}`);
  }
}
