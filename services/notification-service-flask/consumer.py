import pika
import json
import threading
import time
from dotenv import load_dotenv
import os
from notifier import notify

load_dotenv()

NOTIFICATION_QUEUE = 'notification.incident.queue'
EXCHANGE = 'incident_platform'
ROUTING_KEY = 'incident.created'


def handle_incident_created(ch, method, properties, body):
    try:
        event = json.loads(body)
        print(f"Received incident.created event: {event}")

        incident_id = event.get('incidentId')
        title = event.get('title', 'Unknown incident')
        severity = event.get('severity', 'UNKNOWN')
        service_name = event.get('serviceName', 'unknown')
        organization_id = event.get('organizationId', 'org_default')

        incident = {
            'incidentId': incident_id,
            'title': title,
            'severity': severity,
            'serviceName': service_name,
            'organizationId': organization_id
        }

        results = notify(incident)
        print(f"Notification results: {results}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"Error processing event: {e}")
        ch.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=False
        )


def start_consumer():
    retry_delay = 5
    max_retries = 10
    retries = 0

    while retries < max_retries:
        try:
            credentials = pika.PlainCredentials(
                os.getenv('RABBITMQ_USER', 'guest'),
                os.getenv('RABBITMQ_PASSWORD', 'guest')
            )
            parameters = pika.ConnectionParameters(
                host=os.getenv('RABBITMQ_HOST', 'localhost'),
                port=int(os.getenv('RABBITMQ_PORT', '5672')),
                credentials=credentials,
                connection_attempts=3,
                retry_delay=2
            )
            connection = pika.BlockingConnection(parameters)
            channel = connection.channel()

            channel.exchange_declare(
                exchange=EXCHANGE,
                exchange_type='topic',
                durable=True
            )

            channel.queue_declare(
                queue=NOTIFICATION_QUEUE,
                durable=True
            )

            channel.queue_bind(
                exchange=EXCHANGE,
                queue=NOTIFICATION_QUEUE,
                routing_key=ROUTING_KEY
            )

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=NOTIFICATION_QUEUE,
                on_message_callback=handle_incident_created
            )

            print(f"Notification Service consuming from {NOTIFICATION_QUEUE}...")
            retries = 0
            channel.start_consuming()

        except Exception as e:
            retries += 1
            print(f"Consumer error (attempt {retries}/{max_retries}): {e}")
            if retries < max_retries:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print("Max retries reached. Consumer stopped.")


def start_consumer_thread():
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
    return thread