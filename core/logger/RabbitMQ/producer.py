import pika
import json

RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
QUEUE_NAME = 'request_logs'

# this is producer

def publish_message(message):
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME,durable=True)

    # publish message to the quque
    channel.basic_publish(exchange='',
                      routing_key=QUEUE_NAME,
                      body=json.dumps(message),
                      properties=pika.BasicProperties(
                          delivery_mode=2,  # make message persistent
                      )
                    )
    # print('Message sent\n',json.dumps(message,indent=4))
    connection.close()