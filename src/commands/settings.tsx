import { Box, Text } from "ink";
import { useState } from "react";
import SelectInput, { type SelectItem } from "../components/select-input.js";

type Theme = "cyan" | "magenta" | "green" | "yellow" | "blue";

const themes: { label: string; value: Theme }[] = [
  { label: "Cyan", value: "cyan" },
  { label: "Magenta", value: "magenta" },
  { label: "Green", value: "green" },
  { label: "Yellow", value: "yellow" },
  { label: "Blue", value: "blue" },
];

export default function Settings() {
  const [theme, setTheme] = useState<Theme>("cyan");
  const [animations] = useState(true);

  const themeItems: SelectItem<Theme>[] = themes.map((t) => ({
    ...t,
    value: t.value,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ─── Settings ───
        </Text>
      </Box>
      <Box flexDirection="column" paddingLeft={2}>
        <Box marginBottom={1}>
          <Text color="white">Theme:</Text>
        </Box>
        <Box marginLeft={2} marginBottom={1}>
          <SelectInput
            items={themeItems}
            onSelect={(item: SelectItem<Theme>) => setTheme(item.value)}
            initialIndex={themes.findIndex((t) => t.value === theme)}
          />
        </Box>
        <Box marginBottom={1}>
          <Text color="white">
            Animations:{" "}
            <Text color={animations ? "green" : "red"}>
              {animations ? "✓ Enabled" : "✗ Disabled"}
            </Text>
          </Text>
        </Box>
        <Box marginLeft={2}>
          <Text dimColor>Toggle with Space</Text>
        </Box>
      </Box>
      <Box marginTop={2} borderStyle="single" padding={1}>
        <Text dimColor>
          Current: {theme} theme, animations {animations ? "on" : "off"}
        </Text>
      </Box>
    </Box>
  );
}
