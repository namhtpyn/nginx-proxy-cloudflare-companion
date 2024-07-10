import { publicIpv4 } from "public-ip";
import { CronJob } from "cron";
import { containerEnvSchema } from "./env.js";
import { useCloudflare } from "./cloudflare.js";
import { useDocker } from "./docker.js";

const cloudflare = useCloudflare();
const docker = useDocker();
let cacheRecords: Map<string,{ proxied: boolean, dateAdded: Date}> = new Map();

const job = new CronJob(
  //every minute
  "0 * * * * *",
  async () => {
    try {
      console.log("Running job");
      const ipv4 = await publicIpv4();
      const containers = await docker.getRunningContainers();
      const records = containers.flatMap((container) => {
          const env = containerEnvSchema.safeParse(Object.fromEntries(container.Config.Env.map((e) => e.split("="))));
          if (!env.success) return [];
          return  env.data.VIRTUAL_HOST.map(domain => ({ domain, proxied: !env.data.CF_PROXY_DISABLE}))
        })
      for (const { domain, proxied} of records) {
        if(cacheRecords.get(domain)?.proxied !== proxied) {
          try {
            await cloudflare.updateRecord({ domain, ipv4, proxied });
            console.log(`Updated ${domain} to ${ipv4}, proxied: ${proxied}`);
            cacheRecords.set(domain, { proxied, dateAdded: new Date() });
          } catch (e) {
            console.log(`failed ${domain} to ${ipv4}`);
            console.log(e);
          }
        }else
          cacheRecords.set(domain, { proxied, dateAdded: new Date() });
      }

      for(const [domain, { dateAdded }] of cacheRecords.entries()){
        if((new Date().getTime() - dateAdded.getTime()) > 300000){
          cacheRecords.delete(domain);
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
);

job.start();
