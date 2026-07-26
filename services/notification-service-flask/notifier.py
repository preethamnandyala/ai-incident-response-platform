import smtplib
import json
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()


class NotificationSettings:
    smtp_host: str = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port: int = int(os.getenv('SMTP_PORT', '587'))
    smtp_user: str = os.getenv('SMTP_USER', '')
    smtp_password: str = os.getenv('SMTP_PASSWORD', '')
    notification_email: str = os.getenv('NOTIFICATION_EMAIL', '')
    slack_webhook_url: str = os.getenv('SLACK_WEBHOOK_URL', '')
    dashboard_url: str = os.getenv('DASHBOARD_URL', 'http://localhost:3006')


settings = NotificationSettings()


def get_severity_emoji(severity: str) -> str:
    emojis = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢'
    }
    return emojis.get(severity, '⚪')


def send_email(incident: dict) -> bool:
    try:
        severity = incident.get('severity', 'UNKNOWN')
        title = incident.get('title', 'Unknown incident')
        service_name = incident.get('serviceName', 'unknown')
        incident_id = incident.get('incidentId', '')
        emoji = get_severity_emoji(severity)

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{emoji} {severity} Incident — {service_name}"
        msg['From'] = settings.smtp_user
        msg['To'] = settings.notification_email

        dashboard_link = f"{settings.dashboard_url}/incidents/{incident_id}"

        text_content = f"""
INCIDENT ALERT

Severity: {severity}
Service:  {service_name}
Title:    {title}
Status:   OPEN

View incident: {dashboard_link}

This is an automated alert from IncidentAI.
        """.strip()

        html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">{emoji} {severity} Incident</h1>
    </div>
    <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Service</td>
                <td style="padding: 8px; color: #111827;">{service_name}</td>
            </tr>
            <tr style="background: white;">
                <td style="padding: 8px; font-weight: bold; color: #374151;">Title</td>
                <td style="padding: 8px; color: #111827;">{title}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; color: #374151;">Severity</td>
                <td style="padding: 8px; color: #111827;">{severity}</td>
            </tr>
            <tr style="background: white;">
                <td style="padding: 8px; font-weight: bold; color: #374151;">Status</td>
                <td style="padding: 8px; color: #111827;">OPEN</td>
            </tr>
        </table>
        <div style="margin-top: 20px; text-align: center;">
            <a href="{dashboard_link}"
               style="background: #2563eb; color: white; padding: 12px 24px;
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Incident →
            </a>
        </div>
    </div>
    <div style="padding: 12px; text-align: center; color: #9ca3af; font-size: 12px;">
        Automated alert from IncidentAI Monitoring Platform
    </div>
</body>
</html>
        """.strip()

        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(
                settings.smtp_user,
                settings.notification_email,
                msg.as_string()
            )

        print(f"Email sent for incident: {incident_id}")
        return True

    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_slack(incident: dict) -> bool:
    if not settings.slack_webhook_url:
        print("Slack webhook not configured — skipping")
        return False

    try:
        severity = incident.get('severity', 'UNKNOWN')
        title = incident.get('title', 'Unknown incident')
        service_name = incident.get('serviceName', 'unknown')
        incident_id = incident.get('incidentId', '')
        emoji = get_severity_emoji(severity)
        dashboard_link = f"{settings.dashboard_url}/incidents/{incident_id}"

        payload = {
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"{emoji} {severity} Incident Detected"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Service:*\n{service_name}"
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Severity:*\n{severity}"
                        }
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Title:*\n{title}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "View Incident →"
                            },
                            "url": dashboard_link,
                            "style": "danger"
                        }
                    ]
                }
            ]
        }

        response = requests.post(
            settings.slack_webhook_url,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            print(f"Slack notification sent for incident: {incident_id}")
            return True
        else:
            print(f"Slack notification failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"Failed to send Slack notification: {e}")
        return False


def notify(incident: dict) -> dict:
    email_sent = send_email(incident)
    slack_sent = send_slack(incident)

    return {
        'email': email_sent,
        'slack': slack_sent
    }