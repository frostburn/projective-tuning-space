<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Subgroup } from "temperaments";

const props = defineProps<{
  subgroup: string;
  intervals: string[];
  wartss: string[];
  displaySize: boolean;
}>();

// === 3D styles ===
const MONZO_COLOR = 0x12ffab;
const JIP_COLOR = 0xeeee11;
const VAL_COLOR = 0xee11ee;
const GROUND_COLOR_1 = 0xaaaaaa;
const GROUND_COLOR_2 = 0x555555;
const UNISON_COLOR_1 = 0xbbbbaa;
const UNISON_COLOR_2 = 0x666655;

const MONZO_SCALE = 0.15;

const subgroup = computed(() => new Subgroup(props.subgroup));

const jip = computed(() => {
  const mapping = subgroup.value.jip("nats");
  const dir = new THREE.Vector3(...mapping);
  dir.normalize();
  return dir;
});

type Triple = [number, number, number];

const monzos = computed(() => {
  const result = [];
  for (const interval of props.intervals) {
    try {
      const monzo = subgroup.value.toMonzoAndResidual(interval)[0];
      let scale = MONZO_SCALE;
      if (props.displaySize) {
        scale =
          jip.value.x * monzo[0] +
          jip.value.y * monzo[1] +
          jip.value.z * monzo[2];
      }
      result.push({
        position: monzo as Triple,
        scale: [scale, scale, scale] as Triple,
        label: interval,
      });
    } catch {}
  }
  return result;
});

const vals = computed(() => {
  const result = [];
  for (const warts of props.wartss) {
    try {
      const val = subgroup.value.fromWarts(warts);
      result.push(val);
    } catch {}
  }
  return result;
});
const canvas = ref<null | HTMLCanvasElement>(null);

const renderer = ref<null | THREE.WebGLRenderer>(null);

const animationFrame = ref(0);

// In camera screen coordinates
const mouseX = ref<null | number>(null);
const mouseY = ref<null | number>(null);
const mousePos = computed(() =>
  mouseX.value === null ? null : new THREE.Vector2(mouseX.value, mouseY.value!)
);
// In absolute coordinates
const labelLeft = ref(0);
const labelTop = ref(0);
const labelShow = ref(false);
const label = ref("");

const origin = new THREE.Vector3(0, 0, 0);

const ballGeometry = new THREE.IcosahedronGeometry(1, 2);

const monzoMaterial = new THREE.MeshPhongMaterial({ color: MONZO_COLOR });

function setMousePosition(event: MouseEvent) {
  const target: HTMLCanvasElement = event.target! as HTMLCanvasElement;
  const x = event.offsetX;
  const y = event.offsetY;
  mouseX.value = 2 * (x / target.clientWidth) - 1;
  mouseY.value = 1 - 2 * (y / target.clientHeight);

  labelLeft.value = event.clientX;
  labelTop.value = event.clientY;
}

function unsetMousePosition() {
  mouseX.value = null;
  mouseY.value = null;
}

function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
  const element = renderer.domElement;
  const width = element.clientWidth;
  const height = element.clientHeight;
  const needResize = element.width !== width || element.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

