from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from .service import LogService
from .serializers import LogCreateSerializer, LogFilterSerializer


# ─── Serializer Tests ───────────────────────────────────────────────

class LogCreateSerializerTests(TestCase):

    def test_valid_data_passes(self):
        data = {
            'level': 'ERROR',
            'message': 'DB timeout',
            'service_name': 'payment-service'
        }
        serializer = LogCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_invalid_level_fails(self):
        data = {
            'level': 'VERBOSE',
            'message': 'test',
            'service_name': 'test'
        }
        serializer = LogCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('level', serializer.errors)

    def test_missing_message_fails(self):
        data = {'level': 'ERROR', 'service_name': 'test'}
        serializer = LogCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)

    def test_missing_service_name_fails(self):
        data = {'level': 'ERROR', 'message': 'test'}
        serializer = LogCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service_name', serializer.errors)

    def test_metadata_is_optional(self):
        data = {
            'level': 'INFO',
            'message': 'test',
            'service_name': 'test'
        }
        serializer = LogCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['metadata'], {})

    def test_all_valid_levels(self):
        for level in ['INFO', 'WARNING', 'ERROR', 'CRITICAL']:
            data = {'level': level, 'message': 'test', 'service_name': 'test'}
            serializer = LogCreateSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Level {level} should be valid")


# ─── Service Tests ───────────────────────────────────────────────────

class LogServiceTests(TestCase):

    def setUp(self):
        self.service = LogService()

    @patch('logs.service.LogRepository')
    def test_create_log_builds_correct_document(self, MockRepo):
        mock_repo = MagicMock()
        mock_repo.insert_log.return_value = 'abc123'
        self.service.repository = mock_repo

        result = self.service.create_log(
            level='ERROR',
            message='DB timeout',
            service_name='payment-service',
            organization_id='org_default',
            user_id='user_123'
        )

        self.assertEqual(result['level'], 'ERROR')
        self.assertEqual(result['organization_id'], 'org_default')
        self.assertEqual(result['id'], 'abc123')
        mock_repo.insert_log.assert_called_once()

    @patch('logs.service.LogRepository')
    def test_critical_log_triggers_handler(self, MockRepo):
        mock_repo = MagicMock()
        mock_repo.insert_log.return_value = 'abc123'
        self.service.repository = mock_repo

        with patch.object(self.service, '_handle_critical_log') as mock_handler:
            self.service.create_log(
                level='CRITICAL',
                message='System down',
                service_name='payment-service',
                organization_id='org_default',
                user_id='user_123'
            )
            
            mock_handler.assert_called_once_with(
                'payment-service', 'System down', 'org_default', 'abc123'
            )

    @patch('logs.service.LogRepository')
    def test_non_critical_log_does_not_trigger_handler(self, MockRepo):
        mock_repo = MagicMock()
        mock_repo.insert_log.return_value = 'abc123'
        self.service.repository = mock_repo

        with patch.object(self.service, '_handle_critical_log') as mock_handler:
            self.service.create_log(
                level='INFO',
                message='Request processed',
                service_name='payment-service',
                organization_id='org_default',
                user_id='user_123'
            )
            mock_handler.assert_not_called()

    @patch('logs.service.LogRepository')
    def test_get_logs_calculates_pagination_correctly(self, MockRepo):
        mock_repo = MagicMock()
        mock_repo.find_logs.return_value = {'logs': [], 'total': 95}
        self.service.repository = mock_repo

        result = self.service.get_logs(
            organization_id='org_default',
            page=1,
            limit=50
        )

        self.assertEqual(result['total'], 95)
        self.assertEqual(result['pages'], 2)
        self.assertEqual(result['page'], 1)
        self.assertEqual(result['limit'], 50)

    def test_serialize_log_converts_object_id(self):
        from bson import ObjectId
        log = {
            '_id': ObjectId('64abc123def456789012abcd'),
            'level': 'ERROR',
            'message': 'test',
            'timestamp': datetime.now(timezone.utc),
            'created_at': datetime.now(timezone.utc)
        }
        result = self.service._serialize_log(log)

        self.assertIn('id', result)
        self.assertNotIn('_id', result)
        self.assertIsInstance(result['id'], str)
        self.assertIsInstance(result['timestamp'], str)


# ─── View Tests ──────────────────────────────────────────────────────

class LogCreateViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.headers = {
            'HTTP_X_ORGANIZATION_ID': 'org_default',
            'HTTP_X_USER_ID': 'user_123'
        }

    @patch('logs.views.log_service')
    def test_create_log_successfully(self, mock_service):
        mock_service.create_log.return_value = {
            'id': 'abc123',
            'level': 'ERROR',
            'message': 'DB timeout',
            'service_name': 'payment-service',
            'organization_id': 'org_default',
            'timestamp': '2026-06-09T10:00:00+00:00'
        }

        response = self.client.post(
            '/api/logs/',
            data={
                'level': 'ERROR',
                'message': 'DB timeout',
                'service_name': 'payment-service'
            },
            format='json',
            **self.headers
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['level'], 'ERROR')
        mock_service.create_log.assert_called_once()

    def test_create_log_fails_validation(self):
        response = self.client.post(
            '/api/logs/',
            data={'level': 'VERBOSE', 'message': 'test', 'service_name': 'test'},
            format='json',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Validation failed')

    @patch('logs.views.log_service')
    def test_get_logs_successfully(self, mock_service):
        mock_service.get_logs.return_value = {
            'logs': [],
            'total': 0,
            'page': 1,
            'limit': 50,
            'pages': 0
        }

        response = self.client.get('/api/logs/', **self.headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('logs', response.data)
        self.assertIn('total', response.data)

    def test_get_logs_invalid_filter(self):
        response = self.client.get(
            '/api/logs/?level=VERBOSE',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogDetailViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.headers = {'HTTP_X_ORGANIZATION_ID': 'org_default'}

    @patch('logs.views.log_service')
    def test_get_log_by_id_found(self, mock_service):
        mock_service.get_log_by_id.return_value = {
            'id': 'abc123',
            'level': 'ERROR',
            'message': 'DB timeout'
        }

        response = self.client.get(
            '/api/logs/abc123/',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], 'abc123')

    @patch('logs.views.log_service')
    def test_get_log_by_id_not_found(self, mock_service):
        mock_service.get_log_by_id.return_value = None

        response = self.client.get(
            '/api/logs/nonexistent/',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class LogSearchViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.headers = {'HTTP_X_ORGANIZATION_ID': 'org_default'}

    def test_search_without_query_returns_400(self):
        response = self.client.get('/api/logs/search/', **self.headers)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_with_query_returns_placeholder(self):
        response = self.client.get(
            '/api/logs/search/?q=database+timeout',
            **self.headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'], [])
        self.assertIn('note', response.data)


class HealthCheckTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200(self):
        response = self.client.get('/api/logs/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['service'], 'log-service')