from datetime import datetime
from bson import ObjectId
from .mongodb import get_logs_collection


class LogRepository:

    def insert_log(self, log_document: dict) -> str:
        collection = get_logs_collection()
        result = collection.insert_one(log_document)
        return str(result.inserted_id)

    def find_logs(
        self,
        organization_id: str,
        level: str = None,
        service_name: str = None,
        from_date: datetime = None,
        to_date: datetime = None,
        page: int = 1,
        limit: int = 50
    ) -> dict:
        query = {'organization_id': organization_id}

        if level:
            query['level'] = level
        if service_name:
            query['service_name'] = service_name
        if from_date or to_date:
            query['timestamp'] = {}
            if from_date:
                query['timestamp']['$gte'] = from_date
            if to_date:
                query['timestamp']['$lte'] = to_date

        collection = get_logs_collection()
        skip = (page - 1) * limit
        total = collection.count_documents(query)
        logs = list(
            collection.find(query)
            .sort('timestamp', -1)
            .skip(skip)
            .limit(limit)
        )
        return {'logs': logs, 'total': total}

    def find_by_id(self, log_id: str, organization_id: str) -> dict | None:
        try:
            collection = get_logs_collection()
            log = collection.find_one({
                '_id': ObjectId(log_id),
                'organization_id': organization_id
            })
            return log
        except Exception:
            return None

    def insert_many_logs(self, log_documents: list) -> list:
        collection = get_logs_collection()
        result = collection.insert_many(log_documents)
        return [str(id) for id in result.inserted_ids]

    def get_distinct_services(self, organization_id: str) -> list:
        collection = get_logs_collection()
        return collection.distinct('service_name', {
            'organization_id': organization_id
        })