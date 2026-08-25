import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">Last updated: August 25, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our personal finance application.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Financial data is sensitive by nature. We have designed FinTrack AI with privacy as a core principle — collecting only what is necessary and giving you full control over your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Email address (used for authentication only)</li>
              <li>Name (displayed within the app only)</li>
              <li>Password (stored as a one-way hash — we cannot read it)</li>
              <li>User type (student, professional, or general)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Financial Data You Enter</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Transaction records (amounts, descriptions, categories, dates)</li>
              <li>Budgets and savings goals</li>
              <li>Recurring expenses and subscriptions</li>
              <li>Financial profile (income, occupation)</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">Technical Data</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Browser type and version</li>
              <li>Device information (for responsive design)</li>
              <li>Usage patterns within the app (for improving UX)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information solely to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Authenticate your identity and protect your account</li>
              <li>Generate financial insights and analytics (processed locally or on our servers, never shared)</li>
              <li>Improve the Service and user experience</li>
              <li>Communicate important updates about the Service</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We do <strong>not</strong> use your financial data for advertising, marketing, profiling, or any purpose other than providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption. When using Convex (our database provider), data is encrypted in transit and at rest. When using local storage mode, data stays on your device.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">Security measures include:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>SHA-256 password hashing with unique salts</li>
              <li>HTTPS encryption for all data in transit</li>
              <li>User data isolation — each account&apos;s data is completely separate</li>
              <li>No plaintext password storage</li>
              <li>No secrets or API keys exposed to the client</li>
              <li>CSV export sanitization to prevent formula injection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>We do not sell, trade, or share your financial data with any third parties.</strong>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We may share limited, anonymized, and aggregated data for research purposes only, and only with your explicit consent. No individual user can be identified from aggregated data.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">Limited data sharing may occur only when:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Required by law or legal process</li>
              <li>Necessary to protect our rights or safety</li>
              <li>In connection with a merger or acquisition (with prior notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li><strong>Access</strong> — View all your data at any time within the app</li>
              <li><strong>Export</strong> — Download your data as CSV or JSON</li>
              <li><strong>Edit</strong> — Modify any data you&apos;ve entered</li>
              <li><strong>Delete</strong> — Permanently delete your account and all data through Settings</li>
              <li><strong>Portability</strong> — Export your data in standard formats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. ML and Automated Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service uses machine learning to provide:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Automatic expense categorization from descriptions</li>
              <li>Spending forecasts based on historical patterns</li>
              <li>Budget risk assessment</li>
              <li>Unusual transaction detection</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These models process your data only to generate insights for you. Your data is never used to train models for other users or external purposes. Anomaly detection results are labeled as &quot;unusual&quot; or &quot;unexpected&quot; — never as &quot;fraud&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI uses only essential cookies required for authentication and session management. We do not use advertising cookies, tracking pixels, or third-party analytics scripts. We do not sell your browsing data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service uses Convex as its database and backend provider. Convex&apos;s privacy policy governs how they handle data in transit and at rest. We do not integrate with any advertising, social media, or data broker services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data may be processed in the country where Convex operates its infrastructure. We ensure that appropriate safeguards are in place to protect your data regardless of where it is processed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated through the Service or by email. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this Privacy Policy or your data, please contact us through the application or open an issue on our GitHub repository. For data deletion requests, use the Settings page within the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
