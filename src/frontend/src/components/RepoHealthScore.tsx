import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, GitFork, Scale, Shield, Star, Users } from "lucide-react";
import type React from "react";
import type { Repository } from "../types/github";

interface HealthFactor {
  label: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  detail: string;
}

function computeHealthFactors(repo: Repository): HealthFactor[] {
  const factors: HealthFactor[] = [];

  // Popularity (max 25)
  let popularityScore = 0;
  if (repo.stargazers_count >= 10000) popularityScore = 25;
  else if (repo.stargazers_count >= 5000) popularityScore = 22;
  else if (repo.stargazers_count >= 1000) popularityScore = 18;
  else if (repo.stargazers_count >= 500) popularityScore = 14;
  else if (repo.stargazers_count >= 100) popularityScore = 10;
  else if (repo.stargazers_count >= 10) popularityScore = 5;
  else popularityScore = 2;
  factors.push({
    label: "Popularity",
    score: popularityScore,
    maxScore: 25,
    icon: Star,
    detail: `${repo.stargazers_count.toLocaleString()} stars`,
  });

  // Community engagement (max 25)
  let communityScore = 0;
  const forkRatio =
    repo.stargazers_count > 0 ? repo.forks_count / repo.stargazers_count : 0;
  if (forkRatio >= 0.3) communityScore += 12;
  else if (forkRatio >= 0.15) communityScore += 9;
  else if (forkRatio >= 0.05) communityScore += 6;
  else communityScore += 3;
  if (repo.forks_count >= 100) communityScore += 8;
  else if (repo.forks_count >= 50) communityScore += 6;
  else if (repo.forks_count >= 10) communityScore += 4;
  else communityScore += 1;
  communityScore +=
    repo.watchers_count >= 100 ? 5 : repo.watchers_count >= 10 ? 3 : 1;
  communityScore = Math.min(communityScore, 25);
  factors.push({
    label: "Community",
    score: communityScore,
    maxScore: 25,
    icon: Users,
    detail: `${repo.forks_count.toLocaleString()} forks, ${repo.watchers_count.toLocaleString()} watchers`,
  });

  // Maintenance / freshness (max 25)
  let maintenanceScore = 0;
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000,
  );
  if (daysSinceUpdate <= 7) maintenanceScore = 25;
  else if (daysSinceUpdate <= 30) maintenanceScore = 20;
  else if (daysSinceUpdate <= 90) maintenanceScore = 14;
  else if (daysSinceUpdate <= 180) maintenanceScore = 8;
  else if (daysSinceUpdate <= 365) maintenanceScore = 4;
  else maintenanceScore = 1;
  factors.push({
    label: "Maintenance",
    score: maintenanceScore,
    maxScore: 25,
    icon: Activity,
    detail:
      daysSinceUpdate <= 1
        ? "Updated today"
        : `Updated ${daysSinceUpdate}d ago`,
  });

  // Project maturity (max 25)
  let maturityScore = 0;
  if (repo.license) maturityScore += 8;
  else maturityScore += 1;
  if (repo.description) maturityScore += 4;
  if (repo.topics && repo.topics.length >= 3) maturityScore += 5;
  else if (repo.topics && repo.topics.length >= 1) maturityScore += 3;
  const ageInDays = Math.floor(
    (Date.now() - new Date(repo.created_at).getTime()) / 86400000,
  );
  if (ageInDays >= 365) maturityScore += 8;
  else if (ageInDays >= 180) maturityScore += 6;
  else if (ageInDays >= 30) maturityScore += 3;
  else maturityScore += 1;
  maturityScore = Math.min(maturityScore, 25);
  factors.push({
    label: "Maturity",
    score: maturityScore,
    maxScore: 25,
    icon: Shield,
    detail: repo.license ? `License: ${repo.license.name}` : "No license",
  });

  return factors;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Needs Work";
  return "Low";
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return "border-green-400/30";
  if (score >= 60) return "border-emerald-400/30";
  if (score >= 40) return "border-yellow-400/30";
  if (score >= 20) return "border-orange-400/30";
  return "border-red-400/30";
}

interface RepoHealthScoreProps {
  repo: Repository;
  compact?: boolean;
}

export function RepoHealthScore({
  repo,
  compact = false,
}: RepoHealthScoreProps) {
  const factors = computeHealthFactors(repo);
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const colorClass = getScoreColor(totalScore);
  const label = getScoreLabel(totalScore);
  const borderClass = getScoreBorderColor(totalScore);

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${borderClass} bg-card/50 cursor-default`}
          >
            <Scale className={`w-3 h-3 ${colorClass}`} />
            <span className={`font-mono text-xs font-semibold ${colorClass}`}>
              {totalScore}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-mono text-xs">
            Health Score: {totalScore}/100 ({label})
          </p>
          <div className="mt-1 space-y-0.5">
            {factors.map((f) => (
              <div
                key={f.label}
                className="flex justify-between text-xs text-muted-foreground"
              >
                <span>{f.label}</span>
                <span>
                  {f.score}/{f.maxScore}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`rounded-xl border ${borderClass} bg-card/30 p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className={`w-4 h-4 ${colorClass}`} />
          <h3 className="font-mono font-semibold text-sm text-foreground">
            Health Score
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-2xl font-bold ${colorClass}`}>
            {totalScore}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalScore >= 80
                ? "bg-green-400"
                : totalScore >= 60
                  ? "bg-emerald-400"
                  : totalScore >= 40
                    ? "bg-yellow-400"
                    : totalScore >= 20
                      ? "bg-orange-400"
                      : "bg-red-400"
            }`}
            style={{ width: `${totalScore}%` }}
          />
        </div>
        <p className={`text-xs font-mono mt-1 ${colorClass}`}>{label}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {factors.map((factor) => (
          <div
            key={factor.label}
            className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30"
          >
            <factor.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-foreground">
                  {factor.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {factor.score}/{factor.maxScore}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {factor.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RepoHealthScore;
