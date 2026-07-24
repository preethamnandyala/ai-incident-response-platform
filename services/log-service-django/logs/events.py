import pika
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(
        settings.RABBITMQ_USER,
        settings.RABBITMQ_PASSWORD
    )
    parameters = pika.ConnectionParameters(
        host=settings.RABBITMQ_HOST,
        port=settings.RABBITMQ_PORT,
        credentials=credentials
    )
    return pika.BlockingConnection(parameters)


def publish_critical_log_detected(
        log_id: str,
        service_name: str,
        message: str,
        organization_id: str
) -> bool:
    try:
        connection = get_rabbitmq_connection()
        channel = connection.channel()

        channel.exchange_declare(
            exchange='incident_platform',
            exchange_type='topic',
            durable=True
        )

        event_data = {
            'event': 'critical.log.detected',
            'logId': log_id,
            'serviceName': service_name,
            'message': message,
            'organizationId': organization_id
        }

        channel.basic_publish(
            exchange='incident_platform',
            routing_key='critical.log.detected',
            body=json.dumps(event_data),
            properties=pika.BasicProperties(
                delivery_mode=2,  # persistent message
                content_type='application/json'
            )
        )

        connection.close()
        logger.info(
            f"Published critical.log.detected for {service_name}")
        return True

    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
        return False