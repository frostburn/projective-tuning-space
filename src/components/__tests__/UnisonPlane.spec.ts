import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import UnisonPlane from "../UnisonPlane.vue";
import { Subgroup } from "temperaments";
import { Fraction } from "xen-dev-utils";

describe("UnisonPlane", () => {
  it("renders properly", () => {
    const wrapper = mount(UnisonPlane, {
      props: {
        subgroup: new Subgroup(5),
        zoomLevel: 10,
        offset: new Fraction(1),
      },
    });
    expect(wrapper.find("svg").exists()).toBeTruthy();
  });
});
