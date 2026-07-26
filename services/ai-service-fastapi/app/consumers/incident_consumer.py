import pika
import json
import threading
import httpx
from app.config.settings import settings
from app.config.database import SessionLocal
from app.services.ai_service import analyze_incident
from app.repositories.analysis_repository import AnalysisRepository


def get_incident_details(
    incident_id: str,
    organization_id: str
) -> dict | None:
    try:
        import httpx as _httpx
        response = _httpx.get(
            f"{settings.incident_service_url}/api/incidents/{incident_id}",
            headers={'x-organization-id': organization_id},
            timeout=10.0
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Failed to fetch incident: {e}")
        return None


def handle_incident_created(ch, method, properties, body):
    try:
        event = json.loads(body)
        print(f"Received incident.created event: {event}")

        incident_id = event.get('incidentId')
        organization_id = event.get('organizationId', 'org_default')

        incident = get_incident_details(incident_id, organization_id)

        if not incident:
            print(f"Could not fetch incident {incident_id}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        import asyncio
        loop = asyncio.new_event_loop()
        analysis_data = loop.run_until_complete(
            analyze_incident(incident, organization_id)
        )
        loop.close()

        db = SessionLocal()
        try:
            repo = AnalysisRepository(db)
            existing = repo.find_by_incident_id(
                incident_id, organization_id)

            if not existing:
                repo.create(analysis_data)
                print(f"AI analysis stored for incident: {incident_id}")
            else:
                print(f"Analysis already exists for incident: {incident_id}")
        finally:
            db.close()

        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f"Error processing incident.created event: {e}")
        ch.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=False
        )


def start_consumer():
    try:
        credentials = pika.PlainCredentials(
            settings.rabbitmq_user,
            settings.rabbitmq_password
        )
        parameters = pika.ConnectionParameters(
            host=settings.rabbitmq_host,
            port=settings.rabbitmq_port,
            credentials=credentials
        )
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()

        channel.exchange_declare(
            exchange=settings.ai_exchange,
            exchange_type='topic',
            durable=True
        )

        channel.queue_declare(
            queue=settings.incident_created_queue,
            durable=True
        )

        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(
            queue=settings.incident_created_queue,
            on_message_callback=handle_incident_created
        )

        print("AI Service consuming from incident.created.queue...")
        channel.start_consuming()

    except Exception as e:
        print(f"Consumer error: {e}")


def start_consumer_thread():
    thread = threading.Thread(target=start_consumer, daemon=True)
    thread.start()
    return thread