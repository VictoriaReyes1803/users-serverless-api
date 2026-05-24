# SES email identity verification for the sender address.
# The domain/email owner must click the verification link sent by AWS.
resource "aws_ses_email_identity" "sender" {
  email = var.ses_sender_email
}

# NOTE: Mailinator addresses (besta-test@mailinator.com) cannot be verified as
# SES identities because they are disposable. In SES sandbox mode you must also
# verify every *recipient* address. To test delivery to Mailinator you need to
# request production access (SES sending limits increase) so the sandbox
# restriction is lifted. See the README for full instructions.
