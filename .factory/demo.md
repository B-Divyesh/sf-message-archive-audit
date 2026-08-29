# Archive Audit demo

- URL: `https://message-archive-audit.sociobot.in/demo` (local: `http://127.0.0.1:4173/demo`).
- Entry: choose “Try it with sample data” on the first screen. The demo route also opens directly.
- Sample: two EML files and one two-message MBOX. They include a base64 ticket, a 7-bit meter reading, and two messages without attachments.
- Isolation: demo state uses memory only. It never opens or writes the real `archive-audit` IndexedDB database.
- Reset: “Reset demo” recreates the bundled sample in memory.
- Leave: “Start for real” returns home. Reloading or leaving discards the demo report.
- Offline: visit once online, then `/demo` and its completed sample reload through the service worker without a network.
