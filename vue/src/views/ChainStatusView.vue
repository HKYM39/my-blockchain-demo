<template>
  <div class="container mx-auto px-4 py-10 space-y-6">
    <section class="bg-white shadow rounded-lg p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm text-gray-500">最新区块高度</p>
          <p class="text-4xl font-semibold text-indigo-600">
            {{ formattedBlockHeight ?? "—" }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">数据来源：{{ rpcURL }}</span>
          <button
            class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="isFetching"
            @click="refetch"
          >
            {{ isFetching ? "刷新中..." : "刷新" }}
          </button>
        </div>
      </div>
      <p class="mt-4 text-sm text-gray-500">
        最新区块时间：
        <span class="font-medium text-gray-900">{{ latestBlockTime ?? "—" }}</span>
      </p>
    </section>

    <section v-if="isLoading" class="rounded-lg bg-white p-6 text-gray-600 shadow">
      正在读取链信息...
    </section>
    <section v-else-if="errorMessage" class="rounded-lg bg-rose-50 p-6 text-rose-600 shadow">
      读取区块信息失败：{{ errorMessage }}
    </section>

    <section v-else class="grid gap-4 md:grid-cols-2">
      <article
        v-for="item in infoItems"
        :key="item.label"
        class="rounded-lg bg-white p-5 text-gray-700 shadow"
      >
        <p class="text-sm text-gray-500">{{ item.label }}</p>
        <p class="mt-1 break-all text-lg font-medium text-gray-900">
          {{ item.value ?? "—" }}
        </p>
      </article>
    </section>

    <section
      v-if="!isLoading && !errorMessage"
      class="rounded-lg bg-white p-6 text-gray-700 shadow"
    >
      <h2 class="mb-4 text-xl font-semibold">验证人信息</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-sm text-gray-500">验证人地址</p>
          <p class="mt-1 font-mono text-sm text-gray-900">
            {{ validatorAddress ?? "—" }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500">投票权重</p>
          <p class="mt-1 text-lg font-medium text-gray-900">
            {{ validatorVotingPower ?? "—" }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";

import { env } from "@/env";

type TendermintStatusResponse = {
  result?: {
    node_info?: {
      moniker?: string;
      network?: string;
      id?: string;
      listen_addr?: string;
      version?: string;
      other?: {
        tx_index?: string;
        rpc_address?: string;
      };
    };
    sync_info?: {
      latest_block_hash?: string;
      latest_app_hash?: string;
      latest_block_height?: string;
      latest_block_time?: string;
      catching_up?: boolean;
    };
    validator_info?: {
      address?: string;
      voting_power?: string;
    };
  };
};

const rpcURL = env.rpcURL.replace(/\/$/, "");
const fetchStatus = async (): Promise<TendermintStatusResponse> => {
  const response = await fetch(`${rpcURL}/status`);
  if (!response.ok) {
    throw new Error(`状态接口响应异常（${response.status}）`);
  }
  return response.json();
};

const { data, error, isPending, isFetching, refetch } = useQuery<TendermintStatusResponse>({
  queryKey: ["rpc-status"],
  queryFn: fetchStatus,
  refetchInterval: 10000,
  refetchOnWindowFocus: false,
});

const numberFormatter = new Intl.NumberFormat();
const latestBlockHeight = computed(() => data.value?.result?.sync_info?.latest_block_height ?? null);
const formattedBlockHeight = computed(() => {
  if (!latestBlockHeight.value) {
    return null;
  }
  const parsed = Number(latestBlockHeight.value);
  return Number.isFinite(parsed)
    ? numberFormatter.format(parsed)
    : latestBlockHeight.value;
});
const latestBlockTime = computed(() => {
  const timestamp = data.value?.result?.sync_info?.latest_block_time;
  if (!timestamp) {
    return null;
  }
  const parsedTime = new Date(timestamp);
  return Number.isNaN(parsedTime.valueOf())
    ? timestamp
    : parsedTime.toLocaleString();
});

const infoItems = computed(() => {
  const result = data.value?.result;
  const node = result?.node_info;
  const sync = result?.sync_info;
  const syncingText =
    sync?.catching_up === undefined
      ? undefined
      : sync.catching_up
        ? "追赶中"
        : "已同步";
  return [
    { label: "链 ID", value: node?.network },
    { label: "节点别名", value: node?.moniker },
    { label: "节点 ID", value: node?.id },
    { label: "RPC 地址", value: node?.other?.rpc_address ?? env.rpcURL },
    { label: "监听地址", value: node?.listen_addr },
    { label: "Tendermint 版本", value: node?.version },
    { label: "同步状态", value: syncingText },
    { label: "最新区块哈希", value: sync?.latest_block_hash },
    { label: "最新应用哈希", value: sync?.latest_app_hash },
  ];
});

const validatorAddress = computed(
  () => data.value?.result?.validator_info?.address ?? null
);
const validatorVotingPower = computed(
  () => data.value?.result?.validator_info?.voting_power ?? null
);
const errorMessage = computed(() => error.value?.message ?? null);
const isLoading = computed(() => isPending.value);
</script>
