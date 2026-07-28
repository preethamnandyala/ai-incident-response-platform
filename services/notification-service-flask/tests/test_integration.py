import requests
import pika
import json
import time
import os

BASE_URL = 'http://localhost:3005'
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'guest'
RABBITMQ_PASSWORD = 'guest'


class TestNotificationServiceIntegration:
    """
    Integration tests for Notification Service.
    Requires Docker services running.
    Run with: pytest tests/test_integration.py -v
    """

    def test_health_check(self):
        response = requests.get(f'{BASE_URL}/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'notification-service'

    def test_api_health_check(self):
        response = requests.get(f'{BASE_URL}/api/notify/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'

    def test_rabbitmq_connection(self):
        # Verify RabbitMQ is accessible
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        assert connection.is_open
        connection.close()

    def test_notification_queue_exists(self):
        # Verify notification.incident.queue exists in RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Declare queue passively — fails if queue does not exist
        queue = channel.queue_declare(
            queue='notification.incident.queue',
            passive=True
        )
        assert queue.method.queue == 'notification.incident.queue'
        connection.close()

    def test_notification_queue_has_consumer(self):
        # Verify Notification Service consumer is connected
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        queue = channel.queue_declare(
            queue='notification.incident.queue',
            passive=True
        )
        consumer_count = queue.method.consumer_count
        assert consumer_count >= 1, \
            f"Expected at least 1 consumer but found {consumer_count}"
        connection.close()

    def test_incident_created_queue_exists(self):
        # Verify incident.created.queue exists (AI Service queue)
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        queue = channel.queue_declare(
            queue='incident.created.queue',
            passive=True
        )
        assert queue.method.queue == 'incident.created.queue'
        connection.close()

    def test_exchange_exists(self):
        # Verify incident_platform exchange exists
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        # Declare exchange passively — fails if it does not exist
        channel.exchange_declare(
            exchange='incident_platform',
            exchange_type='topic',
            passive=True
        )
        connection.close()