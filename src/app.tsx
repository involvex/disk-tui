import { Box, Text, useInput } from "ink";
import { useState } from "react";
import pkg from "../package.json";
import SelectInput, { type SelectItem } from "./components/select-input.js";

import About from "./commands/about.js";
import DiskInfo from "./commands/disk-info.js";
import Exit from "./commands/exit.js";
import Help from "./commands/help.js";
import Settings from "./commands/settings.js";
import Version from "./commands/version.js";

type AppScreen =
  "disk-info" | "menu" | "help" | "about" | "version" | "settings" | "exit";

interface BackableScreenProps {
  children: React.ReactNode;
  onBack: () => void;
}

function BackableScreen({ children, onBack }: BackableScreenProps) {
  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Box paddingX={2} paddingY={1}>
        <Text dimColor>← Esc to return to menu</Text>
      </Box>
      {children}
    </Box>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("disk-info");

  const goMenu = () => setScreen("menu");

  const menuItems: SelectItem<AppScreen>[] = [
    { label: "→ Disk Info", value: "disk-info" },
    { label: "→ Help", value: "help" },
    { label: "→ Settings", value: "settings" },
    { label: "→ About", value: "about" },
    { label: "→ Version", value: "version" },
    { label: "→ Exit", value: "exit" },
  ];

  if (screen === "disk-info") {
    return (
      <BackableScreen onBack={goMenu}>
        <DiskInfo onContinue={goMenu} />
      </BackableScreen>
    );
  }

  if (screen === "menu") {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        padding={1}
      >
        <Box marginBottom={1}>
          <Text bold color="cyan">
            ╔══════════════════════════════════╗
          </Text>
        </Box>
        <Box marginX={2}>
          <Text bold color="white" dimColor>
            {" "}
            {pkg.name}
          </Text>
        </Box>
        <Box marginX={2} marginBottom={1}>
          <Text dimColor> {pkg.description}</Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            ╠══════════════════════════════════╣
          </Text>
        </Box>
        <Box marginX={2}>
          <Text bold color="magenta">
            {" "}
            Select an option:
          </Text>
        </Box>
        <SelectInput
          items={menuItems}
          onSelect={(item: SelectItem<AppScreen>) => {
            setScreen(item.value);
          }}
        />
        <Box marginTop={1}>
          <Text bold color="cyan">
            ╚══════════════════════════════════╝
          </Text>
        </Box>
        <Box marginTop={1} paddingX={2}>
          <Text dimColor>↑↓ Navigate • Enter Select • Esc Back</Text>
        </Box>
      </Box>
    );
  }

  if (screen === "help") {
    return (
      <BackableScreen onBack={goMenu}>
        <Help />
      </BackableScreen>
    );
  }

  if (screen === "about") {
    return (
      <BackableScreen onBack={goMenu}>
        <About />
      </BackableScreen>
    );
  }

  if (screen === "version") {
    return (
      <BackableScreen onBack={goMenu}>
        <Version />
      </BackableScreen>
    );
  }

  if (screen === "settings") {
    return (
      <BackableScreen onBack={goMenu}>
        <Settings />
      </BackableScreen>
    );
  }

  if (screen === "exit") {
    return <Exit />;
  }

  return null;
}
