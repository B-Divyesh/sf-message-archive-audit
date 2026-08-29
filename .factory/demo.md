# Archive Audit demo

- URL: `https://message-archive-audit.sociobot.in/?demo=1` (local: `http://127.0.0.1:4173/?demo=1`). `/demo` also opens the same sandbox.
- Entry: choose “Try it with sample data” on the first screen. The completed audit is positioned in the first visible screen.
- Sample: two EML message files and one two-message MBOX email collection. They include a ticket, a meter reading, and two messages without attachments.
- Isolation: demo state, including its color setting, uses memory only. It never reads or writes the real preference storage or the real `archive-audit` IndexedDB database.
- Reset: “Reset demo” recreates the bundled sample in memory.
- Leave: “Start for real” returns home. Reloading or leaving discards the demo audit summary.
- Offline: visit once online, then `/demo` and its completed sample reload through the service worker without a network.
