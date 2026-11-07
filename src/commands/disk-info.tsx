import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import { diskFormat, getDiskInfo, type DiskDrive } from "../lib/disk-info.js";

type Props = {
  onContinue?: () => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; disks: DiskDrive[] }
  | { status: "error"; message: string };

function UsageBar({ capacity }: { capacity: string }) {
  const pct = Number.parseInt(capacity, 10);
  const clamped = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  const width = 20;
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const color = clamped >= 90 ? "red" : clamped >= 75 ? "yellow" : "green";

  return (
    <Text>
      [<Text color={color}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>] {capacity}
    </Text>
  );
}

function DiskRow({ disk }: { disk: DiskDrive }) {
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
          {disk.mounted || disk.filesystem}
        </Text>
        {disk.mounted && disk.filesystem ? (
          <Text dimColor> · {disk.filesystem}</Text>
        ) : null}
      </Text>
      <Text>
        Used {diskFormat.bytes(disk.used)} / {diskFormat.bytes(disk.blocks)}
        <Text dimColor> ({diskFormat.bytes(disk.available)} free)</Text>
      </Text>
      <UsageBar capacity={disk.capacity} />
    </Box>
  );
}

export default function DiskInfo({ onContinue }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getDiskInfo()
      .then((disks) => {
        if (!cancelled) {
          setState({ status: "ready", disks });
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
          ─── Disk Info ───
        </Text>
      </Box>

      {state.status === "loading" && (
        <Text color="magenta">Reading disks…</Text>
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

      {state.status === "ready" && state.disks.length === 0 && (
        <Text dimColor>No disks found on this system.</Text>
      )}

      {state.status === "ready" &&
        state.disks.map((disk) => (
          <DiskRow key={`${disk.mounted}-${disk.filesystem}`} disk={disk} />
        ))}

      {onContinue && (
        <Box marginTop={1}>
          <Text dimColor>Press Enter or Esc to continue…</Text>
        </Box>
      )}
    </Box>
  );
}
