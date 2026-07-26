import pika
import json
import threading
from dotenv import load_dotenv
import os
from notifier import notify

load_dotenv()


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
    try:
        credentials = pika.PlainCredentials(
            os.getenv('RABBITMQ_USER', 'guest'),
            os.getenv('RABBITMQ_PASSWORD', 'guest')
        )
        parameters = pika.ConnectionParameters(
            host=os.getenv('RABBITMQ_HOST', 'localhost'),
            port=int(os.getenv('RABBITMQ_PORT', '5672')),
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.exchange_declare(
            exchange='incident_platform',
            exchange_type='topic',
            durable=True
        )

        channel.queue_declare(
            queue='incident.created.queue',
            durable=True
        )

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(
            queue='incident.created.queue',
            on_message_callback=handle_incident_created
        )

        print("Notification Service consuming from incident.created.queue...")
        channel.start_consuming()

    except Exception as e:
        print(f"Consumer error: {e}")


def start_consumer_thread():
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
    return thread