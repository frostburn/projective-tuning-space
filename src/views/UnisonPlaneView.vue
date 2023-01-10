<script setup lang="ts">
import { getCommaNames, Subgroup } from "temperaments";
import { computed, ref } from "vue";
import { add, Fraction, toMonzo } from "xen-dev-utils";
import UnisonPlane from "../components/UnisonPlane.vue";

const subgroup = ref<Subgroup>(new Subgroup(5));

const offset = ref(new Fraction(7));

const key = ref("");
const cents = ref(0);

function getSubgroupMonzo() {
  return key.value.split(",").map((coordinate) => parseInt(coordinate));
}

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
          :subgroup="subgroup"
          :zoomLevel="20"
          :offset="offset"
          @highlight="onHighlight"
        />
      </div>
      <div class="column">
        <h1>Unison plane (commas)</h1>
        <p><b>Names:</b> {{ names.join(", ") }}</p>
        <p><b>Cents:</b> {{ cents.toFixed(3) }} ¢</p>
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
