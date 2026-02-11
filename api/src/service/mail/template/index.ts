export default class EmailTemplatesService {
  private baseUrl: string;

  // ─── Brand Color Palette ───────────────────────────
  // Primary:     #2c2c34 (brand-black — sidebar, header, buttons)
  // Surface:     #ffffff (white card bg)
  // Body BG:     #f5f5f6 (subtle warm gray behind the card)
  // Heading:     #2c2c34 (brand-black)
  // Body text:   #3d3d45 (slightly lighter brand-black for readability)
  // Muted text:  #6b6b73 (brand-muted)
  // Subtle text: #9e9ea6 (brand-subtle)
  // Info box BG: #f0f0f2 (brand-tinted light gray)
  // Info border: #2c2c34 (brand-black accent)
  // Note box BG: #f5f5f6 (off-white)
  // Note border: #9e9ea6 (gray accent)
  // Code BG:     #eeeef0 (brand-tinted code block)
  // Footer BG:   #2c2c34 (brand-black, matches header)
  // Footer text: #9e9ea6 (brand-subtle on dark)
  // ───────────────────────────────────────────────────

  constructor(baseUrl: string = "https://kakcil.umohsg.com") {
    this.baseUrl = baseUrl;
  }

  // ===================================================
  // BASE TEMPLATE
  // ===================================================

  private createEmailTemplate(content: string): string {
    return `
      <!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f5f5f6;
      font-family: 'Segoe UI', Arial, sans-serif;
    "
  >
    <table role="presentation" style="width: 100%; border-collapse: collapse">
      <tr>
        <td style="padding: 40px 16px; text-align: center">
          <table
            role="presentation"
            style="
              width: 600px;
              max-width: 100%;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 24px rgba(44, 44, 52, 0.08);
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  background-color: #2c2c34;
                  padding: 28px 30px;
                  text-align: center;
                "
              >
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                      <img
                        src="https://kakcil.umohsg.com/logo.png"
                        alt="Kakcil AI"
                        style="
                          height: 36px;
                          width: 36px;
                          display: block;
                          border-radius: 10px;
                        "
                      />
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 20px;
                        font-weight: 300;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                      ">KAKCIL</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 40px 36px">
                <div
                  style="
                    color: #3d3d45;
                    font-size: 15px;
                    line-height: 1.7;
                    text-align: start;
                  "
                >
                 ${content}
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background-color: #2c2c34;
                  padding: 24px 30px;
                  text-align: center;
                "
              >
                <p style="margin: 0; color: #9e9ea6; font-size: 13px;">
                  © ${new Date().getFullYear()} Kakcil AI. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }

  // ─── Shared helpers (keep templates DRY) ───────────

  private brandButton(href: string, label: string): string {
    return `
        <table role="presentation" style="margin: 28px 0;">
          <tr>
            <td>
              <a href="${href}" style="display: inline-block; background-color: #2c2c34; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.2px;">
                ${label}
              </a>
            </td>
          </tr>
        </table>`;
  }

  private infoBox(html: string): string {
    return `
        <div style="background-color: #f0f0f2; border-left: 4px solid #2c2c34; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
          ${html}
        </div>`;
  }

  private noteBox(html: string): string {
    return `
        <div style="background-color: #f5f5f6; border-left: 4px solid #9e9ea6; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
          ${html}
        </div>`;
  }

  private featureBox(title: string, features: string): string {
    return `
        <div style="background-color: #f0f0f2; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #2c2c34; font-size: 15px; font-weight: 600;">
            ${title}
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: #3d3d45; font-size: 14px;">
            ${features}
          </ul>
        </div>`;
  }

  private codeBlock(text: string): string {
    return `
        <div style="background-color: #eeeef0; border-radius: 6px; padding: 12px 16px; margin: 0 0 24px 0; word-break: break-all;">
          <code style="color: #3d3d45; font-size: 13px; font-family: 'Courier New', monospace;">
            ${text}
          </code>
        </div>`;
  }

  private heading(text: string): string {
    return `<h2 style="color: #2c2c34; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.2px;">${text}</h2>`;
  }

  private greeting(name: string): string {
    return `<p style="margin: 0 0 16px 0; color: #2c2c34;">Hi ${name},</p>`;
  }

  private body(text: string): string {
    return `<p style="margin: 0 0 16px 0; color: #3d3d45;">${text}</p>`;
  }

  private muted(text: string): string {
    return `<p style="margin: 24px 0 0 0; color: #9e9ea6; font-size: 13px;">${text}</p>`;
  }

  private signOff(): string {
    return `
        <p style="margin: 24px 0 0 0; color: #2c2c34;">
          Best regards,<br/>
          <strong>The Kakcil AI Team</strong>
        </p>`;
  }

  // ===================================================
  // SIGN UP EMAIL
  // ===================================================

  getSignUpEmail(userName: string): {
    subject: string;
    message: string;
  } {
    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading("Welcome to Kakcil AI!")}
        ${this.greeting(userName)}
        ${this.body("We're thrilled to have you join our community! You've taken the first step towards experiencing the power of advanced AI conversations.")}
        ${this.featureBox(
          "Your Free Tier Includes:",
          `<li style="margin-bottom: 8px;">2 messages per day</li>
            <li style="margin-bottom: 8px;">100 messages per month</li>
            <li style="margin-bottom: 8px;">Up to 3 council members</li>`,
        )}
        ${this.body('Ready to unlock more? Upgrade to <strong>Plus</strong> or <strong>Pro</strong> for unlimited messaging and advanced features.')}
        ${this.brandButton(`${this.baseUrl}/chat`, "Get Started")}
        ${this.muted("If you have any questions, we're here to help!")}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: "Welcome to Kakcil AI - Let's Get Started!",
      message: this.createEmailTemplate(content),
    };
  }

  // ===================================================
  // EMAIL VERIFICATION
  // ===================================================

  getVerificationEmail(
    userName: string,
    verificationToken: string,
  ): {
    subject: string;
    message: string;
  } {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;

    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading("Verify Your Email Address")}
        ${this.greeting(userName)}
        ${this.body("Thanks for signing up for Kakcil AI! To complete your registration and start using our platform, please verify your email address.")}
        ${this.brandButton(verificationUrl, "Verify Email Address")}

        <p style="margin: 24px 0 12px 0; color: #9e9ea6; font-size: 13px;">
          Or copy and paste this link into your browser:
        </p>
        ${this.codeBlock(verificationUrl)}
        ${this.infoBox('<p style="margin: 0; color: #2c2c34; font-size: 14px;"><strong>This link will expire in 24 hours.</strong></p>')}
        ${this.muted("If you didn't create an account with Kakcil AI, you can safely ignore this email.")}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: "Verify Your Kakcil AI Email Address",
      message: this.createEmailTemplate(content),
    };
  }

  // ===================================================
  // FORGOT PASSWORD
  // ===================================================

  getForgotPasswordEmail(
    userName: string,
    resetToken: string,
  ): {
    subject: string;
    message: string;
  } {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;

    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading("Reset Your Password")}
        ${this.greeting(userName)}
        ${this.body("We received a request to reset your password for your Kakcil AI account. Click the button below to create a new password:")}
        ${this.brandButton(resetUrl, "Reset Password")}

        <p style="margin: 24px 0 12px 0; color: #9e9ea6; font-size: 13px;">
          Or copy and paste this link into your browser:
        </p>
        ${this.codeBlock(resetUrl)}
        ${this.infoBox(`
          <p style="margin: 0 0 8px 0; color: #2c2c34; font-size: 14px;">
            <strong>This link will expire in 1 hour.</strong>
          </p>
          <p style="margin: 0; color: #3d3d45; font-size: 14px;">
            For security reasons, please reset your password as soon as possible.
          </p>
        `)}
        ${this.noteBox(`
          <p style="margin: 0; color: #3d3d45; font-size: 14px;">
            <strong>Didn't request a password reset?</strong><br/>
            If you didn't request this, please ignore this email and your password will remain unchanged.
          </p>
        `)}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: "Reset Your Kakcil AI Password",
      message: this.createEmailTemplate(content),
    };
  }

  // ===================================================
  // SUBSCRIPTION SUCCESS
  // ===================================================

  getSubscriptionSuccessEmail(
    userName: string,
    tier: string,
    amount: number,
  ): {
    subject: string;
    message: string;
  } {
    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

    const features =
      tier === "plus"
        ? `<li style="margin-bottom: 8px;">500 messages per day</li>
            <li style="margin-bottom: 8px;">10,000 messages per month</li>
            <li style="margin-bottom: 8px;">Up to 10 council members</li>
            <li style="margin-bottom: 8px;">Access to advanced AI models</li>`
        : `<li style="margin-bottom: 8px;">Unlimited messages</li>
            <li style="margin-bottom: 8px;">Unlimited council members</li>
            <li style="margin-bottom: 8px;">Access to advanced AI models</li>
            <li style="margin-bottom: 8px;">Priority support</li>`;

    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading(`Welcome to ${tierName}!`)}
        ${this.greeting(userName)}
        ${this.body(`Thank you for subscribing to Kakcil AI <strong>${tierName}</strong>! Your subscription is now active.`)}
        ${this.featureBox("Your Plan Includes:", features)}

        <div style="background-color: #f0f0f2; border-radius: 8px; padding: 20px 24px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 4px 0; color: #9e9ea6; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
            Amount Paid
          </p>
          <p style="margin: 0; color: #2c2c34; font-size: 28px; font-weight: 700;">
            ₦${(amount / 100).toLocaleString()}
          </p>
        </div>

        ${this.brandButton(`${this.baseUrl}/dashboard`, "Start Using Your Plan")}
        ${this.muted("If you have any questions, feel free to reach out to our support team.")}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: `Welcome to Kakcil AI ${tierName}!`,
      message: this.createEmailTemplate(content),
    };
  }

  // ===================================================
  // SUBSCRIPTION CANCELLED
  // ===================================================

  getSubscriptionCancelledEmail(
    userName: string,
    endDate: Date,
  ): {
    subject: string;
    message: string;
  } {
    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading("Subscription Cancelled")}
        ${this.greeting(userName)}
        ${this.body("We're sorry to see you go. Your Kakcil AI subscription has been cancelled.")}
        ${this.infoBox(`<p style="margin: 0; color: #2c2c34; font-size: 14px;">Your subscription will remain active until <strong>${endDate.toLocaleDateString()}</strong>, after which you'll be moved to the free tier.</p>`)}
        ${this.featureBox(
          "Free Tier Includes:",
          `<li style="margin-bottom: 8px;">2 messages per day</li>
            <li style="margin-bottom: 8px;">100 messages per month</li>
            <li style="margin-bottom: 8px;">Up to 3 council members</li>`,
        )}
        ${this.body("You can resubscribe at any time from your account settings.")}
        ${this.brandButton(`${this.baseUrl}/pricing`, "View Plans")}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: "Your Kakcil AI Subscription Has Been Cancelled",
      message: this.createEmailTemplate(content),
    };
  }

  // ===================================================
  // PAYMENT FAILED
  // ===================================================

  getPaymentFailedEmail(userName: string): {
    subject: string;
    message: string;
  } {
    const content = `
      <div style="color: #3d3d45; font-size: 15px; line-height: 1.7;">
        ${this.heading("Payment Failed — Action Required")}
        ${this.greeting(userName)}
        ${this.body("We weren't able to process your subscription payment.")}
        ${this.infoBox('<p style="margin: 0; color: #2c2c34; font-size: 14px;"><strong>Action Required:</strong> Please update your payment method to continue enjoying Kakcil AI premium features.</p>')}
        ${this.brandButton(`${this.baseUrl}/settings/billing`, "Update Payment Method")}
        ${this.muted("If you have any questions, please contact our support team.")}
        ${this.signOff()}
      </div>
    `;

    return {
      subject: "Payment Failed - Action Required",
      message: this.createEmailTemplate(content),
    };
  }
}
