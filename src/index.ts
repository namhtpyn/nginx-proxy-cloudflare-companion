import { publicIpv4 } from "public-ip";
import { CronJob } from "cron";
import { containerEnvSchema } from "./env.js";
import { useCloudflare } from "./cloudflare.js";
import { useDocker } from "./docker.js";

const cloudflare = useCloudflare();
const docker = useDocker();
let cacheDomains: string[] = [];

const job = new CronJob(
  //every minute
  "0 * * * * *",
  async () => {
    try {
      console.log("Running job");
      const ipv4 = await publicIpv4();
      const containers = await docker.getRunningContainers();
      const domains = new Set(
        containers.flatMap((container) => {
          const env = containerEnvSchema.safeParse(Object.fromEntries(container.Config.Env.map((e) => e.split("="))));
          if (!env.success) return [];
          return env.data.VIRTUAL_HOST;
        }),
      );

      const successDomains: string[] = [];
      for (const domain of domains) {
        if (cacheDomains.includes(domain)) continue;

        try {
          await cloudflare.updateRecord({ domain, ipv4 });
          console.log(`Updated ${domain} to ${ipv4}`);
          successDomains.push(domain);
        } catch (e) {
          console.log(`failed ${domain} to ${ipv4}`);
          console.log(e);
        }
      }

      //remove domains from cacheDomains that are not in domains and add successDomains
      cacheDomains = cacheDomains.filter((domain) => domains.has(domain)).concat(successDomains);

      for (const container of containers) {
        const env = await containerEnvSchema.safeParseAsync(
          Object.fromEntries(container.Config.Env.map((e) => e.split("="))),
        );

        if (!env.success) continue;

        for (const domain of env.data.VIRTUAL_HOST) {
          await cloudflare.updateRecord({ domain, ipv4 });
          console.log(`Updated ${domain} to ${ipv4}`);
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
);

job.start();
