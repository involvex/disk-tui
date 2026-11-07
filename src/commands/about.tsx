import { Box, Text } from "ink";
import pkg from "../../package.json" with { type: "json" };

export default function About() {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ─── About ───
        </Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor="magenta"
        padding={1}
        marginBottom={2}
      >
        <Box flexDirection="column" alignItems="center">
          <Text bold color="white">
            {pkg.name}
          </Text>
          <Text dimColor>{pkg.description}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginLeft={2} marginBottom={2}>
        <Text bold color="magenta">
          Project Details:
        </Text>
        <Box flexDirection="column" marginLeft={2}>
          <Text>
            <Text color="cyan">Name:</Text>
            <Text color="white"> {pkg.name}</Text>
          </Text>
          <Text>
            <Text color="cyan">Version:</Text>
            <Text color="white"> {pkg.version}</Text>
          </Text>
          <Text>
            <Text color="cyan">Author:</Text>
            <Text color="white"> {pkg.author}</Text>
          </Text>
          <Text>
            <Text color="cyan">License:</Text>
            <Text color="white"> {pkg.license}</Text>
          </Text>
          {pkg.repository?.url && (
            <Text>
              <Text color="cyan">Repository:</Text>
              <Text color="white"> {pkg.repository.url}</Text>
            </Text>
          )}
        </Box>
      </Box>

      <Box borderStyle="single" padding={1}>
        <Text dimColor>Built with Ink + Bun + TypeScript</Text>
      </Box>
    </Box>
  );
}
