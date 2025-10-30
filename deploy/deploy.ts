import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedGhostStake = await deploy("GhostStake", {
    from: deployer,
    log: true,
  });

  console.log(`GhostStake contract: `, deployedGhostStake.address);
};
export default func;
func.id = "deploy_ghostStake"; // id required to prevent reexecution
func.tags = ["GhostStake"];
