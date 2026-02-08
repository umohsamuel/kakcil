export default class EmailTemplatesService {
  getSubscriptionSuccessEmail(
    userName: string,
    tier: string,
    amount: number,
  ): {
    subject: string;
    message: string;
  } {
    return {
      subject: `Welcome to AI Council ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`,
      message: `
Hi ${userName},

Thank you for subscribing to AI Council ${tier.charAt(0).toUpperCase() + tier.slice(1)}!

Your subscription is now active. Here's what you get:

${
  tier === "plus"
    ? `
- 500 messages per day
- 10,000 messages per month
- Up to 10 council members
- Access to advanced AI models
`
    : `
- Unlimited messages
- Unlimited council members
- Access to advanced AI models
- Priority support
`
}

Amount paid: ₦${(amount / 100).toLocaleString()}

If you have any questions, feel free to reach out to our support team.

Best regards,
The AI Council Team
      `.trim(),
    };
  }

  getSubscriptionCancelledEmail(
    userName: string,
    endDate: Date,
  ): {
    subject: string;
    message: string;
  } {
    return {
      subject: "Your AI Council Subscription Has Been Cancelled",
      message: `
Hi ${userName},

We're sorry to see you go. Your AI Council subscription has been cancelled.

Your subscription will remain active until ${endDate.toLocaleDateString()}, after which you'll be moved to the free tier.

Free tier includes:
- 2 messages per day
- 100 messages per month
- Up to 3 council members

You can resubscribe at any time from your account settings.

Best regards,
The AI Council Team
      `.trim(),
    };
  }

  getPaymentFailedEmail(userName: string): {
    subject: string;
    message: string;
  } {
    return {
      subject: "Payment Failed - Action Required",
      message: `
Hi ${userName},

We weren't able to process your subscription payment.

Please update your payment method in your account settings to continue enjoying AI Council premium features.

If you have any questions, please contact our support team.

Best regards,
The AI Council Team
      `.trim(),
    };
  }
}
