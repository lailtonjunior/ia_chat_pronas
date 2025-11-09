"""
Serviços de envio de e-mail (SES/SendGrid via boto3)
"""

from __future__ import annotations

import logging
from typing import List

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service simples para envio de emails transacionais."""

    def __init__(self):
        self.region = settings.AWS_REGION_NAME
        self.sender = settings.EMAIL_FROM
        self.client = boto3.client(
            "ses",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=self.region,
        )

    def send_email(
        self,
        to_addresses: List[str],
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> bool:
        try:
            response = self.client.send_email(
                Source=self.sender,
                Destination={"ToAddresses": to_addresses},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {
                        "Text": {"Data": text_body or html_body},
                        "Html": {"Data": html_body},
                    },
                },
            )
            message_id = response.get("MessageId")
            logger.info("📧 Email enviado com sucesso (MessageId=%s)", message_id)
            return True
        except (BotoCoreError, ClientError) as exc:
            logger.error("❌ Falha ao enviar email: %s", exc)
            return False
