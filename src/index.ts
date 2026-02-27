import KickWebSocket, { type EventHandler } from 'kick-wss';
import { definePlugin, type PluginContext } from 'bun_plugins';

const username = process.env.KICK_USERNAME || 'melserngi';

let kickWS: KickWebSocket;

// Legacy event type mapping - maps backend event names to simpler names
const LEGACY_EVENT_MAP: Record<string, string> = {
    "App\\Events\\ChatMessageEvent": "ChatMessage",
    "App\\Events\\MessageDeletedEvent": "MessageDeleted",
    "App\\Events\\UserBannedEvent": "UserBanned",
    "App\\Events\\UserUnbannedEvent": "UserUnbanned",
    "App\\Events\\SubscriptionEvent": "Subscription",
    "App\\Events\\GiftedSubscriptionsEvent": "GiftedSubscriptions",
    "App\\Events\\PinnedMessageCreatedEvent": "PinnedMessageCreated",
    "App\\Events\\StreamHostEvent": "StreamHost",
    "App\\Events\\PollUpdateEvent": "PollUpdate",
    "App\\Events\\PollDeleteEvent": "PollDelete",
    "App\\Events\\RewardRedeemedEvent": "RewardRedeemed",
    "App\\Events\\KicksGiftedEvent": "KicksGifted",
};

// Parse a raw Kick WebSocket message
function parseKickMessage(rawMessage: string): { type: string; data: unknown } | null {
    try {
        const parsed = JSON.parse(rawMessage);
        
        if (!parsed.event || parsed.event.startsWith("pusher:")) {
            return null;
        }

        // Map legacy event type to simpler name
        const eventType = LEGACY_EVENT_MAP[parsed.event] || parsed.event;
        
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

export default definePlugin({
    name: 'kick_plugin',
    version: '1.0.0',
    onLoad(context) {
        // Create instance if not exists or not connected
        if (!kickWS || !kickWS.isConnected()) {
            kickWS = new KickWebSocket({ debug: true });
            setupEvents(kickWS, (data) => {
                console.log("data", data);
                emitEvents(context, data);
            });
        }
    },
    onUnload() {
        if (kickWS) {
            kickWS.disconnect();
        }
    },
});

function setupEvents(kickWS: KickWebSocket, callback: EventHandler<unknown>) {
    try {
        // Connect to a channel
        kickWS.connect(username);

        // Listen to raw messages for better parsing
        kickWS.on('rawMessage', (message: unknown) => {
            if (typeof message === 'string') {
                const parsed = parseKickMessage(message);
                if (parsed) {
                    console.log(`📨 Parsed event: ${parsed.type}`);
                    callback(parsed);
                }
            }
        });

        // Listen to connection events
        kickWS.on('ready', () => {
            console.log('✅ Successfully connected');
        });

        kickWS.on('disconnect', ({ reason }: { reason?: string }) => {
            console.log('❌ Disconnected:', reason);
        });

        kickWS.on('error', (error: Error) => {
            console.error('⚠️ Error:', error);
        });
    }
    catch (error) {
        console.error('⚠️ Error:', error);
    }
}

// Type guard for validating Kick event data structure
function isKickEventData(data: unknown): data is { type: string; data: unknown } {
    return typeof data === 'object' && data !== null && 'type' in data && 'data' in data;
}

function emitEvents(context: PluginContext, data: unknown) {
    if (isKickEventData(data)) {
        context.emit("kick", { eventName: data.type, data: data.data });
    }
}

if (import.meta.main) {
    const kickWS = new KickWebSocket({ debug: true });
    setupEvents(kickWS, (data) => {
        console.log("📨 Event:", data);
    });
}
