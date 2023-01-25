<script setup lang="ts">
import { getTemperamentData } from "named-temperaments";
import type Temperament from "temperaments";
import { simplifyCommas } from "temperaments";
import { reactive, ref } from "vue";
import { monzoToFraction } from "xen-dev-utils";
import RankThreeSpace from "../components/RankThreeSpace.vue";

const subgroupString = ref("2.3.5.7");

const wartss = reactive(["3", "5", "7"]);

const title = ref("");
const subtitle = ref("");
const commas = ref("");
const vals = ref("");

function onHighlight(temperament: Temperament) {
  if (temperament.getRank() === 1) {
    const val = [...temperament.value.vector()];
    vals.value = title.value = temperament.subgroup.toWarts(val);
    if (/^\d+$/.test(title.value)) {
      subtitle.value = "patent val";
    } else {
      subtitle.value = "";
    }
    if (val[0] <= 100) {
      commas.value = simplifyCommas(
        temperament
          .commaFactorize()
          .map((f) => temperament.subgroup.toPrimeMonzo(f))
      )
        .map((c) => monzoToFraction(c).toFraction())
        .join(", ");
    } else {
      commas.value = "";
    }
  } else {
    const data = getTemperamentData(temperament);
    if (data === null) {
      const rank = temperament.getRank();
      const wedgie =
        "<".repeat(rank) +
        [...temperament.value.vector(rank)]
          .map((c) => c.toString())
          .join(", ") +
        "]".repeat(rank);
      title.value = wedgie;
      subtitle.value = "";
      commas.value = "?";
      vals.value = "?";
    } else {
      title.value = data.title;
      subtitle.value = data.subtitle || "";
      commas.value = data.commas
        .map((c) => temperament.subgroup.toFraction(c).toFraction())
        .join(", ");
      if (data.vals === undefined) {
        vals.value = "?";
      } else {
        vals.value = data.vals
          .map((v) => temperament.subgroup.toWarts(v))
          .join(" & ");
      }
    }
  }
}
</script>

<template>
  <main>
    <div class="columns-container">
      <div class="column">
        <RankThreeSpace
          :subgroup="subgroupString"
          :zoomLevel="4.5"
          :wartss="wartss"
          @highlight="onHighlight"
        />
      </div>
      <div class="column">
        <h1>Rank three space</h1>
        <p><b>Title:</b> {{ title }}</p>
        <p><b>Subtitle:</b> {{ subtitle }}</p>
        <p><b>Commas:</b> {{ commas }}</p>
        <p><b>Vals:</b> {{ vals }}</p>
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
