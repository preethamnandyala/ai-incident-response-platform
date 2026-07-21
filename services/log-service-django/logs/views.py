from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timezone
from .service import LogService
from .serializers import LogCreateSerializer, LogFilterSerializer, BulkLogCreateSerializer


log_service = LogService()


class LogListCreateView(APIView):

    def post(self, request):
        organization_id = request.headers.get('X-Organization-Id', 'org_default')
        user_id = request.headers.get('X-User-Id', 'system')

        serializer = LogCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        log = log_service.create_log(
            level=data['level'],
            message=data['message'],
            service_name=data['service_name'],
            organization_id=organization_id,
            user_id=user_id,
            metadata=data.get('metadata', {}),
            trace_id=data.get('trace_id', ''),
            request_id=data.get('request_id', '')
        )
        return Response(log, status=status.HTTP_201_CREATED)

    def get(self, request):
        organization_id = request.headers.get('X-Organization-Id', 'org_default')

        filter_serializer = LogFilterSerializer(data=request.query_params)
        if not filter_serializer.is_valid():
            return Response(
                {'error': 'Invalid filters', 'details': filter_serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        filters = filter_serializer.validated_data
        result = log_service.get_logs(
            organization_id=organization_id,
            level=filters.get('level'),
            service_name=filters.get('service_name'),
            from_date=filters.get('from_date'),
            to_date=filters.get('to_date'),
            page=filters.get('page', 1),
            limit=filters.get('limit', 50)
        )
        return Response(result)


class LogBulkCreateView(APIView):

    def post(self, request):
        organization_id = request.headers.get('X-Organization-Id', 'org_default')
        user_id = request.headers.get('X-User-Id', 'system')

        serializer = BulkLogCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = log_service.create_bulk_logs(
            logs=serializer.validated_data['logs'],
            organization_id=organization_id,
            user_id=user_id
        )
        return Response(result, status=status.HTTP_201_CREATED)


class LogDetailView(APIView):

    def get(self, request, log_id):
        organization_id = request.headers.get('X-Organization-Id', 'org_default')

        log = log_service.get_log_by_id(log_id, organization_id)
        if not log:
            return Response(
                {'error': 'Log not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(log)


class LogServicesView(APIView):

    def get(self, request):
        organization_id = request.headers.get('X-Organization-Id', 'org_default')
        services = log_service.get_services(organization_id)
        return Response({'services': services})

class LogSearchView(APIView):

    def get(self, request):
        organization_id = request.headers.get(
            'X-Organization-Id', 'org_default'
        )
        query = request.query_params.get('q', '')

        if not query:
            return Response(
                {'error': 'Search query parameter q is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # TODO Phase 10: implement OpenSearch full-text search
        # result = opensearch_client.search(
        #     index='logs',
        #     body={
        #         'query': {
        #             'bool': {
        #                 'must': [
        #                     {'match': {'message': query}},
        #                     {'term': {'organization_id': organization_id}}
        #                 ]
        #             }
        #         }
        #     }
        # )
        return Response({
            'results': [],
            'total': 0,
            'query': query,
            'note': 'OpenSearch integration available after Phase 10'
        })

@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'healthy',
        'service': 'log-service',
        'timestamp': datetime.now(timezone.utc).isoformat()
    })