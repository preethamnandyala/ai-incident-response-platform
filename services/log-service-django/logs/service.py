import logging
from datetime import datetime, timezone
from .repository import LogRepository

logger = logging.getLogger(__name__)


class LogService:

    def __init__(self):
        self.repository = LogRepository()

    def create_log(
        self,
        level: str,
        message: str,
        service_name: str,
        organization_id: str,
        user_id: str,
        metadata: dict = None,
        trace_id: str = '',
        request_id: str = ''
    ) -> dict:
        now = datetime.now(timezone.utc)

        log_document = {
            'level': level,
            'message': message,
            'service_name': service_name,
            'metadata': metadata or {},
            'trace_id': trace_id,
            'request_id': request_id,
            'organization_id': organization_id,
            'created_by': user_id,
            'timestamp': now,
            'created_at': now,
        }

        log_id = self.repository.insert_log(log_document)
        log_document['id'] = log_id
        log_document.pop('_id', None)  # remove ObjectId — not JSON serializable
        log_document['timestamp'] = now.isoformat()
        log_document['created_at'] = now.isoformat()

        if level == 'CRITICAL':
            self._handle_critical_log(
                service_name, message, organization_id, log_id
            )

        return log_document

    def create_bulk_logs(
        self,
        logs: list,
        organization_id: str,
        user_id: str
    ) -> dict:
        now = datetime.now(timezone.utc)
        documents = []
        for log in logs:
            documents.append({
                'level': log['level'],
                'message': log['message'],
                'service_name': log['service_name'],
                'metadata': log.get('metadata', {}),
                'trace_id': log.get('trace_id', ''),
                'request_id': log.get('request_id', ''),
                'organization_id': organization_id,
                'created_by': user_id,
                'timestamp': now,
                'created_at': now,
            })

        ids = self.repository.insert_many_logs(documents)
        return {'inserted': len(ids), 'ids': ids}

    def get_logs(
        self,
        organization_id: str,
        level: str = None,
        service_name: str = None,
        from_date=None,
        to_date=None,
        page: int = 1,
        limit: int = 50
    ) -> dict:
        result = self.repository.find_logs(
            organization_id=organization_id,
            level=level,
            service_name=service_name,
            from_date=from_date,
            to_date=to_date,
            page=page,
            limit=limit
        )

        serialized_logs = [
            self._serialize_log(log) for log in result['logs']
        ]

        total = result['total']
        pages = (total + limit - 1) // limit

        return {
            'logs': serialized_logs,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': pages
        }

    def get_log_by_id(
        self,
        log_id: str,
        organization_id: str
    ) -> dict | None:
        log = self.repository.find_by_id(log_id, organization_id)
        if not log:
            return None
        return self._serialize_log(log)

    def get_services(self, organization_id: str) -> list:
        return self.repository.get_distinct_services(organization_id)

    def _handle_critical_log(
        self,
        service_name: str,
        message: str,
        organization_id: str,
        log_id: str = ''
    ) -> None:
        logger.critical(
            f"CRITICAL log detected — {service_name}: {message}"
        )

        from .events import publish_critical_log_detected
        success = publish_critical_log_detected(
            log_id=log_id,
            service_name=service_name,
            message=message,
            organization_id=organization_id
        )

        if success:
            logger.info("Published critical.log.detected to RabbitMQ")
        else:
            logger.error(
                "Failed to publish to RabbitMQ — "
                "incident will not be auto-created"
            )

    def _serialize_log(self, log: dict) -> dict:
        log = dict(log)
        if '_id' in log:
            log['id'] = str(log.pop('_id'))
        if 'timestamp' in log and isinstance(log['timestamp'], object):
            try:
                log['timestamp'] = log['timestamp'].isoformat()
            except AttributeError:
                pass
        if 'created_at' in log and isinstance(log['created_at'], object):
            try:
                log['created_at'] = log['created_at'].isoformat()
            except AttributeError:
                pass
        return log