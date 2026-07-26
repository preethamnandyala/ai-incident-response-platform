from sqlalchemy import Column, String, Float, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.config.database import Base
import uuid


class AIAnalysis(Base):
    __tablename__ = 'ai_analyses'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String, nullable=False, index=True)
    organization_id = Column(String, nullable=False, index=True)
    root_cause = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    possible_causes = Column(JSON, nullable=False, default=list)
    suggested_actions = Column(JSON, nullable=False, default=list)
    similar_incidents = Column(JSON, nullable=False, default=list)
    raw_response = Column(Text)
    model_used = Column(String, default='claude-sonnet-4-6')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())