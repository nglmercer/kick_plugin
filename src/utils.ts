import { LEGACY_EVENT_MAPPING, type KickEventType } from 'kick-wss';
import { type PluginContext } from 'bun_plugins';

// Parse a raw Kick WebSocket message
export function parseKickMessage(rawMessage: string): { type: KickEventType; data: unknown } | null {
    try {
        const parsed = JSON.parse(rawMessage);

        if (!parsed.event || parsed.event.startsWith("pusher:")) {
            return null;
        }

        // Map legacy event type to simpler name
        const eventType = (LEGACY_EVENT_MAPPING[parsed.event] || parsed.event) as KickEventType;
        
        // Parse the data field (it's a JSON string)
        let eventData: unknown;
        try {
            eventData = parsed.data ? JSON.parse(parsed.data) : {};
        } catch {
            eventData = parsed.data || {};
        }

        return { type: eventType, data: eventData };
    } catch (error) {
        return null;
    }
}

// Type guard for validating Kick event data structure
export function isKickEventData(data: unknown): data is { type: KickEventType; data: unknown } {
    return typeof data === 'object' && data !== null && 'type' in data && 'data' in data;
}

export function emitEvents(context: PluginContext, data: unknown) {
    if (isKickEventData(data)) {
        context.emit("kick", { eventName: data.type, data: data.data });
    }
}

