from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.routes import router
from app.config.database import create_tables
from app.consumers.incident_consumer import start_consumer_thread


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting AI Service...")
    try:
        create_tables()
        print("Database tables created")
    except Exception as e:
        print(f"Database setup failed (will retry): {e}")

    try:
        start_consumer_thread()
        print("RabbitMQ consumer started")
    except Exception as e:
        print(f"RabbitMQ consumer failed to start: {e}")

    yield

    # Shutdown
    print("Shutting down AI Service...")


app = FastAPI(
    title="IncidentAI — AI Service",
    description="AI-powered root cause analysis for incidents",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(router, prefix="/api/ai")


@app.get("/health")
async def root_health():
    return {
        "status": "healthy",
        "service": "ai-service",
        "port": 3004
    }