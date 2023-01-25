<script setup lang="ts">
import Temperament, { Subgroup, type Val } from "temperaments";
import { computed } from "vue";
import { applyWeights, centsToNats } from "xen-dev-utils";

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

const metric = computed(() => subgroup.value.jip("nats").map((j) => 1 / j));

const vals = computed(() =>
  props.wartss.map((warts) => subgroup.value.fromWarts(warts))
);

const valTemperaments = computed(() =>
  vals.value.map((val) =>
    Temperament.fromVals([val], subgroup.value).canonize()
  )
);

const temperaments = computed(() => {
  const result: Temperament[] = [];
  for (let i = 0; i < vals.value.length; ++i) {
    for (let j = i + 1; j < vals.value.length; ++j) {
      const temperament = Temperament.fromVals(
        [vals.value[i], vals.value[j]],
        subgroup.value
      ).canonize();
      let novel = true;
      for (const existing of result) {
        if (existing.equals(temperament)) {
          novel = false;
        }
      }
      if (novel) {
        result.push(temperament);
      }
    }
  }
  return result;
});

const intersections = computed(() => {
  if (!temperaments.value.length) {
    return [];
  }
  const result: Temperament[] = [];
  const algebra = temperaments.value[0].algebra;
  for (let i = 0; i < temperaments.value.length; ++i) {
    for (let j = i + 1; j < temperaments.value.length; ++j) {
      const val = new Temperament(
        algebra,
        temperaments.value[i].value.vee(temperaments.value[j].value),
        subgroup.value
      ).canonize();
      let novel = true;
      for (const existing of result) {
        if (existing.equals(val)) {
          novel = false;
        }
      }
      for (const existing of valTemperaments.value) {
        if (existing.equals(val)) {
          novel = false;
        }
      }
      if (novel) {
        result.push(val);
      }
    }
  }
  return result;
});

const diagonalYScale = Math.sqrt(0.75);

function valCoords(val: Val) {
  const key = val.map((v) => v.toString()).join(",");
  const v = applyWeights(val, metric.value);
  let a = v[0];
  let b = v[1];
  let c = v[2];
  // This is the projective norm. Works correctly even if vals get flipped.
  const normalizer = 1 / (a + b + c);

  a *= normalizer;
  b *= normalizer;
  c *= normalizer;
  const cx = 0.5 * (a + b) - c;
  const cy = (a - b) * diagonalYScale;

  return { key, cx, cy };
}

const jipCoords = computed(() => valCoords(subgroup.value.jip("nats")));

const valElements = computed(() =>
  vals.value.map((val, index) => {
    const temperament = valTemperaments.value[index];
    const attrs = valCoords(val);
    return {
      ...attrs,
      temperament,
    };
  })
);

const intersectionElements = computed(() =>
  intersections.value.map((temperament) => {
    return { ...valCoords([...temperament.value.vector()]), temperament };
  })
);

const temperamentElements = computed(() => {
  if (!temperaments.value.length) {
    return [];
  }
  const algebra = temperaments.value[0].algebra;
  // Edges of reasonable tunings.
  const edges = [
    algebra.basisBlade(0, 1),
    algebra.basisBlade(1, 2),
    algebra.basisBlade(2, 0),
  ];
  return temperaments.value.map((temperament) => {
    const vertices = edges.map((edge) => edge.vee(temperament.value));
    // Find vertices that result in a line on-screen.
    let coords1;
    let coords2;
    const norms = vertices
      .map((vertex) => vertex.reduce((a, b) => a + b))
      .map(Math.abs);
    if (norms[0] < norms[1] && norms[0] < norms[2]) {
      coords1 = valCoords([...vertices[1].vector()]);
      coords2 = valCoords([...vertices[2].vector()]);
    } else if (norms[1] < norms[2]) {
      coords1 = valCoords([...vertices[0].vector()]);
      coords2 = valCoords([...vertices[2].vector()]);
    } else {
      coords1 = valCoords([...vertices[0].vector()]);
      coords2 = valCoords([...vertices[1].vector()]);
    }
    const key = temperament
      .rankPrefix(2)
      .map((w) => w.toString())
      .join(",");
    return {
      key,
      temperament,
      x1: coords1.cx,
      y1: coords1.cy,
      x2: coords2.cx,
      y2: coords2.cy,
    };
  });
});

const contourElements = computed(() => {
  const { cx, cy } = jipCoords.value;
  const result = [];
  for (let j = 1; j <= 10; ++j) {
    const r = centsToNats(j);
    for (let i = 0; i < 6; ++i) {
      const theta1 = (i * Math.PI) / 3;
      const theta2 = ((i + 1) * Math.PI) / 3;
      result.push({
        key: `${j},${i}`,
        x1: cx + Math.cos(theta1) * r,
        y1: cy + Math.sin(theta1) * r,
        x2: cx + Math.cos(theta2) * r,
        y2: cy + Math.sin(theta2) * r,
      });
    }
  }
  return result;
});

function highlightTemperament(temperament: Temperament) {
  emit("highlight", temperament);
}
</script>

<template>
  <svg width="1000" height="800" :viewBox="viewBox">
    <line
      v-for="attrs of contourElements"
      v-bind="attrs"
      :key="attrs.key"
      stroke-width="0.00003"
      stroke="red"
    />
    <g>
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        :transform="`scale(0.0001) translate(${jipCoords.cx}, ${jipCoords.cy})`"
        fill="blue"
      />
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        :transform="`rotate(45) scale(0.0001) translate(${jipCoords.cx}, ${jipCoords.cy})`"
        fill="blue"
      />
    </g>
    <line
      v-for="attrs of temperamentElements"
      v-bind="attrs"
      :key="attrs.key"
      stroke-width="0.00003"
      stroke="green"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
    <circle
      v-for="attrs of intersectionElements"
      v-bind="attrs"
      :key="attrs.key"
      r="0.00005"
      fill="gray"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
    <circle
      v-for="attrs of valElements"
      v-bind="attrs"
      :key="attrs.key"
      r="0.0001"
      fill="white"
      @mouseenter="highlightTemperament(attrs.temperament)"
    />
  </svg>
</template>
