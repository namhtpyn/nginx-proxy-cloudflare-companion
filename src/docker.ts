import Dockerode from "dockerode";

export const useDocker = () => {
  const docker = new Dockerode();

  const getRunningContainers = async () => {
    const containers = await docker.listContainers();
    return await Promise.all(containers.map((container) => docker.getContainer(container.Id).inspect()));
  };

  return {
    getRunningContainers,
  };
};
