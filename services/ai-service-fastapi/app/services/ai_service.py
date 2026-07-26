import json
import httpx
from anthropic import AsyncAnthropic
from app.config.settings import settings

client = AsyncAnthropic(api_key=settings.anthropic_api_key)


async def fetch_related_logs(
    incident_id: str,
    service_name: str,
    organization_id: str
) -> list:
    try:
        async with httpx.AsyncClient() as http:
            response = await http.get(
                f"{settings.log_service_url}/api/logs/",
                params={
                    'service_name': service_name,
                    'limit': 20
                },
                headers={
                    'X-Organization-Id': organization_id
                },
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('logs', [])
            return []
    except Exception as e:
        print(f"Failed to fetch logs: {e}")
        return []


def build_analysis_prompt(
    incident: dict,
    logs: list
) -> str:
    logs_text = '\n'.join([
        f"[{log.get('level')}] {log.get('timestamp', '')}: {log.get('message', '')} "
        f"metadata: {json.dumps(log.get('metadata', {}))}"
        for log in logs[:10]
    ])

    return f"""You are an expert Site Reliability Engineer analyzing a production incident.

INCIDENT DETAILS:
- Title: {incident.get('title')}
- Severity: {incident.get('severity')}
- Service: {incident.get('serviceName', 'unknown')}
- Status: {incident.get('status')}
- Created: {incident.get('createdAt')}

RELATED LOGS (most recent first):
{logs_text if logs_text else 'No logs available'}

Analyze this incident and provide a structured response in the following JSON format:
{{
    "rootCause": "Clear, concise description of the most likely root cause",
    "confidence": 0.85,
    "possibleCauses": [
        "First possible cause",
        "Second possible cause",
        "Third possible cause"
    ],
    "suggestedActions": [
        "First immediate action to take",
        "Second action",
        "Third action"
    ],
    "severity_assessment": "Your assessment of the actual severity"
}}

Respond ONLY with valid JSON. No additional text before or after the JSON."""


async def analyze_incident(
    incident: dict,
    organization_id: str
) -> dict:
    service_name = incident.get('serviceName', '')
    incident_id = incident.get('id', '')

    logs = await fetch_related_logs(
        incident_id, service_name, organization_id
    )

    prompt = build_analysis_prompt(incident, logs)

    try:
        response = await client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=1000,
            messages=[
                {
                    'role': 'user',
                    'content': prompt
                }
            ]
        )

        raw_response = response.content[0].text

        try:
            analysis = json.loads(raw_response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(
                r'\{.*\}', raw_response, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                raise ValueError("No valid JSON in response")

        return {
            'incident_id': incident_id,
            'organization_id': organization_id,
            'root_cause': analysis.get('rootCause', 'Unknown'),
            'confidence': float(analysis.get('confidence', 0.5)),
            'possible_causes': analysis.get('possibleCauses', []),
            'suggested_actions': analysis.get('suggestedActions', []),
            'similar_incidents': [],
            'raw_response': raw_response,
            'model_used': 'claude-sonnet-4-6'
        }

    except Exception as e:
        print(f"AI analysis failed: {e}")
        return {
            'incident_id': incident_id,
            'organization_id': organization_id,
            'root_cause': f'Analysis failed: {str(e)}',
            'confidence': 0.0,
            'possible_causes': [],
            'suggested_actions': [
                'Check service logs manually',
                'Review recent deployments',
                'Check infrastructure metrics'
            ],
            'similar_incidents': [],
            'raw_response': str(e),
            'model_used': 'claude-sonnet-4-6'
        }