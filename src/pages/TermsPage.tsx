import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Terms of Service</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">Last updated: August 25, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using FinTrack AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the Service. These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI is a personal finance and budgeting tool that helps users track income, expenses, budgets, and savings goals. The Service includes ML-powered financial insights such as expense categorization, spending forecasts, and budget risk assessments.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>FinTrack AI is not a bank, financial institution, or licensed financial advisor.</strong> The Service does not hold, transfer, or manage real money. All financial data entered is user-generated and user-managed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 13 years of age to use the Service. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Account Registration</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use the Service, you must create an account with a valid email and password. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Maintaining the confidentiality of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Financial Data and Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              All financial data in the Service is entered by you. We do not verify the accuracy of your entries. The Service provides tools for tracking and analysis, but all financial decisions remain your sole responsibility.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              ML-powered insights, forecasts, and predictions are estimates based on historical patterns and should not be treated as guaranteed financial outcomes or professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Upload malicious content or code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its design, code, and content, is owned by FinTrack AI and protected by copyright and intellectual property laws. You retain ownership of data you enter into the Service. You grant us a limited license to process your data solely for providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data and Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your financial data is yours. We do not sell, share, or monetize your personal financial information. See our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details on how we handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, FinTrack AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim, or ₹0 if you used the Service for free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may terminate your account at any time through the Settings page. We may suspend or terminate your access at our discretion, with or without cause. Upon termination, your right to use the Service ceases immediately. You may request data deletion through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Material changes will be communicated through the Service or by email. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us through the application or open an issue on our GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
