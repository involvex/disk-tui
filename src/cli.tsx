#!/usr/bin/env node
import { render } from "ink";
import meow from "meow";
import App from "./app.js";
import About from "./commands/about.js";
import Help from "./commands/help.js";
import DisplayVersion from "./commands/version.js";

const cli = meow(
  `
	Usage
	  $ disk-tui

	Options
		--version  Show version
		--about    Show about
		--help     Show help

	Examples
	  $ disk-tui --about
`,
  {
    importMeta: import.meta,
    flags: {
      version: {
        type: "boolean",
      },
      about: {
        type: "boolean",
      },
      help: {
        type: "boolean",
      },
    },
  },
);

if (cli.flags.help || cli.input[0] === "help") {
  render(<Help />);
} else if (cli.flags.version || cli.input[0] === "version") {
  render(<DisplayVersion />);
} else if (cli.flags.about || cli.input[0] === "about") {
  render(<About />);
} else {
  render(<App />);
}
