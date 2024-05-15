import Dockerode from "dockerode";
import { execSync } from "node:child_process";

export const useDocker = () => {
  const docker = new Dockerode();
  //get the id of the current container by executing the command `hostname` using shell
  const currentContainerId = execSync("hostname").toString().trim();

  const getRunningContainers = async () => {
    const containers = await docker.listContainers();
    const currentContainer = containers.find((container) => container.Id.startsWith(currentContainerId));
    if (!currentContainer) return [];

    const currentNetworks = Object.keys(currentContainer.NetworkSettings.Networks);

    const sameNetworkContainers = containers.filter(
      (container) =>
        container.Id !== currentContainer.Id &&
        Object.keys(container.NetworkSettings.Networks).some((network) => currentNetworks.includes(network)),
    );

    return await Promise.all(sameNetworkContainers.map((container) => docker.getContainer(container.Id).inspect()));
  };

  return {
    getRunningContainers,
  };
};
