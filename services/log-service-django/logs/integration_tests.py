import time
import requests

BASE_URL = 'http://localhost:3003'
HEADERS = {
    'X-Organization-Id': 'org_default',
    'X-User-Id': 'user_test',
    'Content-Type': 'application/json'
}


class TestLogServiceIntegration:
    """
    Integration tests for Log Service.
    Requires Docker services running.
    Run with: pytest logs/integration_tests.py -v
    """

    def test_health_check(self):
        response = requests.get(f'{BASE_URL}/api/logs/health/')
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'
        assert response.json()['service'] == 'log-service'

    def test_create_info_log(self):
        response = requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'INFO',
                'message': 'Integration test INFO log',
                'service_name': 'integration-test-service',
                'metadata': {'test': True}
            },
            headers=HEADERS
        )
        assert response.status_code == 201
        data = response.json()
        assert data['level'] == 'INFO'
        assert data['message'] == 'Integration test INFO log'
        assert data['service_name'] == 'integration-test-service'
        assert data['organization_id'] == 'org_default'
        assert 'id' in data
        assert 'timestamp' in data

    def test_create_critical_log(self):
        response = requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'CRITICAL',
                'message': 'Integration test CRITICAL log',
                'service_name': 'integration-test-service'
            },
            headers=HEADERS
        )
        assert response.status_code == 201
        data = response.json()
        assert data['level'] == 'CRITICAL'
        assert 'id' in data

    def test_create_log_invalid_level(self):
        response = requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'VERBOSE',
                'message': 'test',
                'service_name': 'test'
            },
            headers=HEADERS
        )
        assert response.status_code == 400

    def test_create_log_missing_message(self):
        response = requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'INFO',
                'service_name': 'test'
            },
            headers=HEADERS
        )
        assert response.status_code == 400

    def test_get_logs_returns_list(self):
        # First create a log
        requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'INFO',
                'message': 'Log for listing test',
                'service_name': 'list-test-service'
            },
            headers=HEADERS
        )

        response = requests.get(
            f'{BASE_URL}/api/logs/',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert 'logs' in data
        assert 'total' in data
        assert 'page' in data
        assert 'pages' in data
        assert isinstance(data['logs'], list)

    def test_get_logs_filter_by_level(self):
        response = requests.get(
            f'{BASE_URL}/api/logs/?level=CRITICAL',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        for log in data['logs']:
            assert log['level'] == 'CRITICAL'

    def test_get_logs_filter_by_service(self):
        service_name = f'filter-test-{int(time.time())}'

        # Create a log for this specific service
        requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'INFO',
                'message': 'Filter by service test',
                'service_name': service_name
            },
            headers=HEADERS
        )

        response = requests.get(
            f'{BASE_URL}/api/logs/?service_name={service_name}',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert data['total'] >= 1
        for log in data['logs']:
            assert log['service_name'] == service_name

    def test_get_logs_invalid_level_filter(self):
        response = requests.get(
            f'{BASE_URL}/api/logs/?level=VERBOSE',
            headers=HEADERS
        )
        assert response.status_code == 400

    def test_get_log_by_id(self):
        # Create a log first
        create_response = requests.post(
            f'{BASE_URL}/api/logs/',
            json={
                'level': 'ERROR',
                'message': 'Get by ID test',
                'service_name': 'id-test-service'
            },
            headers=HEADERS
        )
        log_id = create_response.json()['id']

        # Get the log by ID
        response = requests.get(
            f'{BASE_URL}/api/logs/{log_id}/',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == log_id
        assert data['level'] == 'ERROR'
        assert data['message'] == 'Get by ID test'

    def test_get_log_by_invalid_id(self):
        response = requests.get(
            f'{BASE_URL}/api/logs/nonexistent/',
            headers=HEADERS
        )
        assert response.status_code == 404

    def test_pagination(self):
        response = requests.get(
            f'{BASE_URL}/api/logs/?page=1&limit=5',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data['logs']) <= 5
        assert data['limit'] == 5
        assert data['page'] == 1

    def test_all_log_levels_accepted(self):
        for level in ['INFO', 'WARNING', 'ERROR', 'CRITICAL']:
            response = requests.post(
                f'{BASE_URL}/api/logs/',
                json={
                    'level': level,
                    'message': f'{level} level test',
                    'service_name': 'level-test-service'
                },
                headers=HEADERS
            )
            assert response.status_code == 201, \
                f"Level {level} should return 201"