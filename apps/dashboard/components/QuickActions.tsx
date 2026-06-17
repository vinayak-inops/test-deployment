import { CheckCircle, FileText, Award, Download, Shield, Users } from 'lucide-react';

const actions = [
  {
    icon: CheckCircle,
    title: 'Approve Contracts',
    description: '3 pending approvals',
    color: 'blue',
    count: 3,
  },
  {
    icon: FileText,
    title: 'View Audit Reports',
    description: 'Latest compliance audit',
    color: 'emerald',
    count: null,
  },
  {
    icon: Award,
    title: 'View Vendor Scorecard',
    description: 'Q4 2024 performance',
    color: 'orange',
    count: null,
  },
  {
    icon: Download,
    title: 'Download Compliance Summary',
    description: 'November 2024 report',
    color: 'purple',
    count: null,
  },
  {
    icon: Shield,
    title: 'Review Safety Report',
    description: '2 new incidents',
    color: 'red',
    count: 2,
  },
  {
    icon: Users,
    title: 'Approve Manpower Plans',
    description: '5 deployment requests',
    color: 'teal',
    count: 5,
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-500',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-100 hover:border-blue-300',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600',
    hover: 'hover:bg-emerald-100 hover:border-emerald-300',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'bg-orange-500',
    text: 'text-orange-600',
    hover: 'hover:bg-orange-100 hover:border-orange-300',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-500',
    text: 'text-purple-600',
    hover: 'hover:bg-purple-100 hover:border-purple-300',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'bg-red-500',
    text: 'text-red-600',
    hover: 'hover:bg-red-100 hover:border-red-300',
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: 'bg-teal-500',
    text: 'text-teal-600',
    hover: 'hover:bg-teal-100 hover:border-teal-300',
  },
};

export function QuickActions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-slate-700 rounded-lg p-2.5">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">CHRO Quick Actions</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => {
          const colors = colorClasses[action.color as keyof typeof colorClasses];
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className={`relative ${colors.bg} ${colors.border} border-2 rounded-xl p-6 text-left transition-all duration-300 ${colors.hover} group`}
            >
              {action.count && (
                <div className="absolute top-4 right-4">
                  <span className="flex items-center justify-center w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full">
                    {action.count}
                  </span>
                </div>
              )}

              <div className={`${colors.icon} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className={`text-lg font-bold ${colors.text} mb-2`}>{action.title}</h3>
              <p className="text-sm text-slate-600">{action.description}</p>

              <div className="mt-4 flex items-center gap-2">
                <span className={`text-sm font-medium ${colors.text}`}>Take action</span>
                <svg
                  className={`w-4 h-4 ${colors.text} group-hover:translate-x-1 transition-transform duration-300`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Need Assistance?</h3>
        <p className="text-sm text-slate-300 mb-4">
          Contact HR Operations team for support with dashboard insights, data discrepancies, or
          urgent workforce matters.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            Contact Support
          </button>
          <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
            View Documentation
          </button>
          <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors">
            Schedule Review
          </button>
        </div>
      </div>
    </div>
  );
}
