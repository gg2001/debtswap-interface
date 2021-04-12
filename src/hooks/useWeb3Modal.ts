import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

const INFURA_ID: string = "INVALID_INFURA_KEY";

const NETWORK_NAME: string = "mainnet";

interface Config {
  autoLoad: boolean;
  infuraId: string;
  NETWORK: string;
}

function useWeb3Modal(
  config: Config = {
    autoLoad: true,
    infuraId: INFURA_ID,
    NETWORK: NETWORK_NAME,
  }
): [
  ethers.providers.Web3Provider | undefined,
  CallableFunction,
  CallableFunction
] {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  const [autoLoaded, setAutoLoaded] = useState<boolean>(false);
  const { autoLoad, infuraId, NETWORK }: Config = config;

  // Web3Modal also supports many other wallets.
  // You can see other options at https://github.com/Web3Modal/web3modal
  const web3Modal: Web3Modal = new Web3Modal({
    network: NETWORK,
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId,
        },
      },
    },
  });

  // Open wallet selection modal.
  const loadWeb3Modal: CallableFunction = useCallback(async () => {
    const newProvider = await web3Modal.connect();
    setProvider(new ethers.providers.Web3Provider(newProvider));
  }, [web3Modal]);

  const logoutOfWeb3Modal: CallableFunction = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      window.location.reload();
    },
    [web3Modal]
  );

  // If autoLoad is enabled and the the wallet had been loaded before, load it automatically now.
  useEffect(() => {
    if (autoLoad && !autoLoaded && web3Modal.cachedProvider) {
      loadWeb3Modal();
      setAutoLoaded(true);
    }
  }, [
    autoLoad,
    autoLoaded,
    loadWeb3Modal,
    setAutoLoaded,
    web3Modal.cachedProvider,
  ]);

  return [provider, loadWeb3Modal, logoutOfWeb3Modal];
}

export default useWeb3Modal;
