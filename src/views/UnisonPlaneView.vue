<script setup lang="ts">
import { Subgroup } from "temperaments";
import { getCommaNames } from "named-temperaments";
import { computed, ref } from "vue";
import { add, Fraction, toMonzo } from "xen-dev-utils";
import UnisonPlane from "../components/UnisonPlane.vue";

const subgroupString = ref("2.3.5");

const offset = ref(new Fraction(7));

const key = ref("");
const cents = ref(0);

function getSubgroupMonzo() {
  return key.value.split(",").map((coordinate) => parseInt(coordinate));
}

const subgroup = computed(() => new Subgroup(subgroupString.value));

const primeMonzo = computed(() =>
  add(
    subgroup.value.resolveMonzo(getSubgroupMonzo(), true),
    toMonzo(offset.value)
  )
);
const names = computed(() => getCommaNames(primeMonzo.value));
const fraction = computed(() => {
  try {
    const monzo = getSubgroupMonzo();
    for (const component of monzo) {
      if (isNaN(component)) {
        return offset.value;
      }
    }
    return subgroup.value.toFraction(monzo).mul(offset.value);
  } catch (e) {
    return new Fraction(1);
  }
});

function onHighlight(info: { key: string; cents: number }) {
  key.value = info.key;
  cents.value = info.cents;
}
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column">
        <UnisonPlane
          :subgroup="subgroupString"
          :zoomLevel="20"
          :offset="offset"
          @highlight="onHighlight"
        />
      </div>
      <div class="column">
        <h1>Unison plane (commas)</h1>
        <p><b>Names:</b> {{ names.join(", ") }}</p>
        <p><b>Size:</b> {{ cents.toFixed(3) }} ¢</p>
        <p><b>Fraction:</b> {{ fraction.toFraction() }}</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
div.columns-container {
  display: flex;
  column-count: 2;
}
</style>
