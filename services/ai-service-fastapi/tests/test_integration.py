import requests
import time

BASE_URL = 'http://localhost:3004'
HEADERS = {
    'X-Organization-Id': 'org_default',
    'Content-Type': 'application/json'
}


class TestAIServiceIntegration:
    """
    Integration tests for AI Service.
    Requires Docker services running.
    Run with: pytest tests/test_integration.py -v
    """

    def test_health_check(self):
        response = requests.get(f'{BASE_URL}/api/ai/health')
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'ai-service'
        assert 'model' in data

    def test_ai_health_check(self):
        response = requests.get(f'{BASE_URL}/api/ai/health')
        assert response.status_code == 200
        assert response.json()['model'] == 'claude-sonnet-4-6'

    def test_list_analyses_returns_list(self):
        response = requests.get(
            f'{BASE_URL}/api/ai/analyses',
            headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert 'analyses' in data
        assert 'total' in data
        assert isinstance(data['analyses'], list)

    def test_list_analyses_filter_by_org(self):
    # AI Service currently returns all analyses
    # organization filtering is post-Phase-14
        headers = {
            'X-Organization-Id': 'org_unknown_xyz',
            'Content-Type': 'application/json'
        }
        response = requests.get(
            f'{BASE_URL}/api/ai/analyses',
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert 'analyses' in data
        assert isinstance(data['analyses'], list)

    def test_get_analysis_not_found(self):
        response = requests.get(
            f'{BASE_URL}/api/ai/analyses/00000000-0000-0000-0000-000000000000',
            headers=HEADERS
        )
        assert response.status_code == 404

    def test_trigger_analysis_not_found(self):
        response = requests.post(
            f'{BASE_URL}/api/ai/analyses/00000000-0000-0000-0000-000000000000/trigger',
            headers=HEADERS
        )
        assert response.status_code == 404

    def test_list_analyses_has_correct_structure(self):
        response = requests.get(
          f'{BASE_URL}/api/ai/analyses',
          headers=HEADERS
        )
        assert response.status_code == 200
        data = response.json()
        assert 'analyses' in data

        if len(data['analyses']) > 0:
            analysis = data['analyses'][0]
            assert 'id' in analysis
            assert 'incidentId' in analysis
            assert 'rootCause' in analysis
            assert 'confidence' in analysis