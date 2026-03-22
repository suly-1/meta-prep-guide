import { publicProcedure, router } from "../_core/trpc";

const GITHUB_OWNER = "suly-1";
const GITHUB_REPO = "meta-prep-guide";
const WORKFLOW_ID = "249634319"; // pages-build-deployment workflow

export const deployStatusRouter = router({
  latest: publicProcedure.query(async () => {
    try {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/runs?per_page=1`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "meta-prep-guide-app",
        },
      });

      if (!res.ok) {
        return {
          status: "unknown" as const,
          conclusion: null,
          runUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
          createdAt: null,
          commitSha: null,
        };
      }

      const data = await res.json();
      const run = data.workflow_runs?.[0];

      if (!run) {
        return {
          status: "unknown" as const,
          conclusion: null,
          runUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
          createdAt: null,
          commitSha: null,
        };
      }

      return {
        // status: "queued" | "in_progress" | "completed" | "waiting" | "requested"
        status: run.status as string,
        // conclusion: "success" | "failure" | "cancelled" | "skipped" | null (null when in_progress)
        conclusion: run.conclusion as string | null,
        runUrl: run.html_url as string,
        createdAt: new Date(run.created_at as string),
        commitSha: (run.head_sha as string)?.slice(0, 7) ?? null,
      };
    } catch {
      return {
        status: "unknown" as const,
        conclusion: null,
        runUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
        createdAt: null,
        commitSha: null,
      };
    }
  }),
});
