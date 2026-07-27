# ADR-008: Separate RabbitMQ Queues Per Consumer

## Date
27 July 2026

## Status
Accepted

## Context
The AI Service and Notification Service both needed to consume
incident.created events from RabbitMQ. Initially both services
consumed from the same queue (incident.created.queue).

RabbitMQ uses round-robin delivery when multiple consumers share
a queue — each message goes to ONE consumer only. This caused:
→ 50% of incidents had no AI analysis
→ 50% of incidents had no email/Slack notification
→ Message loss was non-deterministic and hard to debug

## Decision
Give each consumer service its own dedicated queue, both bound
to the same exchange with the same routing key.

Exchange: incident_platform (topic)
Routing key: incident.created

Queues:
incident.created.queue → AI Service only
notification.incident.queue → Notification Service only

Both queues bound to same routing key
→ Exchange delivers one copy to each queue
→ Every incident gets both AI analysis AND notification

## Consequences

### Positive
→ Every incident guaranteed to reach every consumer
→ No round-robin message loss
→ Each service processes independently
→ Adding a new consumer = add a new queue + binding
   (no changes to existing services)
→ Each queue can be monitored independently in RabbitMQ UI

### Negative
→ More queues to manage (one per consumer)
→ Must remember to add queue binding when adding new consumers

## Implementation
- Added NOTIFICATION_INCIDENT_QUEUE to RabbitMQConfig.java
- Added notificationIncidentBinding() to bind new queue
- Updated Notification Service consumer.py to use new queue
- Added queue_bind() call in consumer to bind at runtime
- AI Service continues using incident.created.queue unchanged

## Pattern
This is the standard pub/sub (publish-subscribe) pattern:
One publisher → one exchange → many queues → many consumers
Same as how email lists work: one sender, many recipients,
each recipient gets their own copy.

## Future consumers
When adding new consumers (e.g. webhook service, mobile push):
1. Create new queue: webhook.incident.queue
2. Bind to incident_platform exchange with incident.created key
3. Consumer declares and binds its own queue on startup
4. No changes needed to Incident Service or other consumers

