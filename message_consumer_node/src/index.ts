import { Diesel, type ContextType } from "diesel-core";
import startConsuming from "./service/consumer";
import { db } from "./db/connection";
import { RequestLogs } from "./db/schema";
const app = new Diesel()
const port = process.env.PORT || 3000


app.addHooks('onError',() => {
    console.log("Error Occured")
})


app.get("/",(ctx:ContextType) => {
    return ctx.json({message:"Hello World! from diesel message consumer service"})
})

app.get("/logs",async (ctx) => {
    try {
        const logs = await db.select().from(RequestLogs)
        return ctx.json(logs)
    } catch (error) {
        return ctx.json({ error: "Error fetching logs" }, 500);
    }
})

startConsuming()

app.listen(port as number)