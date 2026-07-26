from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    # App
    debug: bool = os.getenv('DEBUG', 'False') == 'True'
    secret_key: str = os.getenv('SECRET_KEY', '')
    port: int = int(os.getenv('PORT', '3004'))

    # Database
    database_url: str = os.getenv(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/incident_platform'
    )

    # RabbitMQ
    rabbitmq_host: str = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_port: int = int(os.getenv('RABBITMQ_PORT', '5672'))
    rabbitmq_user: str = os.getenv('RABBITMQ_USER', 'guest')
    rabbitmq_password: str = os.getenv('RABBITMQ_PASSWORD', 'guest')

    # Anthropic
    anthropic_api_key: str = os.getenv('ANTHROPIC_API_KEY', '')

    # Services
    log_service_url: str = os.getenv(
        'LOG_SERVICE_URL', 'http://localhost:3003')
    incident_service_url: str = os.getenv(
        'INCIDENT_SERVICE_URL', 'http://localhost:3002')

    # RabbitMQ queues
    incident_created_queue: str = 'incident.created.queue'
    ai_exchange: str = 'incident_platform'
    ai_analysis_routing_key: str = 'ai.analysis.complete'


settings = Settings()