import type { ContextType } from "diesel-core";
import { app } from "..";
import { publishLogsToQueue } from "../service/producer";


export const save_log_middleware = () => {
    try {
        app.addHooks("onRequest", (req: Request, url: URL) => {
            const sanitizedHeaders: Record<string, string> = {};

            for (const [key, value] of req.headers) {
                const lowerKey = key.toLowerCase();
                if (lowerKey !== 'authorization' && lowerKey !== 'cookie') {
                    sanitizedHeaders[key] = value;
                }
            }

            const log_data = {
                method: req.method,
                path: url.pathname,
                headers: sanitizedHeaders,
                timestamp: new Date().toISOString(),
            }
            req.log_data = log_data
        })

        app.addHooks('onSend', (ctx: ContextType) => {
            let log_data = ctx.req.log_data
            log_data = {
                ...log_data,
                status: ctx.status,
            }
            publishLogsToQueue(log_data)
        })
    } catch (error) {
        throw error
    }
}