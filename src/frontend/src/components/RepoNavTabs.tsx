import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bug,
  Container,
  Cpu,
  GitPullRequest,
  TrendingUp,
} from "lucide-react";
import React from "react";

interface RepoNavTabsProps {
  owner: string;
  name: string;
}

const TAB_DEFINITIONS = (owner: string, name: string) => [
  { label: "Details", to: `/repo/${owner}/${name}`, icon: null },
  {
    label: "Star History",
    to: `/repo/${owner}/${name}/stars`,
    icon: TrendingUp,
  },
  {
    label: "Activity",
    to: `/repo/${owner}/${name}/activity`,
    icon: Activity,
  },
  { label: "Issues", to: `/repo/${owner}/${name}/issues`, icon: Bug },
  {
    label: "PR Pulse",
    to: `/repo/${owner}/${name}/pr-pulse`,
    icon: GitPullRequest,
  },
  { label: "CI/CD", to: `/repo/${owner}/${name}/cicd`, icon: Cpu },
  { label: "Docker", to: `/repo/${owner}/${name}/docker`, icon: Container },
];

export function RepoNavTabs({ owner, name }: RepoNavTabsProps) {
  const tabs = TAB_DEFINITIONS(owner, name);

  return (
    <div className="flex gap-1 mt-6 border-b border-border pb-0 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary/40 transition-colors whitespace-nowrap [&.active]:text-primary [&.active]:border-primary"
          activeProps={{ className: "text-primary border-primary" }}
          activeOptions={{ exact: true }}
        >
          {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default RepoNavTabs;
