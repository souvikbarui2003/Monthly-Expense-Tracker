import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Community Guidelines</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">Last updated: August 25, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">Purpose</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI is a tool built to help people manage their finances more effectively. These guidelines help ensure a safe, respectful, and productive experience for everyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Use the Service Responsibly</h2>
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <p><strong>Do:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter accurate financial data for meaningful insights</li>
                <li>Use the Service for personal budgeting and financial tracking</li>
                <li>Keep your account credentials secure</li>
                <li>Review ML-generated insights critically before making financial decisions</li>
              </ul>
              <p className="mt-2"><strong>Don&apos;t:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter fabricated data to manipulate insights or test limits excessively</li>
                <li>Use the Service for business accounting (use dedicated accounting software instead)</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to exploit or bypass security measures</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Understand Financial Insights</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI provides automated financial insights powered by machine learning. It is important to understand what these insights are and are not:
            </p>
            <div className="rounded-lg bg-muted/50 p-4 mt-3 space-y-2">
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-muted-foreground">Budget tracking and spending visualization</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-muted-foreground">Historical spending pattern analysis</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-muted-foreground">Automatic expense categorization</span>
              </div>
              <div className="flex gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-muted-foreground">Spending trend notifications</span>
              </div>
              <div className="flex gap-2 mt-3">
                <span className="text-red-600 font-bold">✗</span>
                <span className="text-muted-foreground">Investment advice or recommendations</span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span className="text-muted-foreground">Guaranteed financial outcomes or predictions</span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span className="text-muted-foreground">Tax preparation or filing assistance</span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span className="text-muted-foreground">Licensed financial advisory services</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Always consult a qualified financial professional for investment, tax, or major financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Entry Best Practices</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <div>
                <h4 className="font-medium text-foreground">Be Consistent</h4>
                <p>Use consistent category names and payment methods. This helps the ML models provide better categorization and insights.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Enter Data Regularly</h4>
                <p>The more data you enter, the more accurate forecasts and insights become. Try to log transactions within a day or two.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Use Descriptive Names</h4>
                <p>Instead of &quot;Purchase&quot;, use &quot;Swiggy dinner&quot; or &quot;Uber to office&quot;. This helps the automatic categorization work better.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Set Realistic Budgets</h4>
                <p>Start with slightly generous budgets and tighten them over time. Unrealistic budgets lead to constant alerts and desensitization.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Review Insights Critically</h4>
                <p>ML predictions are estimates, not guarantees. Use them as one input among many in your financial decisions.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Student Mode Guidelines</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI is particularly designed for students. If you are using Student Mode:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Track your monthly allowance, scholarship, and part-time income separately</li>
              <li>Set up semester budgets aligned with your academic calendar</li>
              <li>Include education-related expenses (tuition, books, courses) for accurate tracking</li>
              <li>Monitor recurring costs like hostel, food, and transport</li>
              <li>Set savings goals for post-graduation expenses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. CSV Import Guidelines</h2>
            <p className="text-muted-foreground leading-relaxed">
              When importing transactions from CSV files:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Ensure headers match: date, description, merchant, category, type, amount, payment_method</li>
              <li>Use ISO date format (YYYY-MM-DD) for reliable parsing</li>
              <li>Transaction type must be &quot;income&quot; or &quot;expense&quot;</li>
              <li>Preview imported data before confirming</li>
              <li>Check for duplicate entries after import</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Account Security</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Use a unique, strong password (at least 8 characters)</li>
              <li>Do not share your account with others</li>
              <li>Log out on shared devices</li>
              <li>Report any suspicious activity immediately</li>
              <li>Use the Settings page to delete your account if you no longer need the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Reporting Issues</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter bugs, security vulnerabilities, or have suggestions:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Open an issue on our GitHub repository</li>
              <li>For security vulnerabilities, follow responsible disclosure (see our <Link to="/security" className="text-primary hover:underline">Security Policy</Link>)</li>
              <li>Include steps to reproduce for bug reports</li>
              <li>Be specific about device, browser, and actions taken</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Open Source Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              FinTrack AI is open source. Contributors are expected to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Be respectful and constructive in discussions</li>
              <li>Review the CONTRIBUTING.md before submitting pull requests</li>
              <li>Follow the established code style and conventions</li>
              <li>Write clear commit messages and PR descriptions</li>
              <li>Test changes before submitting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to Guidelines</h2>
            <p className="text-muted-foreground leading-relaxed">
              These guidelines may be updated as the Service evolves. Check this page periodically for changes. Continued use of the Service implies acceptance of updated guidelines.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
