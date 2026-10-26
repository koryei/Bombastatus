# Security

Bombastatus handles your Discord account token, which gives full access to your account.

- The token is read only from `.env` or the `DISCORD_TOKEN` environment variable and is never logged or written anywhere else.
- Never commit `.env`, and never paste your token into an issue.
- If you think your token leaked, change your Discord password immediately. That invalidates the token.

To report a vulnerability, please use GitHub's **Report a vulnerability** button under the Security tab rather than opening a public issue.

Reminder: automating a user account violates Discord's Terms of Service. See the disclaimer in the README.
