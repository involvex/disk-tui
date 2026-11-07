import { Box, Text } from "ink";
import SelectInput from "./select-input.js";

export interface MenuItem {
  label: string;
  value: string;
}

interface MenuProps {
  title: string;
  items: MenuItem[];
  onSelect: (value: string) => void;
}

export default function Menu({ title, items, onSelect }: MenuProps) {
  return (
    <Box flexDirection="column" paddingX={2}>
      <Text bold color="cyan">
        {title}
      </Text>
      <Box>
        <SelectInput
          items={items}
          onSelect={(item) => onSelect(item.value)}
          initialIndex={0}
        />
      </Box>
    </Box>
  );
}
