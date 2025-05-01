import { Diesel, type ContextType } from "diesel-core";
import startConsuming from "./service/consumer";
import { db } from "./db/connection";
import { RequestLogs } from "./db/schema";
import { save_log_middleware } from "./logger/logger";
export const app = new Diesel()
const port = process.env.PORT || 3000


// let arr = [1,2,3,4,5,6,7,8,9,10]
// console.log('before ',arr)
// console.log('after slice',arr.slice(0,3))
// console.log('remove',arr.slice(3))
// arr = arr.slice(3)
// console.log(arr)

save_log_middleware()

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

app.get("/clear",async (ctx) => {
   await db.delete(RequestLogs)
    return ctx.json({message:"Logs cleared"})
})

await startConsuming()

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
