import amqb from 'amqplib/callback_api'
import { db } from '../db/connection';
import { RequestLogs } from '../db/schema';

const amqbHost = process.env.AMQBHOST || 'amqp://localhost'
const QUEUE_NAME =  process.env.QUEUE_NAME ||'request_logs'

let logsBuffer: Array<any> = [];
const BULK_INSERT_THRESHOLD = 10;
let isInserting = false;

export default function startConsuming(){
    amqb.connect(amqbHost, (err , connection) => {
        if(err)throw err

        connection.createChannel((err, channel) => {
            if(err)throw err

            channel.assertQueue(QUEUE_NAME, {
                durable: true
            })

            console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", QUEUE_NAME);

            channel.consume(QUEUE_NAME, async (msg) => {
                if(!msg) return;

                const logData = JSON.parse(msg?.content.toString())

                logsBuffer.push({
                    method: logData.method,
                    path: logData.path,
                    headers: JSON.stringify(logData.headers),
                    body: logData.body,
                    response_status: logData.response_status,
                    response_body: logData.response_body,
                    timestamp: logData.timestamp,
                })

                if(logsBuffer.length == BULK_INSERT_THRESHOLD && !isInserting){
                    isInserting = true;
                    await save_logs_bulk();
                    isInserting = false;
                }
                    channel.ack(msg)
              }, {
                  noAck: false
              });
        })

    })
}


async function save_logs_bulk() {
    if(logsBuffer.length == 0) return;
    const logsToInsert = logsBuffer.slice(0,BULK_INSERT_THRESHOLD)
    try {
        await db.insert(RequestLogs).values(logsToInsert)
        console.log(`✅ Inserted ${logsBuffer.length} logs into DB`);
        logsBuffer = logsBuffer.slice(BULK_INSERT_THRESHOLD)
    } catch (error) {
        console.error("❌ Error inserting logs:", error);
    } 
}