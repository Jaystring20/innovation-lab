/**
 * Shown instead of the app when the build has no Supabase credentials.
 *
 * Vite inlines VITE_* at build time, so a deploy that is missing them produces
 * a bundle that cannot talk to the backend at all. Better to say so plainly
 * than to render a blank page.
 */
const ConfigNotice: React.FC = () => (
  <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-6">
    <div className="max-w-md w-full rounded-xl border border-white/10 bg-slate-900/60 p-8">
      <h1 className="text-xl font-bold mb-3">Not configured yet</h1>
      <p className="text-sm text-slate-400 mb-4">
        This deployment is missing its Supabase credentials, so the Store and Lab
        cannot load. Set both of these environment variables in the hosting
        project, then redeploy:
      </p>
      <ul className="text-sm font-mono space-y-1 text-slate-300 mb-4">
        <li>VITE_SUPABASE_URL</li>
        <li>VITE_SUPABASE_ANON_KEY</li>
      </ul>
      <p className="text-xs text-slate-500">
        These are read at build time — adding them requires a fresh deploy, not
        just a restart.
      </p>
    </div>
  </div>
);

export default ConfigNotice;
