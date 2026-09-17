import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';

const LAST_UPDATED = 'September 17, 2026';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Backdrop />
      <div className="relative z-10 max-w-2xl mx-auto px-5 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <header className="mb-8">
          <p className="text-sm font-semibold tracking-wider text-primary">
            APEN 2026 · STEAM FOUNDRY
          </p>
          <h1 className="text-2xl font-bold text-foreground mt-1">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mt-2">Last updated {LAST_UPDATED}</p>
        </header>

        <Panel hover={false} className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <Section title="Who operates this site">
            <p>
              STEAM Foundry and the APEN 2026 Innovation Store &amp; Lab are operated by{' '}
              <strong className="text-foreground">Imperial Educational Services Ltd</strong>. This
              policy explains what information we collect through the Store (school registration
              and kit orders) and the Lab (team submissions, judging, and feedback), and how we use
              it.
            </p>
          </Section>

          <Section title="Information we collect">
            <p>We collect information directly from the people who use this site:</p>
            <List
              items={[
                'School registration details — school name, state, address, and the registering contact’s name, email, and phone number.',
                'Teacher account details — name and email address, used to create a login for the Lab.',
                'Student names — provided by the registering teacher when setting up a team. We do not collect student email addresses, phone numbers, or other direct contact details; each team shares one login created for the group.',
                'Submission content — video pitch links or uploaded files, code/documentation links, and notes that teams submit for judging.',
                'Payment confirmation — proof-of-payment images or documents uploaded after a bank transfer, and messages sent to confirm payment over WhatsApp.',
                'Judge and organizer account details — name, email address, and role, for people who administer or judge the competition.',
              ]}
            />
          </Section>

          <Section title="A note about children’s information">
            <p>
              Some participating teams are primary-school students (ages 7–12). Students do not
              register themselves or create their own accounts — a teacher or school registers the
              school and enters student names on the team’s behalf. We collect first and last names
              only for students, never a direct contact method for a child, and each team’s
              submissions are accessed through one shared login managed by their teacher.
            </p>
          </Section>

          <Section title="How we use this information">
            <List
              items={[
                'To register schools and teams, create Store and Lab accounts, and run the competition (the 4-Stage Innovation Funnel through the Grand BATTLE).',
                'To send registration confirmations, payment instructions and receipts, login credentials, stage reminders, and judging feedback by email.',
                'To confirm payments and coordinate kit dispatch with the registering contact, including over WhatsApp when a school chooses to message us there.',
                'To let judges and organizers review, score, and provide feedback on team submissions.',
              ]}
            />
            <p>
              We do not sell personal information, and we do not use it for advertising.
            </p>
          </Section>

          <Section title="Where information is stored">
            <p>We use a small number of service providers to run the platform:</p>
            <List
              items={[
                'Supabase (database, authentication, and file storage) hosts registration, order, submission, and account data.',
                'Resend delivers the emails described above (confirmations, receipts, credentials, reminders).',
                'Google Drive stores uploaded submission files (video pitches, documents, code) in folders organized by team and stage, so organizers and judges can review them.',
              ]}
            />
            <p>
              Each provider only receives the information needed to perform its part of the
              service.
            </p>
          </Section>

          <Section title="Cookies and local storage">
            <p>
              The registration form temporarily saves what you have typed in your browser’s local
              storage, so your progress is not lost if the page is refreshed. This data stays on
              your device and is cleared once registration is submitted. We do not use tracking or
              advertising cookies.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep registration, order, and submission records for the duration of the APEN 2026
              competition season and a reasonable period afterward for record-keeping (for example,
              payment and dispatch history). If you would like your school’s or your child’s
              information removed sooner, contact us using the details below.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask us to access, correct, or delete the information we hold about your
              school, your account, or a student you registered. Contact the registering teacher or
              school if you are a student’s guardian and are not sure who registered your child’s
              team.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this page as the platform changes. We will update the “Last updated”
              date above when we do.
            </p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data can be sent to{' '}
              <a href="mailto:apen@digitalcreativeshubltd.com" className="text-primary hover:underline">
                apen@digitalcreativeshubltd.com
              </a>
              , or on WhatsApp at{' '}
              <a href="https://wa.me/2348038838094" className="text-primary hover:underline">
                +234 803 883 8094
              </a>
              .
            </p>
          </Section>
        </Panel>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
    <div className="space-y-2">{children}</div>
  </div>
);

const List: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default Privacy;
