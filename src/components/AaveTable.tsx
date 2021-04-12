import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Box,
  Button,
  Heading,
  Center,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
} from "@chakra-ui/react";
import getUserDebts, { Token } from "../utils/getUserDebts";
import addresses from "../constants/addresses";

function formatAmount(
  price: string | number = 0,
  decimalPoints: number = 2
): string {
  const typecastedPrice = Number(price);
  return Number(typecastedPrice.toFixed(decimalPoints)).toLocaleString();
}

function AaveTable({
  provider,
  network,
}: {
  provider: ethers.providers.Web3Provider | undefined;
  network: number;
}) {
  const [tableData, setTableData] = useState<Token[]>([]);
  useEffect(() => {
    if (provider) {
      const fetchData = async () => {
        const getTableData = await getUserDebts(provider, network);
        setTableData(getTableData);
      };
      fetchData();
    }
  }, [provider]);
  const tableItems = tableData.map((token, index) => (
    <Tr key={token.symbol}>
      <Td>{token.symbol}</Td>
      <Td>
        {token.stable === undefined
          ? "-"
          : formatAmount(
              ethers.utils.formatUnits(
                token.stable.toString(),
                addresses[network].tokens[index].decimals
              )
            )}
      </Td>
      <Td>
        {token.variable === undefined
          ? "-"
          : formatAmount(
              ethers.utils.formatUnits(
                token.variable.toString(),
                addresses[network].tokens[index].decimals
              )
            )}
      </Td>
    </Tr>
  ));
  return (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Token</Th>
          <Th>Stable Debt</Th>
          <Th>Variable Debt</Th>
        </Tr>
      </Thead>
      <Tbody>{tableItems}</Tbody>
    </Table>
  );
}

export default AaveTable;
