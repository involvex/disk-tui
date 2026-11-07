import { Box, Text } from "ink";
import pkg from "../../package.json";

export default function Help() {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ─── Help ───
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="magenta">
          Usage:
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            {" "}
            $ <Text color="white">{pkg.name}</Text>
          </Text>
          <Text>
            {" "}
            $ <Text color="white">{pkg.name} --help</Text>
          </Text>
          <Text>
            {" "}
            $ <Text color="white">{pkg.name} --version</Text>
          </Text>
          <Text>
            {" "}
            $ <Text color="white">{pkg.name} --about</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="magenta">
          Options:
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            <Text color="green">--help</Text>
            <Text dimColor> Show this help message</Text>
          </Text>
          <Text>
            <Text color="green">--version</Text>
            <Text dimColor> Show version</Text>
          </Text>
          <Text>
            <Text color="green">--about</Text>
            <Text dimColor> Show about info</Text>
          </Text>
          <Text>
            <Text color="green">--settings</Text>
            <Text dimColor> Open settings</Text>
          </Text>
          <Text>
            <Text color="green">--demo</Text>
            <Text dimColor> Show component demo</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold color="magenta">
          Navigation:
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            <Text color="green">↑/↓</Text>
            <Text dimColor> Navigate menu</Text>
          </Text>
          <Text>
            <Text color="green">Enter</Text>
            <Text dimColor> Select option</Text>
          </Text>
          <Text>
            <Text color="green">Esc</Text>
            <Text dimColor> Go back</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold color="magenta">
          Commands:
        </Text>
        <Box marginLeft={2} flexDirection="column">
          <Text>
            {" "}
            <Text color="cyan">help</Text> - Show this help
          </Text>
          <Text>
            {" "}
            <Text color="cyan">about</Text> - Show about info
          </Text>
          <Text>
            {" "}
            <Text color="cyan">version</Text> - Show version
          </Text>
          <Text>
            {" "}
            <Text color="cyan">settings</Text> - Open settings
          </Text>
          <Text>
            {" "}
            <Text color="cyan">demo</Text> - Show demo
          </Text>
          <Text>
            {" "}
            <Text color="cyan">exit</Text> - Exit application
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
