import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Layout'
import Icon from '../components/Icon'
import { APP_NAME, COMPANY_NAME, SUPPORT_EMAIL, LEGAL_UPDATED } from '../config'
import { useAuth } from '../lib/auth'

const Mail = () => <a className="link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>

function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="muted small">Last updated: {LEGAL_UPDATED}</p>
      <p>This policy explains what information {APP_NAME} (“we”, “us”) collects when you use the {APP_NAME} app and website, how we use it, and the choices you have.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><b>Account information:</b> your name, email address and, if you sign in with Google, your profile photo.</li>
        <li><b>Profile and preferences:</b> your interests, experience level, display settings and notification choices.</li>
        <li><b>Learning activity:</b> lessons and peptide pages you read, reading progress, bookmarks, reading plan, XP, level and streak.</li>
        <li><b>Content you create:</b> community posts and replies (visible to other signed-in members, with your name and tier badge), and your private experience log (visible only to you).</li>
        <li><b>Usage analytics:</b> pages you view, time spent in the app, device type (mobile or desktop), and dates and times of use.</li>
        <li><b>Approximate location:</b> the city and country you connect from, estimated from your IP address by our hosting provider. We do not use GPS or request precise location.</li>
        <li><b>Push notification tokens:</b> if you turn on notifications, a device token so we can send them.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To provide the app: your account, progress, streaks, reading suggestions and community features.</li>
        <li>To send notifications you have turned on (daily reminders, updates, community replies).</li>
        <li>To understand how the app is used and improve it. App administrators can view account details, usage analytics and approximate location for each user.</li>
        <li>To keep the community safe, including removing content that breaks the rules.</li>
      </ul>
      <p>We do not sell your personal information and we do not show third-party advertising.</p>

      <h2>Service providers</h2>
      <p>We use Google Firebase (authentication, database and push notifications) and Vercel (hosting). They process data on our behalf under their own security and privacy terms. Data may be stored and processed outside your country.</p>

      <h2>Retention and deletion</h2>
      <p>We keep your information while your account is active. You can delete your account at any time in <b>Profile → Delete my account</b>. This permanently removes your profile, progress, reading plan, experience log, usage analytics and community posts. Replies you made on other members’ posts may remain unless you ask us to remove them. You can also request deletion by emailing <Mail />.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Turn notifications on or off in Profile → Settings, or in your device settings.</li>
        <li>Update your name and interests in Profile.</li>
        <li>Depending on where you live, you may have rights to access, correct, export or delete your data. Contact <Mail /> and we will respond within 30 days.</li>
      </ul>

      <h2>Children</h2>
      <p>{APP_NAME} is intended for adults aged 18 and over. We do not knowingly collect information from anyone under 18.</p>

      <h2>Security</h2>
      <p>Data is transmitted over encrypted connections (HTTPS) and protected by access rules so that only you, and app administrators where described above, can see your personal data. No system is completely secure, so please use a strong password.</p>

      <h2>Changes</h2>
      <p>We may update this policy. We will change the date above and, for significant changes, notify you in the app.</p>

      <h2>Contact</h2>
      <p>Questions about privacy: <Mail /></p>
    </>
  )
}

