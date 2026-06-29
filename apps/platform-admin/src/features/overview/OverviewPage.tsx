import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOverview } from '@officing/api-client';
import { Card } from '../../components/ui/Card';

export function OverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: getOverview });
  const d = data?.overview;

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-xl font-semibold">Overview</h2>
      {isLoading ? <p className="text-gray-400">Loading…</p> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Tenants', value: d?.totalTenants ?? 0 },
              { label: 'Active', value: d?.active ?? 0 },
              { label: 'Deactivated', value: d?.deactivated ?? 0 },
              { label: 'Provisioning', value: d?.provisioning ?? 0 },
              { label: 'Suspended', value: d?.suspended ?? 0 },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          {d?.byPlan && (
            <Card title="Tenants by Plan">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(d.byPlan).map(([plan, count]) => (
                  <div key={plan} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 capitalize">{plan}</p>
                    <p className="text-xl font-bold">{String(count)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
