import Dockerode from "dockerode";
import { publicIpv4 } from "public-ip";
import { CronJob } from "cron";
import { containerEnvSchema } from "./env.js";
import { useCloudflare } from "./cloudflare.js";

const docker = new Dockerode();
const cloudflare = useCloudflare();

const cache = {
  ipv4: "",
  containerIds: [] as string[],
};

const job = new CronJob(
  //every minute
  "0 * * * * *",
  async () => {
    try {
      console.log("Running job");
      const ipv4 = await publicIpv4();
      if (cache.ipv4 === ipv4) return;
      cache.ipv4 = ipv4;

      const runningContainers = await docker.listContainers();

      const ids = runningContainers.map((container) => container.Id);
      const hasNewContainer = ids.filter((id) => !cache.containerIds.includes(id)).length > 0;
      if (!hasNewContainer) return;
      cache.containerIds = ids;

      for (const container of runningContainers) {
        const containerInfo = await docker.getContainer(container.Id).inspect();
        const env = await containerEnvSchema.safeParseAsync(
          Object.fromEntries(containerInfo.Config.Env.map((e) => e.split("="))),
        );

        if (!env.success) continue;

        await cloudflare.updateRecord({ domain: env.data.VIRTUAL_HOST, ipv4 });

        console.log(`Updated ${env.data.VIRTUAL_HOST} to ${ipv4}`);
      }
    } catch (e) {
      console.log(e);
    }
  },
);

job.start();
