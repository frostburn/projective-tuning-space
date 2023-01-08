<script setup lang="ts">
import { Subgroup } from "temperaments";
import { Fraction, type Monzo } from "xen-dev-utils";
import UnisonPlane from "../components/UnisonPlane.vue";

const subgroup = new Subgroup(5);

const offset = new Fraction(1);

function onHighlight(info: { monzo: Monzo; cents: number }) {
  let fraction = offset;
  for (let i = 0; i < subgroup.basis.length; ++i) {
    fraction = fraction.mul(subgroup.basis[i].pow(info.monzo[i]));
  }
  console.log(info.monzo, info.cents, fraction.toFraction());
}
</script>

<template>
  <main>
    <h1>Unison plane (commas)</h1>
    <UnisonPlane
      :subgroup="subgroup"
      :zoomLevel="20"
      :offset="offset"
      @highlight="onHighlight"
    />
  </main>
</template>

<style></style>
