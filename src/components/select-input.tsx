/**
 * Custom SelectInput that avoids ink-select-input's handler re-registration
 * bug. The useInput handler has stable identity (empty deps), so ink never
 * tears down / re-adds the listener when selectedIndex changes. Current state
 * is accessed through refs that are updated synchronously on every render.
 */

import type { Key } from "ink";
import { Box, Text, useInput } from "ink";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SelectItem<T = string> {
  label: string;
  value: T;
}

interface Props<T = string> {
  items: Array<SelectItem<T>>;
  onSelect: (item: SelectItem<T>) => void;
  initialIndex?: number;
  isFocused?: boolean;
  limit?: number;
}

export default function SelectInput<T = string>({
  items,
  onSelect,
  initialIndex = 0,
  isFocused = true,
  limit,
}: Props<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Refs updated synchronously each render — always current inside the stable handler
  const indexRef = useRef(selectedIndex);
  const itemsRef = useRef(items);
  const onSelectRef = useRef(onSelect);

  indexRef.current = selectedIndex;
  itemsRef.current = items;
  onSelectRef.current = onSelect;

  // Reset selection when the items list changes
  useEffect(() => {
    setSelectedIndex(0);
    indexRef.current = 0;
  }, [items]);

  // Stable handler — empty deps means ink registers this ONCE and never
  // tears it down while the component is mounted.
  const handleInput = useCallback((_input: string, key: Key) => {
    const current = indexRef.current;
    const list = itemsRef.current;

    if (key.upArrow) {
      const next = current > 0 ? current - 1 : list.length - 1;
      indexRef.current = next;
      setSelectedIndex(next);
    } else if (key.downArrow) {
      const next = current < list.length - 1 ? current + 1 : 0;
      indexRef.current = next;
      setSelectedIndex(next);
    } else if (key.return) {
      const item = list[indexRef.current];
      if (item) onSelectRef.current(item);
    }
  }, []); // intentionally empty — accesses all live values via refs

  useInput(handleInput, { isActive: isFocused });

  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <Box flexDirection="column">
      {displayItems.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={String(item.value)}>
            <Text color={isSelected ? "blue" : undefined}>
              {isSelected ? "❯ " : "  "}
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
