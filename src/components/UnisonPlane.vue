<script setup lang="ts">
import { centsToNats, dot, Fraction, gcd, natsToCents } from "xen-dev-utils";
import { getAlgebra, type Subgroup } from "temperaments";
import { computed } from "vue";

const props = defineProps<{
  subgroup: Subgroup;
  zoomLevel: number;
  offset: Fraction;
}>();

const emit = defineEmits(["highlight", "unhighlight"]);

const viewBox = computed(
  () =>
    `${-props.zoomLevel} ${-props.zoomLevel} ${2 * props.zoomLevel} ${
      2 * props.zoomLevel
    }`
);

const algebra = getAlgebra(3, "float64");

const basisNats = computed(() => props.subgroup.jip("nats"));

const offsetNats = computed(() => Math.log(props.offset.valueOf()));

const jip = computed(() => algebra.fromVector(basisNats.value));

const unisonPlane = computed(() => jip.value.dual());

// Local orthonormal coordinates on the unison plane
const u = computed(() =>
  algebra.basisBlade(0).dotL(unisonPlane.value).normalize()
);
const v = computed(() => {
  const temp = algebra.basisBlade(1).dotL(unisonPlane.value);
  return temp.dotL(u.value.inverse()).dotL(u.value).sub(temp).normalize();
});

const LARGE_COMMA = centsToNats(200);
const MEDIUM_COMMA = centsToNats(100);
const SMALL_COMMA = centsToNats(30);
const UNNOTICEABLE_COMMA = centsToNats(3.5);

const commas = computed(() => {
  const onats = offsetNats.value;
  const bnats = basisNats.value;
  const primaryRange = Math.ceil(Math.abs(props.zoomLevel / v.value.getAt(0)));
  const lowerBound = onats === 0 ? 0 : -primaryRange;
  const secondaryRange = primaryRange;

  const result: Set<string> = new Set();
  for (let i = lowerBound; i <= primaryRange; ++i) {
    for (let j = -secondaryRange; j <= secondaryRange; ++j) {
      let nats = onats + bnats[0] * i + bnats[1] * j;
      const k = -Math.round(nats / bnats[2]);
      nats += bnats[2] * k;
      if (i === 0 && j === 0 && k === 0) {
        continue;
      }
      if (Math.abs(nats) < LARGE_COMMA) {
        result.add(`${i},${j},${k}`);
        if (onats === 0) {
          result.add(`${-i},${-j},${-k}`);
        }
      }
    }
    for (let j = -secondaryRange; j <= secondaryRange; ++j) {
      let nats = onats + bnats[0] * i + bnats[2] * j;
      const k = -Math.round(nats / bnats[1]);
      nats += bnats[1] * k;
      if (i === 0 && j === 0 && k === 0) {
        continue;
      }
      if (Math.abs(nats) < LARGE_COMMA) {
        result.add(`${i},${k},${j}`);
        if (onats === 0) {
          result.add(`${-i},${-k},${-j}`);
        }
      }
    }
  }
  return result;
});

const commaElements = computed(() => {
  const result = [];
  for (const key of commas.value) {
    const comma = key.split(",").map((coordinate) => parseInt(coordinate));
    const nats = dot(basisNats.value, comma) + offsetNats.value;
    const size = Math.abs(nats);
    let r = 100;
    let g = 15;
    let b = 1;
    let a = 0;
    if (size < UNNOTICEABLE_COMMA) {
      r = 255;
      g = 255;
      b = 255;
    } else if (size < SMALL_COMMA) {
      r = 50;
      g = 100;
      b = 255;
    } else if (size < MEDIUM_COMMA) {
      r = 200;
      g = 150;
      b = 20;
    }

    if (nats < 0) {
      a = 0.5;
    } else {
      a = 1.0;
    }

    let stroke = "none";
    if (Math.abs(comma.reduce(gcd)) === 1 && nats > 0) {
      if (size < UNNOTICEABLE_COMMA) {
        stroke = "aqua";
      } else if (size < MEDIUM_COMMA) {
        stroke = "snow";
      } else {
        stroke = "gray";
      }
    } else {
      a -= 0.25;
    }

    const commaElement = algebra.fromVector(comma);

    result.push({
      key: key,
      monzo: comma,
      u: u.value.star(commaElement),
      v: v.value.star(commaElement),
      cents: natsToCents(nats),
      fill: `rgba(${r},${g},${b},${a})`,
      stroke,
    });
  }
  return result;
});

function highlight(e: any) {
  emit("highlight", { key: e.key, cents: e.cents });
}
</script>

<template>
  <svg width="1000" height="800" :viewBox="viewBox">
    <g>
      <rect x="-0.7" y="-0.7" width="1.4" height="1.4" fill="salmon" />
      <rect
        x="-0.7"
        y="-0.7"
        width="1.4"
        height="1.4"
        fill="salmon"
        transform="rotate(45)"
      />
    </g>
    <circle
      v-for="e of commaElements"
      :key="e.key"
      :cx="e.u"
      :cy="e.v"
      :r="2.0 / Math.sqrt(Math.abs(e.cents) + 5)"
      :fill="e.fill"
      :stroke="e.stroke"
      stroke-width="0.1"
      @mouseenter="highlight(e)"
    />
  </svg>
</template>
