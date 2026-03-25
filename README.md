# kick_plugin

A plugin for interacting with Kick.com chat via WebSocket.

## Features

- Connect to Kick.com channels
- Listen to chat events (messages, subscriptions, gifts, etc.)
- Plugin lifecycle management (load, reload, unload)

## Installation

```bash
bun install
```

## Usage

### As a standalone script

```bash
bun run src/index.ts
```

### As a plugin

```typescript
import { KickPlugin } from './src/index';

// The plugin will automatically connect to Kick chat
// and emit events through the plugin context
```

## Configuration

The plugin uses a default username. To change it, update the storage:
- storage\plugins\kick_plugin\storage.json
```typescript
await context.storage.set('username', 'your_kick_username');
// or remplaze content with
{"username": "your_kick_username"}
```

## Dependencies

- `kick-wss` - Kick.com WebSocket client
- `bun_plugins` - Plugin system for Bun

## License

MIT