import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'
    assert response.json()['service'] == 'ai-service'


def test_ai_health_check():
    response = client.get('/api/ai/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'


def test_get_analysis_not_found():
    mock_db = MagicMock()
    mock_repo = MagicMock()
    mock_repo.find_by_incident_id.return_value = None

    with patch(
        'app.api.routes.AnalysisRepository',
        return_value=mock_repo
    ), patch(
        'app.api.routes.get_db',
        return_value=iter([mock_db])
    ):
        response = client.get(
            '/api/ai/analyses/nonexistent',
            params={'organization_id': 'org_default'}
        )

    assert response.status_code == 404


def test_list_analyses_returns_empty():
    mock_db = MagicMock()
    mock_repo = MagicMock()
    mock_repo.find_by_organization.return_value = []

    with patch(
        'app.api.routes.AnalysisRepository',
        return_value=mock_repo
    ), patch(
        'app.api.routes.get_db',
        return_value=iter([mock_db])
    ):
        response = client.get(
            '/api/ai/analyses',
            params={'organization_id': 'org_default'}
        )

    assert response.status_code == 200
    assert response.json()['analyses'] == []
    assert response.json()['total'] == 0