import pytest
from unittest.mock import patch, MagicMock
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from notifier import (
    get_severity_emoji,
    send_email,
    send_slack,
    notify
)


class TestGetSeverityEmoji:

    def test_critical_returns_red(self):
        assert get_severity_emoji('CRITICAL') == '🔴'

    def test_high_returns_orange(self):
        assert get_severity_emoji('HIGH') == '🟠'

    def test_medium_returns_yellow(self):
        assert get_severity_emoji('MEDIUM') == '🟡'

    def test_low_returns_green(self):
        assert get_severity_emoji('LOW') == '🟢'

    def test_unknown_returns_white(self):
        assert get_severity_emoji('UNKNOWN') == '⚪'


class TestSendEmail:

    def get_test_incident(self):
        return {
            'incidentId': 'inc_123',
            'title': 'CRITICAL: DB connection lost',
            'severity': 'CRITICAL',
            'serviceName': 'payment-service',
            'organizationId': 'org_default'
        }

    @patch('notifier.smtplib.SMTP')
    def test_sends_email_successfully(self, mock_smtp):
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        result = send_email(self.get_test_incident())

        assert result == True
        mock_server.starttls.assert_called_once()
        mock_server.sendmail.assert_called_once()

    @patch('notifier.smtplib.SMTP')
    def test_returns_false_on_smtp_error(self, mock_smtp):
        mock_smtp.side_effect = Exception('SMTP connection failed')

        result = send_email(self.get_test_incident())

        assert result == False


class TestSendSlack:

    def get_test_incident(self):
        return {
            'incidentId': 'inc_123',
            'title': 'CRITICAL: DB connection lost',
            'severity': 'CRITICAL',
            'serviceName': 'payment-service',
            'organizationId': 'org_default'
        }

    @patch('notifier.settings')
    @patch('notifier.requests.post')
    def test_sends_slack_successfully(self, mock_post, mock_settings):
        mock_settings.slack_webhook_url = 'https://hooks.slack.com/test'
        mock_settings.dashboard_url = 'http://localhost:3006'
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = send_slack(self.get_test_incident())

        assert result == True
        mock_post.assert_called_once()

    @patch('notifier.settings')
    def test_skips_slack_when_not_configured(self, mock_settings):
        mock_settings.slack_webhook_url = ''

        result = send_slack(self.get_test_incident())

        assert result == False

    @patch('notifier.settings')
    @patch('notifier.requests.post')
    def test_returns_false_on_slack_error(self, mock_post, mock_settings):
        mock_settings.slack_webhook_url = 'https://hooks.slack.com/test'
        mock_settings.dashboard_url = 'http://localhost:3006'
        mock_post.side_effect = Exception('Connection error')

        result = send_slack(self.get_test_incident())

        assert result == False


class TestNotify:

    def get_test_incident(self):
        return {
            'incidentId': 'inc_123',
            'title': 'CRITICAL: DB connection lost',
            'severity': 'CRITICAL',
            'serviceName': 'payment-service',
            'organizationId': 'org_default'
        }

    @patch('notifier.send_email')
    @patch('notifier.send_slack')
    def test_notify_calls_both(self, mock_slack, mock_email):
        mock_email.return_value = True
        mock_slack.return_value = True

        result = notify(self.get_test_incident())

        mock_email.assert_called_once()
        mock_slack.assert_called_once()
        assert result['email'] == True
        assert result['slack'] == True

    @patch('notifier.send_email')
    @patch('notifier.send_slack')
    def test_notify_returns_results(self, mock_slack, mock_email):
        mock_email.return_value = False
        mock_slack.return_value = True

        result = notify(self.get_test_incident())

        assert result['email'] == False
        assert result['slack'] == True