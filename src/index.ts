import KickWebSocket, { type EventHandler, KICK_EVENTS } from 'kick-wss';
import { type PluginContext } from 'bun_plugins';
import { parseKickMessage, emitEvents } from './utils';
import type { IPlugin, PluginBuilder, PluginPermission } from  'bun_plugins';
import { z } from "zod";
/**
 * Abstract base class for Plugins to extend.
 * Provides default implementations for optional methods.
 */
export declare abstract class Plugin implements IPlugin {
    abstract name: string;
    abstract version: string;
    description?: string;
    author?: string;
    dependencies?: Record<string, string>;
    permissions?: PluginPermission[];
    allowedDomains?: string[];
    configSchema?: z.ZodSchema;
    defaultConfig?: Record<string, any>;
    onLoad(context: PluginContext): Promise<void> | void;
    onUnload(): Promise<void> | void;
    onStarted(): Promise<void> | void;
    onReload(context: PluginContext): Promise<void> | void;
    setup(build: PluginBuilder): void | Promise<void>;
}
/**
 * Helper function to define a plugin object with type inference.
 * Useful for functional-style plugin definitions.
 */
export declare function definePlugin(plugin: IPlugin): IPlugin;
//# sourceMappingURL=Plugin.d.ts.map

let kickWS: KickWebSocket | null = null;
const defaultName = 'melserngi';
export default definePlugin({
    name: 'kick_plugin',
    version: '1.0.0',
    async onLoad(context) {
        const username = await context.storage.get('username', defaultName);
        // Create instance if not exists or not connected
        if (!kickWS) {
            kickWS = new KickWebSocket({ debug: true });
            setupEvents(username || defaultName, (data) => {
                //console.log("data", data);
                emitEvents(context, data);
            });
        }
    },
    async onReload(context) {
        const username = await context.storage.get('username', defaultName);
        if (kickWS) {
            kickWS.disconnect();
            kickWS = new KickWebSocket({ debug: true });
            setupEvents(username || defaultName, (data) => {
                //console.log("data", data);
                emitEvents(context, data);
            });
        }
    },
    onUnload() {
        if (kickWS) {
            kickWS.disconnect();
            kickWS = null;
        }
    },
});

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
