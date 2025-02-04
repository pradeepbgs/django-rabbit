import pika
import json

import pika.exceptions
from ..models import RequestLog
from django.db import transaction
import threading
import sys
import signal
import time

RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'request_logs'

logs = []
logs_lock = threading.Lock()
connection = None
channel = None

def save_logs_bulk():
    global logs
    with logs_lock:
        if logs:
            bulk_logs = [
                RequestLog(
                    method=log["method"],
                    path=log["path"],
                    headers=json.dumps(log["headers"]),
                    body=log["body"],
                    response_status=log["response_status"],
                    response_body=log["response_body"],
                    timestamp=log["timestamp"]
                ) for log in logs
            ]

            with transaction.atomic():
                RequestLog.objects.bulk_create(bulk_logs)

            print(f"✅ Inserted {len(logs)} logs into DB")
            logs.clear()


def consume_message():
    while True:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            channel = connection.channel()
            channel.queue_declare(queue=QUEUE_NAME, durable=True)
            print("is consumer working")
            logs=[]

            def callback(ch, method, properties, body):
                log_data = json.loads(body)
                with logs_lock:
                    logs.append(log_data)

                if len(logs) >= 10:
                    save_logs_bulk()
                    logs.clear()
                    print("✅ Bulk inserted 10 logs into DB")
        
                ch.basic_ack(delivery_tag=method.delivery_tag)

            channel.basic_consume(queue=QUEUE_NAME,on_message_callback=callback)
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError as e:
            print(f"Error connecting to RabbitMQ: {e}")
            time.sleep(5)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            break



def graceful_shutdown(signal_received, frame):
    print("\n🚦 Shutdown signal received. Saving remaining logs...")
    save_logs_bulk()
    if connection:
        connection.close()
    sys.exit(0)

signal.signal(signal.SIGINT, graceful_shutdown)
signal.signal(signal.SIGTERM, graceful_shutdown)

def start_consumer_thread():
    consumer_thread = threading.Thread(target=consume_message)
    consumer_thread.daemon=True
    consumer_thread.start()

