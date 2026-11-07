import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import {
  diskFormat,
  getDiskAnalytics,
  type DiskAnalytics,
  type DiskVolume,
  type PhysicalDisk,
} from "../lib/disk-info.js";

type Props = {
  onContinue?: () => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: DiskAnalytics }
  | { status: "error"; message: string };

function useColor(use: number): "red" | "yellow" | "green" {
  if (use >= 90) {
    return "red";
  }
  if (use >= 75) {
    return "yellow";
  }
  return "green";
}

function UsageBar({ use, width = 24 }: { use: number; width?: number }) {
  const clamped = Number.isFinite(use) ? Math.min(100, Math.max(0, use)) : 0;
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const color = useColor(clamped);

  return (
    <Text>
      [<Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>]{" "}
      <Text color={color}>{diskFormat.percent(clamped)}</Text>
    </Text>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  if (!value) {
    return null;
  }
  return (
    <Text>
      <Text dimColor>{label}: </Text>
      <Text>{value}</Text>
    </Text>
  );
}

function SummaryPanel({ data }: { data: DiskAnalytics }) {
  const { summary } = data;
  const color = useColor(summary.overallUse);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      marginBottom={1}
    >
      <Text bold color="magenta">
        Overview
      </Text>
      <Text>
        Storage <Text color={color}>{diskFormat.bytes(summary.totalUsed)}</Text>
        {" / "}
        {diskFormat.bytes(summary.totalSize)}
        <Text dimColor> ({diskFormat.bytes(summary.totalAvailable)} free)</Text>
      </Text>
      <UsageBar use={summary.overallUse} />
      <Box marginTop={1} flexDirection="column">
        <Text>
          Volumes: <Text color="cyan">{summary.volumeCount}</Text>
          {summary.physicalCount > 0 ? (
            <>
              {" · "}Physical: <Text color="cyan">{summary.physicalCount}</Text>
            </>
          ) : null}
          {summary.ssdCount > 0 || summary.hddCount > 0 ? (
            <Text dimColor>
              {" "}
              (SSD {summary.ssdCount} · HDD {summary.hddCount})
            </Text>
          ) : null}
        </Text>
        <Text>
          Health:{" "}
          {summary.criticalVolumes > 0 ? (
            <Text color="red">{summary.criticalVolumes} critical (≥90%)</Text>
          ) : summary.warningVolumes > 0 ? (
            <Text color="yellow">{summary.warningVolumes} warning (≥75%)</Text>
          ) : (
            <Text color="green">ok</Text>
          )}
          <Text dimColor>
            {" "}
            · source {data.source} · {data.platform}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}

function VolumeCard({ volume }: { volume: DiskVolume }) {
  const title = volume.label
    ? `${volume.mount} (${volume.label})`
    : volume.mount || volume.filesystem;
  const access =
    volume.rw === null ? "" : volume.rw ? "read-write" : "read-only";
  const kind = [
    volume.type,
    volume.physical,
    volume.removable ? "removable" : "",
    access,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
    >
      <Text>
        <Text bold color="cyan">
          {title}
        </Text>
      </Text>
      <Text dimColor>{kind}</Text>
      <Text>
        Used {diskFormat.bytes(volume.used)} / {diskFormat.bytes(volume.size)}
        <Text dimColor> ({diskFormat.bytes(volume.available)} free)</Text>
      </Text>
      <UsageBar use={volume.use} />
      {volume.device ? <Meta label="Device" value={volume.device} /> : null}
      {volume.filesystem && volume.filesystem !== volume.mount ? (
        <Meta label="FS" value={volume.filesystem} />
      ) : null}
    </Box>
  );
}

function PhysicalCard({ disk }: { disk: PhysicalDisk }) {
  const smartColor = /ok/i.test(disk.smartStatus)
    ? "green"
    : /unknown/i.test(disk.smartStatus)
      ? undefined
      : "red";

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
    >
      <Text>
        <Text bold color="yellow">
          {disk.name}
        </Text>
        {disk.vendor ? <Text dimColor> · {disk.vendor}</Text> : null}
      </Text>
      <Text>
        {disk.type || "Disk"}
        {disk.interfaceType ? ` · ${disk.interfaceType}` : ""}
        {" · "}
        {diskFormat.bytes(disk.size)}
      </Text>
      <Text>
        SMART: <Text color={smartColor}>{disk.smartStatus || "n/a"}</Text>
        {disk.temperature !== null ? (
          <Text dimColor> · {disk.temperature}°C</Text>
        ) : null}
      </Text>
      {disk.serialNum ? <Meta label="Serial" value={disk.serialNum} /> : null}
      {disk.device ? <Meta label="Path" value={disk.device} /> : null}
    </Box>
  );
}

export default function DiskInfo({ onContinue }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getDiskAnalytics()
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : String(error);
          setState({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useInput((_input, key) => {
    if (!onContinue) {
      return;
    }
    if (key.return || key.escape) {
      onContinue();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ─── Disk Analytics ───
        </Text>
      </Box>

      {state.status === "loading" && (
        <Text color="magenta">Collecting disk analytics…</Text>
      )}

      {state.status === "error" && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="red"
          paddingX={1}
        >
          <Text bold color="red">
            Could not read disk info
          </Text>
          <Text>{state.message}</Text>
        </Box>
      )}

      {state.status === "ready" && (
        <>
          <SummaryPanel data={state.data} />

          <Box marginBottom={1}>
            <Text bold color="cyan">
              Volumes
            </Text>
          </Box>
          {state.data.volumes.length === 0 ? (
            <Text dimColor>No volumes found.</Text>
          ) : (
            state.data.volumes.map((volume) => (
              <VolumeCard
                key={`${volume.mount}-${volume.filesystem}`}
                volume={volume}
              />
            ))
          )}

          {state.data.physical.length > 0 && (
            <>
              <Box marginTop={1} marginBottom={1}>
                <Text bold color="yellow">
                  Physical disks
                </Text>
              </Box>
              {state.data.physical.map((disk) => (
                <PhysicalCard
                  key={`${disk.device}-${disk.serialNum}-${disk.name}`}
                  disk={disk}
                />
              ))}
            </>
          )}
        </>
      )}

      {onContinue && (
        <Box marginTop={1}>
          <Text dimColor>Press Enter or Esc to continue…</Text>
        </Box>
      )}
    </Box>
  );
}
