<script setup lang="ts">
import Temperament, { getAlgebra, Subgroup } from "temperaments";
import { linSolve } from "ts-geometric-algebra";
import { multiply } from "mathjs";
import { computed } from "vue";

const props = defineProps<{
  subgroup: string;
  zoomLevel: number;
  wartss: string[];
}>();

const emit = defineEmits(["highlight", "unhighlight"]);

const viewBox = computed(
  () =>
    `${-props.zoomLevel} ${-props.zoomLevel} ${2 * props.zoomLevel} ${
      2 * props.zoomLevel
    }`
);

const subgroup = computed(() => new Subgroup(props.subgroup));

const vals = computed(() =>
  props.wartss.map((warts) => subgroup.value.fromWarts(warts))
);

const baseTemperament = computed(() =>
  Temperament.fromVals(vals.value, subgroup.value).canonize()
);

const tenney = computed(() =>
  baseTemperament.value.getMapping({ temperEquaves: true, units: "nats" })
);

const algebra = computed(() => getAlgebra(props.wartss.length, "float64"));

const basis = computed(() => {
  return vals.value.map((val) => algebra.value.fromVector(val));
});

const tenneyCoefficients = computed(() => {
  return linSolve(algebra.value.fromVector(tenney.value), basis.value);
});

const diagonalYScale = Math.sqrt(0.75);

function coordinates(coefficients: number[]) {
  let a = coefficients[0];
  let b = coefficients[1];
  let c = coefficients[2];
  // This is the projective norm. Works correctly even if vals get flipped.
  const normalizer = 1 / (a + b + c);

  a *= normalizer;
  b *= normalizer;
  c *= normalizer;
  const cx = (a - b) * diagonalYScale;
  const cy = 0.5 * (a + b) - c;

  return { cx, cy };
}

function valCoords(coefficients: number[]) {
  const key = coefficients.map((c) => c.toString()).join(",");
  const coords = coordinates(coefficients);
  const val = multiply(coefficients, vals.value);
  const temperament = Temperament.fromVals([val], subgroup.value).canonize();
  return {
    cx: coords.cx,
    cy: coords.cy,
    key,
    temperament,
  };
}

const tenneyElement = computed(() => coordinates(tenneyCoefficients.value));

const basisElements = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
].map(valCoords);

const secondaryElements = [
  [1, 1, 1],

  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],

  [2, 1, 0],
  [2, 0, 1],
  [0, 2, 1],
  [1, 2, 0],
  [1, 0, 2],
  [0, 1, 2],

  [2, 1, 1],
  [1, 2, 1],
  [1, 1, 2],

  [2, 2, 1],
  [2, 1, 2],
  [1, 2, 2],

  [-1, 1, 1],
  [1, -1, 1],
  [1, 1, -1],

  [2, -1, 0],
  [2, 0, -1],
  [0, 2, -1],
  [-1, 2, 0],
  [-1, 0, 2],
  [0, -1, 2],

  [2, 1, -1],
  [2, -1, 1],
  [1, 2, -1],
  [-1, 2, 1],
  [1, -1, 2],
  [-1, 1, 2],

  [3, -1, 0],
  [3, 0, -1],
  [-1, 3, 0],
  [0, 3, -1],
  [-1, 0, 3],
  [0, -1, 3],

  [3, -1, -1],
  [-1, 3, -1],
  [-1, -1, 3],

  [4, -1, -1],
  [-1, 4, -1],
  [-1, -1, 4],
].map(valCoords);

const rankTwoElements = [
  [
    [1, 0, 0],
    [0, 1, 0],
  ],
  [
    [1, 0, 0],
    [0, 0, 1],
  ],
  [
    [0, 1, 0],
    [0, 0, 1],
  ],

  [
    [1, 0, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 0],
    [1, 0, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 0],
  ],

  [
    [1, 0, 0],
    [0, 2, -1],
  ],
  [
    [1, 0, 0],
    [0, -1, 2],
  ],
  [
    [1, 0, 0],
    [2, 1, -1],
  ],
  [
    [1, 0, 0],
    [0, -1, 3],
  ],
  [
    [1, 0, 0],
    [0, 3, -1],
  ],

  [
    [1, 0, 0],
    [0, 2, 1],
  ],
  [
    [1, 0, 0],
    [0, 1, 2],
  ],
  [
    [0, 1, 0],
    [1, 0, 2],
  ],
  [
    [0, 1, 0],
    [2, 0, 1],
  ],
  [
    [0, 0, 1],
    [2, 1, 0],
  ],
  [
    [0, 0, 1],
    [1, 2, 0],
  ],

  [
    [0, 1, 0],
    [2, 0, -1],
  ],
  [
    [0, 1, 0],
    [-1, 0, 2],
  ],
  [
    [0, 1, 0],
    [1, 2, -1],
  ],
  [
    [0, 1, 0],
    [-1, 0, 3],
  ],
  [
    [0, 1, 0],
    [3, 0, -1],
  ],

  [
    [0, 0, 1],
    [-1, 2, 0],
  ],
  [
    [0, 0, 1],
    [2, -1, 0],
  ],
  [
    [0, 0, 1],
    [-1, 1, 2],
  ],
  [
    [0, 0, 1],
    [3, -1, 0],
  ],
  [
    [0, 0, 1],
    [-1, 3, 0],
  ],

  [
    [1, 1, 0],
    [1, 0, 1],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 0, 1],
  ],

  [
    [4, -1, -1],
    [-1, 4, -1],
  ],
  [
    [4, -1, -1],
    [-1, -1, 4],
  ],
  [
    [-1, 4, -1],
    [-1, -1, 4],
  ],
].map((endpoints) => {
  const v1 = coordinates(endpoints[0]);
  const v2 = coordinates(endpoints[1]);

  const val1 = multiply(endpoints[0], vals.value);
  const val2 = multiply(endpoints[1], vals.value);
  const temperament = Temperament.fromVals(
    [val1, val2],
    subgroup.value
  ).canonize();
  const key = temperament
    .rankPrefix(2)
    .map((c) => c.toString())
    .join(",");

  return {
    x1: v1.cx * 10 - 9 * v2.cx,
    y1: v1.cy * 10 - 9 * v2.cy,
    x2: v2.cx * 10 - 9 * v1.cx,
    y2: v2.cy * 10 - 9 * v1.cy,
    temperament,
    key,
  };
});

function highlightTemperament(temperament: Temperament) {
  emit("highlight", temperament);
}
</script>

<template>
  <svg width="1000" height="800" :viewBox="viewBox">
    <g
      :transform="`translate(${tenneyElement.cx}, ${tenneyElement.cy})`"
      @mouseenter="highlightTemperament(baseTemperament)"
    >
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        transform="scale(0.1)"
        fill="blue"
      />
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        transform="scale(0.1) rotate(45)"
        fill="blue"
      />
    </g>
    <line
      v-for="attrs of rankTwoElements"
      v-bind="attrs"
      :key="attrs.key"
      stroke-width="0.03"
      stroke="green"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
    <circle
      v-for="attrs of basisElements"
      v-bind="attrs"
      :key="attrs.key"
      r="0.1"
      fill="white"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
    <circle
      v-for="attrs of secondaryElements"
      v-bind="attrs"
      :key="attrs.key"
      r="0.05"
      fill="gray"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
  </svg>
</template>
