import Cloudflare from "cloudflare";
import { getDomain } from "tldts";

export const useCloudflare = () => {
  const cloudflare = new Cloudflare();

  const updateRecord = async (params: { domain: string; ipv4: string }) => {
    const zoneName = getDomain(params.domain);
    if (!zoneName) return;

    const zone = await cloudflare.zones.list({ name: zoneName }).then((zones) => zones.result.at(0));
    if (!zone) return;

    const record = await cloudflare.dns.records
      .list({ zone_id: zone.id, name: params.domain, type: "A" })
      .then((records) => records.result.at(0));

    if (record?.id) {
      await cloudflare.dns.records.edit(record?.id, {
        zone_id: zone.id,
        name: params.domain,
        content: params.ipv4,
        proxied: true,
        type: "A",
      });
    } else {
      await cloudflare.dns.records.create({
        zone_id: zone.id,
        name: params.domain,
        content: params.ipv4,
        proxied: true,
        type: "A",
      });
    }
  };

  return {
    updateRecord,
  };
};
