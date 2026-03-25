import KickWebSocket, { type EventHandler, LEGACY_EVENT_MAPPING, KICK_EVENTS, type KickEventType } from 'kick-wss';
import { definePlugin, type PluginContext } from 'bun_plugins';
import { parseKickMessage, emitEvents } from './utils';


let kickWS: KickWebSocket | null = null;
const defaultName = 'melserngi';
export class KickPlugin {
    name: string = 'kick_plugin';
    version: string = '1.0.0';
    description: string = 'A plugin for interacting with Kick.com';
    async onLoad(context: PluginContext) {
        const username = await context.storage.get('username', defaultName);
        if (username === defaultName) {
            await context.storage.set('username', defaultName);
        }
        // Create instance if not exists or not connected
        if (!kickWS) {
            kickWS = new KickWebSocket({ debug: true });
            setupEvents(username || defaultName, (data) => {
                //console.log("data", data);
                emitEvents(context, data);
            });
        }
    }
    async onReload(context: PluginContext) {
        const username = await context.storage.get('username', defaultName);
        if (kickWS) {
            kickWS.disconnect();
            kickWS = new KickWebSocket({ debug: true });
            setupEvents(username || defaultName, (data) => {
                //console.log("data", data);
                emitEvents(context, data);
            });
        }
    }
    onUnload() {
        if (kickWS) {
            kickWS.disconnect();
            kickWS = null;
        }
    }
}

function setupEvents(username: string, callback: EventHandler<unknown>) {
    try {
        if (!kickWS?.isConnected()) {
            kickWS?.connect(username);
        }
        // Connect to a channel
        
        // Listen to all known events
        KICK_EVENTS.forEach((event) => {
            kickWS?.on(event, (data: unknown) => {
                const ignoredEvents = ['rawMessage', 'rawEvent', 'ready', 'disconnect', 'error'];
                //handle events if not exist on KICK_EVENTS but exist on LEGACY_EVENT_MAPPING
                if (event === 'rawMessage'){
                    const parsedData = parseKickMessage(String(data));
                    if (parsedData && !KICK_EVENTS.includes(parsedData.type)) {
                        callback(parsedData);
                    }
                };
                if (ignoredEvents.includes(event)){return};
                callback({ type: event, data });
            });
        });
        // Listen to connection events
        kickWS?.on('ready', () => {
            console.log('[KICK:READY]');
        });

        kickWS?.on('disconnect', ({ reason }: { reason?: string }) => {
            console.log('[KICK:DISCONNECT]', reason);
        });

        kickWS?.on('error', (error: Error) => {
            console.error('[KICK:ERROR]', error);
        });
    }
    catch (error) {
        console.error('[KICK:ERROR]', error);
    }
}

if (import.meta.main) {
    if (!kickWS) {
        kickWS = new KickWebSocket({ debug: true });
        setupEvents(defaultName, (data) => {
            console.log("data", data);
        });
    }
}
