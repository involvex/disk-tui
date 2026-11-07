import { Box, Text } from "ink";
import pkg from "../../package.json" with { type: "json" };

export default function Version() {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ─── Version ───
        </Text>
      </Box>

      <Box flexDirection="column" alignItems="center" marginY={2}>
        <Box marginBottom={1}>
          <Text bold color="green">
            {pkg.name}
          </Text>
        </Box>
        <Box>
          <Text bold color="white">
            v{pkg.version}
          </Text>
        </Box>
      </Box>

      <Box borderStyle="single" padding={1}>
        <Text dimColor>Node: &gt;=16 | TypeScript | ESM | Bun Ready</Text>
      </Box>
    </Box>
  );
}
