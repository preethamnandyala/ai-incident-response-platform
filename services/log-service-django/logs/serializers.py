from rest_framework import serializers


class LogCreateSerializer(serializers.Serializer):
    level = serializers.ChoiceField(
        choices=['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        error_messages={'invalid_choice': 'Level must be INFO, WARNING, ERROR, or CRITICAL'}
    )
    message = serializers.CharField(
        max_length=2000,
        error_messages={'blank': 'Message is required'}
    )
    service_name = serializers.CharField(
        max_length=255,
        error_messages={'blank': 'Service name is required'}
    )
    metadata = serializers.DictField(
        child=serializers.JSONField(),
        required=False,
        default=dict
    )
    trace_id = serializers.CharField(max_length=255, required=False, allow_blank=True)
    request_id = serializers.CharField(max_length=255, required=False, allow_blank=True)


class LogFilterSerializer(serializers.Serializer):
    level = serializers.ChoiceField(
        choices=['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
        required=False
    )
    service_name = serializers.CharField(required=False)
    from_date = serializers.DateTimeField(required=False)
    to_date = serializers.DateTimeField(required=False)
    page = serializers.IntegerField(min_value=1, default=1)
    limit = serializers.IntegerField(min_value=1, max_value=100, default=50)

class BulkLogCreateSerializer(serializers.Serializer):
    logs = serializers.ListField(
        child=LogCreateSerializer(),
        min_length=1,
        max_length=1000,
        error_messages={
            'min_length': 'At least one log is required',
            'max_length': 'Maximum 1000 logs per bulk request'
        }
    )