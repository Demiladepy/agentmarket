import { useState, useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { jobMarketAddress } from "../config";
import { jobMarketAbi } from "../abis";
import { Hero } from "../components/Hero";
import { FilterBar, filterAndSortJobs, type SortOption } from "../components/FilterBar";
import { JobCard, type JobCardData } from "../components/JobCard";
import { useToast } from "../contexts/ToastContext";

type JobsProps = { showHero?: boolean; dashboardMode?: boolean };

export function Jobs({ showHero = true, dashboardMode = false }: JobsProps) {
  const { address } = useAccount();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  const enabled = !!jobMarketAddress;
  const { data: count } = useReadContracts({
    contracts: enabled ? [{ address: jobMarketAddress, abi: jobMarketAbi, functionName: "getJobCount" }] : [],
    query: { enabled },
  });
  const n = count?.[0]?.result as bigint | undefined;
  const len = n !== undefined ? Number(n) : 0;

  const jobIdContracts =
    enabled && len > 0 && jobMarketAddress
      ? Array.from({ length: len }, (_, i) => ({
          address: jobMarketAddress,
          abi: jobMarketAbi,
          functionName: "getJobIdAt" as const,
          args: [BigInt(i)] as const,
        }))
      : [];

  const { data: jobIds } = useReadContracts({
    contracts: jobIdContracts,
    query: { enabled: enabled && len > 0 },
  });

  const jobContracts =
    jobIds?.map((r, _i) =>
      r?.result && jobMarketAddress
        ? {
            address: jobMarketAddress,
            abi: jobMarketAbi,
            functionName: "getJob" as const,
            args: [r.result as `0x${string}`] as const,
          }
        : null
    ).filter((c): c is NonNullable<typeof c> => c != null) ?? [];

  const { data: jobsData } = useReadContracts({
    contracts: jobContracts,
    query: { enabled: enabled && jobContracts.length > 0 },
  });

  const jobs: (JobCardData & { orderIndex: number })[] = useMemo(() => {
    const list: (JobCardData & { orderIndex: number })[] = [];
    jobsData?.forEach((res, i) => {
      const job = res?.result as [string, string, string, bigint, number] | undefined;
      const jobId = jobIds?.[i]?.result as `0x${string}` | undefined;
      if (!job || !jobId) return;
      const [client, agent, taskDescription, payment, status] = job;
      list.push({
        jobId,
        client,
        agent,
        taskDescription,
        payment,
        status,
        orderIndex: (jobIds?.length ?? 0) - 1 - i,
      });
    });
    return list;
  }, [jobsData, jobIds]);

  const filteredJobs = useMemo(() => {
    let list = filterAndSortJobs(jobs, {
      search,
      statusFilter,
      sort,
      getDescription: (j) => j.taskDescription,
      getStatus: (j) => j.status,
      getPayment: (j) => j.payment,
      getIndex: (j) => (j as JobCardData & { orderIndex: number }).orderIndex,
    });
    if (dashboardMode && address) {
      list = list.filter(
        (j) =>
          j.client.toLowerCase() === address.toLowerCase() ||
          j.agent.toLowerCase() === address.toLowerCase()
      );
    }
    return list;
  }, [jobs, search, statusFilter, sort, dashboardMode, address]);

  const handleTxSuccess = () => {
    addToast("Transaction submitted. It may take a moment to reflect.", "success");
  };

  if (!jobMarketAddress) {
    return (
      <div className="card">
        <p>AgentMarket not configured. Deploy contracts and set VITE_JOB_MARKET_ADDRESS in .env.</p>
      </div>
    );
  }

  return (
    <div>
      {showHero && <Hero />}
      <section className="container" style={showHero ? { paddingTop: "var(--space-6)" } : undefined}>
        <div className="page-header">
          <h1 className="page-title">{dashboardMode ? "My jobs" : "Browse jobs"}</h1>
          <p className="page-desc">
            {dashboardMode
              ? "Jobs where you are the client or the agent."
              : "Discover open tasks. Accept jobs, complete work, get paid in MON."}
          </p>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
          totalCount={filteredJobs.length}
        />

        {len === 0 && (
          <div className="empty-state">
            <p>No jobs yet. Post one from the Post Job page.</p>
          </div>
        )}

        {len > 0 && filteredJobs.length === 0 && (
          <div className="empty-state">
            <p>No jobs match your filters. Try adjusting search or status.</p>
          </div>
        )}

        {filteredJobs.length > 0 && (
          <div className="jobs-grid">
            {filteredJobs.map((job, i) => (
              <JobCard
                key={job.jobId}
                job={job}
                index={i}
                onSuccess={handleTxSuccess}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
