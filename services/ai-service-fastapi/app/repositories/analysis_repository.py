from sqlalchemy.orm import Session
from app.models.analysis import AIAnalysis
from typing import Optional


class AnalysisRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, analysis_data: dict) -> AIAnalysis:
        analysis = AIAnalysis(**analysis_data)
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def find_by_incident_id(
        self,
        incident_id: str,
        organization_id: str
    ) -> Optional[AIAnalysis]:
        return self.db.query(AIAnalysis).filter(
            AIAnalysis.incident_id == incident_id,
            AIAnalysis.organization_id == organization_id
        ).first()

    def find_by_organization(
        self,
        organization_id: str,
        limit: int = 10
    ) -> list[AIAnalysis]:
        return self.db.query(AIAnalysis).filter(
            AIAnalysis.organization_id == organization_id
        ).order_by(
            AIAnalysis.created_at.desc()
        ).limit(limit).all()