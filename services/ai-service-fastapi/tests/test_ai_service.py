import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.ai_service import (
    build_analysis_prompt,
    analyze_incident,
    fetch_related_logs
)


class TestBuildAnalysisPrompt:

    def test_includes_incident_title(self):
        incident = {
            'id': 'inc_123',
            'title': 'Database connection lost',
            'severity': 'CRITICAL',
            'serviceName': 'payment-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }
        prompt = build_analysis_prompt(incident, [])
        assert 'Database connection lost' in prompt

    def test_includes_service_name(self):
        incident = {
            'id': 'inc_123',
            'title': 'Test incident',
            'severity': 'HIGH',
            'serviceName': 'payment-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }
        prompt = build_analysis_prompt(incident, [])
        assert 'payment-service' in prompt

    def test_includes_logs_when_provided(self):
        incident = {
            'id': 'inc_123',
            'title': 'Test',
            'severity': 'HIGH',
            'serviceName': 'test-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }
        logs = [
            {
                'level': 'ERROR',
                'message': 'Connection refused',
                'timestamp': '2026-06-12T10:00:00Z',
                'metadata': {}
            }
        ]
        prompt = build_analysis_prompt(incident, logs)
        assert 'Connection refused' in prompt

    def test_requests_json_output(self):
        incident = {
            'id': 'inc_123',
            'title': 'Test',
            'severity': 'HIGH',
            'serviceName': 'test-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }
        prompt = build_analysis_prompt(incident, [])
        assert 'JSON' in prompt
        assert 'rootCause' in prompt


class TestAnalyzeIncident:

    @pytest.mark.asyncio
    async def test_returns_analysis_structure(self):
        mock_response_text = '''{
            "rootCause": "Database connection pool exhausted",
            "confidence": 0.92,
            "possibleCauses": ["Traffic spike", "Pool size too small"],
            "suggestedActions": ["Increase pool size", "Monitor connections"],
            "severity_assessment": "Critical - immediate action required"
        }'''

        mock_content = MagicMock()
        mock_content.text = mock_response_text

        mock_response = MagicMock()
        mock_response.content = [mock_content]

        incident = {
            'id': 'inc_123',
            'title': 'DB connection lost',
            'severity': 'CRITICAL',
            'serviceName': 'payment-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }

        with patch(
            'app.services.ai_service.client.messages.create',
            new_callable=AsyncMock,
            return_value=mock_response
        ), patch(
            'app.services.ai_service.fetch_related_logs',
            new_callable=AsyncMock,
            return_value=[]
        ):
            result = await analyze_incident(incident, 'org_default')

        assert result['incident_id'] == 'inc_123'
        assert result['organization_id'] == 'org_default'
        assert result['root_cause'] == 'Database connection pool exhausted'
        assert result['confidence'] == 0.92
        assert len(result['possible_causes']) == 2
        assert len(result['suggested_actions']) == 2
        assert result['model_used'] == 'claude-sonnet-4-6'

    @pytest.mark.asyncio
    async def test_handles_api_failure_gracefully(self):
        incident = {
            'id': 'inc_123',
            'title': 'Test',
            'severity': 'HIGH',
            'serviceName': 'test-service',
            'status': 'OPEN',
            'createdAt': '2026-06-12T10:00:00Z'
        }

        with patch(
            'app.services.ai_service.client.messages.create',
            new_callable=AsyncMock,
            side_effect=Exception('API error')
        ), patch(
            'app.services.ai_service.fetch_related_logs',
            new_callable=AsyncMock,
            return_value=[]
        ):
            result = await analyze_incident(incident, 'org_default')

        assert result['confidence'] == 0.0
        assert 'Analysis failed' in result['root_cause']
        assert len(result['suggested_actions']) > 0