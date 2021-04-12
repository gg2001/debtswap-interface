import React from "react";
import { ethers } from "ethers";
import { Button } from "@chakra-ui/react";

function WalletButton({
  provider,
  loadWeb3Modal,
  logoutOfWeb3Modal,
}: {
  provider: ethers.providers.Web3Provider | undefined;
  loadWeb3Modal: CallableFunction;
  logoutOfWeb3Modal: CallableFunction;
}) {
  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}>
      {!provider ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
}

export default WalletButton;
