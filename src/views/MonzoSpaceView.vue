<script setup lang="ts">
import { computed, ref } from "vue";
import MonzoSpace from "../components/MonzoSpace.vue";

const scaleText = ref("5/4\n3/2\n2/1");

const wartssText = ref("3\n5\n12");

const intervals = computed(() => scaleText.value.split(/\s/));

const wartss = computed(() => wartssText.value.split(/\s/));

const displaySize = ref(false);
</script>

<template>
  <div class="columns-container">
    <div class="column primary">
      <MonzoSpace
        subgroup="2.3.5"
        :intervals="intervals"
        :wartss="wartss"
        :displaySize="displaySize"
      />
    </div>
    <div class="column secondary">
      <label for="scale">Scale data</label>
      <textarea id="scale" rows="12" v-model="scaleText"></textarea>
      <label for="wartss">Vals</label>
      <textarea id="wartss" rows="4" v-model="wartssText"></textarea>
      <button @click="displaySize = !displaySize">Show sizes</button>
    </div>
  </div>
</template>

<style scoped>
div.columns-container {
  display: flex;
  column-count: 2;
  height: 100%;
}

div.column.primary {
  width: 80%;
}

div.column.secondary {
  width: 20%;
  display: flex;
  flex-flow: row wrap;
  align-items: stretch;
}

label {
  width: 100%;
  font-weight: bold;
}
</style>