function Terms() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="muted small">Last updated: {LEGAL_UPDATED}</p>
      <p>By creating an account or using {APP_NAME}, you agree to these terms. If you do not agree, please do not use the app.</p>

      <h2>1. Educational use only. Not medical advice</h2>
      <p>{APP_NAME} is a research and education reference. Information about peptides, including research summaries, reported protocols, evidence grades, regulatory status and calculator results, is provided for <b>educational purposes only</b>. It is not medical advice, diagnosis or treatment, and it is not a recommendation to use any substance. Many compounds described are not approved for human use in your country. Always consult a qualified, licensed healthcare professional before making any health decision.</p>

      <h2>2. Calculators</h2>
      <p>Calculator results are mathematical estimates based on the numbers you enter. They may be wrong if inputs are wrong. You are solely responsible for verifying any calculation with a qualified professional.</p>

      <h2>3. Eligibility</h2>
      <p>You must be at least 18 years old to use {APP_NAME}.</p>

      <h2>4. Your account</h2>
      <p>Keep your login details secure. You are responsible for activity on your account. You can delete your account at any time in Profile.</p>

      <h2>5. Community rules</h2>
      <ul>
        <li>Be respectful. No harassment, hate speech or personal attacks.</li>
        <li>No selling, sourcing, or offering to supply any substance.</li>
        <li>No links, phone numbers, emails or other contact details (members only; app administrators may share links).</li>
        <li>Do not give personal medical advice or post anything illegal.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules. You keep ownership of what you post, and you give us permission to display it in the app.</p>

      <h2>6. Content and accuracy</h2>
      <p>We work to keep content accurate and up to date, but research and regulations change. We make no guarantee that content is complete, current or error-free.</p>

      <h2>7. Limitation of liability</h2>
      <p>To the fullest extent permitted by law, {COMPANY_NAME} is not liable for any loss or harm arising from your use of the app or reliance on its content. The app is provided “as is”.</p>

      <h2>8. Changes</h2>
      <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>

      <h2>9. Contact</h2>
      <p><Mail /></p>
    </>
  )
}

function Support() {
  const faqs = [
    ['I didn’t get the verification email', 'Check your spam/junk folder. On the verify screen, tap “Resend verification email”. You can also sign in with Google instead.'],
    ['I forgot my password', 'On the login page, enter your email and tap “Forgot password?”. We’ll email you a reset link.'],
    ['How do I turn notifications on or off?', 'Go to Profile → Settings → Notifications. On iPhone, first add the app to your Home Screen (Share → Add to Home Screen) and open it from there.'],
    ['How do I install the app on my phone?', 'iPhone: open the site in Safari → Share → Add to Home Screen. Android: open it in Chrome → menu → Install app / Add to Home screen.'],
    ['How do I delete my account?', 'Go to Profile → Delete my account. This permanently deletes your data. You may need to log in again first.'],
    ['Is this medical advice?', 'No. PepVella is an educational reference only. Always speak to a qualified healthcare professional.'],
  ]
  return (
    <>
      <h1>Support</h1>
      <p>Need help with {APP_NAME}? Email us and we’ll get back to you as soon as possible, usually within 2 business days.</p>
      <a className="btn" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(APP_NAME + ' support')}`} style={{ alignSelf: 'flex-start', margin: '6px 0 10px' }}>
        <Icon name="megaphone" size={18} /> Email {SUPPORT_EMAIL}
      </a>
      <h2>Frequently asked questions</h2>
      <div className="stack">
        {faqs.map(([q, a]) => (
          <details key={q} className="card flat faq">
            <summary><b>{q}</b></summary>
            <p className="small muted" style={{ marginTop: 8 }}>{a}</p>
          </details>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>See also our <Link className="link" to="/privacy">Privacy Policy</Link> and <Link className="link" to="/terms">Terms of Use</Link>.</p>
    </>
  )
}

/** Public pages (no login needed). Required for app-store listings. */
export default function Legal({ page }) {
  const nav = useNavigate()
  const { user } = useAuth()
  const Body = { privacy: Privacy, terms: Terms, support: Support }[page] || Support
  return (
    <div className="legal">
      <header className="legal-top">
        <button className="icon-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav(user ? '/' : '/login'))} aria-label="Back"><Icon name="back" /></button>
        <Link to={user ? '/' : '/login'}><Brand /></Link>
      </header>
      <article className="legal-body fade-up"><Body /></article>
      <footer className="legal-foot tiny muted">
        <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/support">Support</Link>
        <div style={{ marginTop: 6 }}>© {new Date().getFullYear()} {COMPANY_NAME}</div>
      </footer>
    </div>
  )
}