onMounted(() => {
  if (canvas.value === null) {
    return;
  }
  renderer.value = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
  });

  const scene = new THREE.Scene();
  const aspectRatioGuess = 2; // Later dynamically adjusted.
  const camera = new THREE.PerspectiveCamera(75, aspectRatioGuess, 0.1, 1000);

  const controls = new OrbitControls(camera, renderer.value.domElement);
  controls.enableDamping = true;

  const raycaster = new THREE.Raycaster();

  // Ground plane and axes
  const grid = new THREE.GridHelper(20, 20, GROUND_COLOR_1, GROUND_COLOR_2);
  scene.add(grid);

  const axes = new THREE.AxesHelper(2);
  // Stop z-fighting with the ground plane
  axes.position.set(0.005, 0, 0.005);
  scene.add(axes);

  // Unison plane and JIP vector
  const jipArrow = new THREE.ArrowHelper(jip.value, origin, 3, JIP_COLOR);
  scene.add(jipArrow);
  const unisonPlane = new THREE.PolarGridHelper(
    10,
    15,
    15,
    128,
    UNISON_COLOR_1,
    UNISON_COLOR_2
  );
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    jip.value
  );
  unisonPlane.applyQuaternion(quaternion);
  scene.add(unisonPlane);

  // Custom val vectors
  const valArrows: THREE.ArrowHelper[] = [];
  for (const val of vals.value) {
    const dir = new THREE.Vector3(...val).normalize();
    const valArrow = new THREE.ArrowHelper(dir, origin, 4, VAL_COLOR);
    valArrows.push(valArrow);
    scene.add(valArrow);
  }

  // Custom monzos
  const monzoSpheres: THREE.Mesh[] = [];
  for (const monzo of monzos.value) {
    const sphere = new THREE.Mesh(ballGeometry, monzoMaterial);
    sphere.position.set(...monzo.position);
    sphere.scale.set(...monzo.scale);
    sphere.userData.label = monzo.label;
    monzoSpheres.push(sphere);
    scene.add(sphere);
  }

  const color = 0xffffff;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  camera.position.z = 10;
  camera.position.y = 2;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function animate(time: number) {
    if (renderer.value === null) {
      return;
    }

    if (resizeRendererToDisplaySize(renderer.value)) {
      const element = renderer.value.domElement;
      camera.aspect = element.width / element.height;
      camera.updateProjectionMatrix();
    }

    controls.update();

    // Reactive boilerplate
    while (monzoSpheres.length < monzos.value.length) {
      const monzo = monzos.value[monzoSpheres.length];
      const sphere = new THREE.Mesh(ballGeometry, monzoMaterial);
      sphere.position.set(...monzo.position);
      sphere.scale.set(...monzo.scale);
      sphere.userData.label = monzo.label;
      monzoSpheres.push(sphere);
      scene.add(sphere);
    }
    for (let i = 0; i < monzoSpheres.length; ++i) {
      const sphere = monzoSpheres[i];
      if (i < monzos.value.length) {
        const monzo = monzos.value[i];
        sphere.visible = true;
        sphere.position.set(...monzo.position);
        sphere.scale.set(...monzo.scale);
        sphere.userData.label = monzo.label;
      } else {
        sphere.visible = false;
      }
    }

    while (valArrows.length < vals.value.length) {
      const val = vals.value[valArrows.length];
      const dir = new THREE.Vector3(...val).normalize();
      const valArrow = new THREE.ArrowHelper(dir, origin, 4, VAL_COLOR);
      valArrows.push(valArrow);
      scene.add(valArrow);
    }
    for (let i = 0; i < valArrows.length; ++i) {
      const arrow = valArrows[i];
      if (i < vals.value.length) {
        const val = vals.value[i];
        const dir = new THREE.Vector3(...val).normalize();
        arrow.visible = true;
        arrow.setDirection(dir);
      } else {
        arrow.visible = false;
      }
    }

    renderer.value.render(scene, camera);

    // Tooltips
    if (mousePos.value !== null) {
      raycaster.setFromCamera(mousePos.value, camera);
      const intersections = raycaster.intersectObjects(monzoSpheres);
      if (intersections.length) {
        const hoverable = intersections[0].object;
        label.value = hoverable.userData.label || "(unknown)";
        labelShow.value = true;
      } else {
        labelShow.value = false;
      }
    }

    animationFrame.value = requestAnimationFrame(animate);
  }

  controls.update();
  animationFrame.value = requestAnimationFrame(animate);
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  if (renderer.value !== null) {
    renderer.value.dispose();
  }
});
</script>

<template>
  <canvas
    ref="canvas"
    @mousemove="setMousePosition"
    @mouseleave="unsetMousePosition"
  ></canvas>
  <div
    :style="`top: ${labelTop}px; left: ${labelLeft + 15}px;`"
    v-show="labelShow"
  >
    {{ label }}
  </div>
</template>

<style scoped>
canvas {
  display: block;
  width: 100%;
  height: 100%;
}

div {
  color: white;
  position: absolute;
  user-select: none;
  pointer-events: none;
}
</style>
