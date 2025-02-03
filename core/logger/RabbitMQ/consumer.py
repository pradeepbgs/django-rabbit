import pika
import json
from ..models import RequestLog
from django.db import transaction
import threading

RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'request_logs'

def save_logs_bulks(logs):

    bulk_logs = [
        RequestLog(
            method=log["method"],
            path=log["path"],
            headers=json.dumps(log["headers"]),
            body=log["body"],
            response_status=log["response_status"],
            response_body=log["response_body"],
            timestamp=log["timestamp"]
        )
        for log in logs
    ]

    with transaction.atomic():
        RequestLog.objects.bulk_create(bulk_logs)
    

def consume_message():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    print("is consumer working")
    logs=[]

    def callback(ch, method, properties, body):
        log_data = json.loads(body)
        logs.append(log_data)

        if len(logs) >= 10:
            save_logs_bulks(logs)
            logs.clear()
            print("✅ Bulk inserted 10 logs into DB")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_consume(queue=QUEUE_NAME,on_message_callback=callback)

    print("📡 [*] Waiting for messages. To exit, press CTRL+C")
    channel.start_consuming()

def start_consumer_thread():
    consumer_thread = threading.Thread(target=consume_message)
    consumer_thread.daemon=True
    consumer_thread.start()