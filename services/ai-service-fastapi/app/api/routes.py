from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.repositories.analysis_repository import AnalysisRepository
from app.services.ai_service import analyze_incident
from app.config.settings import settings
import httpx

router = APIRouter()


@router.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'service': 'ai-service',
        'model': 'claude-sonnet-4-6'
    }


@router.get('/analyses/{incident_id}')
async def get_analysis(
    incident_id: str,
    organization_id: str = 'org_default',
    db: Session = Depends(get_db)
):
    repo = AnalysisRepository(db)
    analysis = repo.find_by_incident_id(incident_id, organization_id)

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f'No analysis found for incident {incident_id}'
        )

    return {
        'id': analysis.id,
        'incidentId': analysis.incident_id,
        'organizationId': analysis.organization_id,
        'rootCause': analysis.root_cause,
        'confidence': analysis.confidence,
        'possibleCauses': analysis.possible_causes,
        'suggestedActions': analysis.suggested_actions,
        'similarIncidents': analysis.similar_incidents,
        'modelUsed': analysis.model_used,
        'createdAt': analysis.created_at.isoformat() if analysis.created_at else None
    }


@router.post('/analyses/{incident_id}/trigger')
async def trigger_analysis(
    incident_id: str,
    organization_id: str = 'org_default',
    db: Session = Depends(get_db)
):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.incident_service_url}/api/incidents/{incident_id}",
                headers={'x-organization-id': organization_id},
                timeout=10.0
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=404,
                detail=f'Incident {incident_id} not found'
            )

        incident = response.json()
        analysis_data = await analyze_incident(incident, organization_id)

        repo = AnalysisRepository(db)
        analysis = repo.create(analysis_data)

        return {
            'message': 'Analysis triggered successfully',
            'incidentId': incident_id,
            'rootCause': analysis.root_cause,
            'confidence': analysis.confidence
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/analyses')
async def list_analyses(
    organization_id: str = 'org_default',
    limit: int = 10,
    db: Session = Depends(get_db)
):
    repo = AnalysisRepository(db)
    analyses = repo.find_by_organization(organization_id, limit)

    return {
        'analyses': [
            {
                'id': a.id,
                'incidentId': a.incident_id,
                'rootCause': a.root_cause,
                'confidence': a.confidence,
                'modelUsed': a.model_used,
                'createdAt': a.created_at.isoformat() if a.created_at else None
            }
            for a in analyses
        ],
        'total': len(analyses)
    }