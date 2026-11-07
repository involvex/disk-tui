# disk-tui

A modern CLI / TUI app built with [Ink](https://github.com/vadimdemedes/ink) and [Bun](https://bun.sh) to display disk information in the terminal.

## Features

- Cross-platform disk / mount info (Windows via PowerShell CIM, Linux/macOS/Android Termux via `df`)
- Interactive menu (Disk Info, Help, Settings, About, Version, Exit)
- Formatted, human-readable sizes (B/KB/MB/GB/TB/PB)
- CLI flags: `--help`, `--version`, `--about`

## Requirements

- Node.js >= 16 (or Bun)
- Bun (for development / build)

## Install / Run

Run directly with Bun:

```sh
bun run src/cli.tsx
```

Or build and run the compiled CLI:

```sh
bun run build
node dist/cli.js
```

Install globally (after build/publish):

```sh
npm install -g @involvex/disk-tui
disk-tui
```

## Usage

```sh
disk-tui            # launch interactive TUI (starts on Disk Info)
disk-tui --help     # show help
disk-tui --version  # show version
disk-tui --about    # show about
```

Navigation: `↑/↓` navigate menu, `Enter` select, `Esc` go back.

## Development

```sh
bun run dev        # hot reload
bun run start      # run source
bun run build      # typecheck + lint + format + bundle
bun run lint       # lint src
bun run format     # format
bun run typecheck  # type check
bun test           # tests
```

## Project Structure

```
src/
  cli.tsx            # entry point + meow CLI flags
  app.tsx            # screen router + menu
  commands/          # disk-info, help, about, version, settings, exit
  components/        # menu, select-input
  lib/               # disk-info (platform data gathering)
```

## License

MIT © involvex
